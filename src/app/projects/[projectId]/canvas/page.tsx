import { ArchitectureEditor } from "@/components/editor/architecture-editor";
import { loadProjectDiagram } from "@/lib/supabase/projects";
import { notFound } from "next/navigation";

export default async function ProjectCanvasPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const diagram = await loadProjectDiagram(projectId);
  if (!diagram) notFound();
  return <ArchitectureEditor initialDiagram={diagram} persisted projectId={projectId} />;
}
