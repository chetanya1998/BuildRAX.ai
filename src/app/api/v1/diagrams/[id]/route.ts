import { NextResponse } from "next/server";
import { z } from "zod";
import {
  architectureIRFromDiagram,
  architecturePresentationSchema,
  assertArchitecturePayloadSizes,
  assertPersistablePresentation,
  canonicalStringify,
  canonicalSha256,
  createArchitectureSnapshot,
  presentationFromDiagram,
  validateArchitectureArtifact,
} from "@/lib/architecture-ir/snapshot";
import { ARCHITECTURE_COMPILER_VERSION, SEMANTIC_CATALOG_VERSION, architectureIRSchema } from "@/lib/architecture-ir/schema";
import { diagramSchema } from "@/lib/domain/schema";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyPrivatePresentationAssets } from "@/lib/server/private-assets";

const architectureSaveRequest = z.object({
  idempotencyKey: z.string().uuid(),
  baseVersion: z.number().int().min(1),
  baseIrVersion: z.number().int().min(0),
  ir: architectureIRSchema,
  presentation: architecturePresentationSchema,
  aiRequestId: z.string().uuid().optional(),
}).strict();

const legacySaveRequest = z.object({
  baseVersion: z.number().int().min(1),
  diagram: diagramSchema,
}).strict();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const raw = await readJson(request);
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const { data: current, error: currentError } = await supabase
      .from("diagrams")
      .select("id, current_version, current_ir_version, created_at, projects!inner(workspace_id)")
      .eq("id", id)
      .maybeSingle();
    if (currentError || !current) throw new HttpError(currentError?.code === "42501" ? 403 : 404, "Diagram not found or access denied.");

    const modern = architectureSaveRequest.safeParse(raw);
    const legacy = modern.success ? null : legacySaveRequest.safeParse(raw);
    if (!modern.success && !legacy?.success) return apiError(modern.error);
    const legacyData = !modern.success && legacy?.success ? legacy.data : undefined;

    const baseVersion = modern.success ? modern.data.baseVersion : legacyData!.baseVersion;
    const baseIrVersion = modern.success ? modern.data.baseIrVersion : Number(current.current_ir_version ?? 0);
    const idempotencyKey = modern.success ? modern.data.idempotencyKey : crypto.randomUUID();
    const aiRequestId = modern.success ? modern.data.aiRequestId : undefined;
    const ir = modern.success ? modern.data.ir : architectureIRFromDiagram(legacyData!.diagram, undefined, "legacy-migration");
    let presentation;
    try {
      presentation = assertPersistablePresentation(modern.success ? modern.data.presentation : presentationFromDiagram(legacyData!.diagram));
    } catch (error) {
      throw new HttpError(422, error instanceof Error ? error.message : "Presentation is invalid.");
    }
    if (new TextEncoder().encode(canonicalStringify(ir)).byteLength > 256_000) throw new HttpError(413, "Architecture IR exceeds 256 KB.");
    const validation = validateArchitectureArtifact(ir, presentation);
    if (!validation.valid) return NextResponse.json({ error: "Architecture artifact validation failed.", validation }, { status: 422 });
    if (!modern.success && legacyData!.diagram.id !== id) throw new HttpError(422, "Diagram ID does not match the route.");
    const workspaceId = (current.projects as unknown as { workspace_id?: string } | null)?.workspace_id;
    if (!workspaceId) throw new HttpError(403, "Diagram workspace is unavailable.");
    await verifyPrivatePresentationAssets({
      admin: createSupabaseAdminClient(),
      presentation,
      workspaceId,
      diagramId: id,
    });

    const snapshot = await createArchitectureSnapshot({
      diagramId: id,
      diagramVersion: baseVersion + 1,
      irVersion: Math.max(1, baseIrVersion),
      ir,
      presentation,
      createdAt: current.created_at,
    });
    try {
      assertArchitecturePayloadSizes(ir, presentation, snapshot.materializedDiagram);
    } catch (error) {
      throw new HttpError(413, error instanceof Error ? error.message : "Architecture snapshot is too large.");
    }
    const requestChecksum = await canonicalSha256({ baseVersion, baseIrVersion, ir, presentation });
    const { data, error } = await supabase.rpc("save_architecture_snapshot", {
      target_diagram: id,
      base_version: baseVersion,
      base_ir_version: baseIrVersion,
      idempotency: idempotencyKey,
      request_checksum: requestChecksum,
      ir_payload: ir,
      ir_checksum: snapshot.checksums.ir,
      presentation_payload: presentation,
      presentation_checksum: snapshot.checksums.presentation,
      diagram_payload: snapshot.materializedDiagram,
      diagram_checksum: snapshot.checksums.diagram,
      ir_provenance: ir.provenance.strategy,
      compiler_version: ARCHITECTURE_COMPILER_VERSION,
      catalog_version: SEMANTIC_CATALOG_VERSION,
      ai_request_id: aiRequestId ?? null,
    });
    if (error?.code === "40001") {
      const { data: authoritative } = await supabase.from("diagrams").select("current_version, current_ir_version, updated_at").eq("id", id).maybeSingle();
      return NextResponse.json({ error: "Version conflict", authoritative }, { status: 409 });
    }
    if (error?.code === "22023" && error.message.includes("Idempotency")) {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (error?.code === "P0001" && error.message.includes("rate limit")) {
      return NextResponse.json({ error: "Too many save requests. Retry shortly." }, { status: 429, headers: { "retry-after": "60" } });
    }
    if (error) throw new HttpError(error.code === "42501" ? 403 : error.code === "22023" ? 422 : 500, "Architecture snapshot save failed.");
    const saved = data?.[0];
    const savedVersion = saved?.version ?? snapshot.diagramVersion;
    const savedIrVersion = saved?.ir_version ?? baseIrVersion;
    return NextResponse.json({
      saved: data,
      snapshot: {
        ...snapshot,
        diagramVersion: savedVersion,
        irVersion: savedIrVersion,
        materializedDiagram: { ...snapshot.materializedDiagram, version: savedVersion },
      },
      validation,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
