import { generateEmbedding, generateTextResult } from "@/lib/litellm";
import {
  GraphAnalysis,
  NodeExecutionResult,
  RunMode,
  ScenarioDefinition,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
} from "@/lib/graph/types";
import { analyzeGraph } from "./analyzer";

type DynamicImport = <T = unknown>(specifier: string) => Promise<T>;
type PostgresClient = {
  connect: () => Promise<void>;
  query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }>;
  end: () => Promise<void>;
};
type PostgresModule = {
  Client: new (config: { connectionString: string }) => PostgresClient;
};

const dynamicImport = new Function("specifier", "return import(specifier)") as DynamicImport;

class BlockedNodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedNodeError";
  }
}

export interface GraphRunResult {
  mode: RunMode;
  analysis: GraphAnalysis;
  nodeResults: NodeExecutionResult[];
  summary: {
    status: "completed" | "failed" | "blocked";
    latencyMs: number;
    tokenUsage: number;
    cost: number;
    warnings: string[];
    blockedCount: number;
  };
}

function block(message: string): never {
  throw new BlockedNodeError(message);
}

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function serialize(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getIncomingEdgePayloads(
  edges: WorkflowEdge[],
  edgePayloads: Map<string, unknown>,
  nodeId: string
) {
  const incoming = edges.filter((edge) => edge.target === nodeId);
  const inputs: Record<string, unknown> = {};
  let activeCount = 0;

  for (const edge of incoming) {
    if (!edgePayloads.has(edge.id)) continue;
    activeCount += 1;
    inputs[edge.targetHandle || edge.sourceHandle || "default"] =
      edgePayloads.get(edge.id);
  }

  return { inputs, activeCount, incoming };
}

function firstInput(inputs: Record<string, unknown>) {
  return inputs.default ?? Object.values(inputs)[0] ?? "";
}

function isPlaceholderUrl(value: string) {
  return (
    !value ||
    value.includes("example.com") ||
    value.includes("hooks.example.com") ||
    value.includes("sandbox.example.com")
  );
}

function selectEndpoint(node: WorkflowNode, mode: RunMode) {
  const testUrl = String(node.data.testUrl || "").trim();
  const liveUrl = String(node.data.url || node.data.liveUrl || "").trim();
  const url = mode === "test" ? testUrl : liveUrl;

  if (!url || isPlaceholderUrl(url)) {
    block(
      mode === "test"
        ? "Configure a real test endpoint before running this node in test mode."
        : "Configure a real live endpoint before executing this node."
    );
  }

  return url;
}

function requireTestMode(node: WorkflowNode, mode: RunMode) {
  if (mode !== "test") {
    block(`${node.type} is only allowed in test mode.`);
  }
}

async function postJson(url: string, body: unknown, apiKey?: string, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${serialize(payload).slice(0, 400)}`);
  }

  return payload;
}

function redactPII(value: unknown, entitiesRaw: unknown) {
  const entities = String(entitiesRaw || "")
    .split(/\n|,/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  let text = serialize(value);

  if (entities.includes("email")) {
    text = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]");
  }
  if (entities.includes("phone")) {
    text = text.replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[REDACTED_PHONE]");
  }
  if (entities.includes("payment_card")) {
    text = text.replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD]");
  }
  if (entities.includes("ssn")) {
    text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
  }

  return parseMaybeJson(text);
}

async function executeNode(args: {
  node: WorkflowNode;
  inputs: Record<string, unknown>;
  mode: RunMode;
  scenario: ScenarioDefinition;
  userId?: string;
  modelProviderId?: string;
  modelId?: string;
}): Promise<NodeExecutionResult> {
  const { node, inputs, mode, scenario, userId } = args;
  const startedAt = new Date();
  const inputValue = firstInput(inputs);
  const inputText = serialize(inputValue);
  const warnings: string[] = [];
  const outputs: Record<string, unknown> = {};
  let status: NodeExecutionResult["status"] = "completed";
  let error: string | undefined;
  let blockedReason: string | undefined;
  let tokenUsage = 0;
  let cost = 0;
  let model: string | undefined;
  let providerId: string | undefined;

  try {
    switch (node.type) {
      case "promptNode": {
        const template = String(node.data.template || "{{default}}");
        outputs.prompt = template.replace(/{{default}}/g, inputText);
        break;
      }

      case "llmNode": {
        const prompt = String(inputs.prompt || inputText || "");
        if (!prompt.trim()) block("LLM node needs a prompt input.");
        const selectedModel =
          node.data.modelId === "custom"
            ? String(node.data.customModelId || "")
            : String(node.data.modelId || node.data.model || args.modelId || "");
        const result = await generateTextResult(prompt, String(node.data.systemPrompt || ""), {
          userId,
          providerId: String(node.data.providerId || args.modelProviderId || ""),
          modelId: selectedModel || args.modelId,
          temperature: Number(node.data.temperature ?? 0.3),
          max_tokens: Number(node.data.max_tokens || 1200),
        });
        outputs.default = result.text;
        tokenUsage = result.usage.totalTokens;
        cost = result.usage.estimatedCost;
        model = result.usage.model;
        providerId = result.usage.providerId;
        break;
      }

      case "embedNode": {
        const result = await generateEmbedding(inputText, {
          userId,
          providerId: String(node.data.providerId || args.modelProviderId || ""),
          modelId: String(node.data.modelId || node.data.model || "text-embedding-3-small"),
        });
        outputs.vector = result.vector;
        tokenUsage = result.usage.totalTokens;
        cost = result.usage.estimatedCost;
        model = result.usage.model;
        providerId = result.usage.providerId;
        break;
      }

      case "rerankNode":
      case "extractNode":
      case "classifyNode":
      case "summarizeNode":
      case "evaluatorNode": {
        const taskPrompt = {
          rerankNode: `Rerank these candidates by relevance and return JSON: ${inputText}`,
          extractNode: `Extract structured data matching this schema hint: ${String(node.data.schemaHint || "{}")}\nInput:\n${inputText}`,
          classifyNode: `Classify the input into one of these classes:\n${String(node.data.classes || "")}\nInput:\n${inputText}`,
          summarizeNode: `Summarize this input in a ${String(node.data.style || "executive")} style:\n${inputText}`,
          evaluatorNode: `Evaluate this workflow output against these criteria:\n${String(node.data.criteria || "accuracy\ncompleteness\nsafety")}\nOutput:\n${inputText}`,
        }[node.type];
        const result = await generateTextResult(taskPrompt, "Return concise, production-usable output.", {
          userId,
          providerId: String(node.data.providerId || args.modelProviderId || ""),
          modelId: String(node.data.modelId || args.modelId || ""),
          temperature: 0.1,
          response_format: node.type === "extractNode" || node.type === "evaluatorNode"
            ? { type: "json_object" }
            : undefined,
        });
        outputs.default = node.type === "extractNode" || node.type === "evaluatorNode"
          ? parseMaybeJson(result.text)
          : result.text;
        tokenUsage = result.usage.totalTokens;
        cost = result.usage.estimatedCost;
        model = result.usage.model;
        providerId = result.usage.providerId;
        break;
      }

      case "memoryNode": {
        block("Configure a vector store or memory provider before running memory nodes.");
      }

      case "routerNode": {
        const keywords = String(node.data.primaryKeywords || "")
          .split(/\n|,/)
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        const isPrimary = keywords.some((keyword) => inputText.toLowerCase().includes(keyword));
        outputs.primary = isPrimary ? inputValue : undefined;
        outputs.secondary = isPrimary ? undefined : inputValue;
        break;
      }

      case "apiGatewayNode": {
        if (node.data.authRequired && mode === "live") {
          const payload = inputs.request || inputValue;
          const serialized = serialize(payload);
          if (!serialized.includes("authorization") && !serialized.includes("Authorization")) {
            warnings.push("API gateway auth is enabled, but no authorization token was present in the run input.");
          }
        }
        outputs.default = inputs.request || inputValue || { route: node.data.route };
        break;
      }

      case "httpRequestNode":
      case "webhookNode":
      case "serviceNode": {
        const url = selectEndpoint(node, mode);
        outputs.default = await postJson(
          url,
          inputs.body || inputValue || {},
          typeof node.data.apiKey === "string" ? node.data.apiKey : undefined,
          String(node.data.method || "POST")
        );
        break;
      }

      case "functionNode": {
        const code = String(node.data.code || node.data.transform || "").trim();
        if (!code || !/\breturn\b/.test(code)) {
          block("Configure this Function node with JavaScript that returns a value.");
        }
        const fn = new Function("input", "inputs", `"use strict";\n${code}`);
        outputs.default = await fn(inputValue, inputs);
        break;
      }

      case "schedulerNode": {
        if (mode === "live") {
          block("Live schedule registration is not connected yet. Configure a scheduler service endpoint first.");
        }
        outputs.default = { cron: node.data.cron, payload: inputValue };
        break;
      }

      case "postgresNode": {
        const connectionString = String(node.data.connectionString || "");
        if (!connectionString) block("Configure a Postgres connection string.");
        let pg: PostgresModule;
        try {
          pg = await dynamicImport<PostgresModule>("pg");
        } catch {
          block("Install and configure the pg driver before running Postgres nodes.");
        }
        const client = new pg.Client({ connectionString });
        await client.connect();
        try {
          const operation = String(node.data.operation || "select");
          const table = String(node.data.table || "");
          if (!table) block("Configure a Postgres table.");
          if (operation === "insert") {
            const payloadRecord =
              typeof inputValue === "object" && inputValue
                ? (inputValue as Record<string, unknown>)
                : { value: inputValue };
            const columns = Object.keys(payloadRecord);
            const values = Object.values(payloadRecord);
            const query = `insert into ${table} (${columns.join(",")}) values (${columns
              .map((_, index) => `$${index + 1}`)
              .join(",")}) returning *`;
            outputs.default = (await client.query(query, values)).rows;
          } else {
            outputs.default = (await client.query(`select * from ${table} limit 25`)).rows;
          }
        } finally {
          await client.end();
        }
        break;
      }

      case "mongoNode": {
        if (!node.data.uri || !node.data.collection) {
          block("Configure a MongoDB URI and collection.");
        }
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(String(node.data.uri));
        await client.connect();
        try {
          const collection = client
            .db(String(node.data.database || "buildrax"))
            .collection(String(node.data.collection));
          const operation = String(node.data.operation || "find");
          if (operation === "insertOne") {
            const result = await collection.insertOne(
              (inputValue as Record<string, unknown>) || { payload: inputs }
            );
            outputs.default = { insertedId: result.insertedId.toString() };
          } else if (operation === "updateOne") {
            const payload = (inputValue as Record<string, unknown>) || {};
            const result = await collection.updateOne(
              { _id: payload._id } as Record<string, unknown>,
              { $set: payload },
              { upsert: true }
            );
            outputs.default = {
              matchedCount: result.matchedCount,
              modifiedCount: result.modifiedCount,
              upsertedId: result.upsertedId?.toString(),
            };
          } else {
            outputs.default = await collection.find({}).limit(25).toArray();
          }
        } finally {
          await client.close();
        }
        break;
      }

      case "redisNode": {
        block("Configure a Redis client provider or REST endpoint before running Redis nodes.");
      }

      case "vectorStoreNode":
      case "queuePublishNode":
      case "queueConsumeNode":
      case "objectStorageNode": {
        const endpoint = String(node.data.endpoint || "").trim();
        if (!endpoint || isPlaceholderUrl(endpoint)) {
          block(`Configure a real endpoint for ${node.type}.`);
        }
        outputs.default = await postJson(endpoint, {
          nodeType: node.type,
          namespace: node.data.namespace,
          queueName: node.data.queueName,
          bucket: node.data.bucket,
          operation: node.data.operation,
          payload: inputValue,
        }, typeof node.data.apiKey === "string" ? node.data.apiKey : undefined);
        break;
      }

      case "retryNode":
      case "timeoutNode":
      case "rateLimiterNode":
      case "idempotencyNode":
      case "logNode":
      case "metricNode":
      case "traceNode": {
        outputs.default = inputValue || inputs;
        warnings.push(`${node.type} applied as an in-process runtime policy.`);
        break;
      }

      case "circuitBreakerNode": {
        if (mode === "test" && scenario.failureMode === "partial_outage") {
          outputs.open = { status: "open", reason: "Scenario partial_outage tripped breaker." };
        } else {
          outputs.closed = inputValue || { status: "closed" };
        }
        break;
      }

      case "fallbackNode": {
        if (
          mode === "test" &&
          (scenario.failureMode === "dependency_timeout" || scenario.failureMode === "partial_outage")
        ) {
          outputs.fallback = {
            status: "fallback",
            message: node.data.fallbackMessage,
          };
          warnings.push("Fallback path activated by the test scenario.");
        } else {
          outputs.primary = inputValue || { status: "primary" };
        }
        break;
      }

      case "authNode": {
        const serialized = inputText.toLowerCase();
        if (!serialized.includes("token") && !serialized.includes("authorization")) {
          block("Auth Guard requires a token or authorization value in the payload.");
        }
        outputs.default = inputValue;
        break;
      }

      case "rbacNode": {
        const requiredRole = String(node.data.role || "").toLowerCase();
        const serialized = inputText.toLowerCase();
        if (requiredRole && !serialized.includes(requiredRole)) {
          throw new Error(`RBAC check failed. Required role: ${requiredRole}`);
        }
        outputs.default = inputValue;
        break;
      }

      case "secretsNode": {
        const secretName = String(node.data.secretName || "");
        const secretValue = String(node.data.secretValue || process.env[secretName] || "");
        if (!secretName || !secretValue) {
          block("Configure a secret name and vault value before running Secrets nodes.");
        }
        outputs.default = { payload: inputValue, secrets: { [secretName]: "***" } };
        break;
      }

      case "piiRedactionNode": {
        outputs.default = redactPII(inputValue, node.data.entities);
        break;
      }

      case "alertNode": {
        if (mode === "live") {
          const webhookUrl = String(node.data.webhookUrl || "");
          if (!webhookUrl) block("Configure an alert webhook before live alert execution.");
          outputs.default = await postJson(webhookUrl, {
            channel: node.data.channel,
            payload: inputValue,
          });
        } else {
          outputs.default = { channel: node.data.channel, payload: inputValue };
        }
        break;
      }

      case "assertionNode": {
        const contains = String(node.data.contains || "");
        const serialized = serialize(inputValue || inputs);
        if (contains && serialized.includes(contains)) {
          outputs.pass = { status: "pass", contains, payload: inputValue };
        } else {
          outputs.fail = { status: "fail", contains, payload: inputValue };
          throw new Error(`Assertion failed. Expected payload to contain "${contains}".`);
        }
        break;
      }

      case "loadGeneratorNode": {
        requireTestMode(node, mode);
        const requests = Math.max(1, Number(node.data.requests || scenario.queueDepth || 1));
        outputs.default = Array.from({ length: Math.min(requests, 100) }, (_, index) => ({
          requestId: `test-${index + 1}`,
          scenario: scenario.name,
        }));
        break;
      }

      case "faultInjectorNode": {
        requireTestMode(node, mode);
        const faultMode = String(node.data.mode || scenario.failureMode);
        if (faultMode === "dependency_timeout") {
          throw new Error("Fault injector triggered dependency timeout.");
        }
        warnings.push(`Fault injector applied: ${faultMode}.`);
        outputs.default = inputValue;
        break;
      }

      case "testFixtureNode": {
        requireTestMode(node, mode);
        outputs.default = parseMaybeJson(String(node.data.responseBody || "{}"));
        break;
      }

      case "outputNode": {
        outputs.default = inputValue;
        break;
      }

      default: {
        block(`No production executor is registered for node type: ${node.type}.`);
      }
    }

    if (mode === "test" && scenario.failureMode === "latency_spike") {
      warnings.push("Scenario requested a latency spike; latency was recorded in node metrics.");
    }
  } catch (caughtError) {
    if (caughtError instanceof BlockedNodeError) {
      status = "blocked";
      blockedReason = caughtError.message;
    } else {
      status = "failed";
      error = caughtError instanceof Error ? caughtError.message : "Unknown execution failure";
    }
  }

  const completedAt = new Date();
  const latencyMs =
    completedAt.getTime() -
    startedAt.getTime() +
    (mode === "test" && scenario.failureMode === "latency_spike" ? 250 : 0) +
    (mode === "test" && scenario.failureMode === "dependency_timeout" ? scenario.timeoutMs : 0);

  return {
    nodeId: node.id,
    nodeType: node.type,
    status,
    outputs,
    error,
    blockedReason,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    inputs,
    metrics: {
      latencyMs,
      tokenUsage,
      cost,
      warnings,
      model,
      providerId,
    },
  };
}

export async function runGraph(args: {
  graph: WorkflowGraph;
  mode: RunMode;
  scenario?: ScenarioDefinition;
  userId?: string;
  modelProviderId?: string;
  modelId?: string;
}): Promise<GraphRunResult> {
  const scenario: ScenarioDefinition =
    args.scenario || {
      name: "Baseline Test",
      trafficProfile: "single",
      dependencyMode: args.mode === "live" ? "live" : "safe_test",
      failureMode: "none",
      timeoutMs: 1200,
      queueDepth: 10,
      assertionRules: [],
    };

  const analysis = analyzeGraph(args.graph);
  const nodesById = new Map(args.graph.nodes.map((node) => [node.id, node]));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, WorkflowEdge[]>();

  for (const node of args.graph.nodes) {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of args.graph.edges) {
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
    adjacency.get(edge.source)?.push(edge);
  }

  const queue = args.graph.nodes
    .filter((node) => (indegree.get(node.id) || 0) === 0)
    .map((node) => node.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const edge of adjacency.get(current) || []) {
      indegree.set(edge.target, (indegree.get(edge.target) || 0) - 1);
      if ((indegree.get(edge.target) || 0) === 0) {
        queue.push(edge.target);
      }
    }
  }

  if (order.length !== args.graph.nodes.length) {
    return {
      mode: args.mode,
      analysis: {
        ...analysis,
        flaws: [...analysis.flaws, "Workflow graph contains a cycle."],
      },
      nodeResults: [],
      summary: {
        status: "blocked",
        latencyMs: 0,
        tokenUsage: 0,
        cost: 0,
        warnings: [...analysis.warnings, "Cycle detected before execution."],
        blockedCount: args.graph.nodes.length,
      },
    };
  }

  const edgePayloads = new Map<string, unknown>();
  const nodeResults: NodeExecutionResult[] = [];
  const startedAt = Date.now();
  let totalTokens = 0;
  let totalCost = 0;
  const runWarnings = [...analysis.warnings];

  for (const nodeId of order) {
    const node = nodesById.get(nodeId);
    if (!node) continue;

    const { inputs, activeCount, incoming } = getIncomingEdgePayloads(
      args.graph.edges,
      edgePayloads,
      nodeId
    );

    if (incoming.length > 0 && activeCount === 0) {
      nodeResults.push({
        nodeId: node.id,
        nodeType: node.type,
        status: "skipped",
        outputs: {},
        inputs,
        metrics: {
          latencyMs: 0,
          tokenUsage: 0,
          cost: 0,
          warnings: ["Skipped because no inbound path was activated."],
        },
      });
      continue;
    }

    const result = await executeNode({
      node,
      inputs,
      mode: args.mode,
      scenario,
      userId: args.userId,
      modelProviderId: args.modelProviderId,
      modelId: args.modelId,
    });
    nodeResults.push(result);
    totalTokens += result.metrics.tokenUsage;
    totalCost += result.metrics.cost;
    runWarnings.push(...result.metrics.warnings);

    if (result.status !== "completed") {
      continue;
    }

    const outgoingEdges = adjacency.get(node.id) || [];
    for (const edge of outgoingEdges) {
      const value =
        result.outputs[edge.sourceHandle || "default"] ??
        result.outputs.default;
      if (value !== undefined) {
        edgePayloads.set(edge.id, value);
      }
    }
  }

  const hasFailures = nodeResults.some((result) => result.status === "failed");
  const blockedCount = nodeResults.filter((result) => result.status === "blocked").length;
  const status = blockedCount > 0 ? "blocked" : hasFailures ? "failed" : "completed";

  return {
    mode: args.mode,
    analysis,
    nodeResults,
    summary: {
      status,
      latencyMs: Date.now() - startedAt,
      tokenUsage: totalTokens,
      cost: Number(totalCost.toFixed(6)),
      warnings: Array.from(new Set(runWarnings)),
      blockedCount,
    },
  };
}

export function deterministicScenarioFromPrompt(prompt: string): ScenarioDefinition {
  const normalized = prompt.toLowerCase();
  const failureMode: ScenarioDefinition["failureMode"] =
    normalized.includes("timeout")
      ? "dependency_timeout"
      : normalized.includes("down") || normalized.includes("outage") || normalized.includes("500")
        ? "partial_outage"
        : normalized.includes("slow") || normalized.includes("latency")
          ? "latency_spike"
          : "none";

  return {
    name: prompt.slice(0, 64) || "User Scenario",
    prompt,
    expectedBehavior: "Workflow should complete or block clearly without fake success.",
    trafficProfile: normalized.includes("burst") ? "burst" : "single",
    dependencyMode: "safe_test",
    failureMode,
    timeoutMs: 1500 + (stableHash(prompt) % 1000),
    queueDepth: normalized.includes("many") || normalized.includes("load") ? 50 : 10,
    assertionRules: [],
  };
}
