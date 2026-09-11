"use client";

import { Archive, ArrowRight, Check, LogIn, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { listDrafts, type DraftRecord } from "@/lib/storage/drafts";
import styles from "./dashboard.module.css";

type PersistedProjectSummary = { id: string; name: string; description: string; updatedAt: string; diagramCount: number };
type ArchiveNotification = { id: string; kind: string; diagram_id: string | null; diagram_version: number | null; message: string; read_at: string | null; created_at: string };

export function DashboardClient({ authenticated, projects, notifications: initialNotifications }: { authenticated: boolean; projects: PersistedProjectSummary[]; notifications: ArchiveNotification[] }) {
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [notice, setNotice] = useState(authenticated ? "Your workspace is ready." : "Sign in to open saved projects. Local drafts remain available below.");
  const [notifications, setNotifications] = useState(initialNotifications);
  useEffect(() => { listDrafts().then(setDrafts).catch(() => setNotice("Local drafts could not be read. Browser storage may be blocked; your drafts have not been deleted.")); }, []);

  async function markNotificationRead(id: string) {
    const response = await fetch(`/api/v1/notifications/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ read: true }) });
    if (response.ok) setNotifications((current) => current.filter((item) => item.id !== id));
    else setNotice("The notification could not be dismissed. Please retry.");
  }

  return <div className={styles.page}>
    <header className={styles.header}><Brand /><div className={styles.actions}><ThemeToggle />{!authenticated && <ButtonLink href="/sign-in?next=%2Fdashboard" variant="secondary"><LogIn size={15} /> Sign in</ButtonLink>}<ButtonLink href="/start"><Plus size={15} /> New diagram</ButtonLink></div></header>
    <main className={styles.main}>
      <div className={styles.headline}><div><span>Returning workspace</span><h1>Your architectures</h1></div><ButtonLink href="/templates" variant="secondary">Browse templates</ButtonLink></div>
      <div className={styles.notice}>{notice}</div>
      {notifications.length > 0 && <section className={styles.notificationStack} aria-label="Architecture history notifications">{notifications.map((notification) => <article className={styles.archiveNotice} key={notification.id}><span className={styles.archiveIcon}><Archive size={16} /></span><div><strong>Version history remains available</strong><p>{notification.message}{notification.diagram_version ? ` Version ${notification.diagram_version}.` : ""}</p><small>{new Date(notification.created_at).toLocaleString()}</small></div><button onClick={() => void markNotificationRead(notification.id)} aria-label="Mark archive notice as read" title="Mark as read"><Check size={15} /></button></article>)}</section>}
      {authenticated && <ProjectSection id="saved-projects" heading="Saved projects" meta={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`} projects={projects} />}
      <section aria-labelledby="local-drafts"><div className={styles.sectionHeading}><h2 id="local-drafts">Local drafts</h2><span>Stored in this browser</span></div><div className={styles.grid}>{drafts.length ? drafts.map((draft) => <article className={styles.card} key={draft.id}><div><div className={styles.thumb} /><h2>{draft.diagram.title}</h2><p>Version {draft.diagram.version} · Updated {new Date(draft.updatedAt).toLocaleString()}</p></div><div className={styles.cardBottom}><span>{draft.diagram.nodes.length} components</span><ButtonLink href={`/draft/${draft.id}`} variant="secondary">Open <ArrowRight size={14} /></ButtonLink></div></article>) : <EmptyState text="No local drafts in this browser." />}</div></section>
    </main>
  </div>;
}

function ProjectSection({ id, heading, meta, projects }: { id: string; heading: string; meta: string; projects: PersistedProjectSummary[] }) {
  return <section aria-labelledby={id}><div className={styles.sectionHeading}><h2 id={id}>{heading}</h2><span>{meta}</span></div><div className={styles.grid}>{projects.length ? projects.map((project) => <article className={styles.card} key={project.id}><div><div className={styles.thumb} /><h2>{project.name}</h2><p>{project.description || "Versioned architecture workspace"}</p><p>Updated {new Date(project.updatedAt).toLocaleString()}</p></div><div className={styles.cardBottom}><span>{project.diagramCount} {project.diagramCount === 1 ? "diagram" : "diagrams"}</span><ButtonLink href={`/projects/${project.id}/canvas`} variant="secondary">Open <ArrowRight size={14} /></ButtonLink></div></article>) : <EmptyState text="No saved projects yet." />}</div></section>;
}

function EmptyState({ text }: { text: string }) {
  return <div className={styles.empty}><p>{text}</p><ButtonLink href="/start">Create an architecture</ButtonLink></div>;
}
