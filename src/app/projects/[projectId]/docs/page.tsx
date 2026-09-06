import { documentArchitectureIR } from "@/lib/ai/provider";
import { loadProjectArchitecture } from "@/lib/supabase/projects";
import styles from "@/components/project/project.module.css";

export default async function ProjectDocsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const architecture = await loadProjectArchitecture(projectId);
  if (!architecture) return <main className={styles.section}><h1>Documentation unavailable</h1><p>The project could not be loaded or you do not have access.</p></main>;
  return <main className={styles.section}><header className={styles.sectionHeader}><div><span>IR version {architecture.irVersion} · Diagram version {architecture.diagram.version}</span><h1>Documentation</h1></div><span>Up to date</span></header><pre className={styles.doc}>{documentArchitectureIR(architecture.ir, architecture.irVersion, architecture.diagram.version)}</pre></main>;
}
