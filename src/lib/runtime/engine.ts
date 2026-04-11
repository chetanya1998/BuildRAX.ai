import { generateText } from "@/lib/litellm";
import {
  GraphAnalysis,
  NodeExecutionResult,
  ScenarioDefinition,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
} from "@/lib/graph/types";
import { analyzeGraph } from "./analyzer";

type RunMode = "simulation" | "execution";

export interface GraphRunResult {
  mode: RunMode;
  analysis: GraphAnalysis;
  nodeResults: NodeExecutionResult[];
  summary: {
    status: "completed" | "failed";
    latencyMs: number;
    tokenUsage: number;
    cost: number;
    warnings: string[];
  };
}

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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

async function executeNode(
  node: WorkflowNode,
  inputs: Record<string, unknown>,
  mode: RunMode,
  scenario: ScenarioDefinition
): Promise<NodeExecutionResult> {
  const startedAt = Date.now();
  const inputText =
    typeof inputs.default === "string"
      ? (inputs.default as string)
      : JSON.stringify(inputs.default || inputs);
  const seededLatency = 40 + (stableHash(`${node.id}:${node.type}`) % 120);
  const warnings: string[] = [];
  let outputs: Record<string, unknown> = {};
  let status: NodeExecutionResult["status"] = "completed";
  let error: string | undefined;
  let tokenUsage = 0;
  let cost = 0;

  try {
    switch (node.type) {
      case "promptNode": {
        const template = String(node.data.template || "{{default}}");
        outputs.prompt = template.replace(/{{default}}/g, inputText);
        break;
      }
      case "llmNode": {
        const prompt = String(inputs.prompt || inputText || "Summarize the request.");
        tokenUsage = Math.max(20, Math.ceil(prompt.length / 4));
        cost = Number((tokenUsage * 0.00001).toFixed(4));
        if (mode === "execution" && process.env.OPENAI_API_KEY) {
          outputs.default =
            (await generateText(prompt, String(node.data.systemPrompt || ""), {
              model: String(node.data.model || "gpt-4o"),
              temperature: Number(node.data.temperature || 0.3),
              max_tokens: Number(node.data.max_tokens || 800),
              apiKey:
                typeof node.data.apiKey === "string"
                  ? node.data.apiKey
                  : undefined,
            })) || "";
        } else {
          outputs.default = `[SIMULATED ${String(
            node.data.model || "gpt-4o"
          )}] ${prompt.slice(0, 180)}`;
        }
        break;
      }
      case "embedNode": {
        outputs.vector = Array.from({ length: 8 }, (_, index) =>
          Number((((stableHash(inputText) + index) % 100) / 100).toFixed(2))
        );
        tokenUsage = Math.max(8, Math.ceil(inputText.length / 6));
        cost = Number((tokenUsage * 0.000002).toFixed(4));
        break;
      }
      case "rerankNode": {
        const list = Array.isArray(inputs.default) ? inputs.default : [inputs.default];
        outputs.default = list.slice(0, Number(node.data.topK || 5));
        break;
      }
      case "extractNode": {
        outputs.default = {
          extracted: true,
          schemaHint: node.data.schemaHint || "{}",
          preview: inputText.slice(0, 180),
        };
        break;
      }
      case "classifyNode": {
        const classes = String(node.data.classes || "default")
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);
        outputs.default = classes[stableHash(inputText) % classes.length] || "default";
        break;
      }
      case "summarizeNode": {
        outputs.default = `Summary (${String(node.data.style || "executive")}): ${inputText.slice(
          0,
          140
        )}`;
        break;
      }
      case "evaluatorNode": {
        outputs.default = {
          score: 0.82,
          criteria: String(node.data.criteria || "")
            .split("\n")
            .filter(Boolean),
          verdict: "pass",
        };
        break;
      }
      case "memoryNode": {
        if (node.data.mode === "store") {
          outputs.context = `Stored in namespace ${String(node.data.namespace || "default")}`;
        } else {
          outputs.context = `Retrieved context for "${inputText.slice(0, 60)}" from ${String(
            node.data.namespace || "default"
          )}`;
        }
        break;
      }
      case "routerNode": {
        const keywords = String(node.data.primaryKeywords || "")
          .split("\n")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        const isPrimary = keywords.some((keyword) =>
          inputText.toLowerCase().includes(keyword)
        );
        outputs.primary = isPrimary ? inputs.default || inputText : undefined;
        outputs.secondary = isPrimary ? undefined : inputs.default || inputText;
        break;
      }
      case "apiGatewayNode":
      case "serviceNode":
      case "functionNode":
      case "schedulerNode":
      case "postgresNode":
      case "redisNode":
      case "vectorStoreNode":
      case "queuePublishNode":
      case "queueConsumeNode":
      case "objectStorageNode":
      case "retryNode":
      case "timeoutNode":
      case "rateLimiterNode":
      case "idempotencyNode":
      case "authNode":
      case "rbacNode":
      case "secretsNode":
      case "piiRedactionNode":
      case "logNode":
      case "metricNode":
      case "traceNode":
      case "alertNode":
      case "loadGeneratorNode":
      case "faultInjectorNode":
      case "mockServiceNode":
      case "outputNode": {
        outputs.default = {
          status: "ok",
          nodeType: node.type,
          payload: inputs.default || inputs,
        };
        break;
      }
      case "httpRequestNode":
      case "webhookNode": {
        const url = String(node.data.url || "");
        if (!url) throw new Error("Missing target URL");
        if (mode === "execution") {
          const response = await fetch(url, {
            method: String(node.data.method || "POST"),
            headers: { "Content-Type": "application/json" },
            body:
              node.type === "httpRequestNode" || node.type === "webhookNode"
                ? JSON.stringify(inputs.body || inputs.default || {})
                : undefined,
          });
          const contentType = response.headers.get("content-type") || "";
          outputs.default = contentType.includes("application/json")
            ? await response.json()
            : await response.text();
        } else {
          outputs.default = {
            status: "stubbed",
            url,
            mode: scenario.dependencyMode,
          };
        }
        break;
      }
      case "mongoNode": {
        if (mode === "execution" && node.data.uri && node.data.collection) {
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
                (inputs.default as Record<string, unknown>) || { payload: inputs }
              );
              outputs.default = { insertedId: result.insertedId.toString() };
            } else if (operation === "updateOne") {
              const payload = (inputs.default as Record<string, unknown>) || {};
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
              outputs.default = await collection.find({}).limit(5).toArray();
            }
          } finally {
            await client.close();
          }
        } else {
          outputs.default = {
            status: "simulated",
            database: node.data.database,
            collection: node.data.collection,
          };
        }
        break;
      }
      case "circuitBreakerNode": {
        if (scenario.failureMode === "partial_outage") {
          outputs.open = {
            status: "open",
            reason: "Simulated partial outage opened the breaker",
          };
        } else {
          outputs.closed = inputs.default || { status: "closed" };
        }
        break;
      }
      case "fallbackNode": {
        if (
          scenario.failureMode === "dependency_timeout" ||
          scenario.failureMode === "partial_outage"
        ) {
          outputs.fallback = {
            status: "fallback",
            message: node.data.fallbackMessage,
          };
          warnings.push("Fallback path activated by scenario.");
        } else {
          outputs.primary = inputs.default || { status: "primary" };
        }
        break;
      }
      case "assertionNode": {
        const contains = String(node.data.contains || "");
        const serialized = JSON.stringify(inputs.default || inputs);
        if (contains && serialized.includes(contains)) {
          outputs.pass = { status: "pass", contains };
        } else {
          outputs.fail = { status: "fail", contains };
          status = "failed";
          error = `Assertion failed. Expected payload to contain "${contains}".`;
        }
        break;
      }
      default: {
        outputs.default = inputs.default || inputs;
      }
    }

    if (scenario.failureMode === "latency_spike") {
      warnings.push("Scenario injected additional latency.");
    }
  } catch (caughtError) {
    status = "failed";
    error =
      caughtError instanceof Error ? caughtError.message : "Unknown execution failure";
  }

  const latencyMs =
    seededLatency +
    (scenario.failureMode === "latency_spike" ? 250 : 0) +
    (scenario.failureMode === "dependency_timeout" ? scenario.timeoutMs : 0);

  return {
    nodeId: node.id,
    nodeType: node.type,
    status,
    outputs,
    error,
    metrics: {
      latencyMs,
      tokenUsage,
      cost,
      warnings,
    },
  };
}

export async function runGraph(args: {
  graph: WorkflowGraph;
  mode: RunMode;
  scenario?: ScenarioDefinition;
}): Promise<GraphRunResult> {
  const scenario: ScenarioDefinition =
    args.scenario || {
      name: "Default Scenario",
      trafficProfile: "single",
      dependencyMode: args.mode === "execution" ? "live" : "stub",
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
        metrics: {
          latencyMs: 0,
          tokenUsage: 0,
          cost: 0,
          warnings: ["Skipped because no inbound path was activated."],
        },
      });
      continue;
    }

    const result = await executeNode(node, inputs, args.mode, scenario);
    nodeResults.push(result);
    totalTokens += result.metrics.tokenUsage;
    totalCost += result.metrics.cost;
    runWarnings.push(...result.metrics.warnings);

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
  return {
    mode: args.mode,
    analysis,
    nodeResults,
    summary: {
      status: hasFailures ? "failed" : "completed",
      latencyMs: Date.now() - startedAt,
      tokenUsage: totalTokens,
      cost: Number(totalCost.toFixed(4)),
      warnings: Array.from(new Set(runWarnings)),
    },
  };
}
