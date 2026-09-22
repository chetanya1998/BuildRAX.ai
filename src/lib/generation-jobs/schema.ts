import { z } from "zod";
import { architecturePresentationSchema } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { gatewayMetadataSchema } from "@/lib/ai/metadata";
import { generationRequestSchema } from "@/lib/domain/schema";
import { diagramSchema } from "@/lib/domain/schema";
import { compiledContextBudgetSchema, omittedContextSchema } from "@/lib/intelligence/context";
import { ruleProposalSchema } from "@/lib/intelligence/patterns";
import { traceabilityBundleSchema } from "@/lib/intelligence/schema";

export const generationModeSchema = z.enum(["auto", "deterministic", "provider"]);
export const generationJobStatusSchema = z.enum(["queued", "running", "completed", "failed", "cancelled"]);
export const generationStageSchema = z.enum(["accepted", "evidence", "requirements", "context", "rules", "synthesis", "validation", "layout", "published"]);

export const createGenerationJobSchema = z.object({
  idempotencyKey: z.string().uuid(),
  request: generationRequestSchema,
  mode: generationModeSchema.default("auto"),
}).strict();

export type GenerationMode = z.infer<typeof generationModeSchema>;

const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const generationReceiptSchema = z.object({
  requestId: z.string().uuid(),
  irChecksum: checksumSchema,
  diagramChecksum: checksumSchema,
  issuedAt: z.string().datetime(),
  signature: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
}).strict();
const validationFindingSchema = z.object({
  code: z.string().min(1).max(80),
  severity: z.enum(["error", "warning"]),
  message: z.string().min(1).max(1_200),
  affectedIds: z.array(z.string().min(1).max(120)).max(300),
}).strict();
export const generationValidationSchema = z.object({
  valid: z.boolean(),
  errors: z.array(validationFindingSchema).max(300),
  warnings: z.array(validationFindingSchema).max(300),
}).strict().superRefine((validation, context) => {
  if (validation.valid !== (validation.errors.length === 0)) {
    context.addIssue({ code: "custom", path: ["valid"], message: "Validation status must match the error collection." });
  }
});
const boundedSummaryItems = z.array(z.string().trim().min(1).max(500)).max(8);
export const generationResultSchema = z.object({
  artifact: z.object({
    ir: architectureIRSchema,
    traceability: traceabilityBundleSchema,
    presentation: architecturePresentationSchema,
    diagram: diagramSchema,
    checksums: z.object({
      ir: checksumSchema,
      presentation: checksumSchema,
      diagram: checksumSchema,
      evidence: checksumSchema,
      requirements: checksumSchema,
    }).strict(),
    generationReceipt: generationReceiptSchema,
  }).strict(),
  validation: generationValidationSchema,
  proposals: z.object({
    patterns: z.array(z.object({
      patternId: z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      score: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      matchedTerms: z.array(z.string().min(1).max(80)).max(40),
      explicit: z.boolean(),
      conflicts: z.array(z.string().min(1).max(500)).max(40),
    }).strict()).max(12),
    rules: z.array(ruleProposalSchema).max(20),
  }).strict(),
  summary: z.object({
    facts: boundedSummaryItems,
    assumptions: boundedSummaryItems,
    unknowns: boundedSummaryItems,
  }).strict(),
  context: z.object({
    omitted: z.array(omittedContextSchema).max(5_000),
    budget: compiledContextBudgetSchema,
  }).strict(),
  meta: gatewayMetadataSchema,
}).strict();

export type GenerationResult = z.infer<typeof generationResultSchema>;

export const publicGenerationJobSchema = z.object({
  id: z.string().uuid(),
  status: generationJobStatusSchema,
  stage: generationStageSchema,
  progress: z.number().int().min(0).max(100),
  attempts: z.number().int().min(0).max(12),
  result: generationResultSchema.nullable(),
  error: z.object({ code: z.string().min(1).max(120), message: z.string().min(1).max(500) }).strict().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
}).strict();

export type GenerationJobRecord = {
  id: string;
  subject_key: string;
  user_id: string | null;
  workspace_id: string | null;
  request_payload: unknown;
  mode: GenerationMode;
  status: z.infer<typeof generationJobStatusSchema>;
  current_stage: z.infer<typeof generationStageSchema>;
  progress: number;
  run_version: number;
  attempts: number;
  cancel_requested: boolean;
  result_payload: unknown | null;
  error_class: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

function publicFailureMessage(code: string | null) {
  switch (code) {
    case "configuration": return "Generation is not configured for the requested mode.";
    case "provider_timeout": return "Generation timed out before this stage completed.";
    case "provider_rate_limited": return "The generation provider is temporarily busy.";
    case "invalid_model_output":
    case "semantic_validation_failed": return "The generated architecture did not pass validation.";
    default: return "Generation failed. Retry from the last completed stage.";
  }
}

export function publicGenerationJob(record: GenerationJobRecord) {
  return {
    id: record.id,
    status: record.status,
    stage: record.current_stage,
    progress: record.progress,
    attempts: record.attempts,
    result: record.status === "completed" ? record.result_payload : null,
    error: record.status === "failed" ? { code: record.error_class ?? "generation_failed", message: publicFailureMessage(record.error_class) } : null,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    completedAt: record.completed_at,
  };
}
