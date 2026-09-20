"use client";

import { useEffect, useRef, useState } from "react";
import { architectureIRFromDiagram, presentationFromDiagram, type ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { Diagram } from "@/lib/domain/schema";
import type { TraceabilityBundle } from "@/lib/intelligence/schema";
import { clearQueuedProjectSave, loadQueuedProjectSave, queueProjectSave, type RecoveryRecord } from "@/lib/storage/drafts";
import { CloudSaveCoordinator, CloudSaveFailure, cloudResponseFailure, type CloudRequest, type CloudResult, type CloudSaveState } from "@/lib/storage/cloud-save-coordinator";
import { persistPrivatePresentationImages } from "@/lib/storage/private-assets";

type Value = { diagram: Diagram };
type Prepared = CloudRequest<Value> & { ir: ArchitectureIR; presentation: ArchitecturePresentation; traceability?: TraceabilityBundle };
type Result = CloudResult & { ir: ArchitectureIR; diagram: Diagram; traceability?: TraceabilityBundle };

export function useCloudSave({ enabled, diagram, recovery, recoveredUnsynced, getIR, getTraceability, getIrVersion, applySuccess }: {
  enabled: boolean;
  diagram: Diagram;
  recovery?: RecoveryRecord;
  recoveredUnsynced: boolean;
  getIR: () => ArchitectureIR;
  getTraceability: () => TraceabilityBundle | undefined;
  getIrVersion: () => number;
  applySuccess: (request: Prepared, result: Result) => void;
}) {
  const [state, setState] = useState<CloudSaveState>(enabled ? "idle" : "saved");
  const [message, setMessage] = useState("");
  const callbacks = useRef({ getIR, getTraceability, getIrVersion, applySuccess });
  useEffect(() => { callbacks.current = { getIR, getTraceability, getIrVersion, applySuccess }; }, [getIR, getTraceability, getIrVersion, applySuccess]);
  const coordinator = useRef<CloudSaveCoordinator<Value> | null>(null);
  const previous = useRef(diagram);
  const latest = useRef(diagram);
  latest.current = diagram;
  const ready = useRef(false);
  const changedWhileStarting = useRef(false);
  const suppressNext = useRef(false);

  useEffect(() => {
    if (!enabled || !recovery || recovery.scope.kind !== "account") return;
    const accountRecovery = recovery;
    let active = true;
    const machine = new CloudSaveCoordinator<Value>({
      baseVersion: diagram.version,
      baseIrVersion: accountRecovery.architecture.irVersion,
      initialRevision: accountRecovery.revision,
      online: () => navigator.onLine,
      build: (value, context) => {
        const ir = architectureIRFromDiagram(value.diagram, callbacks.current.getIR());
        const presentation = presentationFromDiagram(value.diagram);
        return { ...context, value, ir, presentation, traceability: callbacks.current.getTraceability() } as Prepared;
      },
      send: async (raw) => {
        const request = raw as Prepared;
        const presentation = await persistPrivatePresentationImages({ diagramId: request.value.diagram.id }, request.presentation);
        const response = await fetch(`/api/v1/diagrams/${request.value.diagram.id}`, {
          method: "PUT", headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey: request.idempotencyKey, baseVersion: request.baseVersion, baseIrVersion: request.baseIrVersion, ir: request.ir, presentation, traceability: request.traceability }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw await cloudResponseFailure(response, body);
        const saved = body.saved?.[0];
        if (!saved?.version || !body.snapshot?.materializedDiagram || !body.snapshot?.ir) throw new CloudSaveFailure("fatal", "Cloud save returned an incomplete result. Local recovery is preserved.");
        return { version: Number(saved.version), irVersion: Number(saved.ir_version ?? body.snapshot.irVersion), ir: body.snapshot.ir, diagram: body.snapshot.materializedDiagram, traceability: body.snapshot.traceability } as Result;
      },
      persist: (raw) => {
        const request = raw as Prepared;
        return queueProjectSave({ diagramId: request.value.diagram.id, idempotencyKey: request.idempotencyKey, baseVersion: request.baseVersion, baseIrVersion: request.baseIrVersion, localRevision: request.localRevision, ir: request.ir, traceability: request.traceability, presentation: request.presentation, diagram: request.value.diagram }, accountRecovery.scope);
      },
      clear: (request) => clearQueuedProjectSave(request.value.diagram.id, accountRecovery.scope, request.idempotencyKey),
      onSuccess: (request, result) => { suppressNext.current = true; callbacks.current.applySuccess(request as Prepared, result as Result); },
      onState: (next, detail) => { if (active) { setState(next); setMessage(detail ?? ""); } },
    });
    coordinator.current = machine;
    async function start() {
      let queued;
      try { queued = await loadQueuedProjectSave(diagram.id, accountRecovery.scope); }
      catch {
        if (active) { setState("error"); setMessage("The cloud retry queue could not be read. Browser recovery is preserved; cloud saving is paused."); }
        return;
      }
      if (!active) return;
      if (queued) await machine.replay({ idempotencyKey: queued.idempotencyKey, localRevision: queued.localRevision, baseVersion: queued.baseVersion, baseIrVersion: queued.baseIrVersion, value: { diagram: queued.diagram }, ir: queued.ir, traceability: queued.traceability, presentation: queued.presentation } as Prepared);
      if (active && (changedWhileStarting.current || recoveredUnsynced) && (!queued || changedWhileStarting.current || accountRecovery.revision > queued.localRevision)) machine.change({ diagram: latest.current });
      if (active && !queued && !recoveredUnsynced) setState("saved");
      ready.current = true;
    }
    void start();
    const online = () => machine.online();
    const offline = () => machine.offline();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { active = false; ready.current = false; machine.stop(); coordinator.current = null; window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  // One coordinator owns one authenticated diagram for this mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, recovery?.key]);

  useEffect(() => {
    if (!enabled || previous.current === diagram) { previous.current = diagram; return; }
    if (!ready.current) { changedWhileStarting.current = true; previous.current = diagram; return; }
    previous.current = diagram;
    if (suppressNext.current) { suppressNext.current = false; return; }
    coordinator.current?.change({ diagram });
  }, [diagram, enabled]);

  return { state, message, flush: () => coordinator.current?.flush(), dirty: coordinator.current?.dirty ?? false };
}
