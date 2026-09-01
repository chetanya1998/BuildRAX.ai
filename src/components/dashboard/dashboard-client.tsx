"use client";

import { ArrowRight, Github, LogIn, Mail, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { listDrafts, type DraftRecord } from "@/lib/storage/drafts";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./dashboard.module.css";

export function DashboardClient({ authenticated }: { authenticated: boolean }) {
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [authOpen, setAuthOpen] = useState(!authenticated);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState(authenticated ? "Your workspace is ready." : "Connect Supabase credentials to enable persistent projects. Local drafts remain available below.");
  useEffect(() => { listDrafts().then(setDrafts); }, []);

  async function oauth(provider: "google" | "github") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setNotice("Authentication is not configured yet. Add the Supabase variables from .env.example.");
    const migrate = new URLSearchParams(location.search).get("migrate");
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(migrate ? `/draft/${migrate}?migrate=1` : "/dashboard")}` } });
  }

  async function magicLink() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setNotice("Authentication is not configured yet. Add the Supabase variables from .env.example.");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setNotice(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return <div className={styles.page}><header className={styles.header}><Brand /><div className={styles.actions}><ThemeToggle />{!authenticated && <Button variant="secondary" onClick={() => setAuthOpen(true)}><LogIn size={15} /> Sign in</Button>}<ButtonLink href="/start"><Plus size={15} /> New diagram</ButtonLink></div></header><main className={styles.main}><div className={styles.headline}><div><span>Returning workspace</span><h1>Your architectures</h1></div><ButtonLink href="/templates" variant="secondary">Browse templates</ButtonLink></div><div className={styles.notice}>{notice}</div><section className={styles.grid}>{drafts.length ? drafts.map((draft) => <article className={styles.card} key={draft.id}><div><div className={styles.thumb} /><h2>{draft.diagram.title}</h2><p>Version {draft.diagram.version} · Updated {new Date(draft.updatedAt).toLocaleString()}</p></div><div className={styles.cardBottom}><span>{draft.diagram.nodes.length} components</span><ButtonLink href={`/draft/${draft.id}`} variant="secondary">Open <ArrowRight size={14} /></ButtonLink></div></article>) : <div className={styles.empty}><p>No local or saved projects yet.</p><ButtonLink href="/start">Create your first architecture</ButtonLink></div>}</section></main>{authOpen && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className={styles.modal}><button className={styles.close} onClick={() => setAuthOpen(false)} aria-label="Close"><X size={16} /></button><h2 id="auth-title">Continue to BuildRAX</h2><p>Sign in only when you want persistent projects, sharing, or another diagram.</p><button className={styles.provider} onClick={() => oauth("google")}>Continue with Google</button><button className={styles.provider} onClick={() => oauth("github")}><Github size={15} /> Continue with GitHub</button><div className={styles.email}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" aria-label="Email address" /><Button onClick={magicLink}><Mail size={14} /> Email link</Button></div></div></div>}</div>;
}
