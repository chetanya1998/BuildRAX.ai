import { getNodeDefinition } from "@/lib/graph/catalog";
import { GraphAnalysis, WorkflowGraph } from "@/lib/graph/types";

export function analyzeGraph(graph: WorkflowGraph): GraphAnalysis {
  const flaws: string[] = [];
  const warnings: string[] = [];

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const outgoingCount = new Map<string, number>();

  for (const node of graph.nodes) {
    const definition = getNodeDefinition(node.type);
    if (!definition) {
      flaws.push(`Unsupported node type detected: ${node.type}`);
      continue;
    }
    if (!definition.capabilities.simulate) {
      warnings.push(`${definition.title} is not test-run ready.`);
    }
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      flaws.push(`Edge ${edge.id} points to a missing node.`);
    }
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
  }

  const gatewayCount = graph.nodes.filter((node) => node.type === "apiGatewayNode").length;
  const outputCount = graph.nodes.filter((node) => node.type === "outputNode").length;
  if (gatewayCount === 0) warnings.push("Graph has no API gateway or ingress node.");
  if (outputCount === 0) flaws.push("Graph has no output node.");

  const reliabilityCount = graph.nodes.filter((node) =>
    [
      "retryNode",
      "timeoutNode",
      "circuitBreakerNode",
      "fallbackNode",
      "idempotencyNode",
    ].includes(node.type)
  ).length;
  if (reliabilityCount === 0) {
    warnings.push("Graph has no explicit reliability policy nodes.");
  }

  const observabilityCount = graph.nodes.filter((node) =>
    ["logNode", "metricNode", "traceNode", "alertNode", "assertionNode"].includes(node.type)
  ).length;
  if (observabilityCount < 2) {
    warnings.push("Observability coverage is thin; add trace, metrics, or assertions.");
  }

  const fanOutNodes = [...outgoingCount.entries()]
    .filter(([, count]) => count > 3)
    .map(([id]) => id);
  if (fanOutNodes.length > 0) {
    warnings.push(`High fan-out detected on nodes: ${fanOutNodes.join(", ")}`);
  }

  const score = Math.max(
    1,
    10 - flaws.length * 2 - Math.min(4, warnings.length)
  );

  return {
    score,
    feedback:
      flaws.length === 0
        ? "The graph has a strong production shape. Focus next on scenario depth and runtime policy tuning."
        : "The graph needs structural cleanup before it is safe for production-style test runs.",
    warnings,
    flaws,
    suggestedScenarios: [
      "primary dependency latency spike",
      "LLM quality regression",
      "queue backlog and retry storm",
    ],
  };
}
