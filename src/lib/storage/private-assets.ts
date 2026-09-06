"use client";

import { architecturePresentationSchema, type ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PRIVATE_ASSET_BUCKET, parsePrivateAssetReference } from "./asset-references";

type UploadTarget = { diagramId: string; guestDraftId?: never } | { guestDraftId: string; diagramId?: never };

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function uploadDataUrl(target: UploadTarget, dataUrl: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (!allowedImageTypes.has(blob.type)) throw new Error("This image format cannot be persisted.");
  if (blob.size > 10_000_000) throw new Error("Persisted images must be 10 MB or smaller.");
  const checksum = bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())));
  const grantResponse = await fetch("/api/v1/assets/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...target, contentType: blob.type, byteSize: blob.size, checksum }),
  });
  const grant = await grantResponse.json() as { error?: string; path?: string; token?: string; reference?: string };
  if (!grantResponse.ok || !grant.path || !grant.token || !grant.reference) {
    throw new Error(grant.error ?? "A private image upload could not be prepared.");
  }
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Private image storage is not configured.");
  const upload = await supabase.storage.from(PRIVATE_ASSET_BUCKET).uploadToSignedUrl(grant.path, grant.token, blob, {
    contentType: blob.type,
  });
  if (upload.error) throw new Error("The private image upload did not complete.");
  return grant.reference;
}

export async function persistPrivatePresentationImages(target: UploadTarget, input: ArchitecturePresentation) {
  const presentation = architecturePresentationSchema.parse(input);
  const imagePrimitives = presentation.primitives.filter((primitive) => primitive.kind === "image");
  if (imagePrimitives.length > 20) throw new Error("A persisted diagram may contain at most 20 images.");
  const replacements = new Map<string, string>();
  let totalBytes = 0;
  for (const primitive of imagePrimitives) {
    const source = primitive.style.src ?? "";
    if (parsePrivateAssetReference(source)) continue;
    if (!source.startsWith("data:image/")) throw new Error("An image has an unsupported source.");
    const estimatedBytes = Math.ceil((source.length * 3) / 4);
    totalBytes += estimatedBytes;
    if (totalBytes > 25_000_000) throw new Error("Canvas images exceed the 25 MB persistence limit.");
    replacements.set(primitive.id, await uploadDataUrl(target, source));
  }
  if (!replacements.size) return presentation;
  return architecturePresentationSchema.parse({
    ...presentation,
    primitives: presentation.primitives.map((primitive) => replacements.has(primitive.id)
      ? { ...primitive, style: { ...primitive.style, src: replacements.get(primitive.id)! } }
      : primitive),
  });
}
