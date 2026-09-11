"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { architectureIRFromDiagram, canonicalSha256, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { Diagram } from "@/lib/domain/schema";
import { downloadText } from "@/lib/domain/export";
import { clearQueuedProjectSave, loadRecovery, preserveRecoveryConflict, recoveryArchitecture, recoveryKey, resolveRecoveryConflict, saveRecovery, type RecoveryRecord, type RecoveryScope } from "@/lib/storage/drafts";
import { RecoveryWriter, recoveryErrorMessage, type RecoveryStatus } from "@/lib/storage/recovery-writer";
import styles from "./loader.module.css";
import { persistPrivatePresentationImages } from "@/lib/storage/private-assets";

export function downloadRecovery(record: RecoveryRecord) {
  downloadText(JSON.stringify(record, null, 2), `buildrax-recovery-${record.diagram.id}.json`, "application/json");
}

export function EditorRecoveryGate({ diagram, ir, irVersion = 0, document = "", scope, children }: {
  diagram: Diagram; ir?: ArchitectureIR; irVersion?: number; document?: string; scope: RecoveryScope;
  children: (record: RecoveryRecord) => ReactNode;
}) {
  const [record, setRecord] = useState<RecoveryRecord>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [resolving, setResolving] = useState<"browser" | "cloud" | "">("");
  const key = recoveryKey(scope, diagram.id);
  useEffect(() => {
    let active = true;
    void loadRecovery(scope, diagram.id).then((stored) => {
      if (!active) return;
      setError("");
      setRecord(stored ?? {
        schemaVersion: 1, key, scope, revision: 0, diagram,
        architecture: { ir: ir ?? architectureIRFromDiagram(diagram), presentation: presentationFromDiagram(diagram), irVersion },
        document, updatedAt: diagram.updatedAt,
      });
    }).catch(() => { if (active) setError("Browser recovery could not be opened. Existing records have not been removed. Enable browser storage or retry."); });
    return () => { active = false; };
  // The parent keys this boundary by account/workspace/diagram; server input is
  // the opening baseline, not a signal to reload over active user edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  if (error) return <div className={styles.state} role="alert"><strong>{error}</strong><button onClick={() => setAttempt((value) => value + 1)}>Retry browser recovery</button></div>;
  if (!record) return <div className={styles.state} role="status">Opening browser recovery…</div>;
  if (scope.kind === "account" && record.diagram.version !== diagram.version) {
    const cloud: RecoveryRecord = { schemaVersion: 1, key, scope, revision: record.revision, diagram,
      architecture: { ir: ir ?? architectureIRFromDiagram(diagram), presentation: presentationFromDiagram(diagram), irVersion }, document, updatedAt: diagram.updatedAt };
    async function chooseCloud() {
      setResolving("cloud");
      try {
        const conflictKey = await preserveRecoveryConflict(record!, cloud);
        const revision = await saveRecovery({ ...cloud, revision: record!.revision }, record!.revision);
        await clearQueuedProjectSave(diagram.id, scope);
        await resolveRecoveryConflict(conflictKey, "cloud");
        setRecord({ ...cloud, revision });
      } catch { setError("The conflict could not be resolved. Both copies remain preserved."); setResolving(""); }
    }
    async function chooseBrowser() {
      setResolving("browser");
      try {
        const conflictKey = await preserveRecoveryConflict(record!, cloud);
        const presentation = await persistPrivatePresentationImages({ diagramId: diagram.id }, record!.architecture.presentation);
        const response = await fetch(`/api/v1/diagrams/${diagram.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(), baseVersion: diagram.version, baseIrVersion: irVersion,
          ir: record!.architecture.ir, presentation,
        }) });
        const body = await response.json();
        if (!response.ok || !body.snapshot?.materializedDiagram) throw new Error();
        const next: RecoveryRecord = { ...record!, revision: record!.revision, diagram: body.snapshot.materializedDiagram,
          architecture: { ...record!.architecture, ir: body.snapshot.ir, presentation: body.snapshot.presentation, irVersion: body.snapshot.irVersion, checksums: body.snapshot.checksums }, updatedAt: new Date().toISOString() };
        const revision = await saveRecovery(next, record!.revision);
        await clearQueuedProjectSave(diagram.id, scope);
        await resolveRecoveryConflict(conflictKey, "browser");
        setRecord({ ...next, revision });
      } catch { setError("The browser copy could not be saved as a new cloud version. Both copies remain preserved."); setResolving(""); }
    }
    return <div className={styles.state} role="alert">
    <strong>Your browser copy and cloud version differ.</strong>
    <p>Browser version {record.diagram.version} has {record.diagram.nodes.length} components. Cloud version {diagram.version} has {diagram.nodes.length}. Both copies are backed up before either choice is applied.</p>
    <button onClick={() => downloadRecovery(record)}>Download browser recovery</button>
    <button disabled={Boolean(resolving)} onClick={() => void chooseBrowser()}>{resolving === "browser" ? "Saving browser copy…" : "Keep browser copy as a new cloud version"}</button>
    <button disabled={Boolean(resolving)} onClick={() => void chooseCloud()}>{resolving === "cloud" ? "Opening cloud copy…" : "Use cloud version"}</button>
    <a href="/dashboard">Return to projects</a>
  </div>;
  }
  return children(record);
}

export function useEditorRecovery({ initial, diagram, document, getIR, getIrVersion, enabled }: {
  initial?: RecoveryRecord; diagram: Diagram; document: string;
  getIR: () => ArchitectureIR; getIrVersion: () => number; enabled: boolean;
}) {
  const [status, setStatus] = useState<RecoveryStatus>("pending");
  const [error, setError] = useState("");
  const writer = useRef<RecoveryWriter<RecoveryRecord> | null>(null);
  const active = useRef(false);
  const capture = useRef(() => initial);
  useEffect(() => {
    capture.current = () => initial && ({
      ...initial, diagram, document,
      architecture: recoveryArchitecture(diagram, getIR(), getIrVersion()),
      updatedAt: new Date().toISOString(),
    });
  }, [initial, diagram, document, getIR, getIrVersion]);

  useEffect(() => {
    if (!enabled || !initial) return;
    active.current = true;
    let revision = initial.revision;
    const queue = writer.current ?? new RecoveryWriter<RecoveryRecord>(async (record) => {
      const { ir, presentation } = record.architecture;
      const [irHash, presentationHash, diagramHash] = await Promise.all([canonicalSha256(ir), canonicalSha256(presentation), canonicalSha256(record.diagram)]);
      revision = await saveRecovery({ ...record, architecture: { ...record.architecture, checksums: { ir: irHash, presentation: presentationHash, diagram: diagramHash } } }, revision);
    }, (next, failure) => {
      if (!active.current) return;
      setStatus(next);
      if (next === "error") setError(recoveryErrorMessage(failure));
      if (next === "saved") setError("");
    });
    writer.current = queue;
    const unload = (event: BeforeUnloadEvent) => {
      if (!queue.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const hide = () => { if (documentHidden()) void queue.flush(); };
    window.addEventListener("beforeunload", unload);
    window.document.addEventListener("visibilitychange", hide);
    return () => {
      active.current = false;
      void queue.flush();
      window.removeEventListener("beforeunload", unload);
      window.document.removeEventListener("visibilitychange", hide);
    };
  }, [enabled, initial]);

  // A fixed 800 ms window, not an indefinitely postponed idle debounce. Every
  // write includes both the canvas and document, even while typing continuously.
  useEffect(() => {
    if (!enabled || !writer.current) return;
    const current = capture.current();
    if (current) writer.current.enqueue(current);
  }, [enabled, diagram, document, initial]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => { void writer.current?.flush(false); }, 800);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return {
    status, error,
    retry: () => { void writer.current?.flush(); },
    flush: async () => { await writer.current?.flush(); return !(writer.current?.dirty ?? false); },
    download: () => { const current = capture.current(); if (current) downloadRecovery(current); },
  };
}

function documentHidden() { return window.document.visibilityState === "hidden"; }
