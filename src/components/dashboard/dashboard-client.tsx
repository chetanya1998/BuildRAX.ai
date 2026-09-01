"use client";

import { ArrowRight, Github, LogIn, Mail, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { listDrafts, type DraftRecord } from "@/lib/storage/drafts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./dashboard.module.css";

type PersistedProjectSummary = { id: string; name: string; description: string; updatedAt: string; diagramCount: number };

export function DashboardClient({ authenticated, projects }: { authenticated: boolean; projects: PersistedProjectSummary[] }) {
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [authOpen, setAuthOpen] = useState(!authenticated);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState(authenticated ? "Your workspace is ready." : "Connect Supabase credentials to enable persistent projects. Local drafts remain available below.");
  useEffect(() => { listDrafts().then(setDrafts); }, []);

  async function oauth(provider: "google" | "github") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setNotice("Authentication is not configured yet. Add the Supabase variables from .env.example.");
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl() } });
    if (error) setNotice(error.message);
  }

  async function magicLink() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setNotice("Authentication is not configured yet. Add the Supabase variables from .env.example.");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl() } });
    setNotice(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return <div className={styles.page}><header className={styles.header}><Brand /><div className={styles.actions}><ThemeToggle />{!authenticated && <Button variant="secondary" onClick={() => setAuthOpen(true)}><LogIn size={15} /> Sign in</Button>}<ButtonLink href="/start"><Plus size={15} /> New diagram</ButtonLink></div></header><main className={styles.main}><div className={styles.headline}><div><span>Returning workspace</span><h1>Your architectures</h1></div><ButtonLink href="/templates" variant="secondary">Browse templates</ButtonLink></div><div className={styles.notice}>{notice}</div>{authenticated && <ProjectSection id="saved-projects" heading="Saved projects" meta={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`} projects={projects} />}<section aria-labelledby="local-drafts"><div className={styles.sectionHeading}><h2 id="local-drafts">Local drafts</h2><span>Stored in this browser</span></div><div className={styles.grid}>{drafts.length ? drafts.map((draft) => <article className={styles.card} key={draft.id}><div><div className={styles.thumb} /><h2>{draft.diagram.title}</h2><p>Version {draft.diagram.version} · Updated {new Date(draft.updatedAt).toLocaleString()}</p></div><div className={styles.cardBottom}><span>{draft.diagram.nodes.length} components</span><ButtonLink href={`/draft/${draft.id}`} variant="secondary">Open <ArrowRight size={14} /></ButtonLink></div></article>) : <EmptyState text="No local drafts in this browser." />}</div></section></main>{authOpen && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className={styles.modal}><button className={styles.close} onClick={() => setAuthOpen(false)} aria-label="Close"><X size={16} /></button><h2 id="auth-title">Continue to BuildRAX</h2><p>Sign in only when you want persistent projects, sharing, or another diagram.</p><button className={styles.provider} onClick={() => void oauth("google")}>Continue with Google</button><button className={styles.provider} onClick={() => void oauth("github")}><Github size={15} /> Continue with GitHub</button><div className={styles.email}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" aria-label="Email address" /><Button onClick={() => void magicLink()}><Mail size={14} /> Email link</Button></div></div></div>}</div>;
}

function ProjectSection({ id, heading, meta, projects }: { id: string; heading: string; meta: string; projects: PersistedProjectSummary[] }) {
  return <section aria-labelledby={id}><div className={styles.sectionHeading}><h2 id={id}>{heading}</h2><span>{meta}</span></div><div className={styles.grid}>{projects.length ? projects.map((project) => <article className={styles.card} key={project.id}><div><div className={styles.thumb} /><h2>{project.name}</h2><p>{project.description || "Versioned architecture workspace"}</p><p>Updated {new Date(project.updatedAt).toLocaleString()}</p></div><div className={styles.cardBottom}><span>{project.diagramCount} {project.diagramCount === 1 ? "diagram" : "diagrams"}</span><ButtonLink href={`/projects/${project.id}/canvas`} variant="secondary">Open <ArrowRight size={14} /></ButtonLink></div></article>) : <EmptyState text="No saved projects yet." />}</div></section>;
}

function EmptyState({ text }: { text: string }) {
  return <div className={styles.empty}><p>{text}</p><ButtonLink href="/start">Create an architecture</ButtonLink></div>;
}

function callbackUrl() {
  const migrate = new URLSearchParams(location.search).get("migrate");
  const next = migrate ? `/draft/${migrate}?migrate=1` : "/dashboard";
  return `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
