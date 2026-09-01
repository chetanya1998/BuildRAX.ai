import { SCHEMA_VERSION, type ArchitectureNode, type Connector, type Diagram } from "./schema";
import { catalogByType } from "./catalog";

export function createNode(semanticType: string, id: string, name: string, x: number, y: number): ArchitectureNode {
  const item = catalogByType.get(semanticType) ?? catalogByType.get("backend-service")!;
  return {
    id,
    semanticType: item.semanticType,
    category: item.category,
    name,
    description: item.description,
    technology: "",
    provider: "",
    environment: "agnostic",
    responsibilities: [],
    ports: [
      { id: "in", name: "Input", kind: "input", protocols: item.defaultProtocols },
      { id: "out", name: "Output", kind: "output", protocols: item.defaultProtocols },
    ],
    position: { x, y },
    dimensions: { width: 220, height: 112 },
    metadata: {},
  };
}

export function createConnector(id: string, source: string, target: string, type: Connector["type"], label = ""): Connector {
  return {
    id,
    source,
    sourcePort: "out",
    target,
    targetPort: "in",
    type,
    protocol: type === "http-rest" ? "HTTPS" : "",
    direction: "unidirectional",
    authentication: "",
    encryption: type === "http-rest" ? "TLS 1.3" : "",
    retryPolicy: "Exponential backoff",
    latency: "",
    dataClassification: "internal",
    label,
    style: type.includes("message") || type.includes("stream") ? "dashed" : "solid",
  };
}

export function createDiagram(title: string, nodes: ArchitectureNode[] = [], connectors: Connector[] = []): Diagram {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: crypto.randomUUID(),
    title,
    version: 1,
    createdAt: now,
    updatedAt: now,
    theme: "light",
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes,
    primitives: [],
    connectors,
    assumptions: [],
  };
}
