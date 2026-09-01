import { ArchitectureEditor } from "@/components/editor/architecture-editor";
import { getProjectFixture } from "@/lib/domain/project-fixture";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ArchitectureEditor initialDiagram={getProjectFixture(token)} readOnly />;
}
