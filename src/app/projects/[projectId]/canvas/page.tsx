import { ArchitectureEditor } from "@/components/editor/architecture-editor";
import { listPersistedProjects, loadProjectArchitecture } from "@/lib/supabase/projects";
import { notFound } from "next/navigation";

export default async function ProjectCanvasPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [architecture, projects] = await Promise.all([loadProjectArchitecture(projectId), listPersistedProjects()]);
  if (!architecture) notFound();
  return <ArchitectureEditor initialDiagram={architecture.diagram} initialIR={architecture.ir} initialIrVersion={architecture.irVersion} initialDocument={architecture.document} initialDocumentVersion={architecture.documentVersion} initialDocumentSource={architecture.documentSource} recoveryScope={architecture.recoveryScope} persisted projectId={projectId} projectOptions={projects.map(({ id, name }) => ({ id, name }))} />;
}
