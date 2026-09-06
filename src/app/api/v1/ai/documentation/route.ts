import { NextResponse } from "next/server";
import { z } from "zod";
import { architectureIRFromDiagram, architecturePresentationSchema, validateArchitectureArtifact } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { documentArchitectureIR } from "@/lib/ai/provider";
import { diagramSchema } from "@/lib/domain/schema";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  diagram: diagramSchema,
  ir: architectureIRSchema.optional(),
  presentation: architecturePresentationSchema.optional(),
  irVersion: z.number().int().min(1).optional(),
  persist: z.boolean().default(false),
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
    let documentVersion: number | null = null;
    if (body.persist) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) throw new HttpError(503, "Persistence is not configured.");
      const { data, error } = await supabase.rpc("persist_architecture_document", {
        target_diagram: body.diagram.id,
        target_diagram_version: body.diagram.version,
        target_ir_version: irVersion,
        document_markdown: markdown,
      });
      if (error) throw new HttpError(error.code === "42501" ? 403 : error.code === "22023" ? 422 : 500, "Architecture document could not be persisted.");
      documentVersion = Number(data);
    }
    return NextResponse.json({ diagramVersion: body.diagram.version, irVersion, documentVersion, markdown });
  } catch (error) { return apiError(error); }
}
