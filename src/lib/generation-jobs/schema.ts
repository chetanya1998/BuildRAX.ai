import { z } from "zod";
import { generationRequestSchema } from "@/lib/domain/schema";

export const generationModeSchema = z.enum(["auto", "deterministic", "provider"]);
export const generationJobStatusSchema = z.enum(["queued", "running", "completed", "failed", "cancelled"]);
export const generationStageSchema = z.enum(["accepted", "evidence", "requirements", "context", "synthesis", "validation", "layout", "published"]);

export const createGenerationJobSchema = z.object({
  idempotencyKey: z.string().uuid(),
  request: generationRequestSchema,
  mode: generationModeSchema.default("auto"),
}).strict();

export type GenerationMode = z.infer<typeof generationModeSchema>;

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
