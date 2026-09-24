import { z } from "zod";
import type { TraceabilityBundle } from "./schema";

export const CONTEXT_PACK_VERSION = "1.0.0" as const;
const MAX_CONTEXT_BLOCKS = 5_000;
const MAX_COMPILED_SOURCE_REFS = 10_000;

export const contextTaskSchema = z.enum([
  "requirement-extraction",
  "architecture-synthesis",
  "change-planning",
  "architecture-review",
  "documentation",
  "explanation",
]);

export const contextBlockSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(["instruction", "schema", "requirement", "constraint", "evidence", "architecture", "section", "table", "code"]),
  format: z.enum(["text", "markdown", "table", "code", "json"]).default("text"),
  text: z.string().min(1).max(200_000),
  section: z.string().min(1).max(240).optional(),
  language: z.string().min(1).max(40).optional(),
  priority: z.number().int().min(0).max(100).default(50),
  mandatory: z.boolean().default(false),
  sourceRefs: z.array(z.string().min(1).max(120)).max(100).default([]),
}).strict();

export type ContextBlock = z.infer<typeof contextBlockSchema>;
export type ContextBlockInput = z.input<typeof contextBlockSchema>;
export type ContextTask = z.infer<typeof contextTaskSchema>;

export const contextBudgetSchema = z.object({
  inputTokens: z.number().int().min(256).max(1_000_000),
  outputTokens: z.number().int().min(64).max(100_000),
}).strict();

export type ContextBudget = z.infer<typeof contextBudgetSchema>;

export const DEFAULT_CONTEXT_BUDGETS: Record<ContextTask, ContextBudget> = {
  "requirement-extraction": { inputTokens: 12_000, outputTokens: 4_000 },
  "architecture-synthesis": { inputTokens: 16_000, outputTokens: 6_000 },
  "change-planning": { inputTokens: 12_000, outputTokens: 4_000 },
  "architecture-review": { inputTokens: 12_000, outputTokens: 4_000 },
  documentation: { inputTokens: 16_000, outputTokens: 6_000 },
  explanation: { inputTokens: 8_000, outputTokens: 3_000 },
};

export const omittedContextSchema = z.object({
  id: z.string().min(1).max(120),
  sourceRefs: z.array(z.string().min(1).max(120)),
  reason: z.enum(["duplicate", "budget", "lower-relevance"]),
  duplicateOf: z.string().min(1).max(120).optional(),
  estimatedTokens: z.number().int().min(1),
}).strict();

const compiledContextBlockSchema = contextBlockSchema.extend({
  sourceRefs: z.array(z.string().min(1).max(120)).max(MAX_COMPILED_SOURCE_REFS),
  estimatedTokens: z.number().int().min(1),
}).strict();

export const compiledContextBudgetSchema = contextBudgetSchema.extend({
  instructionTokens: z.number().int().min(0),
  schemaTokens: z.number().int().min(0),
  contentTokens: z.number().int().min(0),
  usedInputTokens: z.number().int().min(0),
  remainingInputTokens: z.number().int().min(0),
}).strict();

export const contextPackSchema = z.object({
  schemaVersion: z.literal(CONTEXT_PACK_VERSION),
  task: contextTaskSchema,
  blocks: z.array(compiledContextBlockSchema).max(MAX_CONTEXT_BLOCKS),
  omitted: z.array(omittedContextSchema).max(5_000),
  budget: compiledContextBudgetSchema,
}).strict().superRefine((pack, ctx) => {
  const ids = new Set<string>();
  [...pack.blocks, ...pack.omitted].forEach((item, index) => {
    if (ids.has(item.id)) ctx.addIssue({ code: "custom", path: [index < pack.blocks.length ? "blocks" : "omitted", index < pack.blocks.length ? index : index - pack.blocks.length, "id"], message: `Duplicate context record ID ${item.id}.` });
    ids.add(item.id);
  });
  pack.omitted.forEach((item, index) => {
    if (item.reason === "duplicate" && (!item.duplicateOf || !ids.has(item.duplicateOf) || item.duplicateOf === item.id)) {
      ctx.addIssue({ code: "custom", path: ["omitted", index, "duplicateOf"], message: "Duplicate omissions must reference another context record." });
    }
    if (item.reason !== "duplicate" && item.duplicateOf) {
      ctx.addIssue({ code: "custom", path: ["omitted", index, "duplicateOf"], message: "Only duplicate omissions may name a duplicate target." });
    }
  });
  const contentTokens = pack.blocks.reduce((total, block) => total + block.estimatedTokens, 0);
  const usedInputTokens = pack.budget.instructionTokens + pack.budget.schemaTokens + contentTokens;
  if (pack.budget.contentTokens !== contentTokens) ctx.addIssue({ code: "custom", path: ["budget", "contentTokens"], message: "Content token accounting does not match retained blocks." });
  if (pack.budget.usedInputTokens !== usedInputTokens) ctx.addIssue({ code: "custom", path: ["budget", "usedInputTokens"], message: "Used input token accounting is inconsistent." });
  if (usedInputTokens > pack.budget.inputTokens) ctx.addIssue({ code: "custom", path: ["budget", "usedInputTokens"], message: "Used input tokens exceed the configured budget." });
  if (pack.budget.remainingInputTokens !== pack.budget.inputTokens - usedInputTokens) ctx.addIssue({ code: "custom", path: ["budget", "remainingInputTokens"], message: "Remaining input token accounting is inconsistent." });
});

export type ContextPack = z.infer<typeof contextPackSchema>;

export class ContextBudgetError extends Error {
  constructor(public requiredTokens: number, public availableTokens: number) {
    super(`Mandatory context requires ${requiredTokens} tokens but only ${availableTokens} are available.`);
  }
}

export class ContextInputError extends Error {}

/** Conservative deterministic estimate. Provider usage remains authoritative. */
export function estimateContextTokens(value: string) {
  if (!value) return 0;
  return Math.max(1, Math.ceil(new TextEncoder().encode(value).byteLength / 4));
}

export function normalizeContextText(text: string, format: ContextBlock["format"] = "text") {
  const normalizedNewlines = text.replace(/\r\n?/g, "\n");
  if (format === "code" || format === "table" || format === "json") return normalizedNewlines.trim();
  return normalizedNewlines
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function duplicateFingerprint(block: ContextBlock) {
  const normalized = normalizeContextText(block.text, block.format);
  const structural = block.format === "code" || block.format === "table" || block.format === "json";
  const comparable = structural ? normalized : normalized.replace(/\s+/g, " ").toLowerCase();
  return [block.kind, block.format, block.language?.toLowerCase() ?? "", block.section ?? "", comparable].join("\u0000");
}

const taskWeights: Record<ContextTask, Partial<Record<ContextBlock["kind"], number>>> = {
  "requirement-extraction": { instruction: 100, schema: 95, constraint: 90, evidence: 80, section: 70, table: 70, code: 55, architecture: 30 },
  "architecture-synthesis": { instruction: 100, schema: 95, constraint: 95, requirement: 90, evidence: 75, architecture: 70, table: 60, code: 50 },
  "change-planning": { instruction: 100, schema: 95, constraint: 95, architecture: 90, requirement: 85, evidence: 70, code: 55 },
  "architecture-review": { instruction: 100, schema: 95, architecture: 95, constraint: 90, evidence: 85, requirement: 75, code: 70 },
  documentation: { instruction: 100, schema: 95, architecture: 90, requirement: 85, evidence: 80, section: 75, table: 75, code: 50 },
  explanation: { instruction: 100, schema: 95, architecture: 90, requirement: 85, evidence: 75, constraint: 75, section: 60 },
};

function rank(task: ContextTask, block: ContextBlock) {
  return (taskWeights[task][block.kind] ?? 40) * 1_000 + block.priority;
}

export function compileContextPack(options: {
  task: ContextTask;
  blocks: ContextBlockInput[];
  instruction?: string;
  outputSchema?: string;
  budget?: Partial<ContextBudget>;
}): ContextPack {
  const task = contextTaskSchema.parse(options.task);
  const defaults = DEFAULT_CONTEXT_BUDGETS[task];
  const budget = contextBudgetSchema.parse({ ...defaults, ...options.budget });
  const instructionTokens = estimateContextTokens(options.instruction ?? "");
  const schemaTokens = estimateContextTokens(options.outputSchema ?? "");
  const overhead = instructionTokens + schemaTokens;
  if (overhead > budget.inputTokens) throw new ContextBudgetError(overhead, budget.inputTokens);

  const inputBlocks = z.array(contextBlockSchema).max(MAX_CONTEXT_BLOCKS).parse(options.blocks);
  const ids = new Set<string>();
  const parsed = inputBlocks.map((item) => {
    if (ids.has(item.id)) throw new ContextInputError(`Duplicate context block ID ${item.id}.`);
    ids.add(item.id);
    const text = normalizeContextText(item.text, item.format);
    if (!text) throw new ContextInputError(`Context block ${item.id} is empty after normalization.`);
    return { ...item, text, sourceRefs: [...new Set(item.sourceRefs)], estimatedTokens: estimateContextTokens(text) };
  });
  const unique = new Map<string, typeof parsed[number]>();
  const omitted: z.infer<typeof omittedContextSchema>[] = [];
  for (const block of [...parsed].sort((left, right) => rank(task, right) - rank(task, left))) {
    const fingerprint = duplicateFingerprint(block);
    const retained = unique.get(fingerprint);
    if (!retained) { unique.set(fingerprint, block); continue; }
    retained.mandatory ||= block.mandatory;
    const mergedSourceRefs = [...new Set([...retained.sourceRefs, ...block.sourceRefs])];
    if (mergedSourceRefs.length > MAX_COMPILED_SOURCE_REFS) {
      throw new ContextInputError(`Duplicate context for ${retained.id} exceeds ${MAX_COMPILED_SOURCE_REFS} source references.`);
    }
    retained.sourceRefs = mergedSourceRefs;
    omitted.push({ id: block.id, sourceRefs: block.sourceRefs, reason: "duplicate", duplicateOf: retained.id, estimatedTokens: block.estimatedTokens });
  }

  const candidates = [...unique.values()].sort((left, right) => Number(right.mandatory) - Number(left.mandatory) || rank(task, right) - rank(task, left));
  const mandatoryTokens = candidates.filter((block) => block.mandatory).reduce((total, block) => total + block.estimatedTokens, 0);
  if (overhead + mandatoryTokens > budget.inputTokens) throw new ContextBudgetError(overhead + mandatoryTokens, budget.inputTokens);

  let usedInputTokens = overhead;
  const blocks: typeof candidates = [];
  for (const block of candidates) {
    if (block.mandatory || usedInputTokens + block.estimatedTokens <= budget.inputTokens) {
      blocks.push(block);
      usedInputTokens += block.estimatedTokens;
    } else {
      omitted.push({ id: block.id, sourceRefs: block.sourceRefs, reason: "budget", estimatedTokens: block.estimatedTokens });
    }
  }

  return contextPackSchema.parse({
    schemaVersion: CONTEXT_PACK_VERSION,
    task,
    blocks,
    omitted,
    budget: {
      ...budget,
      instructionTokens,
      schemaTokens,
      contentTokens: usedInputTokens - overhead,
      usedInputTokens,
      remainingInputTokens: budget.inputTokens - usedInputTokens,
    },
  });
}

export function contextBlocksFromTraceability(traceability: TraceabilityBundle): ContextBlock[] {
  const evidenceById = new Map(traceability.evidence.items.map((item) => [item.id, item]));
  const requirements: ContextBlock[] = traceability.requirements.items.map((requirement) => ({
    id: requirement.id,
    kind: requirement.kind === "constraint" && requirement.state !== "unknown" ? "constraint" : "requirement",
    format: "text",
    text: requirement.question ? `${requirement.statement} Question: ${requirement.question}` : requirement.statement,
    priority: requirement.state === "unknown" || requirement.state === "conflicting" ? 95 : 80,
    mandatory: requirement.kind === "constraint" && requirement.state !== "unknown",
    sourceRefs: requirement.evidenceRefs,
  }));
  const referenced = new Set(traceability.requirements.items.flatMap((item) => item.evidenceRefs));
  const evidence: ContextBlock[] = [...referenced].flatMap((id) => {
    const item = evidenceById.get(id);
    return item ? [{ id: item.id, kind: "evidence" as const, format: "text" as const, text: item.claim, priority: 65, mandatory: false, sourceRefs: [item.id] }] : [];
  });
  return [...requirements, ...evidence];
}
