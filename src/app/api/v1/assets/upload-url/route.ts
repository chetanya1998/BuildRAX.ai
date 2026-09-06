import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPrivateAssetReference } from "@/lib/storage/asset-references";

const uploadRequest = z.object({
  diagramId: z.string().uuid().optional(),
  guestDraftId: z.string().uuid().optional(),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]),
  byteSize: z.number().int().min(1).max(3_000_000),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
}).strict().refine((value) => Number(Boolean(value.diagramId)) + Number(Boolean(value.guestDraftId)) === 1, {
  message: "Provide either diagramId or guestDraftId.",
});

const extensions: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg",
};

export async function POST(request: Request) {
  try {
    const input = uploadRequest.parse(await readJson(request));
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) throw new HttpError(503, "Private asset uploads are not configured.");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new HttpError(401, "Authentication required.");
    let workspaceId: string | undefined;
    const targetId = input.diagramId ?? input.guestDraftId!;
    if (input.diagramId) {
      const { data: diagram } = await supabase.from("diagrams").select("id, projects!inner(workspace_id)").eq("id", input.diagramId).maybeSingle();
      workspaceId = (diagram?.projects as unknown as { workspace_id?: string } | null)?.workspace_id;
      if (!diagram || !workspaceId) throw new HttpError(403, "Diagram not found or access denied.");
    } else {
      const { data: membership } = await supabase.from("workspace_members").select("workspace_id, created_at")
        .eq("user_id", user.id).in("role", ["owner", "editor"]).order("created_at").limit(1).maybeSingle();
      workspaceId = membership?.workspace_id;
      if (!workspaceId) throw new HttpError(403, "An editable workspace is required.");
    }
    const path = `${workspaceId}/${targetId}/${input.checksum}.${extensions[input.contentType]}`;
    const { data, error } = await admin.storage.from("architecture-assets").createSignedUploadUrl(path, { upsert: true });
    if (error || !data) throw new HttpError(500, "A private upload URL could not be created.");
    return NextResponse.json({ path, token: data.token, reference: createPrivateAssetReference(path), maxBytes: input.byteSize }, { status: 201 });
  } catch (error) { return apiError(error); }
}
