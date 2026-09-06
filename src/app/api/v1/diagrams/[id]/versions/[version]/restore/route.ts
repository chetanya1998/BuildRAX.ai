import { NextResponse } from "next/server";
import { z } from "zod";
import { assertArchitecturePayloadSizes, canonicalSha256, createArchitectureSnapshot } from "@/lib/architecture-ir/snapshot";
import { ARCHITECTURE_COMPILER_VERSION, SEMANTIC_CATALOG_VERSION, architectureIRSchema } from "@/lib/architecture-ir/schema";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { readArchitectureVersion } from "@/lib/supabase/architecture-artifacts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const restoreRequest = z.object({ idempotencyKey: z.string().uuid() }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  try {
    const { id: rawId, version: rawVersion } = await params;
    const id = z.string().uuid().parse(rawId);
    const version = Number(rawVersion);
    if (!Number.isInteger(version) || version < 1) throw new HttpError(400, "Version must be a positive integer.");
    const input = restoreRequest.parse(await readJson(request));
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const [source, currentResult] = await Promise.all([
      readArchitectureVersion(supabase, id, version),
      supabase.from("diagrams").select("current_version, current_ir_version, created_at").eq("id", id).maybeSingle(),
    ]);
    if (currentResult.error || !currentResult.data) throw new HttpError(403, "Diagram not found or access denied.");
    const ir = architectureIRSchema.parse({ ...source.ir, provenance: { ...source.ir.provenance, strategy: "restore" } });
    const snapshot = await createArchitectureSnapshot({
      diagramId: id,
      diagramVersion: currentResult.data.current_version + 1,
      irVersion: currentResult.data.current_ir_version + 1,
      ir,
      presentation: source.presentation,
      createdAt: currentResult.data.created_at,
    });
    try {
      assertArchitecturePayloadSizes(ir, source.presentation, snapshot.materializedDiagram);
    } catch (error) {
      throw new HttpError(413, error instanceof Error ? error.message : "Architecture snapshot is too large.");
    }
    const requestChecksum = await canonicalSha256({
      baseVersion: currentResult.data.current_version,
      baseIrVersion: currentResult.data.current_ir_version,
      ir,
      presentation: source.presentation,
    });
    const { data, error } = await supabase.rpc("save_architecture_snapshot", {
      target_diagram: id,
      base_version: currentResult.data.current_version,
      base_ir_version: currentResult.data.current_ir_version,
      idempotency: input.idempotencyKey,
      request_checksum: requestChecksum,
      ir_payload: ir,
      ir_checksum: snapshot.checksums.ir,
      presentation_payload: source.presentation,
      presentation_checksum: snapshot.checksums.presentation,
      diagram_payload: snapshot.materializedDiagram,
      diagram_checksum: snapshot.checksums.diagram,
      ir_provenance: "restore",
      compiler_version: ARCHITECTURE_COMPILER_VERSION,
      catalog_version: SEMANTIC_CATALOG_VERSION,
      ai_request_id: null,
    });
    if (error?.code === "40001") return NextResponse.json({ error: "Version conflict" }, { status: 409 });
    if (error?.code === "22023" && error.message.includes("Idempotency")) return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    if (error?.code === "P0001" && error.message.includes("rate limit")) return NextResponse.json({ error: "Too many restore requests. Retry shortly." }, { status: 429, headers: { "retry-after": "60" } });
    if (error) throw new HttpError(error.code === "42501" ? 403 : error.code === "22023" ? 422 : 500, "Architecture version could not be restored.");
    const saved = data?.[0];
    return NextResponse.json({
      restoredFrom: version,
      saved,
      snapshot: {
        ...snapshot,
        diagramVersion: saved?.version ?? snapshot.diagramVersion,
        irVersion: saved?.ir_version ?? snapshot.irVersion,
        materializedDiagram: { ...snapshot.materializedDiagram, version: saved?.version ?? snapshot.diagramVersion },
      },
    }, { status: 201 });
  } catch (error) { return apiError(error); }
}
