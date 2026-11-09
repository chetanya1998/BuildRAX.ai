"use client";

import { Panel, ViewportPortal, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { TraceabilityBundle } from "@/lib/intelligence/schema";
import type { Diagram } from "@/lib/domain/schema";
import { ScenarioPlayback, seedPatternScenarios, validateScenario, type PlaybackAction } from "@/lib/architecture-ir/scenarios";
import styles from "./scenario-panel.module.css";

export type ScenarioFrame = ReturnType<ScenarioPlayback["frame"]>;
type Props = {
  ir: ArchitectureIR; diagram: Diagram; traceability?: TraceabilityBundle; readOnly: boolean;
  onSave: () => void; onClose: () => void; onFrame: (frame: ScenarioFrame | null) => void;
  previewRef: React.MutableRefObject<boolean>;
};

export function ScenarioPanel({ ir, diagram, traceability, readOnly, onSave, onClose, onFrame, previewRef }: Props) {
  const flow = useReactFlow();
  const [selected, setSelected] = useState(ir.scenarios?.[0]?.id ?? "");
  const [frame, setFrame] = useState<ScenarioFrame | null>(null);
  const [error, setError] = useState("");
  const engine = useRef<{ signature: string; player: ScenarioPlayback } | null>(null);
  const prior = useRef<Diagram["viewport"] | null>(null);
  const transition = useRef(0);
  const scenario = ir.scenarios?.find((item) => item.id === selected);
  const signature = JSON.stringify(scenario);
  const validation = useMemo(() => scenario ? validateScenario(scenario, ir, traceability) : null, [scenario, ir, traceability]);
  const suggestions = useMemo(() => {
    if (readOnly || (ir.scenarios?.length ?? 0) >= 20) return [];
    try { return seedPatternScenarios(ir, traceability).slice(0, 20 - (ir.scenarios?.length ?? 0)); } catch { return []; }
  }, [ir, traceability, readOnly]);

  const exit = useCallback(() => {
    const viewport = prior.current;
    const token = ++transition.current;
    prior.current = null;
    engine.current = null;
    setFrame(null);
    onFrame(null);
    // Keep viewport writes suppressed until React Flow finishes restoration.
    if (viewport) void flow.setViewport(viewport, { duration: 0 }).finally(() => { if (token === transition.current) previewRef.current = false; });
    else previewRef.current = false;
  }, [flow, onFrame, previewRef]);

  const dispatch = useCallback((action: PlaybackAction) => {
    if (action === "exit") { exit(); return; }
    if (!scenario || !validation?.valid) return;
    if (!engine.current || engine.current.signature !== signature) engine.current = { signature, player: new ScenarioPlayback(scenario) };
    const next = engine.current.player.dispatch(action, ir, { traceability, reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    if (next.step) {
      prior.current ??= flow.getViewport();
      transition.current++;
      previewRef.current = true;
      void flow.fitView({ nodes: next.focus.componentIds.map((id) => ({ id })), padding: window.matchMedia("(max-width: 700px)").matches ? .3 : { right: "390px", left: "40px", top: "40px", bottom: "40px" }, maxZoom: 1, duration: 0 });
    }
    setFrame(next);
    onFrame(next);
  }, [scenario, validation, signature, ir, traceability, flow, previewRef, onFrame, exit]);

  useEffect(() => {
    if (frame?.phase !== "playing") return;
    const timer = window.setTimeout(() => dispatch("tick"), 1200);
    return () => window.clearTimeout(timer);
  }, [frame, dispatch]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); exit(); } };
    const hide = () => { if (document.visibilityState === "hidden") dispatch("pause"); };
    window.addEventListener("keydown", escape);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("keydown", escape); document.removeEventListener("visibilitychange", hide); };
  }, [exit, dispatch]);
  useEffect(() => {
    if (!frame || (validation?.valid && frame.revision === scenario?.revision && engine.current?.signature === signature)) return;
    const id = requestAnimationFrame(exit);
    return () => cancelAnimationFrame(id);
  }, [frame, validation, scenario, signature, exit]);
  useEffect(() => () => {
    onFrame(null);
    if (prior.current) void flow.setViewport(prior.current, { duration: 0 }).finally(() => { previewRef.current = false; });
  }, [flow, onFrame, previewRef]);

  const active = validation?.valid && frame?.step ? frame : null;
  return <>
    <ViewportPortal>{active?.focus.componentIds.map((id) => {
      const node = diagram.nodes.find((item) => item.id === id);
      return node && <div key={`${active.pulse.key}:${id}`} aria-hidden="true" data-scenario-pulse={active.pulse.iterations} className={styles.pulse} style={{ left: node.position.x - 6, top: node.position.y - 6, width: node.dimensions.width + 12, height: node.dimensions.height + 12, animationIterationCount: active.pulse.iterations }} />;
    })}</ViewportPortal>
    <Panel position="top-right" className={`${styles.panel} nowheel nopan nodrag`}>
      <section aria-label="Scenario playback">
        <header><strong>Scenarios</strong><button onClick={() => { exit(); onClose(); }}>Close scenarios</button></header>
        <p>Saved directed journeys, not a runtime simulation. Playback makes no AI calls.</p>
        {!readOnly && !active && <button disabled={!suggestions.length} onClick={() => { try { onSave(); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Could not save scenarios."); } }}>Save suggested scenarios{suggestions.length ? ` (${suggestions.length})` : ""}</button>}
        <label>Scenario<select aria-label="Scenario" value={scenario?.id ?? ""} onChange={(event) => { exit(); setSelected(event.target.value); }}><option value="">Choose a saved scenario</option>{ir.scenarios?.map((item) => <option key={item.id} value={item.id}>{item.name} · revision {item.revision}</option>)}</select></label>
        {!ir.scenarios?.length && <p>No saved scenarios. In Design, save suggestions from a registered pattern with a directed client-to-data path.</p>}
        {validation && !validation.valid && <p role="alert">Scenario cannot play: {validation.issues.map((item) => `${item.stepId ?? "scenario"}: ${item.reason}`).join("; ")}. The saved definition is preserved.</p>}
        <div className={styles.actions}>
          <button disabled={!validation?.valid || frame?.phase === "playing" || frame?.phase === "completed"} onClick={() => dispatch("play")}>Play scenario</button>
          <button disabled={frame?.phase !== "playing"} onClick={() => dispatch("pause")}>Pause scenario</button>
          <button disabled={!active || active.index === 0} onClick={() => dispatch("previous")}>Previous step</button>
          <button disabled={!active || active.index === (scenario?.steps.length ?? 0) - 1} onClick={() => dispatch("next")}>Next step</button>
          <button disabled={!validation?.valid} onClick={() => dispatch("restart")}>Restart scenario</button>
          <button disabled={!frame} onClick={exit}>Exit playback</button>
        </div>
        <p role="status" aria-live="polite" data-testid="scenario-status">{frame?.phase ?? "idle"}{active ? ` · Step ${active.index! + 1} of ${scenario!.steps.length}` : ""}</p>
        {active?.step && <div><p>{ir.components.find((item) => item.id === active.step!.from)?.name} → {ir.components.find((item) => item.id === active.step!.to)?.name}</p><p>Flow: {active.step.flowId}</p><p>Requirement IDs: {active.step.requirementRefs.join(", ") || "None linked"}</p><p>Evidence IDs: {active.step.evidenceRefs.join(", ") || "None linked"}</p></div>}
        {error && <p role="alert">{error}</p>}
      </section>
    </Panel>
  </>;
}
