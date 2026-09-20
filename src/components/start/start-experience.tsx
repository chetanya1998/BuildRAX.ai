"use client";

import { ArrowRight, LayoutTemplate, PencilRuler } from "lucide-react";
import { ArrowBendRightDown } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createDiagram } from "@/lib/domain/factory";
import { architectureIRFromDiagram, presentationFromDiagram, type ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { GenerationReceipt } from "@/lib/server/generation-receipt";
import { getTemplate, templates } from "@/lib/domain/templates";
import type { GenerationRequest } from "@/lib/domain/schema";
import type { TraceabilityBundle } from "@/lib/intelligence/schema";
import { saveDraft } from "@/lib/storage/drafts";
import { useHydrated } from "@/lib/ui/use-hydrated";
import styles from "./start.module.css";

const guestTokenStorageKey = "buildrax-signed-guest-session";

const fieldLabels: Record<string, string> = {
  prompt: "Architecture description",
  productType: "Product type",
  preferredStack: "Preferred stack",
  cloudProvider: "Cloud provider",
  scale: "Scale",
  tenancy: "Tenancy",
  dataSensitivity: "Data sensitivity",
  templateId: "Template",
};

function generationErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") return "Generation failed.";
  const response = body as { error?: string; stage?: string; fieldErrors?: Record<string, string[]> };
  const firstFieldError = Object.entries(response.fieldErrors ?? {}).find(([, messages]) => messages.length > 0);
  if (firstFieldError) return `${fieldLabels[firstFieldError[0]] ?? firstFieldError[0]}: ${firstFieldError[1][0]}`;
  const stage = response.stage ? `${response.stage.replaceAll("-", " ")}: ` : "";
  return `${stage}${response.error || "Generation failed."}`;
}

type CompletedGeneration = {
  artifact: { ir: ArchitectureIR; presentation: ArchitecturePresentation; traceability?: TraceabilityBundle; diagram: ReturnType<typeof createDiagram>; checksums?: { ir: string; presentation: string; diagram: string; evidence?: string; requirements?: string }; generationReceipt?: GenerationReceipt };
  summary: { facts: string[]; assumptions: string[]; unknowns: string[] };
  sourcePrompt: string;
};

const stageMessages: Record<string, string> = {
  accepted: "Queued for bounded generation…",
  evidence: "Captured source evidence…",
  requirements: "Normalized requirements and unknowns…",
  context: "Prepared the task context within budget…",
  rules: "Evaluated reusable patterns and proposal-only rules…",
  synthesis: "Synthesized the semantic architecture…",
  validation: "Validated components, flows, and constraints…",
  layout: "Compiled the visual layout…",
  published: "The architecture is ready to inspect.",
};

export function StartExperience({ initialTemplate, authenticated = false }: { initialTemplate?: string; authenticated?: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate ?? "");
  const [productType, setProductType] = useState("");
  const [preferredStack, setPreferredStack] = useState("");
  const [cloudProvider, setCloudProvider] = useState("");
  const [scale, setScale] = useState("");
  const [tenancy, setTenancy] = useState<GenerationRequest["tenancy"] | "">("");
  const [dataSensitivity, setDataSensitivity] = useState<GenerationRequest["dataSensitivity"] | "">("");
  const [state, setState] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [completedGeneration, setCompletedGeneration] = useState<CompletedGeneration | null>(null);
  const guestToken = useRef<string | null>(null);
  const hydrated = useHydrated();
  const selected = useMemo(() => getTemplate(selectedTemplate), [selectedTemplate]);

  async function generationHeaders() {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (authenticated) return headers;
    let token = guestToken.current;
    if (!token) {
      try { token = sessionStorage.getItem(guestTokenStorageKey); } catch { /* Use a fresh signed session. */ }
    }
    if (!token) {
      const response = await fetch("/api/v1/guest-session", { method: "POST" });
      const body = await response.json();
      if (!response.ok || !body.token) throw new Error(body.error || "A secure guest session could not be created.");
      const issuedToken = String(body.token);
      token = issuedToken;
      try { sessionStorage.setItem(guestTokenStorageKey, issuedToken); } catch { /* In-memory token remains usable. */ }
    }
    if (!token) throw new Error("A secure guest session could not be created.");
    guestToken.current = token;
    headers["x-buildrax-guest-token"] = token;
    return headers;
  }

  async function openDiagram(diagram: ReturnType<typeof createDiagram>, sourcePrompt?: string, artifact?: {
    ir: ArchitectureIR;
    presentation: ArchitecturePresentation;
    traceability?: TraceabilityBundle;
    checksums?: { ir: string; presentation: string; diagram: string; evidence?: string; requirements?: string };
    generationReceipt?: GenerationReceipt;
  }) {
    const resolvedArtifact = artifact ?? {
      ir: architectureIRFromDiagram(diagram),
      presentation: presentationFromDiagram(diagram),
    };
    if (authenticated) {
      setMessage("Saving a new project to your workspace…");
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // The diagram ID is already a UUID and remains stable if this exact
          // creation request is replayed after an uncertain network response.
          idempotencyKey: diagram.id,
          artifact: { ir: resolvedArtifact.ir, presentation: resolvedArtifact.presentation, traceability: resolvedArtifact.traceability, diagram },
          generationReceipt: resolvedArtifact.generationReceipt,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.project?.projectId) throw new Error(body.error || "The project could not be saved.");
      router.push(`/projects/${body.project.projectId}/canvas`);
      return;
    }
    const draftId = diagram.id;
    await saveDraft({
      id: draftId,
      diagram,
      architecture: {
        ir: resolvedArtifact.ir,
        presentation: resolvedArtifact.presentation,
        irVersion: 1,
        traceability: resolvedArtifact.traceability,
        checksums: resolvedArtifact.checksums,
        generationReceipt: resolvedArtifact.generationReceipt,
      },
      prompt: sourcePrompt,
      status: "ready",
      createdAt: diagram.createdAt,
      updatedAt: diagram.updatedAt,
    });
    try { sessionStorage.setItem("buildrax-active-draft", draftId); } catch { /* The IndexedDB draft is already committed. */ }
    router.push(`/draft/${draftId}`);
  }

  async function generate() {
    if (prompt.trim().length < 12 && !selected) {
      setState("error");
      setMessage("Describe the system in at least 12 characters or choose a template.");
      return;
    }
    setState("generating");
    setCompletedGeneration(null);
    setMessage(stageMessages.accepted);
    try {
      const basePrompt = prompt.trim().length ? prompt : selected!.description;
      const headers = await generationHeaders();
      const architectureRequest = {
        prompt: basePrompt,
        productType: productType.trim() || undefined,
        preferredStack: preferredStack.trim() || undefined,
        cloudProvider: cloudProvider || undefined,
        scale: scale || undefined,
        tenancy: tenancy || undefined,
        dataSensitivity: dataSensitivity || undefined,
        templateId: selected?.id,
      } satisfies GenerationRequest;
      const response = await fetch("/api/v1/generation-jobs", {
        method: "POST",
        headers,
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          request: architectureRequest,
          mode: selected ? "deterministic" : "auto",
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(generationErrorMessage(body));
      const jobId = body.job?.id;
      if (!jobId) throw new Error("Generation did not return a durable job ID.");
      setActiveJobId(jobId);
      void fetch(`/api/v1/generation-jobs/${jobId}/run`, { method: "POST", headers });

      let completed;
      for (let poll = 0; poll < 240; poll += 1) {
        const statusResponse = await fetch(`/api/v1/generation-jobs/${jobId}`, { headers });
        const statusBody = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(statusBody.error || "Generation status is unavailable.");
        const job = statusBody.job;
        setMessage(`${stageMessages[job.stage] ?? "Generating architecture…"} ${job.progress}%`);
        if (job.status === "completed") { completed = job.result; break; }
        if (job.status === "failed") throw new Error(job.error?.message || "Generation failed at a recoverable stage.");
        if (job.status === "cancelled") throw new Error("Generation was cancelled. Completed checkpoints were retained.");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!completed?.artifact) throw new Error("Generation is still queued. Retry shortly; completed checkpoints are retained.");
      setCompletedGeneration({ ...completed, sourcePrompt: basePrompt });
      setState("ready");
      setMessage(stageMessages.published);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not generate the diagram.");
    }
  }

  async function cancelGeneration() {
    if (!activeJobId) return;
    try {
      const headers = await generationHeaders();
      await fetch(`/api/v1/generation-jobs/${activeJobId}/cancel`, { method: "POST", headers });
      setState("error");
      setMessage("Generation was cancelled. Completed checkpoints were retained for retry.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Cancellation could not be recorded."); }
  }

  async function retryGeneration() {
    if (!activeJobId) return generate();
    setState("generating");
    setMessage("Retrying from the last valid checkpoint…");
    try {
      const headers = await generationHeaders();
      const retry = await fetch(`/api/v1/generation-jobs/${activeJobId}/retry`, { method: "POST", headers });
      if (!retry.ok) throw new Error((await retry.json()).error || "Generation could not be retried.");
      void fetch(`/api/v1/generation-jobs/${activeJobId}/run`, { method: "POST", headers });
      for (let poll = 0; poll < 240; poll += 1) {
        const statusResponse = await fetch(`/api/v1/generation-jobs/${activeJobId}`, { headers });
        const statusBody = await statusResponse.json();
        const job = statusBody.job;
        if (!statusResponse.ok) throw new Error(statusBody.error || "Generation status is unavailable.");
        setMessage(`${stageMessages[job.stage] ?? "Generating architecture…"} ${job.progress}%`);
        if (job.status === "completed") {
          setCompletedGeneration({ ...job.result, sourcePrompt: prompt.trim() || selected?.description || "Architecture request" });
          setState("ready");
          setMessage(stageMessages.published);
          return;
        }
        if (job.status === "failed") throw new Error(job.error?.message || "Generation retry failed.");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      throw new Error("Generation remains queued; try again shortly.");
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Generation retry failed."); }
  }

  async function openCompletedGeneration() {
    if (!completedGeneration) return;
    const { artifact, sourcePrompt } = completedGeneration;
    await openDiagram(artifact.diagram, sourcePrompt, artifact);
  }

  async function blankCanvas() {
    try { await openDiagram(createDiagram("Untitled architecture")); }
    catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : authenticated ? "The workspace project could not be created." : "Browser storage is unavailable or full. A new draft could not be saved."); }
  }

  return <div className={styles.page}>
    <header className={styles.header}><Brand /><div className={styles.headerActions}><ButtonLink href="/templates" variant="secondary"><LayoutTemplate size={15} /> Templates</ButtonLink><ThemeToggle /></div></header>
    <main className={styles.main}>
      <section className={styles.intro}><span className={styles.kicker}>Start with the system you can explain</span><h1>Turn your product idea into a clear architecture.</h1><p>Tell BuildRAX what you are building. Add the stack, scale and constraints that matter, then refine every choice on the canvas.</p></section>
      <div className={styles.composer}>
        <label className="sr-only" htmlFor="architecture-prompt">Architecture prompt</label>
        <textarea id="architecture-prompt" maxLength={3000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="A multi-tenant AI support platform using Next.js, FastAPI, PostgreSQL, Redis and OpenAI…" />
        <div className={styles.composerFooter}><span className={styles.count}>{prompt.length.toLocaleString()} / 3,000</span><div><Button variant="tertiary" onClick={blankCanvas} disabled={!hydrated || state === "generating"}><PencilRuler size={15} /> Blank canvas</Button> {state === "generating" ? <Button onClick={cancelGeneration}>Cancel generation</Button> : state === "error" && activeJobId ? <Button onClick={retryGeneration}>Retry generation <ArrowRight size={15} /></Button> : <Button onClick={generate} disabled={!hydrated}>Generate architecture <ArrowRight size={15} /></Button>}</div></div>
      </div>
      <span className={`${styles.handNote} ${styles.promptNote}`}>add context for a sharper first draft <ArrowBendRightDown size={29} weight="light" /></span>
      <fieldset className={styles.contextPanel}>
        <legend>Optional architecture context</legend>
        <p>Leave a field unspecified when it is unknown. BuildRAX will not silently turn an unknown into a requirement.</p>
        <div className={styles.contextGrid}>
          <label>Product type<input value={productType} maxLength={80} onChange={(event) => setProductType(event.target.value)} placeholder="URL shortener" /></label>
          <label>Preferred stack<input value={preferredStack} maxLength={180} onChange={(event) => setPreferredStack(event.target.value)} placeholder="Next.js, PostgreSQL, Redis" /></label>
          <label>Cloud provider<select value={cloudProvider} onChange={(event) => setCloudProvider(event.target.value)}><option value="">Not specified</option><option value="AWS">AWS</option><option value="GCP">GCP</option><option value="Azure">Azure</option><option value="Provider-neutral">Provider-neutral</option></select></label>
          <label>Expected scale<select value={scale} onChange={(event) => setScale(event.target.value)}><option value="">Not specified</option><option value="prototype">Prototype / pilot</option><option value="small">Small</option><option value="medium">Medium / growth</option><option value="large">Large / global</option></select></label>
          <label>Tenancy<select value={tenancy} onChange={(event) => setTenancy(event.target.value as GenerationRequest["tenancy"] | "")}><option value="">Not specified</option><option value="single-tenant">Single-tenant</option><option value="multi-tenant">Multi-tenant</option></select></label>
          <label>Data sensitivity<select value={dataSensitivity} onChange={(event) => setDataSensitivity(event.target.value as GenerationRequest["dataSensitivity"] | "")}><option value="">Not specified</option><option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="restricted">Restricted</option></select></label>
        </div>
      </fieldset>
      {state !== "idle" && <div className={`${styles.status} ${state === "error" ? styles.error : ""}`} role="status">{state === "generating" && <span className={styles.spinner} />}{message}</div>}
      {completedGeneration && <section className={styles.firstResult} aria-labelledby="first-result-title">
        <div><span className={styles.kicker}>Explainable first result</span><h2 id="first-result-title">Review what shaped this architecture</h2></div>
        <div className={styles.resultColumns}>
          <div><strong>Facts</strong><ul>{completedGeneration.summary.facts.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><strong>Assumptions</strong><ul>{completedGeneration.summary.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><strong>Unknowns</strong><ul>{completedGeneration.summary.unknowns.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <Button onClick={openCompletedGeneration}>Open validated architecture <ArrowRight size={15} /></Button>
      </section>}
      <div className={styles.divider}>or begin from a trusted template</div>
      <span className={`${styles.handNote} ${styles.templateNote}`}>pick a validated starting point <ArrowBendRightDown size={29} weight="light" /></span>
      <div className={styles.templateGrid}>{templates.map((item) => <button className={`${styles.template} ${selectedTemplate === item.id ? styles.templateSelected : ""}`} key={item.id} onClick={() => setSelectedTemplate(selectedTemplate === item.id ? "" : item.id)} aria-pressed={selectedTemplate === item.id}><small>{item.category}</small><strong>{item.name}</strong><p>{item.description}</p><span>{item.diagram.nodes.length} components · {item.diagram.connectors.length} typed flows</span></button>)}</div>
    </main>
  </div>;
}
