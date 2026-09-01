import { documentDiagram } from "@/lib/ai/provider";
import { getProjectFixture } from "@/lib/domain/project-fixture";
import styles from "@/components/project/project.module.css";

export default async function ProjectDocsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params; const diagram = getProjectFixture(projectId);
  return <main className={styles.section}><header className={styles.sectionHeader}><div><span>Diagram version {diagram.version}</span><h1>Documentation</h1></div><span>Up to date</span></header><pre className={styles.doc}>{documentDiagram(diagram)}</pre></main>;
}
