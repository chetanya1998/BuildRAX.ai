import { z } from "zod";

export const AI_GATEWAY_VERSION = "1.0.0" as const;

export const aiTaskSchema = z.enum([
  "requirement-extraction",
  "architecture-synthesis",
  "change-planning",
  "architecture-review",
  "documentation",
  "explanation",
]);
export type AITask = z.infer<typeof aiTaskSchema>;

export const usageSchema = z.object({
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  estimatedCostUsd: z.number().min(0).nullable(),
}).strict().superRefine((usage, context) => {
  if (usage.totalTokens !== usage.inputTokens + usage.outputTokens) {
    context.addIssue({ code: "custom", path: ["totalTokens"], message: "Total tokens must equal input plus output tokens." });
  }
});

export const gatewayMetadataSchema = z.object({
  gatewayVersion: z.literal(AI_GATEWAY_VERSION),
  requestId: z.string().uuid(),
  task: aiTaskSchema,
  provider: z.string().min(1).max(80),
  model: z.string().min(1).max(160),
  durationMs: z.number().int().min(0),
  attempts: z.number().int().min(1).max(2),
  successfulCalls: z.number().int().min(0).max(2),
  repairCalls: z.number().int().min(0).max(1),
  usage: usageSchema,
}).strict().superRefine((metadata, context) => {
  if (metadata.repairCalls > metadata.successfulCalls) {
    context.addIssue({ code: "custom", path: ["repairCalls"], message: "Repair calls cannot exceed successful provider calls." });
  }
  if (metadata.successfulCalls === 0) {
    if (metadata.repairCalls !== 0) context.addIssue({ code: "custom", path: ["repairCalls"], message: "Provider-free tasks cannot report repairs." });
    if (metadata.usage.totalTokens !== 0 || metadata.usage.estimatedCostUsd !== 0) {
      context.addIssue({ code: "custom", path: ["usage"], message: "Provider-free tasks must report zero usage and cost." });
    }
  } else if (metadata.attempts !== metadata.successfulCalls + metadata.repairCalls) {
    context.addIssue({ code: "custom", path: ["attempts"], message: "Attempts must account for successful and repair calls." });
  }
});

export type GatewayMetadata = z.infer<typeof gatewayMetadataSchema>;
