import { reviewDiagram } from "@/lib/ai/provider";
import { getProjectFixture } from "@/lib/domain/project-fixture";
import styles from "@/components/project/project.module.css";

export default async function ProjectReviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params; const diagram = getProjectFixture(projectId); const findings = reviewDiagram(diagram);
  return <main className={styles.section}><header className={styles.sectionHeader}><div><span>Advisory · Diagram version {diagram.version}</span><h1>Architecture review</h1></div><span>{findings.length} open findings</span></header>{findings.map((finding) => <article className={styles.finding} key={finding.id}><div className={styles.findingTop}><span>{finding.lens}</span><span>{finding.severity}</span></div><p>{finding.rationale}</p><strong>{finding.recommendation}</strong></article>)}</main>;
}
