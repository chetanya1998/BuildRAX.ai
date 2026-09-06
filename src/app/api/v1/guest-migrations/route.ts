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
import { generationReceiptSchema, verifyGenerationReceipt } from "@/lib/server/generation-receipt";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyPrivatePresentationAssets } from "@/lib/server/private-assets";
import { readArchitectureVersion } from "@/lib/supabase/architecture-artifacts";

const migrationRequest = z.object({
  idempotencyKey: z.string().uuid(),
  artifact: z.object({
    ir: architectureIRSchema,
    presentation: architecturePresentationSchema,
    diagram: diagramSchema,
  }).strict(),
  generationReceipt: generationReceiptSchema.optional(),
}).strict();

const legacyMigrationRequest = z.object({ idempotencyKey: z.string().uuid(), diagram: diagramSchema }).strict();

export async function POST(request: Request) {
  try {
    const raw = await readJson(request);
    const modern = migrationRequest.safeParse(raw);
    const legacy = modern.success ? null : legacyMigrationRequest.safeParse(raw);
    if (!modern.success && !legacy?.success) return apiError(modern.error);
    const legacyData = !modern.success && legacy?.success ? legacy.data : undefined;

    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new HttpError(401, "Authentication required.");

    const sourceDiagram = modern.success ? modern.data.artifact.diagram : legacyData!.diagram;
    z.string().uuid().parse(sourceDiagram.id);
    const ir = modern.success ? modern.data.artifact.ir : architectureIRFromDiagram(sourceDiagram, undefined, "legacy-migration");
    let presentation;
    try {
      presentation = assertPersistablePresentation(modern.success ? modern.data.artifact.presentation : presentationFromDiagram(sourceDiagram));
    } catch (error) {
      throw new HttpError(422, error instanceof Error ? error.message : "Presentation is invalid.");
    }
    if (new TextEncoder().encode(canonicalStringify(ir)).byteLength > 256_000) throw new HttpError(413, "Architecture IR exceeds 256 KB.");
    const validation = validateArchitectureArtifact(ir, presentation);
    if (!validation.valid) return NextResponse.json({ error: "Architecture artifact validation failed.", validation }, { status: 422 });
    const { data: membership } = await supabase.from("workspace_members").select("workspace_id, created_at")
      .eq("user_id", user.id).in("role", ["owner", "editor"]).order("created_at").limit(1).maybeSingle();
    if (!membership?.workspace_id) throw new HttpError(403, "An editable workspace is required.");
    await verifyPrivatePresentationAssets({
      admin: createSupabaseAdminClient(),
      presentation,
      workspaceId: membership.workspace_id,
      diagramId: sourceDiagram.id,
    });
    const snapshot = await createArchitectureSnapshot({
      diagramId: sourceDiagram.id,
      diagramVersion: 1,
      irVersion: 1,
      ir,
      presentation,
      createdAt: sourceDiagram.createdAt,
      updatedAt: sourceDiagram.updatedAt,
    });
    try {
      assertArchitecturePayloadSizes(ir, presentation, snapshot.materializedDiagram);
    } catch (error) {
      throw new HttpError(413, error instanceof Error ? error.message : "Architecture snapshot is too large.");
    }
    let generationReceipt;
    try {
      generationReceipt = modern.success && modern.data.generationReceipt
        ? verifyGenerationReceipt(modern.data.generationReceipt, snapshot.checksums)
        : undefined;
    } catch {
      throw new HttpError(422, "Generation receipt validation failed.");
    }

    let aiRequestId: string | null = null;
    if (generationReceipt) {
      const admin = createSupabaseAdminClient();
      if (!admin) throw new HttpError(503, "Generation provenance storage is not configured.");
      const recorded = await admin.from("ai_runs").upsert({
        user_id: user.id,
        kind: "generation",
        provider: "generation-receipt",
        model: "recorded-at-generation",
        status: "completed",
        duration_ms: 0,
        request_id: generationReceipt.requestId,
        prompt_version: "architecture-v1",
        attempts: 1,
      }, { onConflict: "request_id", ignoreDuplicates: true });
      if (recorded.error) throw new HttpError(500, "Generation provenance could not be prepared.");
      aiRequestId = generationReceipt.requestId;
    }

    const { data, error } = await supabase.rpc("migrate_guest_architecture", {
      idempotency: modern.success ? modern.data.idempotencyKey : legacyData!.idempotencyKey,
      request_checksum: await canonicalSha256({ ir, presentation, diagram: snapshot.materializedDiagram }),
      draft_title: snapshot.materializedDiagram.title,
      ir_payload: ir,
      ir_checksum: snapshot.checksums.ir,
      presentation_payload: presentation,
      presentation_checksum: snapshot.checksums.presentation,
      diagram_payload: snapshot.materializedDiagram,
      diagram_checksum: snapshot.checksums.diagram,
      ir_provenance: ir.provenance.strategy,
      compiler_version: ARCHITECTURE_COMPILER_VERSION,
      catalog_version: SEMANTIC_CATALOG_VERSION,
      ai_request_id: aiRequestId,
    });
    if (error?.code === "22023" && error.message.includes("Idempotency")) {
      return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    }
    if (error?.code === "P0001" && error.message.includes("rate limit")) {
      return NextResponse.json({ error: "Too many migration requests. Retry shortly." }, { status: 429, headers: { "retry-after": "60" } });
    }
    if (error) throw new HttpError(error.code === "42501" ? 403 : error.code === "23505" ? 409 : error.code === "22023" ? 422 : 500, "Guest architecture migration failed.");
    const migration = data?.[0];
    if (!migration?.diagram_id) throw new HttpError(500, "Guest migration did not return an architecture.");
    const persisted = await readArchitectureVersion(supabase, migration.diagram_id, Number(migration.version));
    if (persisted.checksums.ir !== snapshot.checksums.ir || persisted.checksums.presentation !== snapshot.checksums.presentation || persisted.checksums.diagram !== snapshot.checksums.diagram) {
      throw new HttpError(500, "Persisted architecture failed read-back verification.");
    }
    return NextResponse.json({ migration, checksums: persisted.checksums });
  } catch (error) {
    return apiError(error);
  }
}
