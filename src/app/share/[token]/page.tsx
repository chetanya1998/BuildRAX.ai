import { ArchitectureEditor } from "@/components/editor/architecture-editor";
import { hashShareToken } from "@/lib/server/share-token";
import { loadSharedDiagram } from "@/lib/supabase/projects";
import { notFound } from "next/navigation";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const diagram = await loadSharedDiagram(hashShareToken(token));
  if (!diagram) notFound();
  return <ArchitectureEditor initialDiagram={diagram} readOnly />;
}
