import { NextResponse } from "next/server";
import { apiError, HttpError } from "@/lib/server/http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRIVATE_ASSET_BUCKET, parsePrivateAssetReference } from "@/lib/storage/asset-references";
import { hashShareToken } from "@/lib/server/share-token";

export async function GET(request: Request) {
  try {
    const reference = new URL(request.url).searchParams.get("ref") ?? "";
    const asset = parsePrivateAssetReference(reference);
    if (!asset) throw new HttpError(400, "Private asset reference is invalid.");
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) throw new HttpError(503, "Private asset storage is not configured.");
    const user = (await supabase.auth.getUser()).data.user;
    let authorized = false;
    if (user) {
      const { data: membership } = await supabase.from("workspace_members").select("workspace_id")
        .eq("workspace_id", asset.workspaceId).eq("user_id", user.id).maybeSingle();
      authorized = Boolean(membership);
    }
    const shareToken = new URL(request.url).searchParams.get("share");
    if (!authorized && shareToken && shareToken.length >= 24 && shareToken.length <= 256) {
      const { data } = await supabase.rpc("read_shared_diagram", { target_token_hash: hashShareToken(shareToken) });
      const shared = data?.[0] as { diagram_id?: string; diagram_payload?: { primitives?: Array<{ kind?: string; style?: { src?: string } }> } } | undefined;
      authorized = shared?.diagram_id === asset.diagramId && Boolean(shared.diagram_payload?.primitives?.some((primitive) => primitive.kind === "image" && primitive.style?.src === reference));
    }
    if (!authorized) throw new HttpError(user ? 403 : 401, "Private asset access denied.");
    const verified = await admin.from("architecture_assets").select("id").eq("workspace_id", asset.workspaceId)
      .eq("diagram_id", asset.diagramId).eq("checksum", asset.checksum).maybeSingle();
    if (verified.error || !verified.data) throw new HttpError(404, "Private asset has not been verified.");
    const { data, error } = await admin.storage.from(PRIVATE_ASSET_BUCKET).createSignedUrl(asset.path, 60);
    if (error || !data?.signedUrl) throw new HttpError(404, "Private asset not found.");
    return NextResponse.redirect(data.signedUrl, { status: 307, headers: { "cache-control": "private, max-age=45" } });
  } catch (error) {
    return apiError(error);
  }
}
