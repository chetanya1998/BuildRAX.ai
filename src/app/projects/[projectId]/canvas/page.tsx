import { ArchitectureEditor } from "@/components/editor/architecture-editor";
import { getProjectFixture } from "@/lib/domain/project-fixture";

export default async function ProjectCanvasPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ArchitectureEditor initialDiagram={getProjectFixture(projectId)} persisted />;
}
