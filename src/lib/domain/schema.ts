import { z } from "zod";

export const SCHEMA_VERSION = "1.0.0" as const;

const safeText = (max: number) =>
  z.string().trim().max(max).refine((value) => !/[<>]/.test(value), "HTML-like markup is not allowed");

export const categorySchema = z.enum([
  "client",
  "networking",
  "compute",
  "data",
  "messaging",
  "ai",
  "security",
  "devops",
]);

export const portSchema = z.object({
  id: z.string().min(1).max(80),
  name: safeText(80),
  kind: z.enum(["input", "output", "bidirectional"]),
  protocols: z.array(z.string().max(40)).max(12).default([]),
}).strict();

export const architectureNodeSchema = z.object({
  id: z.string().min(1).max(120),
  semanticType: z.string().min(1).max(80),
  category: categorySchema,
  name: safeText(120),
  description: safeText(600).default(""),
  technology: safeText(120).default(""),
  provider: safeText(120).default(""),
  environment: z.enum(["agnostic", "development", "staging", "production", "multi-environment"]).default("agnostic"),
  responsibilities: z.array(safeText(180)).max(12).default([]),
  ports: z.array(portSchema).max(20).default([]),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
  dimensions: z.object({ width: z.number().min(120).max(640), height: z.number().min(72).max(480) }).strict(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
}).strict();

export const connectorTypeSchema = z.enum([
  "http-rest",
  "grpc",
  "websocket",
  "async-message",
  "pub-sub",
  "event-stream",
  "database-read-write",
  "cache",
  "object-transfer",
  "model-inference",
  "vector-retrieval",
  "tool-call",
  "control-plane",
]);

export const connectorSchema = z.object({
  id: z.string().min(1).max(120),
  source: z.string().min(1).max(120),
  sourcePort: z.string().max(80).default("out"),
  target: z.string().min(1).max(120),
  targetPort: z.string().max(80).default("in"),
  type: connectorTypeSchema,
  protocol: safeText(80).default(""),
  direction: z.enum(["unidirectional", "bidirectional"]),
  authentication: safeText(120).default(""),
  encryption: safeText(120).default(""),
  retryPolicy: safeText(180).default(""),
  latency: safeText(80).default(""),
  dataClassification: z.enum(["public", "internal", "confidential", "restricted", "unspecified"]).default("unspecified"),
  label: safeText(120).default(""),
  style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  routing: z.enum(["orthogonal", "curved", "straight"]).default("orthogonal"),
}).strict().refine((connector) => connector.source !== connector.target, "Self-referencing connectors are not supported");

export const primitiveSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(["rectangle", "ellipse", "diamond", "frame", "line", "arrow", "text", "freehand", "image"]),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
  dimensions: z.object({ width: z.number().min(1), height: z.number().min(1) }).strict(),
  text: safeText(1000).default(""),
  // Image primitives keep a local data URL in style.src. The limit permits a
  // reasonably sized canvas image while keeping diagram payloads bounded.
  style: z.record(z.string(), z.string().max(4_500_000)).default({}),
}).strict();

export const assumptionSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(["scale", "cloud", "tenancy", "data-sensitivity", "stack", "general"]),
  text: safeText(500),
  confidence: z.number().min(0).max(1),
  affectedObjects: z.array(z.string().max(120)).max(80).default([]),
  edited: z.boolean().default(false),
}).strict();

export const diagramSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1).max(120),
  title: safeText(160),
  version: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  theme: z.enum(["light", "dark"]),
  viewport: z.object({ x: z.number().finite(), y: z.number().finite(), zoom: z.number().min(0.1).max(4) }).strict(),
  nodes: z.array(architectureNodeSchema).max(150),
  primitives: z.array(primitiveSchema).max(300).default([]),
  connectors: z.array(connectorSchema).max(300),
  assumptions: z.array(assumptionSchema).max(40),
}).strict().superRefine((diagram, context) => {
  const ids = new Set(diagram.nodes.map((node) => node.id));
  if (ids.size !== diagram.nodes.length) context.addIssue({ code: "custom", message: "Node IDs must be unique" });
  for (const connector of diagram.connectors) {
    if (!ids.has(connector.source) || !ids.has(connector.target)) {
      context.addIssue({ code: "custom", message: `Connector ${connector.id} references a missing node` });
    }
  }
});

export const reviewFindingSchema = z.object({
  id: z.string().min(1).max(120),
  diagramVersion: z.number().int().min(1),
  lens: z.enum(["security", "scalability", "reliability", "performance", "maintainability", "cost"]),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  rationale: safeText(1200),
  recommendation: safeText(1200),
  affectedObjects: z.array(z.string().max(120)).max(80),
  status: z.enum(["open", "dismissed", "fixed", "outdated"]),
  dismissalNote: safeText(500).optional(),
}).strict();

export const changePlanSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  baseVersion: z.number().int().min(1),
  addedNodes: z.array(architectureNodeSchema).max(40),
  changedNodes: z.array(z.object({ before: architectureNodeSchema, after: architectureNodeSchema }).strict()).max(80),
  removedNodeIds: z.array(z.string().max(120)).max(80),
  addedConnectors: z.array(connectorSchema).max(80),
  removedConnectorIds: z.array(z.string().max(120)).max(120),
  warnings: z.array(safeText(300)).max(20),
}).strict();

export const generationRequestSchema = z.object({
  prompt: safeText(3000).min(12),
  productType: safeText(80).optional(),
  preferredStack: safeText(180).optional(),
  cloudProvider: safeText(80).optional(),
  scale: safeText(80).optional(),
  templateId: z.string().max(80).optional(),
}).strict();

export type Diagram = z.infer<typeof diagramSchema>;
export type ArchitectureNode = z.infer<typeof architectureNodeSchema>;
export type Connector = z.infer<typeof connectorSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ReviewFinding = z.infer<typeof reviewFindingSchema>;
export type ChangePlan = z.infer<typeof changePlanSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
