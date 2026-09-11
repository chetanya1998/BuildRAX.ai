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
import { verifyPrivateAssetReferences, verifyPrivatePresentationAssets } from "@/lib/server/private-assets";
import { readArchitectureVersion } from "@/lib/supabase/architecture-artifacts";

const migrationRequest = z.object({
  idempotencyKey: z.string().uuid(),
  artifact: z.object({
    ir: architectureIRSchema,
    presentation: architecturePresentationSchema,
    diagram: diagramSchema,
  }).strict(),
  generationReceipt: generationReceiptSchema.optional(),
  document: z.string().max(1_000_000).optional(),
  generationOrigin: z.object({
    diagram: diagramSchema,
    architecture: z.object({
      ir: architectureIRSchema,
      presentation: architecturePresentationSchema,
      generationReceipt: generationReceiptSchema,
    }).strict(),
  }).strict().optional(),
}).strict();

const legacyMigrationRequest = z.object({ idempotencyKey: z.string().uuid(), diagram: diagramSchema }).strict();

export async function POST(request: Request) {
  return persistArchitectureProject(request, "migration");
}

export async function persistArchitectureProject(request: Request, responseKey: "migration" | "project") {
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
    if (modern.success && modern.data.document !== undefined) {
      const documentAssets = [...modern.data.document.matchAll(/!\[[^\]]*\]\((buildrax-private-asset:[^)]+)\)/g)].map((match) => match[1]);
      if (/data:image\//.test(modern.data.document)) throw new HttpError(422, "Document images must be uploaded before migration.");
      await verifyPrivateAssetReferences({ admin: createSupabaseAdminClient(), references: documentAssets,
        workspaceId: membership.workspace_id, diagramId: sourceDiagram.id, context: "document" });
    }
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

    let originPayload: { ir: unknown; presentation: unknown; diagram: unknown } | null = null;
    let originChecksum: string | null = null;
    let originRequestId: string | null = null;
    if (modern.success && modern.data.generationOrigin) {
      const origin = modern.data.generationOrigin;
      const originValidation = validateArchitectureArtifact(origin.architecture.ir, origin.architecture.presentation);
      if (!originValidation.valid) throw new HttpError(422, "Original generation artifact is invalid.");
      const originSnapshot = await createArchitectureSnapshot({
        diagramId: origin.diagram.id, diagramVersion: 1, irVersion: 1,
        ir: origin.architecture.ir, presentation: origin.architecture.presentation,
        createdAt: origin.diagram.createdAt, updatedAt: origin.diagram.updatedAt,
      });
      const receipt = verifyGenerationReceipt(origin.architecture.generationReceipt, originSnapshot.checksums);
      originPayload = { ir: origin.architecture.ir, presentation: origin.architecture.presentation, diagram: originSnapshot.materializedDiagram };
      originChecksum = await canonicalSha256(originPayload);
      originRequestId = receipt.requestId;
    }

    let aiRequestId: string | null = originRequestId;
    if (generationReceipt || originRequestId) {
      const receipt = generationReceipt ?? (modern.success ? modern.data.generationOrigin?.architecture.generationReceipt : undefined);
      if (!receipt) throw new HttpError(422, "Generation receipt is unavailable.");
      const admin = createSupabaseAdminClient();
      if (!admin) throw new HttpError(503, "Generation provenance storage is not configured.");
      const recorded = await admin.from("ai_runs").upsert({
        user_id: user.id,
        kind: "generation",
        provider: "generation-receipt",
        model: "recorded-at-generation",
        status: "completed",
        duration_ms: 0,
        request_id: receipt.requestId,
        prompt_version: "architecture-v1",
        attempts: 1,
      }, { onConflict: "request_id", ignoreDuplicates: true });
      if (recorded.error) throw new HttpError(500, "Generation provenance could not be prepared.");
      aiRequestId = receipt.requestId;
    }

    const completeMigration = modern.success && (modern.data.document !== undefined || originPayload !== null);
    const rpcName = completeMigration ? "migrate_guest_architecture_complete" : "migrate_guest_architecture";
    const rpcInput: Record<string, unknown> = {
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
      ai_request_id: completeMigration ? null : aiRequestId,
    };
    if (completeMigration) Object.assign(rpcInput, {
      document_markdown: modern.data.document ?? "",
      generation_origin: originPayload,
      generation_origin_checksum: originChecksum,
      generation_request_id: originRequestId,
    });
    const { data, error } = await supabase.rpc(rpcName, rpcInput);
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
    let migrationVerification: { documentChecksum: string; generationOriginChecksum: string | null } | undefined;
    if (completeMigration) {
      const [{ data: documentRow }, { data: originRow }] = await Promise.all([
        supabase.from("documents").select("current_version, document_versions(markdown, version)").eq("diagram_id", migration.diagram_id).maybeSingle(),
        supabase.from("diagram_generation_origins").select("artifact_checksum").eq("diagram_id", migration.diagram_id).maybeSingle(),
      ]);
      const versions = documentRow?.document_versions as unknown as Array<{ markdown: string; version: number }> | undefined;
      const storedDocument = versions?.find((item) => item.version === documentRow?.current_version)?.markdown;
      if (storedDocument !== (modern.data.document ?? "") || (originChecksum && originRow?.artifact_checksum !== originChecksum)) {
        throw new HttpError(500, "Complete migration failed read-back verification.");
      }
      migrationVerification = { documentChecksum: await canonicalSha256(storedDocument), generationOriginChecksum: originRow?.artifact_checksum ?? null };
    }
    const result = { projectId: migration.project_id, diagramId: migration.diagram_id, version: Number(migration.version), irVersion: Number(migration.ir_version) };
    return NextResponse.json(responseKey === "migration" ? { migration, checksums: persisted.checksums, verification: migrationVerification } : { project: result, checksums: persisted.checksums }, { status: responseKey === "project" ? 201 : 200 });
  } catch (error) {
    return apiError(error);
  }
}
