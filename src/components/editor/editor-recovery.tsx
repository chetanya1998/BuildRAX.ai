"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { architectureIRFromDiagram, canonicalSha256, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { Diagram } from "@/lib/domain/schema";
import { downloadText } from "@/lib/domain/export";
import { loadRecovery, recoveryArchitecture, recoveryKey, saveRecovery, type RecoveryRecord, type RecoveryScope } from "@/lib/storage/drafts";
import { RecoveryWriter, recoveryErrorMessage, type RecoveryStatus } from "@/lib/storage/recovery-writer";
import styles from "./loader.module.css";

export function downloadRecovery(record: RecoveryRecord) {
  downloadText(JSON.stringify(record, null, 2), `buildrax-recovery-${record.diagram.id}.json`, "application/json");
}

export function EditorRecoveryGate({ diagram, ir, irVersion = 0, scope, children }: {
  diagram: Diagram; ir?: ArchitectureIR; irVersion?: number; scope: RecoveryScope;
  children: (record: RecoveryRecord) => ReactNode;
}) {
  const [record, setRecord] = useState<RecoveryRecord>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const key = recoveryKey(scope, diagram.id);
  useEffect(() => {
    let active = true;
    void loadRecovery(scope, diagram.id).then((stored) => {
      if (!active) return;
      setError("");
      setRecord(stored ?? {
        schemaVersion: 1, key, scope, revision: 0, diagram,
        architecture: { ir: ir ?? architectureIRFromDiagram(diagram), presentation: presentationFromDiagram(diagram), irVersion },
        document: "", updatedAt: diagram.updatedAt,
      });
    }).catch(() => { if (active) setError("Browser recovery could not be opened. Existing records have not been removed. Enable browser storage or retry."); });
    return () => { active = false; };
  // The parent keys this boundary by account/workspace/diagram; server input is
  // the opening baseline, not a signal to reload over active user edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  if (error) return <div className={styles.state} role="alert"><strong>{error}</strong><button onClick={() => setAttempt((value) => value + 1)}>Retry browser recovery</button></div>;
  if (!record) return <div className={styles.state} role="status">Opening browser recovery…</div>;
  if (scope.kind === "account" && record.diagram.version !== diagram.version) return <div className={styles.state} role="alert">
    <strong>Your browser copy and cloud version differ.</strong>
    <p>Browser base: {record.diagram.version}. Cloud: {diagram.version}. Neither copy has been overwritten. Automatic saving is paused; download this recovery before resolving the conflict.</p>
    <button onClick={() => downloadRecovery(record)}>Download browser recovery</button>
    <a href="/dashboard">Return to projects</a>
  </div>;
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
