import { z } from "zod";
import { diagramSchema, primitiveSchema, type Diagram } from "@/lib/domain/schema";
import { compileArchitectureIR } from "./compiler";
import {
  ARCHITECTURE_COMPILER_VERSION,
  ARCHITECTURE_IR_VERSION,
  SEMANTIC_CATALOG_VERSION,
  architectureIRSchema,
  type ArchitectureIR,
} from "./schema";
import { validateArchitectureIR, type IRValidationFinding } from "./validator";
import { parsePrivateAssetReference } from "@/lib/storage/asset-references";

export const ARCHITECTURE_PRESENTATION_VERSION = "1.0.0" as const;
export const ARCHITECTURE_SNAPSHOT_VERSION = "1.0.0" as const;

const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const dimensionsSchema = z.object({
  width: z.number().min(1).max(4_000),
  height: z.number().min(1).max(4_000),
}).strict();

const componentAppearanceSchema = z.object({
  variant: z.enum(["card", "tinted", "outline"]).default("card"),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  fillColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  borderRadius: z.enum(["8", "16", "24"]).default("16"),
  shadow: z.enum(["none", "soft", "raised"]).default("soft"),
}).strict().default({ variant: "card", borderRadius: "16", shadow: "soft" });

export const architecturePresentationSchema = z.object({
  schemaVersion: z.literal(ARCHITECTURE_PRESENTATION_VERSION),
  theme: z.enum(["light", "dark"]),
  viewport: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    zoom: z.number().min(0.1).max(4),
  }).strict(),
  components: z.array(z.object({
    componentId: z.string().min(1).max(120),
    position: pointSchema,
    dimensions: dimensionsSchema,
    zIndex: z.number().int().min(-10_000).max(10_000).default(0),
    appearance: componentAppearanceSchema,
  }).strict()).max(150),
  flows: z.array(z.object({
    flowId: z.string().min(1).max(120),
    sourcePort: z.string().min(1).max(80).default("out"),
    targetPort: z.string().min(1).max(80).default("in"),
    style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
    routing: z.enum(["orthogonal", "curved", "straight"]).default("orthogonal"),
    labelPosition: z.number().min(0).max(1).default(0.5),
    zIndex: z.number().int().min(-10_000).max(10_000).default(0),
  }).strict()).max(300),
  primitives: z.array(primitiveSchema).max(300).default([]),
  layerOrder: z.array(z.string().min(1).max(120)).max(750).default([]),
}).strict();

const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const architectureSnapshotSchema = z.object({
  schemaVersion: z.literal(ARCHITECTURE_SNAPSHOT_VERSION),
  diagramId: z.string().min(1).max(120),
  diagramVersion: z.number().int().min(1),
  irVersion: z.number().int().min(1),
  ir: architectureIRSchema,
  presentation: architecturePresentationSchema,
  materializedDiagram: diagramSchema,
  checksums: z.object({
    ir: checksumSchema,
    presentation: checksumSchema,
    diagram: checksumSchema,
  }).strict(),
}).strict();

export type ArchitecturePresentation = z.infer<typeof architecturePresentationSchema>;
export type ArchitectureSnapshot = z.infer<typeof architectureSnapshotSchema>;

export type ArchitectureArtifactValidation = {
  valid: boolean;
  errors: IRValidationFinding[];
  warnings: IRValidationFinding[];
};

function normalizeForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForCanonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalizeForCanonicalJson(child)]),
    );
  }
  return value;
}

export function canonicalStringify(value: unknown) {
  return JSON.stringify(normalizeForCanonicalJson(value));
}

export async function canonicalSha256(value: unknown) {
  const bytes = new TextEncoder().encode(canonicalStringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function assertArchitecturePayloadSizes(ir: unknown, presentation: unknown, diagram: unknown) {
  const encoder = new TextEncoder();
  const irBytes = encoder.encode(canonicalStringify(ir)).byteLength;
  const presentationBytes = encoder.encode(canonicalStringify(presentation)).byteLength;
  const diagramBytes = encoder.encode(canonicalStringify(diagram)).byteLength;
  if (irBytes > 256_000) throw new Error("Architecture IR exceeds 256 KB.");
  if (irBytes + presentationBytes + diagramBytes > 1_000_000) throw new Error("Architecture snapshot exceeds 1 MB.");
  return { irBytes, presentationBytes, diagramBytes, totalBytes: irBytes + presentationBytes + diagramBytes };
}

export function presentationFromDiagram(diagramInput: Diagram): ArchitecturePresentation {
  const diagram = diagramSchema.parse(diagramInput);
  const layerOrder = [
    ...diagram.nodes.map((node) => ({ id: node.id, zIndex: Number(node.metadata.zIndex ?? 0) })),
    ...diagram.primitives.map((primitive) => ({ id: primitive.id, zIndex: Number(primitive.style.zIndex ?? 0) })),
    ...diagram.connectors.map((connector) => ({ id: connector.id, zIndex: 0 })),
  ].sort((left, right) => left.zIndex - right.zIndex).map((item) => item.id);

  return architecturePresentationSchema.parse({
    schemaVersion: ARCHITECTURE_PRESENTATION_VERSION,
    theme: diagram.theme,
    viewport: diagram.viewport,
    components: diagram.nodes.map((node) => ({
      componentId: node.id,
      position: node.position,
      dimensions: node.dimensions,
      zIndex: Number(node.metadata.zIndex ?? 0),
      appearance: {
        variant: ["card", "tinted", "outline"].includes(String(node.metadata.appearanceVariant)) ? node.metadata.appearanceVariant : "card",
        accentColor: typeof node.metadata.accentColor === "string" ? node.metadata.accentColor : undefined,
        fillColor: typeof node.metadata.fillColor === "string" ? node.metadata.fillColor : undefined,
        borderRadius: ["8", "16", "24"].includes(String(node.metadata.borderRadius)) ? String(node.metadata.borderRadius) : "16",
        shadow: ["none", "soft", "raised"].includes(String(node.metadata.shadow)) ? node.metadata.shadow : "soft",
      },
    })),
    flows: diagram.connectors.map((connector) => ({
      flowId: connector.id,
      sourcePort: connector.sourcePort,
      targetPort: connector.targetPort,
      style: connector.style,
      routing: connector.routing,
      labelPosition: 0.5,
      zIndex: 0,
    })),
    primitives: diagram.primitives,
    layerOrder,
  });
}

export function architectureIRFromDiagram(
  diagramInput: Diagram,
  base?: ArchitectureIR,
  strategy: ArchitectureIR["provenance"]["strategy"] = "manual-edit",
): ArchitectureIR {
  const diagram = diagramSchema.parse(diagramInput);
  return architectureIRSchema.parse({
    schemaVersion: ARCHITECTURE_IR_VERSION,
    intent: {
      title: diagram.title,
      summary: base?.intent.summary ?? "Preserve the behavior represented by this architecture diagram.",
      archetype: base?.intent.archetype ?? "general",
      trafficProfile: base?.intent.trafficProfile ?? "unknown",
    },
    requirements: base?.requirements ?? {
      functional: ["Preserve the represented system behavior and typed data flows."],
      nonFunctional: [],
    },
    constraints: base?.constraints ?? {
      preferredStack: [],
      cloudProvider: "",
      multiTenant: false,
      dataSensitivity: "unspecified",
    },
    components: diagram.nodes.map((node) => ({
      id: node.id,
      semanticType: node.semanticType,
      category: node.category,
      name: node.name,
      description: node.description || node.name,
      responsibilities: node.responsibilities,
      technology: node.technology || undefined,
      provider: node.provider || undefined,
      environment: node.environment,
    })),
    flows: diagram.connectors.map((connector) => ({
      id: connector.id,
      source: connector.source,
      sourcePort: connector.sourcePort,
      target: connector.target,
      targetPort: connector.targetPort,
      type: connector.type,
      label: connector.label || connector.type,
      protocol: connector.protocol || undefined,
      direction: connector.direction,
      security: {
        authentication: connector.authentication,
        encryption: connector.encryption,
        dataClassification: connector.dataClassification,
      },
      resilience: {
        retryPolicy: connector.retryPolicy,
        latencyTarget: connector.latency,
      },
    })),
    assumptions: diagram.assumptions.map((assumption) => ({
      id: assumption.id,
      type: assumption.type,
      text: assumption.text,
      confidence: assumption.confidence,
      affectedComponents: assumption.affectedObjects,
    })),
    decisions: base?.decisions ?? [],
    provenance: {
      strategy,
      templateId: base?.provenance.templateId,
      compilerVersion: ARCHITECTURE_COMPILER_VERSION,
      catalogVersion: SEMANTIC_CATALOG_VERSION,
    },
  });
}

export function validateArchitectureArtifact(irInput: unknown, presentationInput: unknown): ArchitectureArtifactValidation {
  const ir = architectureIRSchema.parse(irInput);
  const presentation = architecturePresentationSchema.parse(presentationInput);
  const validation = validateArchitectureIR(ir);
  const errors = [...validation.errors];
  const componentIds = new Set(ir.components.map((component) => component.id));
  const flowIds = new Set(ir.flows.map((flow) => flow.id));
  const presentedComponentIds = new Set(presentation.components.map((component) => component.componentId));
  const presentedFlowIds = new Set(presentation.flows.map((flow) => flow.flowId));

  for (const component of presentation.components) {
    if (!componentIds.has(component.componentId)) {
      errors.push({ code: "SCHEMA_INVALID", severity: "error", message: `Presentation references unknown component ${component.componentId}.`, affectedIds: [component.componentId] });
    }
  }
  for (const flow of presentation.flows) {
    if (!flowIds.has(flow.flowId)) {
      errors.push({ code: "SCHEMA_INVALID", severity: "error", message: `Presentation references unknown flow ${flow.flowId}.`, affectedIds: [flow.flowId] });
    }
  }
  for (const component of ir.components) {
    if (!presentedComponentIds.has(component.id)) {
      errors.push({ code: "SCHEMA_INVALID", severity: "error", message: `Presentation is missing component ${component.id}.`, affectedIds: [component.id] });
    }
  }
  for (const flow of ir.flows) {
    const presented = presentation.flows.find((item) => item.flowId === flow.id);
    if (!presentedFlowIds.has(flow.id)) {
      errors.push({ code: "SCHEMA_INVALID", severity: "error", message: `Presentation is missing flow ${flow.id}.`, affectedIds: [flow.id] });
    } else if (presented && (presented.sourcePort !== flow.sourcePort || presented.targetPort !== flow.targetPort)) {
      errors.push({ code: "SCHEMA_INVALID", severity: "error", message: `Presentation ports do not match semantic flow ${flow.id}.`, affectedIds: [flow.id] });
    }
  }
  const duplicateLayerIds = presentation.layerOrder.filter((id, index) => presentation.layerOrder.indexOf(id) !== index);
  if (duplicateLayerIds.length) {
    errors.push({ code: "SCHEMA_INVALID", severity: "error", message: "Layer order contains duplicate object IDs.", affectedIds: [...new Set(duplicateLayerIds)] });
  }
  return { valid: errors.length === 0, errors, warnings: validation.warnings };
}

export function materializeArchitecture(
  irInput: unknown,
  presentationInput: unknown,
  options: { id: string; version: number; createdAt?: string; updatedAt?: string },
): Diagram {
  const ir = architectureIRSchema.parse(irInput);
  const presentation = architecturePresentationSchema.parse(presentationInput);
  const validation = validateArchitectureArtifact(ir, presentation);
  if (!validation.valid) throw new Error("Architecture artifact failed validation.");
  const now = options.updatedAt ?? new Date().toISOString();
  const diagram = compileArchitectureIR(ir, { id: options.id, now: options.createdAt ?? now, theme: presentation.theme });
  const componentViews = new Map(presentation.components.map((component) => [component.componentId, component]));
  const flowViews = new Map(presentation.flows.map((flow) => [flow.flowId, flow]));

  return diagramSchema.parse({
    ...diagram,
    version: options.version,
    updatedAt: now,
    viewport: presentation.viewport,
    nodes: diagram.nodes.map((node) => {
      const view = componentViews.get(node.id);
      return view ? {
        ...node,
        position: view.position,
        dimensions: view.dimensions,
        metadata: {
          ...node.metadata,
          zIndex: view.zIndex,
          appearanceVariant: view.appearance.variant,
          accentColor: view.appearance.accentColor ?? null,
          fillColor: view.appearance.fillColor ?? null,
          borderRadius: view.appearance.borderRadius,
          shadow: view.appearance.shadow,
        },
      } : node;
    }),
    connectors: diagram.connectors.map((connector) => {
      const view = flowViews.get(connector.id);
      return view ? {
        ...connector,
        sourcePort: view.sourcePort,
        targetPort: view.targetPort,
        style: view.style,
        routing: view.routing,
      } : connector;
    }),
    primitives: presentation.primitives,
  });
}

export async function createArchitectureSnapshot(options: {
  diagramId: string;
  diagramVersion: number;
  irVersion: number;
  ir: unknown;
  presentation: unknown;
  createdAt?: string;
  updatedAt?: string;
}): Promise<ArchitectureSnapshot> {
  const ir = architectureIRSchema.parse(options.ir);
  const presentation = architecturePresentationSchema.parse(options.presentation);
  const materializedDiagram = materializeArchitecture(ir, presentation, {
    id: options.diagramId,
    version: options.diagramVersion,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
  });
  return architectureSnapshotSchema.parse({
    schemaVersion: ARCHITECTURE_SNAPSHOT_VERSION,
    diagramId: options.diagramId,
    diagramVersion: options.diagramVersion,
    irVersion: options.irVersion,
    ir,
    presentation,
    materializedDiagram,
    checksums: {
      ir: await canonicalSha256(ir),
      presentation: await canonicalSha256(presentation),
      diagram: await canonicalSha256(materializedDiagram),
    },
  });
}

export function assertPersistablePresentation(presentationInput: unknown) {
  const presentation = architecturePresentationSchema.parse(presentationInput);
  for (const primitive of presentation.primitives) {
    if (primitive.kind === "image" && !parsePrivateAssetReference(primitive.style.src ?? "")) {
      throw new Error("Persisted images must use a valid private Storage reference.");
    }
  }
  return presentation;
}
