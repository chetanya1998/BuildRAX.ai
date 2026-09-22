import { NextResponse } from "next/server";
import { z } from "zod";
import { canonicalSha256 } from "@/lib/architecture-ir/snapshot";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { verifyPrivateAssetReferences } from "@/lib/server/private-assets";
import { assertSharedRateLimit } from "@/lib/server/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const saveRequest = z.object({
  idempotencyKey: z.string().uuid(),
  baseDocumentVersion: z.number().int().min(0),
  diagramVersion: z.number().int().min(1),
  irVersion: z.number().int().min(1),
  markdown: z.string().max(1_000_000),
  source: z.enum(["user-edit", "ai-generated"]),
}).strict();

async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const { data, error } = await supabase.from("documents")
      .select("current_version, stale_at, document_versions(version, diagram_version, markdown, content_checksum, source, created_at)")
      .eq("diagram_id", id).maybeSingle();
    if (error) throw new HttpError(error.code === "42501" ? 403 : 500, "Architecture document could not be loaded.");
    if (!data) return NextResponse.json({ document: null }, { headers: { "cache-control": "no-store" } });
    const versions = data.document_versions as unknown as Array<{ version: number; diagram_version: number; markdown: string; content_checksum: string; source: string; created_at: string }>;
    const current = versions.find((item) => item.version === data.current_version);
    if (!current) throw new HttpError(500, "Current document version is unavailable.");
    return NextResponse.json({ document: { ...current, stale: Boolean(data.stale_at) } }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertSharedRateLimit(request, "document-save", { limit: 60, windowSeconds: 60 });
    const id = z.string().uuid().parse((await params).id);
    const body = saveRequest.parse(await readJson(request));
    if (/data:image\//.test(body.markdown)) throw new HttpError(422, "Document images must be uploaded before saving.");
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const { data: diagram, error: diagramError } = await supabase.from("diagrams")
      .select("id, current_version, current_ir_version, projects!inner(workspace_id)").eq("id", id).maybeSingle();
    if (diagramError || !diagram) throw new HttpError(diagramError?.code === "42501" ? 403 : 404, "Diagram not found or access denied.");
    const workspaceId = (diagram.projects as unknown as { workspace_id?: string } | null)?.workspace_id;
    if (!workspaceId) throw new HttpError(403, "Diagram workspace is unavailable.");
    const references = [...body.markdown.matchAll(/!\[[^\]]*\]\((buildrax-private-asset:[^)]+)\)/g)].map((match) => match[1]);
    await verifyPrivateAssetReferences({ admin: createSupabaseAdminClient(), references, workspaceId, diagramId: id, context: "document" });
    const requestChecksum = await canonicalSha256({
      baseDocumentVersion: body.baseDocumentVersion,
      diagramVersion: body.diagramVersion,
      irVersion: body.irVersion,
      markdown: body.markdown,
      source: body.source,
    });
    const { data, error } = await supabase.rpc("save_architecture_document", {
      target_diagram: id,
      base_document_version: body.baseDocumentVersion,
      target_diagram_version: body.diagramVersion,
      target_ir_version: body.irVersion,
      idempotency: body.idempotencyKey,
      request_checksum: requestChecksum,
      document_markdown: body.markdown,
      document_source: body.source,
    });
    if (error?.code === "40001") {
      const [{ data: architecture }, { data: document }] = await Promise.all([
        supabase.from("diagrams").select("current_version, current_ir_version").eq("id", id).maybeSingle(),
        supabase.from("documents").select("current_version").eq("diagram_id", id).maybeSingle(),
      ]);
      return NextResponse.json({ error: "Document version conflict", authoritative: {
        documentVersion: document?.current_version ?? 0,
        diagramVersion: architecture?.current_version,
        irVersion: architecture?.current_ir_version,
      } }, { status: 409 });
    }
    if (error?.code === "22023" && error.message.includes("Idempotency")) return NextResponse.json({ error: "Idempotency key conflict" }, { status: 409 });
    if (error) throw new HttpError(error.code === "42501" ? 403 : error.code === "22023" ? 422 : 500, "Architecture document could not be saved.");
    const saved = data?.[0];
    if (!saved?.document_version) throw new HttpError(500, "Document save did not return a version.");
    const expectedChecksum = await sha256Text(body.markdown);
    if (saved.content_checksum !== expectedChecksum) throw new HttpError(500, "Document save checksum verification failed.");
    return NextResponse.json({ document: {
      version: Number(saved.document_version),
      diagramVersion: Number(saved.diagram_version),
      irVersion: Number(saved.ir_version),
      markdown: body.markdown,
      checksum: saved.content_checksum,
      source: body.source,
      replayed: Boolean(saved.replayed),
    } }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
