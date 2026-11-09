"use client";

import { Panel, ViewportPortal, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Diagram } from "@/lib/domain/schema";
import { applyPresentationObjectCommand } from "@/lib/architecture-ir/presentation-commands";
import { presentationObjectSchema, presentationTargets, resolvePresentationObject, type PresentationObject, type PresentationTarget } from "@/lib/architecture-ir/presentation-objects";
import { movePresentationGroup, objectBounds } from "./presentation-geometry";
import styles from "./presentation.module.css";

type Props = { diagram: Diagram; readOnly: boolean; selectedIds: string[]; commit: (transform: (current: Diagram) => Diagram) => void; previewRef: React.MutableRefObject<boolean> };
type Viewport = Diagram["viewport"];
function label(object: PresentationObject) { return "text" in object ? object.text : "name" in object ? object.name : "Highlight"; }
function inventory(diagram: Diagram) { return { componentIds: diagram.nodes.map((item) => item.id), flowIds: diagram.connectors.map((item) => item.id), primitiveIds: diagram.primitives.map((item) => item.id) }; }

export function PresentationTools({ diagram, readOnly, selectedIds, commit, previewRef }: Props) {
  const flow = useReactFlow();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [kind, setKind] = useState<PresentationObject["kind"]>("note");
  const [error, setError] = useState("");
  const [activeFocus, setActiveFocus] = useState<string | null>(null);
  const prior = useRef<Viewport | null>(null);
  const transition = useRef(0);
  const objects = diagram.presentationObjects ?? [];
  const object = objects.find((item) => item.id === selected);
  const exitFocus = useCallback(() => {
    const viewport = prior.current;
    const token = ++transition.current;
    prior.current = null;
    setActiveFocus(null);
    if (viewport) void flow.setViewport(viewport, { duration: 0 }).finally(() => { if (token === transition.current) previewRef.current = false; });
    else previewRef.current = false;
  }, [flow, previewRef]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && prior.current) { event.preventDefault(); exitFocus(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [exitFocus]);
  useEffect(() => () => {
    if (prior.current) void flow.setViewport(prior.current, { duration: 0 }).finally(() => { previewRef.current = false; });
  }, [flow, previewRef]);
  const focusValid = !activeFocus || objects.some((item) => item.id === activeFocus && !resolvePresentationObject(item, inventory(diagram)).missingTargets.length);
  useEffect(() => {
    if (focusValid) return;
    const frame = requestAnimationFrame(exitFocus);
    return () => cancelAnimationFrame(frame);
  }, [focusValid, exitFocus]);

  function run(action: () => void) {
    try { action(); setError(""); } catch (error) { setError(error instanceof Error ? error.message : "Presentation change failed."); }
  }
  function focus(item: PresentationObject) {
    const bounds = objectBounds(diagram, item);
    if (item.kind !== "focus" || !bounds || resolvePresentationObject(item, inventory(diagram)).missingTargets.length) return;
    if (!prior.current) prior.current = flow.getViewport();
    transition.current++;
    previewRef.current = true;
    setActiveFocus(item.id);
    if (item.viewport) void flow.setViewport(item.viewport, { duration: 0 });
    else void flow.fitBounds(bounds, { padding: .3, duration: 0 });
  }
  const focusObject = objects.find((item) => item.id === activeFocus);
  const focusBounds = focusObject && objectBounds(diagram, focusObject);

  return <>
    <ViewportPortal>
      {objects.filter((item) => item.kind !== "focus").map((item) => {
        const bounds = objectBounds(diagram, item);
        if (!bounds) return null;
        return <div key={item.id} data-presentation-id={item.id} data-presentation-kind={item.kind} className={`${styles.object} ${item.kind === "note" ? styles.note : item.kind === "annotation" ? styles.annotation : item.kind === "group" ? styles.group : ""}`} style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height, zIndex: item.zIndex, ...(item.kind === "note" ? { background: item.color } : item.kind === "highlight" ? { background: item.color, opacity: item.opacity, borderColor: item.color } : {}) }}>
          {item.kind === "group" ? <span>{item.name}</span> : "text" in item ? item.text : null}
        </div>;
      })}
      {focusBounds && <div data-testid="presentation-focus" className={styles.object} style={{ left: focusBounds.x - 8, top: focusBounds.y - 8, width: focusBounds.width + 16, height: focusBounds.height + 16, borderWidth: 4 }} />}
    </ViewportPortal>
    <Panel position="top-right" className={`${styles.panel} nowheel nopan nodrag`}>
      {!open ? <button onClick={() => setOpen(true)}>Presentation objects</button> : <section aria-label="Presentation objects">
        <header><strong>Presentation objects</strong><button aria-label="Close presentation objects" onClick={() => { exitFocus(); setOpen(false); }}>Close</button></header>
        <p>Visual context only — architecture semantics stay unchanged.</p>
        <label>Saved object<select value={object?.id ?? ""} onChange={(event) => { exitFocus(); setSelected(event.target.value); setError(""); }}><option value="">{readOnly ? "Choose an object" : "New object"}</option>{objects.map((item) => <option key={item.id} value={item.id}>{item.kind}: {label(item).slice(0, 60)}</option>)}</select></label>
        {object && resolvePresentationObject(object, inventory(diagram)).missingTargets.length > 0 && <p className={styles.warning} role="status">Some targets were removed. Content is preserved; choose available targets and save to repair.</p>}
        {!readOnly ? <>
          {!object && <label>Object kind<select value={kind} onChange={(event) => setKind(event.target.value as PresentationObject["kind"])}>{["note", "annotation", "highlight", "group", "focus"].map((value) => <option key={value}>{value}</option>)}</select></label>}
          <ObjectForm key={object ? JSON.stringify(object) : `new:${kind}`} diagram={diagram} object={object} kind={object?.kind ?? kind} selectedIds={selectedIds} getViewport={() => prior.current ?? flow.getViewport()} onSave={(next) => run(() => { commit((current) => applyPresentationObjectCommand(current, { type: "put", object: next }, { readOnly })); setSelected(next.id); })} />
          {object && <div className={styles.actions}>
            <button onClick={() => run(() => { const copy = { ...structuredClone(object), id: crypto.randomUUID(), revision: 1 }; if (copy.kind === "note") copy.position = { x: copy.position.x + 32, y: copy.position.y + 32 }; if (copy.kind === "annotation") copy.offset = { x: copy.offset.x + 32, y: copy.offset.y + 32 }; commit((current) => applyPresentationObjectCommand(current, { type: "put", object: copy }, { readOnly })); setSelected(copy.id); })}>Duplicate visual object</button>
            <button onClick={() => run(() => { exitFocus(); commit((current) => applyPresentationObjectCommand(current, { type: "remove", id: object.id, expectedRevision: object.revision }, { readOnly })); setSelected(""); })}>Delete object</button>
            {object.kind === "group" && <>{[["left", -20, 0], ["right", 20, 0], ["up", 0, -20], ["down", 0, 20]].map(([direction, dx, dy]) => <button key={direction} onClick={() => run(() => commit((current) => movePresentationGroup(current, object, Number(dx), Number(dy))))}>Move group {direction}</button>)}</>}
          </div>}
        </> : <p>Read-only: {object ? label(object) : `${objects.length} saved objects`}</p>}
        {object?.kind === "focus" && <button disabled={!objectBounds(diagram, object) || resolvePresentationObject(object, inventory(diagram)).missingTargets.length > 0} onClick={() => focus(object)}>Open saved focus</button>}
        {activeFocus && <button onClick={exitFocus}>Exit focus</button>}
        {error && <p role="alert">{error}</p>}
      </section>}
    </Panel>
  </>;
}

function ObjectForm({ diagram, object, kind, selectedIds, getViewport, onSave }: { diagram: Diagram; object?: PresentationObject; kind: PresentationObject["kind"]; selectedIds: string[]; getViewport: () => Viewport; onSave: (object: PresentationObject) => void }) {
  const options: Array<PresentationTarget & { label: string }> = [...diagram.nodes.map((item) => ({ kind: "component" as const, id: item.id, label: item.name })), ...diagram.connectors.map((item) => ({ kind: "flow" as const, id: item.id, label: item.label || `${item.source} → ${item.target}` })), ...diagram.primitives.map((item) => ({ kind: "primitive" as const, id: item.id, label: item.text || item.kind }))];
  const [text, setText] = useState(object ? label(object) : "");
  const [targets, setTargets] = useState<PresentationTarget[]>(object ? presentationTargets(object).filter((target) => options.some((item) => item.kind === target.kind && item.id === target.id)) : options.filter((item) => selectedIds.includes(item.id)).slice(0, kind === "annotation" ? 1 : 100).map(({ kind, id }) => ({ kind, id })));
  const position = object?.kind === "note" ? object.position : object?.kind === "annotation" ? object.offset : { x: 0, y: 0 };
  const [x, setX] = useState(position.x); const [y, setY] = useState(position.y);
  const [color, setColor] = useState(object && "color" in object ? object.color : "#ffe8a3");
  const [zIndex, setZIndex] = useState(object?.zIndex ?? 1);
  const [width, setWidth] = useState(object?.kind === "note" ? object.dimensions.width : 220);
  const [height, setHeight] = useState(object?.kind === "note" ? object.dimensions.height : 140);
  const [error, setError] = useState("");
  return <form onSubmit={(event) => {
    event.preventDefault();
    const viewport = getViewport();
    const base = { schemaVersion: "1.0.0", id: object?.id ?? crypto.randomUUID(), revision: (object?.revision ?? 0) + 1, zIndex, kind };
    const value = kind === "note" ? { ...base, text, position: { x, y }, dimensions: { width, height }, color } : kind === "annotation" ? { ...base, text, anchor: targets[0], offset: { x, y } } : kind === "highlight" ? { ...base, targets, color, opacity: object?.kind === "highlight" ? object.opacity : .2 } : kind === "group" ? { ...base, name: text, members: targets } : { ...base, name: text, targets, viewport: object?.kind === "focus" ? object.viewport : viewport };
    const result = presentationObjectSchema.safeParse(value);
    if (!result.success) { setError("Enter plain text and valid dimensions, and select the required targets (maximum 100)."); return; }
    setError(""); onSave(result.data);
  }}>
    {kind !== "highlight" && <label>Object text<textarea required maxLength={kind === "group" || kind === "focus" ? 120 : 1000} value={text} onChange={(event) => setText(event.target.value)} /></label>}
    {kind !== "note" && <fieldset><legend>{kind === "annotation" ? "Anchor (choose one)" : "Targets"}</legend>{options.map((target) => <label key={`${target.kind}:${target.id}`}><input type="checkbox" checked={targets.some((item) => item.kind === target.kind && item.id === target.id)} onChange={(event) => setTargets((current) => event.target.checked ? kind === "annotation" ? [{ kind: target.kind, id: target.id }] : [...current, { kind: target.kind, id: target.id }] : current.filter((item) => item.kind !== target.kind || item.id !== target.id))} />{target.kind}: {target.label}</label>)}</fieldset>}
    {(kind === "note" || kind === "annotation") && <div className={styles.grid}><label>{kind === "annotation" ? "Offset X" : "Position X"}<input required type="number" value={x} onChange={(event) => setX(event.target.valueAsNumber)} /></label><label>{kind === "annotation" ? "Offset Y" : "Position Y"}<input required type="number" value={y} onChange={(event) => setY(event.target.valueAsNumber)} /></label></div>}
    {kind === "note" && <div className={styles.grid}><label>Width<input required type="number" min={80} max={2000} value={width} onChange={(event) => setWidth(event.target.valueAsNumber)} /></label><label>Height<input required type="number" min={40} max={2000} value={height} onChange={(event) => setHeight(event.target.valueAsNumber)} /></label></div>}
    {(kind === "note" || kind === "highlight") && <label>Object color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>}
    <label>Layer<input type="number" required min={-10000} max={10000} value={zIndex} onChange={(event) => setZIndex(event.target.valueAsNumber)} /></label>
    <button type="submit">{object ? "Save object" : "Create object"}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
