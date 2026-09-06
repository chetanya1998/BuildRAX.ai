import { ArchitectureEditor } from "@/components/editor/architecture-editor";
import { hashShareToken } from "@/lib/server/share-token";
import { loadSharedDiagram } from "@/lib/supabase/projects";
import { notFound } from "next/navigation";
import { privateAssetRenderUrl } from "@/lib/storage/asset-references";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const diagram = await loadSharedDiagram(hashShareToken(token));
  if (!diagram) notFound();
  const sharedDiagram = {
    ...diagram,
    primitives: diagram.primitives.map((primitive) => primitive.kind === "image"
      ? { ...primitive, style: { ...primitive.style, src: privateAssetRenderUrl(primitive.style.src ?? "", token) } }
      : primitive),
  };
  return <ArchitectureEditor initialDiagram={sharedDiagram} readOnly />;
}
