import { z } from "zod";

export const EVIDENCE_IR_VERSION = "1.0.0" as const;
export const REQUIREMENT_IR_VERSION = "1.0.0" as const;
export const TRACEABILITY_BUNDLE_VERSION = "1.0.0" as const;

const recordText = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value), "HTML-like markup is not allowed");
const sourceSetIdSchema = z.string().regex(/^eset_[a-z0-9][a-z0-9_-]{5,79}$/);
const sourceIdSchema = z.string().regex(/^src_[a-z0-9][a-z0-9_-]{5,79}$/);
const evidenceIdSchema = z.string().regex(/^ev_[a-z0-9][a-z0-9_-]{5,79}$/);
const requirementIdSchema = z.string().regex(/^req_[a-z0-9][a-z0-9_-]{5,79}$/);
const conflictIdSchema = z.string().regex(/^conflict_[a-z0-9][a-z0-9_-]{5,79}$/);

const inputLocationSchema = z.object({
  type: z.literal("input"),
  sourceId: sourceIdSchema,
  field: z.enum(["prompt", "productType", "preferredStack", "cloudProvider", "scale", "tenancy", "dataSensitivity", "templateId"]),
  start: z.number().int().min(0).max(3_000).optional(),
  end: z.number().int().min(1).max(3_000).optional(),
}).strict().superRefine((location, ctx) => {
  if ((location.start === undefined) !== (location.end === undefined)) {
    ctx.addIssue({ code: "custom", message: "Input offsets must provide both start and end." });
  } else if (location.start !== undefined && location.end !== undefined && location.end <= location.start) {
    ctx.addIssue({ code: "custom", path: ["end"], message: "Input location end must be greater than start." });
  }
});

const documentLocationSchema = z.object({
  type: z.literal("document"),
  sourceId: sourceIdSchema,
  page: z.number().int().min(1).optional(),
  section: recordText(240).optional(),
  start: z.number().int().min(0).optional(),
  end: z.number().int().min(1).optional(),
}).strict().superRefine((location, ctx) => {
  if (location.page === undefined && location.section === undefined && location.start === undefined) {
    ctx.addIssue({ code: "custom", message: "Document evidence requires a page, section, or text offset." });
  }
  if ((location.start === undefined) !== (location.end === undefined)) {
    ctx.addIssue({ code: "custom", message: "Document offsets must provide both start and end." });
  } else if (location.start !== undefined && location.end !== undefined && location.end <= location.start) {
    ctx.addIssue({ code: "custom", path: ["end"], message: "Document location end must be greater than start." });
  }
});

const repositoryLocationSchema = z.object({
  type: z.literal("repository"),
  sourceId: sourceIdSchema,
  commit: recordText(128),
  path: recordText(500),
  startLine: z.number().int().min(1),
  endLine: z.number().int().min(1),
}).strict().superRefine((location, ctx) => {
  if (location.endLine < location.startLine) {
    ctx.addIssue({ code: "custom", path: ["endLine"], message: "Repository end line must be at or after the start line." });
  }
});

const runtimeLocationSchema = z.object({
  type: z.literal("runtime"),
  sourceId: sourceIdSchema,
  observedAt: z.iso.datetime(),
  signal: recordText(160),
}).strict();

export const evidenceLocationSchema = z.discriminatedUnion("type", [
  inputLocationSchema,
  documentLocationSchema,
  repositoryLocationSchema,
  runtimeLocationSchema,
]);

export const evidenceItemSchema = z.object({
  id: evidenceIdSchema,
  claim: recordText(500),
  category: z.enum(["requirement", "constraint", "technology", "component", "flow", "operation", "unknown"]),
  origin: z.enum(["user-input", "document-source", "code-detector", "runtime-observation", "system-rule", "ai-suggestion"]),
  verification: z.enum(["user-provided", "source-observed", "verified-within-scope", "inferred", "ai-proposed", "unknown"]),
  confidence: z.number().min(0).max(1),
  locations: z.array(evidenceLocationSchema).max(20).default([]),
  detector: z.object({
    id: recordText(120),
    version: recordText(40),
    scope: recordText(300),
  }).strict().optional(),
}).strict().superRefine((item, ctx) => {
  if (item.origin === "ai-suggestion" && !["ai-proposed", "unknown"].includes(item.verification)) {
    ctx.addIssue({ code: "custom", path: ["verification"], message: "AI suggestions cannot claim observed or verified evidence." });
  }
  if (item.origin === "user-input" && item.verification !== "user-provided") {
    ctx.addIssue({ code: "custom", path: ["verification"], message: "Explicit user input must remain labelled user-provided." });
  }
  if (item.origin === "user-input" && !item.locations.some((location) => location.type === "input")) {
    ctx.addIssue({ code: "custom", path: ["locations"], message: "User-provided evidence requires an input location." });
  }
  if (item.verification === "verified-within-scope") {
    if (item.origin !== "code-detector") {
      ctx.addIssue({ code: "custom", path: ["origin"], message: "Only deterministic code detectors may verify evidence within a declared scope." });
    }
    if (!item.detector) {
      ctx.addIssue({ code: "custom", path: ["detector"], message: "Verified code evidence requires detector identity and scope." });
    }
    if (!item.locations.some((location) => location.type === "repository")) {
      ctx.addIssue({ code: "custom", path: ["locations"], message: "Verified code evidence requires a repository location." });
    }
  }
  if (item.verification === "unknown" && item.confidence !== 0) {
    ctx.addIssue({ code: "custom", path: ["confidence"], message: "Unknown evidence must use zero confidence." });
  }
});

export const evidenceSourceSchema = z.object({
  id: sourceIdSchema,
  type: z.enum(["input", "document", "repository", "runtime", "system", "ai"]),
  label: recordText(160),
  version: recordText(128).optional(),
}).strict();

export const evidenceIRSchema = z.object({
  schemaVersion: z.literal(EVIDENCE_IR_VERSION),
  sourceSetId: sourceSetIdSchema,
  sources: z.array(evidenceSourceSchema).min(1).max(100),
  items: z.array(evidenceItemSchema).max(500),
}).strict().superRefine((artifact, ctx) => {
  const sources = new Map<string, string>();
  artifact.sources.forEach((source, index) => {
    if (sources.has(source.id)) ctx.addIssue({ code: "custom", path: ["sources", index, "id"], message: `Duplicate evidence source ID ${source.id}.` });
    sources.set(source.id, source.type);
  });
  const seen = new Set<string>();
  artifact.items.forEach((item, index) => {
    if (seen.has(item.id)) ctx.addIssue({ code: "custom", path: ["items", index, "id"], message: `Duplicate evidence ID ${item.id}.` });
    seen.add(item.id);
    item.locations.forEach((location, locationIndex) => {
      const sourceType = sources.get(location.sourceId);
      if (!sourceType) ctx.addIssue({ code: "custom", path: ["items", index, "locations", locationIndex, "sourceId"], message: `Evidence location references unknown source ${location.sourceId}.` });
      else if (sourceType !== location.type) ctx.addIssue({ code: "custom", path: ["items", index, "locations", locationIndex, "sourceId"], message: `Evidence location type ${location.type} does not match source type ${sourceType}.` });
    });
  });
});

export const requirementItemSchema = z.object({
  id: requirementIdSchema,
  kind: z.enum(["functional", "non-functional", "constraint"]),
  statement: recordText(500),
  state: z.enum(["stated", "derived", "proposed", "unknown", "conflicting"]),
  origin: z.enum(["user-provided", "evidence-derived", "inferred", "ai-proposed", "unknown"]),
  confidence: z.number().min(0).max(1),
  evidenceRefs: z.array(evidenceIdSchema).max(40).default([]),
  architectureRefs: z.array(z.object({
    kind: z.enum(["component", "flow"]),
    id: z.string().min(1).max(120),
  }).strict()).max(80).default([]),
  question: recordText(300).optional(),
}).strict().superRefine((item, ctx) => {
  if (new Set(item.evidenceRefs).size !== item.evidenceRefs.length) {
    ctx.addIssue({ code: "custom", path: ["evidenceRefs"], message: "Requirement evidence references must be unique." });
  }
  const architectureReferences = item.architectureRefs.map((reference) => `${reference.kind}:${reference.id}`);
  if (new Set(architectureReferences).size !== architectureReferences.length) {
    ctx.addIssue({ code: "custom", path: ["architectureRefs"], message: "Requirement architecture references must be unique." });
  }
  if (item.origin === "user-provided" && !["stated", "conflicting"].includes(item.state)) {
    ctx.addIssue({ code: "custom", path: ["state"], message: "User-provided requirements must remain stated or explicitly conflicting facts." });
  }
  if (item.origin === "ai-proposed" && !["proposed", "conflicting"].includes(item.state)) {
    ctx.addIssue({ code: "custom", path: ["state"], message: "AI requirements must remain proposals until accepted by a user." });
  }
  if (item.origin === "evidence-derived" && item.evidenceRefs.length === 0) {
    ctx.addIssue({ code: "custom", path: ["evidenceRefs"], message: "Evidence-derived requirements require at least one evidence reference." });
  }
  if (item.state === "unknown") {
    if (item.origin !== "unknown" || item.confidence !== 0 || !item.question || item.evidenceRefs.length > 0) {
      ctx.addIssue({ code: "custom", message: "Unknown requirements require unknown origin, zero confidence, and a clarifying question." });
    }
  } else if (item.origin === "unknown") {
    ctx.addIssue({ code: "custom", path: ["origin"], message: "Unknown origin is valid only for an unknown requirement." });
  }
});

export const requirementConflictSchema = z.object({
  id: conflictIdSchema,
  summary: recordText(500),
  requirementRefs: z.array(requirementIdSchema).min(1).max(20),
  evidenceRefs: z.array(evidenceIdSchema).min(2).max(40),
  status: z.enum(["unresolved", "resolved"]),
  resolution: recordText(500).optional(),
}).strict().superRefine((conflict, ctx) => {
  if (new Set(conflict.requirementRefs).size !== conflict.requirementRefs.length) {
    ctx.addIssue({ code: "custom", path: ["requirementRefs"], message: "Conflict requirement references must be unique." });
  }
  if (new Set(conflict.evidenceRefs).size !== conflict.evidenceRefs.length) {
    ctx.addIssue({ code: "custom", path: ["evidenceRefs"], message: "Conflict evidence references must be unique." });
  }
  if (conflict.status === "resolved" && !conflict.resolution) {
    ctx.addIssue({ code: "custom", path: ["resolution"], message: "Resolved conflicts require a resolution." });
  }
});

export const requirementIRSchema = z.object({
  schemaVersion: z.literal(REQUIREMENT_IR_VERSION),
  requirementSetId: z.string().regex(/^rset_[a-z0-9][a-z0-9_-]{5,79}$/),
  items: z.array(requirementItemSchema).min(1).max(500),
  conflicts: z.array(requirementConflictSchema).max(100).default([]),
}).strict().superRefine((artifact, ctx) => {
  const requirementIds = new Set<string>();
  artifact.items.forEach((item, index) => {
    if (requirementIds.has(item.id)) ctx.addIssue({ code: "custom", path: ["items", index, "id"], message: `Duplicate requirement ID ${item.id}.` });
    requirementIds.add(item.id);
  });
  const conflictIds = new Set<string>();
  artifact.conflicts.forEach((conflict, index) => {
    if (conflictIds.has(conflict.id)) ctx.addIssue({ code: "custom", path: ["conflicts", index, "id"], message: `Duplicate conflict ID ${conflict.id}.` });
    conflictIds.add(conflict.id);
    conflict.requirementRefs.forEach((reference) => {
      const requirement = artifact.items.find((item) => item.id === reference);
      if (!requirement) ctx.addIssue({ code: "custom", path: ["conflicts", index, "requirementRefs"], message: `Conflict references unknown requirement ${reference}.` });
      else if (requirement.state !== "conflicting") ctx.addIssue({ code: "custom", path: ["conflicts", index, "requirementRefs"], message: `Conflict reference ${reference} must be marked conflicting.` });
    });
  });
  artifact.items.forEach((item, index) => {
    if (item.state === "conflicting" && !artifact.conflicts.some((conflict) => conflict.requirementRefs.includes(item.id))) {
      ctx.addIssue({ code: "custom", path: ["items", index, "state"], message: `Conflicting requirement ${item.id} must belong to a conflict.` });
    }
  });
});

export const traceabilityBundleSchema = z.object({
  schemaVersion: z.literal(TRACEABILITY_BUNDLE_VERSION),
  evidence: evidenceIRSchema,
  requirements: requirementIRSchema,
}).strict().superRefine((bundle, ctx) => {
  const evidenceById = new Map(bundle.evidence.items.map((item) => [item.id, item]));
  bundle.requirements.items.forEach((requirement, index) => {
    requirement.evidenceRefs.forEach((reference) => {
      if (!evidenceById.has(reference)) ctx.addIssue({ code: "custom", path: ["requirements", "items", index, "evidenceRefs"], message: `Requirement references unknown evidence ${reference}.` });
    });
    if (requirement.origin === "user-provided" && !requirement.evidenceRefs.some((reference) => evidenceById.get(reference)?.verification === "user-provided")) {
      ctx.addIssue({ code: "custom", path: ["requirements", "items", index, "evidenceRefs"], message: "User-provided requirements must reference user-provided evidence." });
    }
  });
  bundle.requirements.conflicts.forEach((conflict, index) => {
    conflict.evidenceRefs.forEach((reference) => {
      if (!evidenceById.has(reference)) ctx.addIssue({ code: "custom", path: ["requirements", "conflicts", index, "evidenceRefs"], message: `Conflict references unknown evidence ${reference}.` });
    });
  });
});

export type EvidenceLocation = z.infer<typeof evidenceLocationSchema>;
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type EvidenceIR = z.infer<typeof evidenceIRSchema>;
export type RequirementItem = z.infer<typeof requirementItemSchema>;
export type RequirementIR = z.infer<typeof requirementIRSchema>;
export type TraceabilityBundle = z.infer<typeof traceabilityBundleSchema>;
