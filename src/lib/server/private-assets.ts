import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import { PRIVATE_ASSET_BUCKET, parsePrivateAssetReference } from "@/lib/storage/asset-references";
import { HttpError } from "./http";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyPrivatePresentationAssets(options: {
  admin: SupabaseClient | null;
  presentation: ArchitecturePresentation;
  workspaceId: string;
  diagramId: string;
}) {
  const images = options.presentation.primitives.filter((primitive) => primitive.kind === "image");
  if (!images.length) return;
  if (!options.admin) throw new HttpError(503, "Private asset verification is not configured.");
  if (images.length > 20) throw new HttpError(413, "A persisted diagram may contain at most 20 images.");
  let totalBytes = 0;
  for (const image of images) {
    const asset = parsePrivateAssetReference(image.style.src ?? "");
    if (!asset || asset.workspaceId !== options.workspaceId || asset.diagramId !== options.diagramId) {
      throw new HttpError(422, "A private image reference is outside this architecture.");
    }
    const verified = await options.admin.from("architecture_assets").select("id, byte_size")
      .eq("workspace_id", options.workspaceId).eq("diagram_id", options.diagramId).eq("checksum", asset.checksum).maybeSingle();
    if (verified.data && !verified.error) {
      totalBytes += Number(verified.data.byte_size);
      if (totalBytes > 25_000_000) throw new HttpError(413, "Private canvas images exceed persistence limits.");
      continue;
    }
    const { data, error } = await options.admin.storage.from(PRIVATE_ASSET_BUCKET).download(asset.path);
    if (error || !data) throw new HttpError(422, "A referenced private image was not uploaded.");
    totalBytes += data.size;
    if (data.size > 3_000_000 || totalBytes > 25_000_000) throw new HttpError(413, "Private canvas images exceed persistence limits.");
    const digest = await crypto.subtle.digest("SHA-256", await data.arrayBuffer());
    if (bytesToHex(new Uint8Array(digest)) !== asset.checksum) throw new HttpError(422, "A private image checksum did not match its reference.");
    const recorded = await options.admin.from("architecture_assets").upsert({
      workspace_id: options.workspaceId,
      diagram_id: options.diagramId,
      checksum: asset.checksum,
      storage_path: asset.path,
      byte_size: data.size,
      content_type: ({ png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml" } as Record<string, string>)[asset.extension],
    }, { onConflict: "workspace_id,diagram_id,checksum", ignoreDuplicates: true });
    if (recorded.error) throw new HttpError(500, "Private image verification could not be recorded.");
  }
}
