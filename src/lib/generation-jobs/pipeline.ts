import "server-only";

import { z } from "zod";
import { buildArchitectureIR, compileArchitectureIR } from "@/lib/architecture-ir/compiler";
import { architecturePresentationSchema, createArchitectureSnapshot, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { validateArchitectureIR } from "@/lib/architecture-ir/validator";
import { AIGatewayConfigurationError, AI_GATEWAY_VERSION, gatewayMetadataSchema, runArchitectureSynthesis } from "@/lib/ai/gateway";
import { classifyAIError } from "@/lib/ai/errors";
import { diagramSchema, generationRequestSchema } from "@/lib/domain/schema";
import { compileContextPack, contextBlocksFromTraceability, contextPackSchema } from "@/lib/intelligence/context";
import { buildInputTraceability } from "@/lib/intelligence/input";
import { evaluateArchitectureRules, matchArchitecturePatterns, ruleProposalSchema } from "@/lib/intelligence/patterns";
import { EVIDENCE_IR_VERSION, REQUIREMENT_IR_VERSION, TRACEABILITY_BUNDLE_VERSION, evidenceIRSchema, requirementIRSchema, traceabilityBundleSchema } from "@/lib/intelligence/schema";
import { createGenerationReceipt, generationReceiptSchema } from "@/lib/server/generation-receipt";
import { HttpError } from "@/lib/server/http";
import { checkpointGenerationJob, completeGenerationJob, failGenerationJob, leaseGenerationJob, readGenerationJob, readGenerationStages } from "./store";
import { generationModeSchema, generationResultSchema, generationValidationSchema } from "./schema";

const progressByStage = { evidence: 12, requirements: 24, context: 38, rules: 50, synthesis: 68, validation: 82, layout: 94 } as const;
const synthesisStageSchema = z.object({ ir: architectureIRSchema, meta: gatewayMetadataSchema }).strict();
const patternMatchSchema = z.object({
  patternId: z.string().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  score: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  matchedTerms: z.array(z.string().min(1).max(80)).max(40),
  explicit: z.boolean(),
  conflicts: z.array(z.string().min(1).max(500)).max(40),
}).strict();
const rulesStageSchema = z.object({
  patterns: z.array(patternMatchSchema).max(12),
  rules: z.array(ruleProposalSchema).max(20),
}).strict().superRefine((value, context) => {
  if (new Set(value.patterns.map((pattern) => pattern.patternId)).size !== value.patterns.length) {
    context.addIssue({ code: "custom", path: ["patterns"], message: "Pattern matches must be unique." });
  }
  if (new Set(value.rules.map((rule) => rule.ruleId)).size !== value.rules.length) {
    context.addIssue({ code: "custom", path: ["rules"], message: "Rule evaluations must be unique." });
  }
});
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const layoutStageSchema = z.object({
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
}).strict();

export async function processGenerationJob(options: { jobId: string; subjectKey: string }) {
  const existing = await readGenerationJob(options.jobId, options.subjectKey);
  if (["completed", "cancelled"].includes(existing.status)) return existing;
  const requestedMode = generationModeSchema.parse(existing.mode);
  const providerEnabled = Boolean(process.env.OPENAI_API_KEY);
  const requestPayload = existing.request_payload as { request?: unknown; mode?: unknown };
  const request = generationRequestSchema.parse(requestPayload.request);
  const useProvider = requestedMode === "provider" || (requestedMode === "auto" && providerEnabled && !request.templateId);
  const provider = useProvider ? "openai" : "deterministic";
  const workerId = crypto.randomUUID();
  const lease = await leaseGenerationJob({ jobId: options.jobId, subjectKey: options.subjectKey, workerId, provider });
  if (!lease) return readGenerationJob(options.jobId, options.subjectKey);
  const activeLease = lease;

  try {
    if (requestedMode === "provider" && !providerEnabled) throw new AIGatewayConfigurationError("Provider generation was requested but OPENAI_API_KEY is unavailable.");
    const stages = await readGenerationStages(options.jobId);

    async function stage<T>(name: keyof typeof progressByStage, create: () => Promise<T> | T): Promise<T> {
      if (stages.has(name)) return stages.get(name) as T;
      const value = await create();
      await checkpointGenerationJob({ workerId, jobId: options.jobId, runVersion: activeLease.run_version, stage: name, progress: progressByStage[name], payload: value });
      stages.set(name, value);
      return value;
    }

    const evidence = evidenceIRSchema.parse(await stage("evidence", () => buildInputTraceability(request).evidence));
    const requirements = requirementIRSchema.parse(await stage("requirements", () => buildInputTraceability(request).requirements));
    const traceability = traceabilityBundleSchema.parse({
      schemaVersion: TRACEABILITY_BUNDLE_VERSION,
      evidence: { ...evidence, schemaVersion: EVIDENCE_IR_VERSION },
      requirements: { ...requirements, schemaVersion: REQUIREMENT_IR_VERSION },
    });
    const contextPack = contextPackSchema.parse(await stage("context", () => compileContextPack({ task: "architecture-synthesis", blocks: contextBlocksFromTraceability(traceability) })));
    const proposals = rulesStageSchema.parse(await stage("rules", () => ({
      patterns: matchArchitecturePatterns(request).map((match) => ({
        patternId: match.pattern.id,
        score: match.score,
        matchedTerms: match.matchedTerms,
        explicit: match.explicit,
        conflicts: match.conflicts,
      })),
      rules: evaluateArchitectureRules({ request, traceability }),
    })));
    const synthesis = await stage("synthesis", async () => {
      if (!useProvider) {
        return {
          ir: buildArchitectureIR(request),
          meta: { gatewayVersion: AI_GATEWAY_VERSION, requestId: options.jobId, task: "architecture-synthesis", provider: "deterministic", model: "buildrax-compiler-v1", durationMs: 0, attempts: 1, successfulCalls: 0, repairCalls: 0, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 } },
        };
      }
      const gateway = await runArchitectureSynthesis(request, { requestId: options.jobId, timeoutMs: 25_000 });
      return { ir: gateway.data.ir, meta: gateway.meta };
    });
    const parsedSynthesis = synthesisStageSchema.parse(synthesis);
    const ir = parsedSynthesis.ir;
    const validation = generationValidationSchema.parse(await stage("validation", () => validateArchitectureIR(ir)));
    if (!validation.valid) throw new HttpError(422, "Generated Architecture IR did not pass validation.");
    const layout = layoutStageSchema.parse(await stage("layout", async () => {
      const diagram = compileArchitectureIR(ir);
      const presentation = presentationFromDiagram(diagram);
      const artifact = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, traceability, presentation, createdAt: diagram.createdAt, updatedAt: diagram.updatedAt });
      const generationReceipt = createGenerationReceipt({ requestId: options.jobId, irChecksum: artifact.checksums.ir, diagramChecksum: artifact.checksums.diagram });
      return { artifact: { ir, traceability, presentation, diagram: artifact.materializedDiagram, checksums: artifact.checksums, generationReceipt } };
    }));
    const result = generationResultSchema.parse({
      artifact: layout.artifact,
      validation,
      proposals,
      summary: {
        facts: traceability.requirements.items.filter((item) => item.state === "stated").map((item) => item.statement).slice(0, 8),
        assumptions: ir.assumptions.map((item) => item.text).slice(0, 8),
        unknowns: traceability.requirements.items.filter((item) => item.state === "unknown" && item.question).map((item) => item.question!).slice(0, 8),
      },
      context: { omitted: contextPack.omitted, budget: contextPack.budget },
      meta: parsedSynthesis.meta,
    });
    await completeGenerationJob({ workerId, jobId: options.jobId, runVersion: activeLease.run_version, result });
    return readGenerationJob(options.jobId, options.subjectKey);
  } catch (error) {
    await failGenerationJob({ workerId, jobId: options.jobId, runVersion: activeLease.run_version, errorClass: classifyAIError(error), message: error instanceof Error ? error.message : "Unknown generation failure" });
    throw error;
  }
}
