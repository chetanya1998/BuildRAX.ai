import { z } from "zod";
import { categorySchema, connectorTypeSchema } from "@/lib/domain/schema";

export const LEGACY_ARCHITECTURE_IR_VERSION = "1.0.0" as const;
export const ARCHITECTURE_IR_VERSION = "1.1.0" as const;
export const ARCHITECTURE_COMPILER_VERSION = "1.1.0" as const;
export const SEMANTIC_CATALOG_VERSION = "1.0.0" as const;

const irText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML-like markup is not allowed");

export const architectureIRComponentSchema = z.object({
  id: z.string().min(1).max(120),
  semanticType: z.string().min(1).max(80),
  category: categorySchema,
  name: irText(120),
  description: irText(600),
  responsibilities: z.array(irText(180)).max(12).default([]),
  technology: irText(120).optional(),
  provider: irText(120).optional(),
  environment: z.enum(["agnostic", "development", "staging", "production", "multi-environment"]).default("agnostic"),
  layoutHint: z.object({ x: z.number().finite(), y: z.number().finite() }).strict().optional(),
}).strict();

export const architectureIRFlowSchema = z.object({
  id: z.string().min(1).max(120),
  source: z.string().min(1).max(120),
  sourcePort: z.string().min(1).max(80).default("out"),
  target: z.string().min(1).max(120),
  targetPort: z.string().min(1).max(80).default("in"),
  type: connectorTypeSchema,
  label: irText(120),
  protocol: irText(80).optional(),
  direction: z.enum(["unidirectional", "bidirectional"]).default("unidirectional"),
  security: z.object({
    authentication: z.string().trim().max(120).default(""),
    encryption: z.string().trim().max(120).default(""),
    dataClassification: z.enum(["public", "internal", "confidential", "restricted", "unspecified"]).default("unspecified"),
  }).strict(),
  resilience: z.object({
    retryPolicy: z.string().trim().max(180).default(""),
    latencyTarget: z.string().trim().max(80).default(""),
  }).strict(),
}).strict();

export const architectureIRSchema = z.object({
  schemaVersion: z.literal(ARCHITECTURE_IR_VERSION),
  intent: z.object({
    title: irText(160),
    summary: irText(1200),
    archetype: z.enum(["saas", "ai-rag", "commerce", "event-driven", "realtime", "data-pipeline", "microservices", "mobile", "general"]),
    trafficProfile: z.enum(["prototype", "small", "medium", "large", "unknown"]),
  }).strict(),
  requirements: z.object({
    functional: z.array(irText(240)).min(1).max(30),
    nonFunctional: z.array(irText(240)).max(30).default([]),
  }).strict(),
  constraints: z.object({
    preferredStack: z.array(irText(80)).max(20).default([]),
    cloudProvider: z.string().trim().max(80).default(""),
    multiTenant: z.boolean().default(false),
    dataSensitivity: z.enum(["public", "internal", "confidential", "restricted", "unspecified"]).default("unspecified"),
  }).strict(),
  // Empty semantic graphs are valid for a user-created blank canvas. AI
  // generation applies its stricter 6–15 component contract separately.
  components: z.array(architectureIRComponentSchema).max(100),
  flows: z.array(architectureIRFlowSchema).max(200),
  assumptions: z.array(z.object({
    id: z.string().min(1).max(120),
    type: z.enum(["scale", "cloud", "tenancy", "data-sensitivity", "stack", "general"]),
    text: irText(500),
    confidence: z.number().min(0).max(1),
    affectedComponents: z.array(z.string().max(120)).max(80).default([]),
  }).strict()).max(40).default([]),
  decisions: z.array(z.object({
    id: z.string().min(1).max(120),
    title: irText(160),
    rationale: irText(600),
    status: z.enum(["proposed", "accepted", "rejected"]).default("proposed"),
  }).strict()).max(30).default([]),
  provenance: z.object({
    strategy: z.enum(["deterministic-template", "ai-proposal", "manual-edit", "legacy-migration", "restore"]),
    templateId: z.string().min(1).max(80).optional(),
    compilerVersion: z.string().min(1).max(40).default(ARCHITECTURE_COMPILER_VERSION),
    catalogVersion: z.string().min(1).max(40).default(SEMANTIC_CATALOG_VERSION),
  }).strict(),
}).strict();

// Providers propose only the portable IR. Provenance is attached by the
// trusted server so a model cannot claim a different generation source.
export const architectureIRProposalSchema = architectureIRSchema.omit({ provenance: true });

const legacyArchitectureIRSchema = architectureIRSchema.extend({
  schemaVersion: z.literal(LEGACY_ARCHITECTURE_IR_VERSION),
  flows: z.array(architectureIRFlowSchema.omit({ sourcePort: true, targetPort: true })).max(200),
  provenance: z.object({
    strategy: z.enum(["deterministic-template", "ai-proposal"]),
    templateId: z.string().min(1).max(80).optional(),
  }).strict(),
}).strict();

export function migrateArchitectureIR(input: unknown): ArchitectureIR {
  const current = architectureIRSchema.safeParse(input);
  if (current.success) return current.data;
  const legacy = legacyArchitectureIRSchema.parse(input);
  return architectureIRSchema.parse({
    ...legacy,
    schemaVersion: ARCHITECTURE_IR_VERSION,
    flows: legacy.flows.map((flow) => ({ ...flow, sourcePort: "out", targetPort: "in" })),
    provenance: {
      ...legacy.provenance,
      compilerVersion: ARCHITECTURE_COMPILER_VERSION,
      catalogVersion: SEMANTIC_CATALOG_VERSION,
    },
  });
}

export type ArchitectureIR = z.infer<typeof architectureIRSchema>;
export type ArchitectureIRComponent = z.infer<typeof architectureIRComponentSchema>;
export type ArchitectureIRFlow = z.infer<typeof architectureIRFlowSchema>;
