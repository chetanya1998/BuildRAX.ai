import { getNodeDefinition } from "@/lib/graph/catalog";
import { WorkflowGraph } from "@/lib/graph/types";

export function sanitizeMermaidLabel(value: unknown) {
  return String(value || "")
    .replace(/[<>{}[\]|"`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Node";
}

function nodeKey(id: string, index: number) {
  return `N${index}_${id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) || "node"}`;
}

export function generateMermaid(graph: WorkflowGraph) {
  const idMap = new Map<string, string>();
  const lines = ["flowchart TD"];

  graph.nodes.forEach((node, index) => {
    const key = nodeKey(node.id, index + 1);
    idMap.set(node.id, key);
    const definition = getNodeDefinition(node.type);
    const label = sanitizeMermaidLabel(node.data.label || definition?.title || node.type);
    const shape = ["database", "cache", "object_storage"].includes(node.type) ? `[(${label})]` : `[${label}]`;
    lines.push(`    ${key}${shape}`);
  });

  graph.edges.forEach((edge) => {
    const source = idMap.get(edge.source);
    const target = idMap.get(edge.target);
    if (!source || !target) return;
    const label = sanitizeMermaidLabel(edge.label || edge.condition || "");
    lines.push(label ? `    ${source} -->|${label}| ${target}` : `    ${source} --> ${target}`);
  });

  return lines.join("\n");
}

export function validateMermaid(code: string) {
  const errors: string[] = [];
  const trimmed = code.trim();

  if (!trimmed) errors.push("Mermaid code is empty.");
  if (!/^(flowchart|graph|sequenceDiagram|stateDiagram-v2)\b/m.test(trimmed)) {
    errors.push("Diagram must start with flowchart, graph, sequenceDiagram, or stateDiagram-v2.");
  }
  if (trimmed.length > 15000) errors.push("Diagram exceeds the 15KB MVP size limit.");
  if (/<script|onerror=|onclick=|<iframe/i.test(trimmed)) {
    errors.push("Unsafe HTML or script-like content is not allowed.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: trimmed.includes("%%") ? ["Comments are allowed but omitted from exports when needed."] : [],
  };
}
