"use client";

import { ArrowRight, LayoutTemplate, PencilRuler } from "lucide-react";
import { ArrowBendRightDown } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createDiagram } from "@/lib/domain/factory";
import { architectureIRFromDiagram, presentationFromDiagram, type ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { GenerationReceipt } from "@/lib/server/generation-receipt";
import { getTemplate, templates } from "@/lib/domain/templates";
import type { GenerationRequest } from "@/lib/domain/schema";
import { publicGenerationJobSchema, type GenerationResult } from "@/lib/generation-jobs/schema";
import type { TraceabilityBundle } from "@/lib/intelligence/schema";
import { saveDraft } from "@/lib/storage/drafts";
import { useHydrated } from "@/lib/ui/use-hydrated";
import styles from "./start.module.css";

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

async function responseBody(response: Response) {
  try { return await response.json() as unknown; }
  catch { return null; }
}

function responseError(response: Response, body: unknown) {
  const retryAfter = response.headers.get("retry-after");
  const suffix = retryAfter && /^\d+$/.test(retryAfter) ? ` Try again in ${retryAfter} seconds.` : "";
  return `${generationErrorMessage(body)}${suffix}`;
}

const stageMessages: Record<string, string> = {
  accepted: "Waiting for generation capacity…",
  evidence: "Capturing facts and preserving their source…",
  requirements: "Separating requirements from unresolved questions…",
  context: "Building a bounded architecture context…",
  rules: "Evaluating architecture patterns and proposal-only rules…",
  synthesis: "Synthesizing component and flow boundaries…",
  validation: "Validating the architecture graph…",
  layout: "Laying out validated components and typed connections…",
  published: "The first architecture result is ready to inspect.",
};

function waitForPoll(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException("Polling cancelled", "AbortError"));
    };
    const timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, 450);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

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
  const [state, setState] = useState<"idle" | "generating" | "ready" | "error" | "cancelled">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [recovery, setRecovery] = useState<"retry" | "resume" | null>(null);
  const hydrated = useHydrated();
  const selected = useMemo(() => getTemplate(selectedTemplate), [selectedTemplate]);
  const guestSessionReady = useRef(authenticated);
  const operation = useRef(0);
  const pollController = useRef<AbortController | null>(null);
  const activePrompt = useRef("");

  useEffect(() => () => pollController.current?.abort(), []);

  async function generationHeaders() {
    if (!authenticated && !guestSessionReady.current) {
      const guestSession = await fetch("/api/v1/guest-session", { method: "POST" });
      const body = await responseBody(guestSession);
      if (!guestSession.ok) throw new Error(responseError(guestSession, body));
      guestSessionReady.current = true;
    }
    return { "content-type": "application/json" };
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

  async function monitorGeneration(jobId: string, headers: Record<string, string>, currentOperation: number, signal: AbortSignal) {
    while (operation.current === currentOperation) {
      const response = await fetch(`/api/v1/generation-jobs/${jobId}`, { headers, signal });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(responseError(response, body));
      const parsed = publicGenerationJobSchema.safeParse(body && typeof body === "object" ? (body as { job?: unknown }).job : undefined);
      if (!parsed.success) throw new Error("Generation returned an invalid status payload.");
      const job = parsed.data;
      setProgress(job.progress);
      setMessage(stageMessages[job.stage] ?? "Generation is progressing…");
      if (job.status === "completed") {
        if (!job.result) throw new Error("Generation completed without a validated result.");
        setResult(job.result);
        setRecovery(null);
        setState("ready");
        return;
      }
      if (job.status === "failed") {
        setRecovery("retry");
        throw new Error(job.error?.message ?? "Generation failed. Retry from the last completed stage.");
      }
      if (job.status === "cancelled") {
        setRecovery("retry");
        setState("cancelled");
        setMessage("Generation was cancelled. Completed stages are retained for retry.");
        return;
      }
      await waitForPoll(signal);
    }
  }

  async function runAndMonitor(jobId: string) {
    const headers = await generationHeaders();
    pollController.current?.abort();
    const controller = new AbortController();
    pollController.current = controller;
    const currentOperation = ++operation.current;
    setState("generating");
    setRecovery(null);
    setMessage("Starting the durable generation workflow…");
    void fetch(`/api/v1/generation-jobs/${jobId}/run`, { method: "POST", headers, signal: controller.signal })
      .catch(() => undefined);
    try {
      await monitorGeneration(jobId, headers, currentOperation, controller.signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (operation.current !== currentOperation) return;
      setRecovery((current) => current ?? "resume");
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not read generation progress.");
    }
  }

  async function generate() {
    if (prompt.trim().length < 12 && !selected) {
      setState("error");
      setMessage("Describe the system in at least 12 characters or choose a template.");
      return;
    }
    setState("generating");
    setResult(null);
    setRecovery(null);
    setProgress(0);
    setMessage("Creating a durable generation job…");
    try {
      const basePrompt = prompt.trim().length ? prompt : selected!.description;
      const headers = await generationHeaders();
      const request = {
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
          request,
          mode: "auto",
        }),
      });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(responseError(response, body));
      const job = body && typeof body === "object" ? (body as { job?: { id?: unknown } }).job : undefined;
      if (!job || typeof job.id !== "string") throw new Error("Generation job creation returned an invalid response.");
      setActiveJobId(job.id);
      activePrompt.current = basePrompt;
      await runAndMonitor(job.id);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not generate the diagram.");
    }
  }

  async function cancelGeneration() {
    if (!activeJobId) return;
    operation.current += 1;
    pollController.current?.abort();
    setMessage("Cancelling generation…");
    try {
      const headers = await generationHeaders();
      const response = await fetch(`/api/v1/generation-jobs/${activeJobId}/cancel`, { method: "POST", headers });
      const body = await responseBody(response);
      if (!response.ok) throw new Error(responseError(response, body));
      setRecovery("retry");
      setState("cancelled");
      setMessage("Generation was cancelled. Completed stages are retained for retry.");
    } catch (error) {
      setRecovery("resume");
      setState("error");
      setMessage(error instanceof Error ? error.message : "Generation could not be cancelled.");
    }
  }

  async function recoverGeneration() {
    if (!activeJobId) return;
    try {
      if (recovery === "retry") {
        const headers = await generationHeaders();
        const response = await fetch(`/api/v1/generation-jobs/${activeJobId}/retry`, { method: "POST", headers });
        const body = await responseBody(response);
        if (!response.ok) throw new Error(responseError(response, body));
      }
      await runAndMonitor(activeJobId);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Generation could not be resumed.");
    }
  }

  async function openResult() {
    if (!result) return;
    try {
      await openDiagram(result.artifact.diagram, activePrompt.current, result.artifact);
    } catch (error) {
      setRecovery(null);
      setState("error");
      setMessage(error instanceof Error ? error.message : "The generated architecture could not be saved.");
    }
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
        <div className={styles.composerFooter}><span className={styles.count}>{prompt.length.toLocaleString()} / 3,000</span><div><Button variant="tertiary" onClick={blankCanvas} disabled={!hydrated || state === "generating"}><PencilRuler size={15} /> Blank canvas</Button> <Button onClick={generate} disabled={!hydrated || state === "generating"}>Generate architecture <ArrowRight size={15} /></Button></div></div>
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
      {state !== "idle" && <div className={`${styles.status} ${state === "error" ? styles.error : ""}`} role="status">
        {state === "generating" && <span className={styles.spinner} />}
        <div className={styles.statusCopy}><span>{message}</span>{state === "generating" && <progress aria-label="Generation progress" max={100} value={progress} />}</div>
        {state === "generating" && activeJobId && <Button variant="tertiary" onClick={cancelGeneration}>Cancel</Button>}
        {(state === "error" || state === "cancelled") && recovery && activeJobId && <Button variant="secondary" onClick={recoverGeneration}>{recovery === "retry" ? "Retry generation" : "Resume status"}</Button>}
      </div>}
      {state === "ready" && result && <section className={styles.firstResult} aria-labelledby="first-result-title">
        <div className={styles.resultHeading}><div><span className={styles.kicker}>Validated first result</span><h2 id="first-result-title">Inspect what BuildRAX understood.</h2></div><Button onClick={openResult}>Open validated architecture <ArrowRight size={15} /></Button></div>
        <div className={styles.resultGrid}>
          <article><h3>Facts</h3>{result.summary.facts.length ? <ul>{result.summary.facts.map((item, index) => <li key={`fact-${index}`}>{item}</li>)}</ul> : <p>No explicit facts were captured.</p>}</article>
          <article><h3>Assumptions</h3>{result.summary.assumptions.length ? <ul>{result.summary.assumptions.map((item, index) => <li key={`assumption-${index}`}>{item}</li>)}</ul> : <p>No explicit assumptions.</p>}</article>
          <article><h3>Unknowns</h3>{result.summary.unknowns.length ? <ul>{result.summary.unknowns.map((item, index) => <li key={`unknown-${index}`}>{item}</li>)}</ul> : <p>No unresolved questions.</p>}</article>
        </div>
        <p className={styles.resultMeta}>{result.artifact.diagram.nodes.length} components · {result.artifact.diagram.connectors.length} typed flows · {result.validation.warnings.length} validation warnings · {result.proposals.rules.filter((rule) => rule.status === "matched").length} rule proposals</p>
      </section>}
      <div className={styles.divider}>or begin from a trusted template</div>
      <span className={`${styles.handNote} ${styles.templateNote}`}>pick a validated starting point <ArrowBendRightDown size={29} weight="light" /></span>
      <div className={styles.templateGrid}>{templates.map((item) => <button className={`${styles.template} ${selectedTemplate === item.id ? styles.templateSelected : ""}`} key={item.id} onClick={() => setSelectedTemplate(selectedTemplate === item.id ? "" : item.id)} aria-pressed={selectedTemplate === item.id} disabled={state === "generating"}><small>{item.category}</small><strong>{item.name}</strong><p>{item.description}</p><span>{item.diagram.nodes.length} components · {item.diagram.connectors.length} typed flows</span></button>)}</div>
    </main>
  </div>;
}
