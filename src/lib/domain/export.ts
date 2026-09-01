import type { Diagram } from "./schema";

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

export function downloadText(content: string, filename: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
