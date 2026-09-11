import { NextResponse } from "next/server";
import { z } from "zod";
import { architectureIRFromDiagram, architecturePresentationSchema, validateArchitectureArtifact } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { documentArchitectureIR } from "@/lib/ai/provider";
import { diagramSchema } from "@/lib/domain/schema";
import { apiError, readJson } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";

const requestSchema = z.object({
  diagram: diagramSchema,
  ir: architectureIRSchema.optional(),
  presentation: architecturePresentationSchema.optional(),
  irVersion: z.number().int().min(1).optional(),
  persist: z.literal(false).default(false),
}).strict();

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "documentation", 12);
    const body = requestSchema.parse(await readJson(request));
    const ir = body.ir ?? architectureIRFromDiagram(body.diagram);
    if (body.presentation) {
      const validation = validateArchitectureArtifact(ir, body.presentation);
      if (!validation.valid) return NextResponse.json({ error: "Architecture artifact validation failed.", validation }, { status: 422 });
    }
    const irVersion = body.irVersion ?? 1;
    const markdown = documentArchitectureIR(ir, irVersion, body.diagram.version);
    return NextResponse.json({ diagramVersion: body.diagram.version, irVersion, documentVersion: null, markdown });
  } catch (error) { return apiError(error); }
}
