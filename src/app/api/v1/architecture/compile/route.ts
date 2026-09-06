import { NextResponse } from "next/server";
import { ArchitectureIRValidationError, compileArchitectureRequest } from "@/lib/architecture-ir/compiler";
import { generationRequestSchema } from "@/lib/domain/schema";
import { apiError, readJson } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { createArchitectureSnapshot, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";

export const maxDuration = 10;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    assertRateLimit(request, "architecture-ir", 20, 60_000);
    const input = generationRequestSchema.parse(await readJson(request));
    const result = compileArchitectureRequest(input);
    const presentation = presentationFromDiagram(result.diagram);
    const artifact = await createArchitectureSnapshot({
      diagramId: result.diagram.id,
      diagramVersion: 1,
      irVersion: 1,
      ir: result.ir,
      presentation,
      createdAt: result.diagram.createdAt,
      updatedAt: result.diagram.updatedAt,
    });
    return NextResponse.json({
      ir: artifact.ir,
      presentation: artifact.presentation,
      diagram: artifact.materializedDiagram,
      checksums: artifact.checksums,
      validation: result.validation,
      meta: { requestId, strategy: "deterministic-ir", durationMs: Date.now() - startedAt },
    }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof ArchitectureIRValidationError) {
      return NextResponse.json({ error: "Architecture validation failed.", validation: error.validation, requestId }, { status: 422, headers: { "x-request-id": requestId } });
    }
    return apiError(error);
  }
}
