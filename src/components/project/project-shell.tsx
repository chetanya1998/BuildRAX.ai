import { FileText, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "./project.module.css";

export function ProjectShell({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const base = `/projects/${projectId}`;
  return <div className={styles.layout}><aside className={styles.sidebar}><Brand /><div className={styles.projectName}>Project workspace</div><nav className={styles.nav} aria-label="Project"><a href={`${base}/canvas`}><LayoutDashboard size={16} /> Canvas</a><a href={`${base}/docs`}><FileText size={16} /> Documentation</a><a href={`${base}/review`}><ShieldCheck size={16} /> Review</a><a href={`${base}/settings`}><Settings size={16} /> Settings</a></nav><div className={styles.sidebarBottom}><ThemeToggle /><span>Version-aware workspace</span></div></aside><div className={styles.content}>{children}</div></div>;
}
