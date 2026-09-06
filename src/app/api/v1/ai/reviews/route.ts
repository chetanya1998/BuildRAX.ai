import { NextResponse } from "next/server";
import { z } from "zod";
import { architectureIRFromDiagram, architecturePresentationSchema, validateArchitectureArtifact } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { reviewArchitectureIR } from "@/lib/ai/provider";
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
    assertRateLimit(request, "review", 12);
    const body = requestSchema.parse(await readJson(request));
    const ir = body.ir ?? architectureIRFromDiagram(body.diagram);
    if (body.presentation) {
      const validation = validateArchitectureArtifact(ir, body.presentation);
      if (!validation.valid) return NextResponse.json({ error: "Architecture artifact validation failed.", validation }, { status: 422 });
    }
    const irVersion = body.irVersion ?? 1;
    const findings = reviewArchitectureIR(ir, body.diagram.version);
    let reviewRunId: string | null = null;
    if (body.persist) {
      const supabase = await createSupabaseServerClient();
      if (!supabase) throw new HttpError(503, "Persistence is not configured.");
      const { data, error } = await supabase.rpc("persist_architecture_review", {
        target_diagram: body.diagram.id,
        target_diagram_version: body.diagram.version,
        target_ir_version: irVersion,
        findings_payload: findings,
      });
      if (error) throw new HttpError(error.code === "42501" ? 403 : error.code === "22023" ? 422 : 500, "Architecture review could not be persisted.");
      reviewRunId = data as string;
    }
    return NextResponse.json({ diagramVersion: body.diagram.version, irVersion, reviewRunId, advisory: true, findings });
  } catch (error) { return apiError(error); }
}
