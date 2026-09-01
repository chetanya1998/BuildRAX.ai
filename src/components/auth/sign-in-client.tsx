"use client";

import { ArrowLeft, Github, Mail } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./sign-in.module.css";

export function SignInClient() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  function callbackUrl() {
    const next = new URLSearchParams(location.search).get("next");
    const destination = next?.startsWith("/") ? next : "/dashboard";
    return `${location.origin}/auth/callback?next=${encodeURIComponent(destination)}`;
  }

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

  return <main className={styles.page}>
    <header className={styles.header}><Brand /><div><ThemeToggle /><ButtonLink href="/" variant="tertiary"><ArrowLeft size={15} /> Home</ButtonLink></div></header>
    <section className={styles.card} aria-labelledby="sign-in-title">
      <span>BUILD YOUR WORKSPACE</span>
      <h1 id="sign-in-title">Continue to BuildRAX</h1>
      <p>Sign in to save diagrams, keep versioned reviews and return to your projects.</p>
      <div className={styles.providers}><Button onClick={() => oauth("google")} variant="secondary">Continue with Google</Button><Button onClick={() => oauth("github")} variant="secondary"><Github size={15} /> Continue with GitHub</Button></div>
      <div className={styles.divider}><span />or use email<span /></div>
      <label><span>Email address</span><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" autoComplete="email" /></label>
      <Button onClick={magicLink}><Mail size={15} /> Email me a sign-in link</Button>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      <p className={styles.footnote}>Your first diagram remains available locally even if you do not sign in.</p>
    </section>
  </main>;
}
