import { NextResponse } from "next/server";
import { ArchitectureIRValidationError, compileArchitectureRequest } from "@/lib/architecture-ir/compiler";
import { generationRequestSchema } from "@/lib/domain/schema";
import { apiError, inputValidationError, readJson } from "@/lib/server/http";
import { assertSharedRateLimit } from "@/lib/server/rate-limit";
import { createArchitectureSnapshot, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { buildInputTraceability } from "@/lib/intelligence/input";

export const maxDuration = 10;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    await assertSharedRateLimit(request, "architecture-ir", { limit: 20, windowSeconds: 60 });
    const parsed = generationRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return inputValidationError(parsed.error, requestId);
    const input = parsed.data;
    const result = compileArchitectureRequest(input);
    const traceability = buildInputTraceability(input);
    const presentation = presentationFromDiagram(result.diagram);
    const artifact = await createArchitectureSnapshot({
      diagramId: result.diagram.id,
      diagramVersion: 1,
      irVersion: 1,
      ir: result.ir,
      traceability,
      presentation,
      createdAt: result.diagram.createdAt,
      updatedAt: result.diagram.updatedAt,
    });
    return NextResponse.json({
      ir: artifact.ir,
      traceability: artifact.traceability,
      presentation: artifact.presentation,
      diagram: artifact.materializedDiagram,
      checksums: artifact.checksums,
      validation: result.validation,
      meta: { requestId, strategy: "deterministic-ir", durationMs: Date.now() - startedAt },
    }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof ArchitectureIRValidationError) {
      return NextResponse.json({ error: "Architecture validation failed.", stage: "architecture-validation", validation: error.validation, requestId }, { status: 422, headers: { "x-request-id": requestId } });
    }
    if (error && typeof error === "object" && "issues" in error) return NextResponse.json({ error: "The validated input could not be compiled into Architecture IR.", stage: "architecture-compilation", requestId }, { status: 422, headers: { "x-request-id": requestId } });
    return apiError(error);
  }
}
