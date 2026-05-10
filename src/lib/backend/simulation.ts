import { getNodeDefinition } from "@/lib/graph/catalog";
import { SimulationResult, SimulationScenario, SimulationScenarioId, SimulationTraceStep, WorkflowGraph, WorkflowNode } from "@/lib/graph/types";

export const DEFAULT_SCENARIOS: SimulationScenario[] = [
  { id: "happy_path", name: "Happy Path", inputs: { sample_payload: { ok: true } } },
  { id: "failure_path", name: "Failure Path", inputs: { failed_node: "", failure_type: "dependency_error" } },
  { id: "timeout", name: "Timeout", inputs: { timeout_ms: 2500 } },
  { id: "load_estimate", name: "Load Estimate", inputs: { requests_per_second: 25, payload_size: "10KB", cache_hit_rate: 0.4 } },
  { id: "security_misuse", name: "Security Misuse", inputs: { expired_token: true, missing_permission: true, invalid_payload: true, duplicate_webhook: true, rate_limit_abuse: true } },
];

function labelFor(node: WorkflowNode) {
  return String(node.data.label || getNodeDefinition(node.type)?.title || node.type);
}

function roleFor(node: WorkflowNode) {
  return String(node.data.node_role || getNodeDefinition(node.type)?.fields.find((field) => field.name === "node_role")?.defaultValue || "");
}

function estimateLatency(node: WorkflowNode) {
  if (typeof node.data.avg_latency_ms === "number") return Math.max(1, node.data.avg_latency_ms);
  if (roleFor(node).includes("storage")) return 45;
  if (roleFor(node) === "cache") return 8;
  if (roleFor(node) === "async_buffer") return 18;
  if (roleFor(node) === "background_processor") return 90;
  if (roleFor(node) === "external_side_effect") return 650;
  if (node.type === "payment_gateway") return 850;
  if (["observer", "operations_response", "availability_monitor", "compliance_observer"].includes(roleFor(node))) return 12;
  return 25;
}

function orderedNodes(graph: WorkflowGraph) {
  const nodes = graph.nodes || [];
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) incoming.set(node.id, 0);
  for (const edge of graph.edges || []) {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
  }

  const queue = nodes.filter((node) => (incoming.get(node.id) || 0) === 0);
  const visited = new Set<string>();
  const result: WorkflowNode[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || visited.has(node.id)) continue;
    visited.add(node.id);
    result.push(node);
    for (const nextId of outgoing.get(node.id) || []) {
      incoming.set(nextId, Math.max(0, (incoming.get(nextId) || 0) - 1));
      if ((incoming.get(nextId) || 0) === 0) {
        const nextNode = nodes.find((item) => item.id === nextId);
        if (nextNode) queue.push(nextNode);
      }
    }
  }

  return result.length === nodes.length ? result : nodes;
}

export function runWorkflowSimulation(graph: WorkflowGraph, scenarioId: SimulationScenarioId = "happy_path", inputs: Record<string, unknown> = {}): SimulationResult {
  const scenario = {
    ...(DEFAULT_SCENARIOS.find((item) => item.id === scenarioId) || DEFAULT_SCENARIOS[0]),
    inputs: { ...(DEFAULT_SCENARIOS.find((item) => item.id === scenarioId)?.inputs || {}), ...inputs },
  } as SimulationScenario;
  const typeSet = new Set((graph.nodes || []).map((node) => node.type));
  const roleSet = new Set((graph.nodes || []).map(roleFor));
  const trace: SimulationTraceStep[] = [];
  const failedNodes: string[] = [];
  const missingFallback: string[] = [];

  for (const node of orderedNodes(graph)) {
    let status: SimulationTraceStep["status"] = "completed";
    let message = "Node completed in deterministic simulation.";

    if (scenario.id === "security_misuse") {
      if (roleFor(node) === "guard" && scenario.inputs.expired_token) {
        status = "completed";
        message = "Expired-token or unauthorized misuse blocked by guard node.";
      } else if (node.type === "rbac_permission_check" && scenario.inputs.missing_permission) {
        status = "completed";
        message = "Missing-permission misuse blocked by RBAC.";
      } else if (["trigger", "api_endpoint", "gateway"].includes(roleFor(node)) && !typeSet.has("rate_limiter") && scenario.inputs.rate_limit_abuse) {
        status = "warning";
        message = "Rate-limit abuse would not be blocked in this flow.";
        missingFallback.push(labelFor(node));
      }
    }

    if (scenario.id === "failure_path") {
      const selectedFailedNode = String(scenario.inputs.failed_node || "");
      if ((selectedFailedNode && selectedFailedNode === node.id) || (!selectedFailedNode && ["external_side_effect", "background_processor", "async_buffer"].includes(roleFor(node)))) {
        status = (typeSet.has("queue") || typeSet.has("dead_letter_queue") || typeSet.has("alert") || roleSet.has("operations_response")) ? "warning" : "failed";
        message = status === "failed" ? "Injected failure has no clear recovery path." : "Injected failure found partial recovery coverage.";
        failedNodes.push(node.id);
        if (status === "failed") missingFallback.push(labelFor(node));
      }
    }

    if (scenario.id === "timeout" && String(node.data.traffic_behavior || "").includes('"can_timeout": true')) {
      const p95 = Number(node.data.p95_latency_ms || 0);
      if (!p95 || p95 > Number(scenario.inputs.timeout_ms || 2500)) {
        status = "warning";
        message = "P95 latency exceeds the scenario timeout threshold.";
        missingFallback.push(labelFor(node));
      } else {
        message = "Latency profile fits within the scenario timeout threshold.";
      }
    }

    if (scenario.id === "load_estimate") {
      if (roleFor(node).includes("storage") && !typeSet.has("cache")) {
        status = "warning";
        message = "Storage access may become a load bottleneck without cache or read-scaling assumptions.";
      }
      if (node.type === "queue" && !typeSet.has("dead_letter_queue")) {
        status = "warning";
        message = "Queue absorbs load but has no DLQ for failed jobs.";
      }
    }

    trace.push({
      nodeId: node.id,
      label: labelFor(node),
      type: node.type,
      status,
      message,
      estimatedLatencyMs: estimateLatency(node),
    });
  }

  const affectedDownstreamNodes = failedNodes.length > 0 ? trace.slice(trace.findIndex((step) => failedNodes.includes(step.nodeId)) + 1).map((step) => step.nodeId) : [];
  const warningCount = trace.filter((step) => step.status === "warning").length;
  const failCount = trace.filter((step) => step.status === "failed" || step.status === "blocked").length;
  const totalLatency = trace.reduce((sum, step) => sum + step.estimatedLatencyMs, 0);
  const bottleneck = trace.slice().sort((a, b) => b.estimatedLatencyMs - a.estimatedLatencyMs)[0];

  return {
    scenario,
    status: failCount > 0 ? "failed" : warningCount > 0 ? "warning" : "completed",
    trace,
    failedNodes,
    affectedDownstreamNodes,
    bottleneckEstimate: bottleneck ? `${bottleneck.label} is the likely bottleneck at ~${bottleneck.estimatedLatencyMs}ms. Total path estimate: ${totalLatency}ms.` : "No bottleneck estimate available.",
    missingFallback: Array.from(new Set(missingFallback)),
    summary:
      failCount > 0
        ? "Simulation found a blocking failure path."
        : warningCount > 0
          ? "Simulation completed with warnings that should be resolved before implementation."
          : "Simulation completed cleanly for the selected scenario.",
    createdAt: new Date().toISOString(),
  };
}
