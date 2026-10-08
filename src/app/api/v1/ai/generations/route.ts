import { NextResponse } from "next/server";
import { generationRequestSchema } from "@/lib/domain/schema";
import { classifyAIError, AISemanticValidationError, getAIExecution } from "@/lib/ai/errors";
import { runArchitectureSynthesis } from "@/lib/ai/gateway";
import { resolveTaskRoute } from "@/lib/ai/router";
import { apiError, HttpError, inputValidationError, readJson } from "@/lib/server/http";
import { recordGenerationRun } from "@/lib/server/ai-runs";
import { assertSharedRateLimit } from "@/lib/server/rate-limit";
import { ARCHITECTURE_COMPILER_VERSION } from "@/lib/architecture-ir/schema";
import { createGenerationReceipt } from "@/lib/server/generation-receipt";

export const maxDuration = 30;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  let run: { provider: string; model: string; promptVersion: string; attempts: number } | undefined;
  try {
    const parsed = generationRequestSchema.safeParse(await readJson(request));
    const { provider } = resolveTaskRoute("architecture-synthesis", { templateId: parsed.success ? parsed.data.templateId : undefined });
    await assertSharedRateLimit(request, "generation", {
      limit: 5,
      windowSeconds: 600,
      costUnits: provider === "openai" ? 1 : 0,
      provider: provider === "openai" ? provider : undefined,
    });
    if (!parsed.success) return inputValidationError(parsed.error, requestId);
    const input = parsed.data;
    const gateway = await runArchitectureSynthesis(input, { requestId, timeoutMs: 25_000, signal: request.signal });
    const result = gateway.data;
    run = result;
    const generationReceipt = createGenerationReceipt({
      requestId,
      irChecksum: result.artifact.checksums.ir,
      diagramChecksum: result.artifact.checksums.diagram,
    });
    void recordGenerationRun({ requestId, provider: result.provider, model: result.model, status: "completed", durationMs: Date.now() - startedAt, promptVersion: result.promptVersion, attempts: result.attempts });
    return NextResponse.json({
      artifact: {
        ir: result.ir,
        traceability: result.traceability,
        presentation: result.presentation,
        diagram: result.diagram,
        checksums: result.artifact.checksums,
        generationReceipt,
      },
      validation: result.validation,
      // Temporary compatibility field for clients created before IR persistence.
      diagram: result.diagram,
      meta: {
        requestId,
        durationMs: Date.now() - startedAt,
        provider: result.provider,
        model: result.model,
        attempts: result.attempts,
        promptVersion: result.promptVersion,
        compilerVersion: ARCHITECTURE_COMPILER_VERSION,
        usage: gateway.meta.usage,
        successfulCalls: gateway.meta.successfulCalls,
        repairCalls: gateway.meta.repairCalls,
        failedCalls: gateway.meta.failedCalls,
        routing: gateway.meta.routing,
        gatewayVersion: gateway.meta.gatewayVersion,
      },
    }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    const execution = getAIExecution(error) ?? run;
    // Admission/configuration rejection is not an attempted provider run.
    if (execution) void recordGenerationRun({ requestId, provider: execution.provider, model: execution.model, promptVersion: execution.promptVersion, attempts: execution.attempts, status: "failed", durationMs: Date.now() - startedAt, errorClass: classifyAIError(error) });
    if (error instanceof AISemanticValidationError) {
      return NextResponse.json({ error: "The generated architecture could not be validated. Please refine the request and try again.", stage: "architecture-validation", requestId }, { status: 422, headers: { "x-request-id": requestId } });
    }
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "The validated input could not be compiled into Architecture IR.", stage: "architecture-compilation", requestId }, { status: 422, headers: { "x-request-id": requestId } });
    }
    if (!(error instanceof HttpError)) {
      console.error("BuildRAX AI generation failure", { requestId, errorClass: classifyAIError(error) });
      return NextResponse.json({ error: "The architecture service is temporarily unavailable. Please try again.", stage: "generation", requestId }, { status: 502, headers: { "x-request-id": requestId } });
    }
    return apiError(error);
  }
}
