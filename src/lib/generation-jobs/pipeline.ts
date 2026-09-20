import "server-only";

import { buildArchitectureIR, compileArchitectureIR } from "@/lib/architecture-ir/compiler";
import { createArchitectureSnapshot, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { validateArchitectureIR } from "@/lib/architecture-ir/validator";
import { AIGatewayConfigurationError, AI_GATEWAY_VERSION, runArchitectureSynthesis } from "@/lib/ai/gateway";
import { classifyAIError } from "@/lib/ai/errors";
import { generationRequestSchema } from "@/lib/domain/schema";
import { compileContextPack, contextBlocksFromTraceability, contextPackSchema } from "@/lib/intelligence/context";
import { buildInputTraceability } from "@/lib/intelligence/input";
import { evaluateArchitectureRules, matchArchitecturePatterns } from "@/lib/intelligence/patterns";
import { EVIDENCE_IR_VERSION, REQUIREMENT_IR_VERSION, TRACEABILITY_BUNDLE_VERSION, evidenceIRSchema, requirementIRSchema, traceabilityBundleSchema } from "@/lib/intelligence/schema";
import { createGenerationReceipt } from "@/lib/server/generation-receipt";
import { HttpError } from "@/lib/server/http";
import { checkpointGenerationJob, completeGenerationJob, failGenerationJob, leaseGenerationJob, readGenerationJob, readGenerationStages } from "./store";
import { generationModeSchema } from "./schema";

const progressByStage = { evidence: 12, requirements: 24, context: 38, rules: 50, synthesis: 68, validation: 80, layout: 94 } as const;

export async function processGenerationJob(options: { jobId: string; subjectKey: string }) {
  const existing = await readGenerationJob(options.jobId, options.subjectKey);
  if (existing.status === "completed" || existing.status === "cancelled") return existing;
  const requestedMode = generationModeSchema.parse(existing.mode);
  const providerEnabled = Boolean(process.env.OPENAI_API_KEY);
  const useProvider = requestedMode === "provider" || (requestedMode === "auto" && providerEnabled && !(existing.request_payload as { request?: { templateId?: string } }).request?.templateId);
  const providerName = useProvider ? "openai" : "deterministic";
  const workerId = crypto.randomUUID();
  const lease = await leaseGenerationJob({ jobId: options.jobId, subjectKey: options.subjectKey, workerId, provider: providerName });
  if (!lease) return readGenerationJob(options.jobId, options.subjectKey);
  const activeLease = lease;

  try {
    if (requestedMode === "provider" && !providerEnabled) throw new AIGatewayConfigurationError("Provider generation was requested but OPENAI_API_KEY is unavailable.");
    const payload = activeLease.request_payload as { request?: unknown; mode?: unknown };
    const request = generationRequestSchema.parse(payload.request);
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
    const traceability = traceabilityBundleSchema.parse({ schemaVersion: TRACEABILITY_BUNDLE_VERSION, evidence: { ...evidence, schemaVersion: EVIDENCE_IR_VERSION }, requirements: { ...requirements, schemaVersion: REQUIREMENT_IR_VERSION } });
    const contextPack = contextPackSchema.parse(await stage("context", () => compileContextPack({ task: "architecture-synthesis", blocks: contextBlocksFromTraceability(traceability) })));
    const proposals = await stage("rules", () => ({
      patterns: matchArchitecturePatterns(request).map((match) => ({ patternId: match.pattern.id, score: match.score, matchedTerms: match.matchedTerms, explicit: match.explicit, conflicts: match.conflicts })),
      rules: evaluateArchitectureRules({ request, traceability }),
    }));

    const synthesis = await stage("synthesis", async () => {
      if (!useProvider) {
        return {
          ir: buildArchitectureIR(request),
          meta: { gatewayVersion: AI_GATEWAY_VERSION, requestId: options.jobId, task: "architecture-synthesis", provider: "deterministic", model: "buildrax-compiler-v1", attempts: 1, successfulCalls: 0, repairCalls: 0, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 } },
        };
      }
      const result = await runArchitectureSynthesis(request, { requestId: options.jobId, timeoutMs: 25_000 });
      return { ir: result.data.ir, meta: result.meta };
    });
    const ir = architectureIRSchema.parse((synthesis as { ir: unknown }).ir);
    const validation = await stage("validation", () => validateArchitectureIR(ir));
    if (!(validation as ReturnType<typeof validateArchitectureIR>).valid) throw new HttpError(422, "Generated Architecture IR did not pass validation.");
    const layout = await stage("layout", async () => {
      const diagram = compileArchitectureIR(ir);
      const presentation = presentationFromDiagram(diagram);
      const artifact = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, traceability, presentation, createdAt: diagram.createdAt, updatedAt: diagram.updatedAt });
      const generationReceipt = createGenerationReceipt({ requestId: options.jobId, irChecksum: artifact.checksums.ir, diagramChecksum: artifact.checksums.diagram });
      return { artifact: { ir, traceability, presentation, diagram: artifact.materializedDiagram, checksums: artifact.checksums, generationReceipt } };
    });
    const result = {
      ...(layout as { artifact: unknown }),
      validation,
      proposals,
      context: { omitted: contextPack.omitted, budget: contextPack.budget },
      summary: {
        facts: traceability.requirements.items.filter((item) => item.state === "stated").slice(0, 8).map((item) => item.statement),
        assumptions: ir.assumptions.slice(0, 8).map((item) => item.text),
        unknowns: traceability.requirements.items.filter((item) => item.state === "unknown").slice(0, 8).map((item) => item.question ?? item.statement),
      },
      meta: (synthesis as { meta: unknown }).meta,
    };
    await completeGenerationJob({ workerId, jobId: options.jobId, runVersion: activeLease.run_version, result });
    return readGenerationJob(options.jobId, options.subjectKey);
  } catch (error) {
    await failGenerationJob({ workerId, jobId: options.jobId, runVersion: activeLease.run_version, errorClass: classifyAIError(error), message: error instanceof Error ? error.message : "Unknown generation failure" });
    throw error;
  }
}
