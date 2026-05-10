import { getNodeDefinition } from "@/lib/graph/catalog";
import { ReviewIssue, ReviewResult, WorkflowGraph, WorkflowNode } from "@/lib/graph/types";

function hasValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return value.trim().length > 0 && !["{}", "[]"].includes(value.trim());
  return value !== undefined && value !== null;
}

function roleFor(node?: WorkflowNode) {
  return String(node?.data?.node_role || getNodeDefinition(node?.type || "")?.fields.find((field) => field.name === "node_role")?.defaultValue || "");
}

function textIncludes(value: unknown, needle: string) {
  return String(value || "").toLowerCase().includes(needle.toLowerCase());
}

function labelFor(node?: WorkflowNode) {
  return String(node?.data?.label || getNodeDefinition(node?.type || "")?.title || node?.type || "Workflow");
}

function issue(args: Omit<ReviewIssue, "id">, index: number): ReviewIssue {
  return { id: `${args.category}-${index + 1}`, ...args };
}

export function runWorkflowReview(graph: WorkflowGraph): ReviewResult {
  const issues: ReviewIssue[] = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  const byId = new Map(nodes.map((node) => [node.id, node]));

  for (const edge of edges) {
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    if (!byId.has(edge.source) || !byId.has(edge.target)) {
      issues.push(issue({
        severity: "critical",
        category: "data_flow",
        description: `Edge ${edge.id} references a missing node.`,
        whyItMatters: "Broken edges make the architecture ambiguous and invalidate simulations.",
        suggestedFix: "Reconnect or delete the broken edge.",
        designPatternReference: "Workflow Integrity",
      }, issues.length));
    }
  }

  const roleSet = new Set(nodes.map(roleFor));
  const typeSet = new Set(nodes.map((node) => node.type));
  const entryNodes = nodes.filter((node) => ["trigger", "api_endpoint", "gateway"].includes(roleFor(node)));
  const protectedMutations = nodes.filter((node) =>
    ["storage_writer", "external_side_effect", "billing_state_manager", "usage_meter", "balance_state_manager", "governance_action"].includes(roleFor(node))
  );
  const observabilityCount = nodes.filter((node) =>
    ["observer", "operations_response", "availability_monitor", "compliance_observer"].includes(roleFor(node))
  ).length;

  if (nodes.length === 0) {
    issues.push(issue({
      severity: "critical",
      category: "architecture_completeness",
      description: "Workflow has no backend nodes.",
      whyItMatters: "The system cannot be reviewed, simulated, or exported without a graph.",
      suggestedFix: "Add an entry point, auth/security controls, data layer, and observability nodes.",
      designPatternReference: "Backend Flow Baseline",
    }, issues.length));
  }

  if (entryNodes.length === 0) {
    issues.push(issue({
      severity: "high",
      category: "architecture_completeness",
      description: "Workflow has no entry point.",
      whyItMatters: "Every backend flow needs a clear trigger such as an API endpoint, webhook, or scheduled job.",
      suggestedFix: "Add an API Endpoint, Webhook Receiver, or Cron Trigger node.",
      designPatternReference: "API Gateway Pattern",
    }, issues.length));
  }

  if (protectedMutations.length > 0 && !roleSet.has("guard")) {
    issues.push(issue({
      severity: "critical",
      category: "security",
      affectedNodeId: protectedMutations[0]?.id,
      affectedNodeLabel: labelFor(protectedMutations[0]),
      description: "Mutation endpoint exists without an authentication node.",
      whyItMatters: "Unauthenticated mutations can expose sensitive operations to abuse.",
      suggestedFix: "Add an Auth Node, JWT Auth, OAuth Login, or API Key Auth before mutation/side-effect nodes.",
      designPatternReference: "Defense in Depth",
    }, issues.length));
  }

  if (protectedMutations.length > 0 && !typeSet.has("rbac_permission_check")) {
    issues.push(issue({
      severity: "high",
      category: "security",
      affectedNodeId: protectedMutations[0]?.id,
      affectedNodeLabel: labelFor(protectedMutations[0]),
      description: "Mutation endpoint is missing explicit authorization/RBAC.",
      whyItMatters: "Authentication proves identity, but authorization controls resource access.",
      suggestedFix: "Add an RBAC Permission Check node with ownership and default-deny rules.",
      designPatternReference: "Least Privilege",
    }, issues.length));
  }

  if (entryNodes.length > 0 && !typeSet.has("rate_limiter")) {
    issues.push(issue({
      severity: "high",
      category: "security",
      description: "Public API flow has no rate limiter.",
      whyItMatters: "Rate limits protect login, write, and public endpoints from abuse and traffic spikes.",
      suggestedFix: "Add a Rate Limiter near the entry point and define scope/window/burst behavior.",
      designPatternReference: "API Gateway Pattern",
    }, issues.length));
  }

  for (const node of nodes) {
    const definition = getNodeDefinition(node.type);
    if (!definition) {
      issues.push(issue({
        severity: "medium",
        category: "architecture_completeness",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: `Unsupported node type: ${node.type}.`,
        whyItMatters: "Unsupported nodes cannot receive schema validation, review rules, or simulation behavior.",
        suggestedFix: "Replace it with a registered backend node or define a custom node schema.",
        designPatternReference: "Node Registry",
      }, issues.length));
      continue;
    }

    for (const field of definition.fields.filter((item) => item.required)) {
      if (!hasValue(node.data[field.name])) {
        issues.push(issue({
          severity: "medium",
          category: "architecture_completeness",
          affectedNodeId: node.id,
          affectedNodeLabel: labelFor(node),
          description: `${field.label} is required but empty.`,
          whyItMatters: "Required node configuration needs to be explicit for engineering handoff.",
          suggestedFix: `Fill in ${field.label}.`,
          designPatternReference: "Request Validation Pattern",
        }, issues.length));
      }
    }

    if ((incoming.get(node.id) || 0) === 0 && !["trigger", "api_endpoint", "gateway"].includes(roleFor(node))) {
      issues.push(issue({
        severity: "low",
        category: "data_flow",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: "Node has no incoming connection.",
        whyItMatters: "Disconnected nodes may represent missing dependencies or stale design fragments.",
        suggestedFix: "Connect the node into the workflow or remove it.",
        designPatternReference: "Workflow Integrity",
      }, issues.length));
    }

    if ((outgoing.get(node.id) || 0) === 0 && !["storage_reader", "storage_writer", "file_storage", "observer", "operations_response", "availability_monitor", "compliance_observer", "exporter"].includes(roleFor(node))) {
      issues.push(issue({
        severity: "info",
        category: "data_flow",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: "Node has no downstream path.",
        whyItMatters: "Terminal behavior should be intentional so exports describe the final system state.",
        suggestedFix: "Connect a downstream node or document why this is terminal.",
        designPatternReference: "Workflow Integrity",
      }, issues.length));
    }

    if (node.type === "webhook_trigger" && !textIncludes(node.data.security_requirements, "signature")) {
      issues.push(issue({
        severity: "high",
        category: "security",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: "Webhook receiver does not verify provider signatures.",
        whyItMatters: "Unsigned webhook handling can allow forged events and replay attacks.",
        suggestedFix: "Enable signature verification and persist verified event IDs.",
        designPatternReference: "Secure Webhook Pattern",
      }, issues.length));
    }

    if (node.type === "payment_gateway" && !textIncludes(node.data.security_requirements, "idempotency")) {
      issues.push(issue({
        severity: "critical",
        category: "reliability",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: "Payment flow does not define idempotency.",
        whyItMatters: "Retries or duplicate webhooks can create double charges or inconsistent payment state.",
        suggestedFix: "Use request or provider event idempotency keys and store processed events.",
        designPatternReference: "Idempotency Pattern",
      }, issues.length));
    }

    if (node.type === "queue" && !typeSet.has("dead_letter_queue")) {
      issues.push(issue({
        severity: "medium",
        category: "reliability",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: "Queue does not define a dead-letter queue.",
        whyItMatters: "Failed jobs can retry forever or disappear without operator visibility.",
        suggestedFix: "Enable DLQ behavior and connect an alert path for failed jobs.",
        designPatternReference: "Dead-Letter Queue Pattern",
      }, issues.length));
    }

    if (roleFor(node) === "external_side_effect" && String(node.data.traffic_behavior || "").includes('"can_timeout": true') && !typeSet.has("circuit_breaker")) {
      issues.push(issue({
        severity: "medium",
        category: "failure_handling",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: "Third-party dependency has no circuit breaker.",
        whyItMatters: "Repeated dependency failures can cascade through the backend.",
        suggestedFix: "Enable a circuit breaker and define fallback behavior.",
        designPatternReference: "Circuit Breaker Pattern",
      }, issues.length));
    }

    if (roleFor(node) === "storage_reader" && !typeSet.has("cache")) {
      issues.push(issue({
        severity: "medium",
        category: "scalability",
        affectedNodeId: node.id,
        affectedNodeLabel: labelFor(node),
        description: "Read-heavy path has no cache node.",
        whyItMatters: "Frequently-read paths often need caching or explicit capacity assumptions.",
        suggestedFix: "Add a Cache node or document why direct reads are acceptable.",
        designPatternReference: "Cache-Aside Pattern",
      }, issues.length));
    }
  }

  if (observabilityCount < 2) {
    issues.push(issue({
      severity: "medium",
      category: "observability",
      description: "Observability coverage is thin.",
      whyItMatters: "Production teams need logs, metrics, and alerts to detect and diagnose failures.",
      suggestedFix: "Add Logger, Metrics, and Alert nodes on critical paths.",
      designPatternReference: "Audit Log Pattern",
    }, issues.length));
  }

  const critical = issues.filter((item) => item.severity === "critical").length;
  const high = issues.filter((item) => item.severity === "high").length;
  const medium = issues.filter((item) => item.severity === "medium").length;
  const penalty = critical * 18 + high * 10 + medium * 5 + Math.max(0, issues.length - critical - high - medium);
  const overall = Math.max(0, Math.min(100, 100 - penalty));

  return {
    status: critical > 0 ? "blocked" : issues.length > 0 ? "needs_attention" : "passed",
    scores: {
      architecture: Math.max(0, 100 - issues.filter((item) => item.category === "architecture_completeness" || item.category === "data_flow").length * 12),
      security: Math.max(0, 100 - issues.filter((item) => item.category === "security").length * 16),
      reliability: Math.max(0, 100 - issues.filter((item) => item.category === "reliability" || item.category === "failure_handling").length * 12),
      observability: Math.max(0, 100 - issues.filter((item) => item.category === "observability").length * 20),
      overall,
    },
    issues,
    summary:
      critical > 0
        ? "Critical architecture gaps need to be resolved before this workflow is implementation-ready."
        : issues.length > 0
          ? "The workflow is structurally usable, but several backend risks should be addressed."
          : "The workflow has a clean deterministic review with no blocking issues.",
    createdAt: new Date().toISOString(),
  };
}
