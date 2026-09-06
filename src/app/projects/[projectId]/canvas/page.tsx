import { ArchitectureEditor } from "@/components/editor/architecture-editor";
import { loadProjectArchitecture } from "@/lib/supabase/projects";
import { notFound } from "next/navigation";

export default async function ProjectCanvasPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const architecture = await loadProjectArchitecture(projectId);
  if (!architecture) notFound();
  return <ArchitectureEditor initialDiagram={architecture.diagram} initialIR={architecture.ir} initialIrVersion={architecture.irVersion} persisted projectId={projectId} />;
}
