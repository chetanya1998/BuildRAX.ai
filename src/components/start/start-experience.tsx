"use client";

import { ArrowRight, LayoutTemplate, PencilRuler } from "lucide-react";
import { ArrowBendRightDown } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createDiagram } from "@/lib/domain/factory";
import type { ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { GenerationReceipt } from "@/lib/server/generation-receipt";
import { getTemplate, templates } from "@/lib/domain/templates";
import { saveDraft } from "@/lib/storage/drafts";
import { useHydrated } from "@/lib/ui/use-hydrated";
import styles from "./start.module.css";

const preferenceOptions = ["Next.js", "Supabase", "AWS", "GCP", "Azure", "High scale", "Multi-tenant", "Sensitive data"];
const anonymousSessionStorageKey = "buildrax-anonymous-session";

function anonymousSessionId() {
  const existing = localStorage.getItem(anonymousSessionStorageKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(anonymousSessionStorageKey, created);
  return created;
}

export function StartExperience({ initialTemplate }: { initialTemplate?: string }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate ?? "");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "generating" | "error">("idle");
  const [message, setMessage] = useState("");
  const hydrated = useHydrated();
  const selected = useMemo(() => getTemplate(selectedTemplate), [selectedTemplate]);

  function togglePreference(value: string) {
    setPreferences((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function openDiagram(diagram: ReturnType<typeof createDiagram>, sourcePrompt?: string, artifact?: {
    ir: ArchitectureIR;
    presentation: ArchitecturePresentation;
    checksums?: { ir: string; presentation: string; diagram: string };
    generationReceipt?: GenerationReceipt;
  }) {
    const draftId = diagram.id;
    await saveDraft({
      id: draftId,
      diagram,
      architecture: artifact ? {
        ir: artifact.ir,
        presentation: artifact.presentation,
        irVersion: 1,
        checksums: artifact.checksums,
        generationReceipt: artifact.generationReceipt,
      } : undefined,
      prompt: sourcePrompt,
      status: "ready",
      createdAt: diagram.createdAt,
      updatedAt: diagram.updatedAt,
    });
    sessionStorage.setItem("buildrax-active-draft", draftId);
    router.push(`/draft/${draftId}`);
  }

  async function generate() {
    if (prompt.trim().length < 12 && !selected) {
      setState("error");
      setMessage("Describe the system in at least 12 characters or choose a template.");
      return;
    }
    setState("generating");
    setMessage("Understanding the system and validating component boundaries…");
    try {
      const basePrompt = prompt.trim() || selected!.description;
      const response = await fetch("/api/v1/ai/generations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-buildrax-guest": "true",
          "x-buildrax-anonymous-session": anonymousSessionId(),
        },
        body: JSON.stringify({ prompt: basePrompt, preferredStack: preferences.join(", ") || undefined, templateId: selected?.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Generation failed.");
      setMessage("Laying out validated components and typed connections…");
      await openDiagram(body.artifact.diagram, basePrompt, {
        ir: body.artifact.ir,
        presentation: body.artifact.presentation,
        checksums: body.artifact.checksums,
        generationReceipt: body.artifact.generationReceipt,
      });
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not generate the diagram.");
    }
  }

  async function blankCanvas() {
    await openDiagram(createDiagram("Untitled architecture"));
  }

  return <div className={styles.page}>
    <header className={styles.header}><Brand /><div className={styles.headerActions}><ButtonLink href="/templates" variant="secondary"><LayoutTemplate size={15} /> Templates</ButtonLink><ThemeToggle /></div></header>
    <main className={styles.main}>
      <section className={styles.intro}><span className={styles.kicker}>Start with the system you can explain</span><h1>Turn your product idea into a clear architecture.</h1><p>Tell BuildRAX what you are building. Add the stack, scale and constraints that matter, then refine every choice on the canvas.</p></section>
      <div className={styles.composer}>
        <label className="sr-only" htmlFor="architecture-prompt">Architecture prompt</label>
        <textarea id="architecture-prompt" maxLength={3000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="A multi-tenant AI support platform using Next.js, FastAPI, PostgreSQL, Redis and OpenAI…" />
        <div className={styles.composerFooter}><span className={styles.count}>{prompt.length.toLocaleString()} / 3,000</span><div><Button variant="tertiary" onClick={blankCanvas} disabled={!hydrated}><PencilRuler size={15} /> Blank canvas</Button> <Button onClick={generate} disabled={!hydrated || state === "generating"}>Generate architecture <ArrowRight size={15} /></Button></div></div>
      </div>
      <span className={`${styles.handNote} ${styles.promptNote}`}>add context for a sharper first draft <ArrowBendRightDown size={29} weight="light" /></span>
      <div className={styles.chips} aria-label="Architecture preferences">{preferenceOptions.map((item) => <button key={item} className={`${styles.chip} ${preferences.includes(item) ? styles.chipActive : ""}`} onClick={() => togglePreference(item)} aria-pressed={preferences.includes(item)}>{item}</button>)}</div>
      {state !== "idle" && <div className={`${styles.status} ${state === "error" ? styles.error : ""}`} role="status">{state === "generating" && <span className={styles.spinner} />}{message}</div>}
      <div className={styles.divider}>or begin from a trusted template</div>
      <span className={`${styles.handNote} ${styles.templateNote}`}>pick a validated starting point <ArrowBendRightDown size={29} weight="light" /></span>
      <div className={styles.templateGrid}>{templates.map((item) => <button className={`${styles.template} ${selectedTemplate === item.id ? styles.templateSelected : ""}`} key={item.id} onClick={() => setSelectedTemplate(selectedTemplate === item.id ? "" : item.id)} aria-pressed={selectedTemplate === item.id}><small>{item.category}</small><strong>{item.name}</strong><p>{item.description}</p><span>{item.diagram.nodes.length} components · {item.diagram.connectors.length} typed flows</span></button>)}</div>
    </main>
  </div>;
}
