import { reviewArchitectureIR } from "@/lib/ai/provider";
import { loadProjectArchitecture } from "@/lib/supabase/projects";
import styles from "@/components/project/project.module.css";

export default async function ProjectReviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const architecture = await loadProjectArchitecture(projectId);
  if (!architecture) return <main className={styles.section}><h1>Architecture review unavailable</h1><p>The project could not be loaded or you do not have access.</p></main>;
  const findings = reviewArchitectureIR(architecture.ir, architecture.diagram.version);
  return <main className={styles.section}><header className={styles.sectionHeader}><div><span>Advisory · IR version {architecture.irVersion} · Diagram version {architecture.diagram.version}</span><h1>Architecture review</h1></div><span>{findings.length} open findings</span></header>{findings.map((finding) => <article className={styles.finding} key={finding.id}><div className={styles.findingTop}><span>{finding.lens}</span><span>{finding.severity}</span></div><p>{finding.rationale}</p><strong>{finding.recommendation}</strong></article>)}</main>;
}
