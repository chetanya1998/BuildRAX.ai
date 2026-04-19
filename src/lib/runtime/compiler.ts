import { DEFAULT_GEMMA_MODEL } from "@/lib/ai-providers";
import { getDefaultNodeData, getNodeDefinition, PRODUCTION_NODE_TYPES } from "@/lib/graph/catalog";
import { PromptCompileResult, WorkflowGraph, WorkflowNode } from "@/lib/graph/types";
import { generateTextResult } from "@/lib/litellm";

interface CompileOptions {
  userId?: string;
  modelProviderId?: string;
  modelId?: string;
}

interface GeneratedWorkflowPayload {
  graph: WorkflowGraph;
  assumptions?: string[];
  unresolvedDependencies?: string[];
  riskWarnings?: string[];
  suggestedScenarios?: string[];
  configurationRequirements?: string[];
  testInputSuggestions?: unknown[];
  auditRubric?: string[];
  estimatedCostRisk?: string;
  estimatedLatencyRisk?: string;
  sideEffectRisk?: string;
}

const SYSTEM_PROMPT = `
You are BuildRAX.ai's workflow compiler. Convert a user automation request into a production workflow graph.

Return ONLY valid JSON. Do not use markdown.

Required JSON shape:
{
  "graph": {
    "version": "1.0",
    "metadata": {
      "name": "short workflow name",
      "description": "original intent summary",
      "mode": "design",
      "tags": ["automation"],
      "assumptions": [],
      "riskWarnings": [],
      "suggestedScenarios": []
    },
    "nodes": [
      {
        "id": "node-1",
        "type": "promptNode",
        "position": { "x": 80, "y": 160 },
        "data": { "label": "Prompt", "template": "..." }
      }
    ],
    "edges": [
      { "id": "edge-node-1-node-2", "source": "node-1", "target": "node-2", "animated": true }
    ]
  },
  "assumptions": [],
  "unresolvedDependencies": [],
  "riskWarnings": [],
  "suggestedScenarios": [],
  "configurationRequirements": [],
  "testInputSuggestions": [],
  "auditRubric": [],
  "estimatedCostRisk": "low|medium|high with explanation",
  "estimatedLatencyRisk": "low|medium|high with explanation",
  "sideEffectRisk": "low|medium|high with explanation"
}

Available node types:
${PRODUCTION_NODE_TYPES.join(", ")}

Rules:
- Generate a real automation graph, not a demo.
- Every graph must include at least one trigger/ingress node and one outputNode.
- Use llmNode modelId "${DEFAULT_GEMMA_MODEL}" unless a custom model is clearly needed.
- For apiGatewayNode, leave authRequired false unless the user explicitly asks for authentication, API keys, OAuth, or authorization checks.
- Put missing credentials, URLs, queues, buckets, tables, OAuth setup, API tokens, and live/test separation in configurationRequirements and unresolvedDependencies.
- For external side effects, include nodes but do not put real secrets in node data.
- Prefer left-to-right positions with 260px spacing.
- Never invent API keys, tokens, or credentials.
`;

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function parseJsonPayload(text: string): GeneratedWorkflowPayload {
  return JSON.parse(extractJson(text));
}

function normalizeNode(node: WorkflowNode, index: number): WorkflowNode {
  const definition = getNodeDefinition(node.type);
  if (!definition) {
    throw new Error(`Generated unsupported node type: ${node.type}`);
  }

  return {
    id: String(node.id || `${node.type}-${index + 1}`),
    type: node.type,
    position: {
      x: Number(node.position?.x ?? 80 + index * 260),
      y: Number(node.position?.y ?? 160),
    },
    data: {
      ...getDefaultNodeData(node.type),
      ...(node.data || {}),
    },
  };
}

function validateAndNormalizePayload(payload: GeneratedWorkflowPayload, prompt: string): GeneratedWorkflowPayload {
  if (!payload?.graph?.nodes || !payload?.graph?.edges) {
    throw new Error("Generated workflow did not include graph nodes and edges.");
  }

  const nodes = payload.graph.nodes.map(normalizeNode);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = payload.graph.edges.map((edge, index) => {
    const source = String(edge.source || "");
    const target = String(edge.target || "");
    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      throw new Error(`Generated edge ${edge.id || index} points to a missing node.`);
    }
    return {
      id: String(edge.id || `edge-${source}-${target}-${index + 1}`),
      source,
      target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      animated: edge.animated ?? true,
      label: edge.label || undefined,
    };
  });

  const hasIngress = nodes.some((node) =>
    ["apiGatewayNode", "webhookNode", "schedulerNode", "loadGeneratorNode", "promptNode"].includes(node.type)
  );
  const hasOutput = nodes.some((node) => node.type === "outputNode");
  if (!hasIngress) throw new Error("Generated workflow needs an ingress, trigger, or prompt node.");
  if (!hasOutput) throw new Error("Generated workflow needs an output node.");

  const metadata = {
    name: payload.graph.metadata?.name || `Automation: ${prompt.slice(0, 48)}`,
    description: payload.graph.metadata?.description || prompt,
    mode: "design" as const,
    tags: payload.graph.metadata?.tags || ["automation"],
    assumptions: payload.assumptions || payload.graph.metadata?.assumptions || [],
    riskWarnings: payload.riskWarnings || payload.graph.metadata?.riskWarnings || [],
    suggestedScenarios: payload.suggestedScenarios || payload.graph.metadata?.suggestedScenarios || [],
  };

  return {
    ...payload,
    graph: {
      version: "1.0",
      nodes,
      edges,
      metadata,
    },
    assumptions: metadata.assumptions,
    riskWarnings: metadata.riskWarnings,
    suggestedScenarios: metadata.suggestedScenarios,
    unresolvedDependencies: payload.unresolvedDependencies || payload.configurationRequirements || [],
  };
}

async function repairPayload(args: {
  prompt: string;
  invalidPayload: string;
  error: string;
  options: CompileOptions;
}) {
  const result = await generateTextResult(
    `Repair this invalid BuildRAX workflow JSON.\nOriginal user request:\n${args.prompt}\nValidation error:\n${args.error}\nInvalid JSON/output:\n${args.invalidPayload}`,
    SYSTEM_PROMPT,
    {
      userId: args.options.userId,
      providerId: args.options.modelProviderId,
      modelId: args.options.modelId || DEFAULT_GEMMA_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 3500,
    }
  );

  return result;
}

export async function compilePromptToGraph(
  prompt: string,
  options: CompileOptions = {}
): Promise<PromptCompileResult & Record<string, unknown>> {
  const modelResult = await generateTextResult(
    `User automation request:\n${prompt}`,
    SYSTEM_PROMPT,
    {
      userId: options.userId,
      providerId: options.modelProviderId,
      modelId: options.modelId || DEFAULT_GEMMA_MODEL,
      temperature: 0.15,
      response_format: { type: "json_object" },
      max_tokens: 4000,
    }
  );

  let payload: GeneratedWorkflowPayload;
  try {
    payload = validateAndNormalizePayload(parseJsonPayload(modelResult.text), prompt);
  } catch (error) {
    const repair = await repairPayload({
      prompt,
      invalidPayload: modelResult.text,
      error: error instanceof Error ? error.message : "Invalid generated graph",
      options,
    });
    payload = validateAndNormalizePayload(parseJsonPayload(repair.text), prompt);
    modelResult.usage.totalTokens += repair.usage.totalTokens;
    modelResult.usage.estimatedCost += repair.usage.estimatedCost;
  }

  return {
    graph: payload.graph,
    assumptions: payload.assumptions || [],
    unresolvedDependencies: payload.unresolvedDependencies || [],
    riskWarnings: payload.riskWarnings || [],
    suggestedScenarios: payload.suggestedScenarios || [],
    configurationRequirements: payload.configurationRequirements || payload.unresolvedDependencies || [],
    testInputSuggestions: payload.testInputSuggestions || [],
    auditRubric: payload.auditRubric || [],
    estimatedCostRisk: payload.estimatedCostRisk || "",
    estimatedLatencyRisk: payload.estimatedLatencyRisk || "",
    sideEffectRisk: payload.sideEffectRisk || "",
    usage: modelResult.usage,
  };
}
