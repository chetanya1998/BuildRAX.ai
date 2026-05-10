import { generateMermaid } from "@/lib/backend/mermaid";
import { runWorkflowReview } from "@/lib/backend/review";
import { runWorkflowSimulation } from "@/lib/backend/simulation";
import { getNodeDefinition } from "@/lib/graph/catalog";
import { WorkflowGraph } from "@/lib/graph/types";

export type ExportType =
  | "workflow_json"
  | "mermaid"
  | "developer_handoff"
  | "api_contract"
  | "security_checklist"
  | "simulation_report";

function nodeLabel(node: WorkflowGraph["nodes"][number]) {
  return String(node.data.label || getNodeDefinition(node.type)?.title || node.type);
}

function nodeRole(node: WorkflowGraph["nodes"][number]) {
  return String(node.data.node_role || getNodeDefinition(node.type)?.fields.find((field) => field.name === "node_role")?.defaultValue || "");
}

function markdownList(items: string[]) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

export function generateExport(graph: WorkflowGraph, type: ExportType) {
  const review = runWorkflowReview(graph);
  const simulation = runWorkflowSimulation(graph, "happy_path");

  if (type === "workflow_json") {
    return JSON.stringify({ graph, review: review.scores, generatedAt: new Date().toISOString() }, null, 2);
  }

  if (type === "mermaid") {
    return graph.metadata.mermaid || generateMermaid(graph);
  }

  if (type === "api_contract") {
    const endpoints = graph.nodes.filter((node) => ["trigger", "api_endpoint", "gateway"].includes(nodeRole(node)));
    return `# API Contract\n\n${endpoints.map((node) => {
      return `## ${nodeLabel(node)}\n\nRole: ${nodeRole(node)}\n\nSecurity:\n${markdownList(String(node.data.security_requirements || "").split("\\n").filter(Boolean))}\n\nInput:\n\`\`\`json\n${String(node.data.input_contract || "{}")}\n\`\`\`\n\nOutput:\n\`\`\`json\n${String(node.data.output_contract || "{}")}\n\`\`\`\n\nExport mapping:\n\`\`\`json\n${String(node.data.export_mapping || "{}")}\n\`\`\``;
    }).join("\n\n") || "No API endpoint nodes defined."}`;
  }

  if (type === "security_checklist") {
    const securityIssues = review.issues.filter((issue) => issue.category === "security");
    return `# Security Checklist\n\n## Current Controls\n${markdownList(graph.nodes.filter((node) => ["guard", "safety_validator", "compliance_observer", "operations_response"].includes(nodeRole(node)) || String(node.data.security_requirements || "").trim()).map((node) => `${nodeLabel(node)} (${nodeRole(node)})`))}\n\n## Issues To Resolve\n${markdownList(securityIssues.map((issue) => `${issue.severity.toUpperCase()}: ${issue.description} Fix: ${issue.suggestedFix}`))}`;
  }

  if (type === "simulation_report") {
    return `# Simulation Report\n\nScenario: ${simulation.scenario.name}\n\nStatus: ${simulation.status}\n\n${simulation.summary}\n\n## Trace\n${simulation.trace.map((step) => `- ${step.label}: ${step.status} (${step.estimatedLatencyMs}ms) - ${step.message}`).join("\n")}\n\n## Bottleneck\n${simulation.bottleneckEstimate}\n\n## Missing Fallbacks\n${markdownList(simulation.missingFallback)}`;
  }

  return `# Developer Handoff\n\n## Product Flow Summary\n${graph.metadata.description || "Backend workflow designed in BuildRAX."}\n\n## Architecture Overview\n${graph.nodes.length} nodes and ${graph.edges.length} edges.\n\n## Node List\n${graph.nodes.map((node) => `- ${nodeLabel(node)} (${node.type}, role: ${nodeRole(node)})`).join("\n") || "- None"}\n\n## Entry Points\n${markdownList(graph.nodes.filter((node) => ["trigger", "api_endpoint", "gateway"].includes(nodeRole(node))).map(nodeLabel))}\n\n## State And Storage\n${markdownList(graph.nodes.filter((node) => ["storage_reader", "storage_writer", "atomic_state_manager", "cache", "file_storage"].includes(nodeRole(node))).map((node) => `${nodeLabel(node)}: ${String(node.data.output_contract || "contract not specified").slice(0, 180)}`))}\n\n## Review Summary\n${review.summary}\n\n## Open Questions\n${markdownList(review.issues.slice(0, 8).map((issue) => issue.description))}`;
}
