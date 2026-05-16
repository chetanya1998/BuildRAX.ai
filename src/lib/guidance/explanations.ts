import { getNodeDefinition } from "@/lib/graph/catalog";
import { ReviewResult, SimulationResult, SimulationScenarioId, WorkflowGraph, WorkflowNode } from "@/lib/graph/types";

export interface BeginnerNodeExplanation {
  title: string;
  plainName: string;
  whatItIs: string;
  whyItMatters: string;
  receives: string;
  sendsForward: string;
  whatCanGoWrong: string;
  exampleResponse: string;
}

export interface PlainLanguageExplanation {
  title: string;
  whatTesting: string;
  howTesting: string;
  whyImportant: string;
  expectedResult: string;
  actualResult: string;
  fixFirst: string;
}

export interface ExpectedFlowStep {
  nodeId: string;
  label: string;
  role: string;
  expectation: string;
  expectedOutput: string;
}

export interface ExpectedVsExactReport {
  expectedSummary: string;
  exactSummary: string;
  matchedSteps: string[];
  missingExpectedSteps: string[];
  unexpectedWarnings: string[];
  blockedOrFailedNodes: string[];
  finalUserResponse: string;
  finalDeveloperResponse: string;
}

type TemplateLike = {
  name: string;
  description: string;
  category: string;
  product_type?: string;
  core_flow?: readonly string[];
  validation_checks?: readonly string[];
  recommended_nodes?: readonly { name: string; node_id: string }[];
  simulation_profile?: { default_scenarios?: readonly string[] };
};

function nodeLabel(node: WorkflowNode) {
  return String(node.data.label || getNodeDefinition(node.type)?.title || node.type);
}

function roleFor(node: WorkflowNode) {
  return String(node.data.node_role || getNodeDefinition(node.type)?.fields.find((field) => field.name === "node_role")?.defaultValue || "component");
}

function inputFor(node: WorkflowNode) {
  return String(node.data.input_contract || "information from the previous step in the workflow");
}

function outputFor(node: WorkflowNode) {
  return String(node.data.output_contract || node.data.outputs || "a result that the next step can use");
}

function possibleOutcomesFor(node: WorkflowNode) {
  return String(node.data.possible_outcomes || node.data.failure_modes || "timeout, invalid data, missing permission, or dependency failure");
}

function graphTheme(graph: WorkflowGraph) {
  const text = [graph.metadata.name, graph.metadata.description, ...(graph.metadata.tags || []), ...graph.nodes.map((node) => `${node.type} ${nodeLabel(node)} ${roleFor(node)}`)].join(" ").toLowerCase();
  if (/payment|billing|subscription|credit|wallet|invoice|refund|payout|escrow/.test(text)) return "payments";
  if (/ai|llm|rag|prompt|vector|embedding|moderation|agent/.test(text)) return "ai";
  if (/marketplace|vendor|creator|job|booking|listing|dispute/.test(text)) return "marketplace";
  if (/saas|tenant|workspace|team|crm|support|project/.test(text)) return "saas";
  if (/analytics|etl|dashboard|report|event|warehouse/.test(text)) return "analytics";
  return "backend";
}

function themeLanguage(theme: string) {
  const map: Record<string, { testing: string; why: string; fix: string }> = {
    payments: {
      testing: "payment safety, duplicate charges, provider failure, ledger state, auditability, and recovery paths",
      why: "money movement needs clear state, audit logs, idempotency, and safe failure handling so users are not double-charged or left in an unclear state",
      fix: "secure payment entry points, idempotency, transaction boundaries, audit logs, retries, and fallback or manual review paths",
    },
    ai: {
      testing: "prompt input, model calls, retrieval, guardrails, parsing, usage metering, and safety boundaries",
      why: "AI workflows can become costly or unsafe if prompts, retrieval, guardrails, and output parsing are not visible",
      fix: "input validation, guardrails, output parsing, usage metering, observability, and fallback behavior",
    },
    marketplace: {
      testing: "buyer/seller actions, escrow or payout handoff, dispute paths, notifications, and audit events",
      why: "marketplace workflows involve multiple parties and can fail in ways that affect trust, payouts, and dispute resolution",
      fix: "permission checks, escrow state, payout reliability, audit logs, notifications, and dispute recovery paths",
    },
    saas: {
      testing: "login, tenant boundaries, team permissions, subscriptions, data writes, and reporting paths",
      why: "SaaS backends need clear access rules so users only see and change the data they are allowed to manage",
      fix: "authentication, RBAC, tenant scoping, rate limits, subscription checks, logs, and metrics",
    },
    analytics: {
      testing: "event intake, processing, storage, reporting, freshness, and failure recovery",
      why: "analytics systems are only useful if events are captured reliably and reports explain what data was processed",
      fix: "queue buffering, worker capacity, dead-letter handling, metrics, and report exports",
    },
    backend: {
      testing: "entry points, validation, security, storage, reliability, and observability",
      why: "a backend design should show how requests move, how failures are handled, and how operators know what happened",
      fix: "entry validation, auth, rate limits, retries, storage contracts, logs, metrics, and alerts",
    },
  };
  return map[theme] || map.backend;
}

export function explainNodeForBeginner(node: WorkflowNode): BeginnerNodeExplanation {
  const definition = getNodeDefinition(node.type);
  const label = nodeLabel(node);
  const role = roleFor(node);
  return {
    title: label,
    plainName: definition?.title || label,
    whatItIs: definition?.description || String(node.data.description || `${label} is a custom backend component in this workflow.`),
    whyItMatters: `This step acts as a ${role.replace(/_/g, " ")}. It helps the workflow stay understandable by making this responsibility explicit instead of hiding it inside code.`,
    receives: inputFor(node),
    sendsForward: outputFor(node),
    whatCanGoWrong: possibleOutcomesFor(node),
    exampleResponse: `${label} finishes and passes ${outputFor(node).slice(0, 140)} to the next connected step.`,
  };
}

export function explainTemplateForBeginner(template: TemplateLike) {
  const nodes = template.recommended_nodes || [];
  const firstNodes = nodes.slice(0, 5).map((node) => node.name).join(", ");
  const flow = (template.core_flow || []).join(" -> ");
  return {
    title: template.name,
    solves: template.description,
    audience: `${template.product_type || template.category} teams can use this when they need a proven backend starting point instead of a blank canvas.`,
    keyNodes: firstNodes || "The template opens with backend nodes chosen from the catalog.",
    happyPath: flow || "A request enters the workflow, passes checks, performs the main business operation, records state, and reports the result.",
    risks: (template.validation_checks || []).slice(0, 4).join(" ") || "Review should check access, validation, failure recovery, and observability.",
    customizeFirst: nodes[0]?.name ? `Start by checking ${nodes[0].name}, then update the nodes that represent your own services, providers, and data stores.` : "Start by naming the workflow and replacing generic components with your real services.",
    scenarios: template.simulation_profile?.default_scenarios || ["happy_path", "failure_path", "timeout"],
  };
}

export function buildExpectedFlow(graph: WorkflowGraph, scenario: SimulationScenarioId = "happy_path"): ExpectedFlowStep[] {
  return graph.nodes.map((node) => {
    const label = nodeLabel(node);
    const role = roleFor(node);
    return {
      nodeId: node.id,
      label,
      role,
      expectation:
        scenario === "failure_path"
          ? `${label} should either recover safely or clearly report a failure.`
          : scenario === "timeout"
            ? `${label} should complete inside its latency assumptions or warn about timeout risk.`
            : `${label} should complete and pass usable output to the next step.`,
      expectedOutput: outputFor(node),
    };
  });
}

export function compareExpectedToActual(expectedFlow: ExpectedFlowStep[], simulation: SimulationResult | null): ExpectedVsExactReport {
  if (!simulation) {
    return {
      expectedSummary: expectedFlow.length > 0 ? `Expected ${expectedFlow.length} connected backend steps to run in order.` : "Expected flow is empty because no nodes are on the canvas.",
      exactSummary: "Simulation has not run yet, so there is no exact trace to compare.",
      matchedSteps: [],
      missingExpectedSteps: expectedFlow.map((step) => step.label),
      unexpectedWarnings: [],
      blockedOrFailedNodes: [],
      finalUserResponse: "Run simulation to see the exact response a user should expect.",
      finalDeveloperResponse: "No simulation trace is available yet.",
    };
  }

  const traceLabels = new Set(simulation.trace.map((step) => step.label));
  const matchedSteps = expectedFlow.filter((step) => traceLabels.has(step.label)).map((step) => step.label);
  const missingExpectedSteps = expectedFlow.filter((step) => !traceLabels.has(step.label)).map((step) => step.label);
  const unexpectedWarnings = simulation.trace.filter((step) => step.status === "warning").map((step) => `${step.label}: ${step.message}`);
  const blockedOrFailedNodes = simulation.trace.filter((step) => step.status === "blocked" || step.status === "failed").map((step) => `${step.label}: ${step.message}`);

  return {
    expectedSummary: expectedFlow.length > 0 ? `Expected ${expectedFlow.length} backend steps to run for ${simulation.scenario.name}.` : "No expected steps were found.",
    exactSummary: `${simulation.trace.length} steps ran. Final status: ${simulation.status}. ${simulation.summary}`,
    matchedSteps,
    missingExpectedSteps,
    unexpectedWarnings,
    blockedOrFailedNodes,
    finalUserResponse:
      simulation.status === "completed"
        ? "The user can expect the workflow to finish successfully for this scenario."
        : simulation.status === "warning"
          ? "The user may still get a response, but the workflow has risks that should be fixed before production."
          : "The user should expect this scenario to fail or stop until the highlighted issue is fixed.",
    finalDeveloperResponse: `${simulation.summary} ${simulation.bottleneckEstimate}`,
  };
}

export function formatExpectedVsExactReport(report: ExpectedVsExactReport) {
  const list = (items: string[]) => (items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None");
  return [
    "## Expected vs Exact Flow",
    "",
    `**Expected:** ${report.expectedSummary}`,
    `**Exact:** ${report.exactSummary}`,
    "",
    "### Matched steps",
    list(report.matchedSteps),
    "",
    "### Missing expected steps",
    list(report.missingExpectedSteps),
    "",
    "### Unexpected warnings",
    list(report.unexpectedWarnings),
    "",
    "### Blocked or failed nodes",
    list(report.blockedOrFailedNodes),
    "",
    "### Final user-facing response",
    report.finalUserResponse,
    "",
    "### Final developer-facing response",
    report.finalDeveloperResponse,
  ].join("\n");
}

export function explainReviewRun(graph: WorkflowGraph, review: ReviewResult | null): PlainLanguageExplanation {
  const theme = themeLanguage(graphTheme(graph));
  const critical = review?.issues.find((issue) => issue.severity === "critical" || issue.severity === "high");
  return {
    title: "Review explanation",
    whatTesting: `This review checks ${theme.testing}.`,
    howTesting: "BuildRAX reads the current graph, groups nodes by role, checks connections, and looks for missing security, reliability, data-flow, and observability pieces.",
    whyImportant: theme.why,
    expectedResult: "A healthy workflow should have a clear entry point, protected access, recoverable failures, visible logs or metrics, and complete handoff data.",
    actualResult: review ? `${review.summary} Overall score: ${review.scores.overall}/100 with ${review.issues.length} finding(s).` : "Review has not run yet.",
    fixFirst: critical ? critical.suggestedFix : `Fix first: ${theme.fix}.`,
  };
}

export function explainSimulationRun(graph: WorkflowGraph, simulation: SimulationResult | null): PlainLanguageExplanation {
  const theme = themeLanguage(graphTheme(graph));
  const firstGap = simulation?.missingFallback[0];
  return {
    title: "Simulation explanation",
    whatTesting: `This simulation tests ${theme.testing} by walking through the connected workflow steps.`,
    howTesting: "BuildRAX does not execute production code. It uses the graph, node roles, latency assumptions, failure modes, and selected scenario to produce a deterministic trace.",
    whyImportant: theme.why,
    expectedResult: "A healthy simulation should show each step completing or failing clearly, with no hidden dead ends.",
    actualResult: simulation ? `${simulation.summary} ${simulation.bottleneckEstimate}` : "Simulation has not run yet.",
    fixFirst: firstGap ? `Fix the missing fallback around ${firstGap}.` : `Fix first: ${theme.fix}.`,
  };
}
