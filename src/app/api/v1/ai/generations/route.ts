import { NextResponse } from "next/server";
import { generationRequestSchema } from "@/lib/domain/schema";
import { classifyAIError, AISemanticValidationError } from "@/lib/ai/errors";
import { runArchitectureSynthesis } from "@/lib/ai/gateway";
import { apiError, HttpError, inputValidationError, readJson } from "@/lib/server/http";
import { recordGenerationRun } from "@/lib/server/ai-runs";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { ARCHITECTURE_COMPILER_VERSION } from "@/lib/architecture-ir/schema";
import { createGenerationReceipt } from "@/lib/server/generation-receipt";

export const maxDuration = 30;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  let run: { provider: string; model: string; promptVersion: string; attempts: number } | undefined;
  try {
    assertRateLimit(request, "generation");
    const parsed = generationRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return inputValidationError(parsed.error, requestId);
    const input = parsed.data;
    const gateway = await runArchitectureSynthesis(input, { requestId, timeoutMs: 25_000, signal: request.signal });
    const result = gateway.data;
    const generationReceipt = createGenerationReceipt({
      requestId,
      irChecksum: result.artifact.checksums.ir,
      diagramChecksum: result.artifact.checksums.diagram,
    });
    run = result;
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
        gatewayVersion: gateway.meta.gatewayVersion,
      },
    }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    void recordGenerationRun({ requestId, provider: run?.provider ?? (process.env.OPENAI_API_KEY ? "openai" : "mock"), model: run?.model ?? (process.env.OPENAI_MODEL || (process.env.OPENAI_API_KEY ? "gpt-5.4-mini-2026-03-17" : "deterministic-ir-v1")), status: "failed", durationMs: Date.now() - startedAt, promptVersion: run?.promptVersion ?? "architecture-v1", attempts: run?.attempts ?? 1, errorClass: classifyAIError(error) });
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
