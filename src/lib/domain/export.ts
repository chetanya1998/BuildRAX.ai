import type { Diagram } from "./schema";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";

export function safeFilename(title: string, extension: string) {
  const base = title.normalize("NFKD").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-").slice(0, 80).toLowerCase() || "buildrax-diagram";
  return `${base}.${extension}`;
}

export function toMermaid(diagram: Diagram) {
  const lines = ["flowchart LR"];
  for (const node of diagram.nodes) lines.push(`  ${node.id.replace(/[^a-zA-Z0-9_]/g, "_")}["${node.name.replaceAll('"', "'")}"]`);
  for (const connector of diagram.connectors) {
    const source = connector.source.replace(/[^a-zA-Z0-9_]/g, "_");
    const target = connector.target.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`  ${source} -->|"${(connector.label || connector.type).replaceAll('"', "'")}"| ${target}`);
  }
  return lines.join("\n");
}

function mermaidId(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

function mermaidText(value: string) {
  return value.replaceAll('"', "'").replace(/[<>]/g, "");
}

/** Semantic Mermaid exports deliberately ignore canvas geometry and styling. */
export function architectureIRToMermaid(ir: ArchitectureIR) {
  const lines = ["flowchart LR"];
  for (const component of ir.components) lines.push(`  ${mermaidId(component.id)}["${mermaidText(component.name)}"]`);
  for (const flow of ir.flows) {
    lines.push(`  ${mermaidId(flow.source)} -->|"${mermaidText(flow.label || flow.type)}"| ${mermaidId(flow.target)}`);
  }
  return lines.join("\n");
}

export function downloadText(content: string, filename: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
