"use client";

import { useMemo, useState } from "react";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { TraceabilityBundle } from "@/lib/intelligence/schema";
import { buildExploreIndex, emptyExploreFocus, exploreReachability, flowFacts, probeArchitecture, searchArchitecture, type ExploreEntry, type ExploreFocus } from "@/lib/architecture-ir/explore";
import styles from "./explore-panel.module.css";

type Props = { ir: ArchitectureIR; traceability?: TraceabilityBundle; selectedId: string | null; onFocus: (focus: ExploreFocus, selectedId?: string) => void };

export function ExplorePanel({ ir, traceability, selectedId, onFocus }: Props) {
  const [query, setQuery] = useState("");
  const [record, setRecord] = useState<ExploreEntry | null>(null);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [probe, setProbe] = useState<ReturnType<typeof probeArchitecture> | null>(null);
  const index = useMemo(() => buildExploreIndex(ir, traceability), [ir, traceability]);
  const search = useMemo(() => searchArchitecture(index, query), [index, query]);
  const selected = index.find((entry) => entry.id === selectedId && (entry.kind === "component" || entry.kind === "flow")) ?? record;
  const selectedFlow = ir.flows.find((flow) => flow.id === selected?.id);
  const related = selected ? index.filter((entry) => (entry.kind === "evidence" || entry.kind === "requirement") && (selected.kind === "component" ? entry.componentIds.includes(selected.id) : entry.flowIds.includes(selected.id))) : [];
  function reset() { setQuery(""); setRecord(null); setSource(""); setTarget(""); setProbe(null); onFocus(emptyExploreFocus()); }
  function choose(entry: ExploreEntry) { setRecord(entry); onFocus(entry, entry.kind === "component" || entry.kind === "flow" ? entry.id : undefined); }

  return <aside className={styles.panel} aria-label="Explore architecture" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); reset(); } }}>
    <header><h2>Explore</h2><button onClick={reset}>Reset focus</button></header>
    <p>Read-only · No AI calls. Reachability follows flow direction, not operational dependency.</p>
    <label>Search architecture<input autoFocus aria-label="Search architecture" maxLength={300} placeholder="Components, flows, requirements, evidence" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <p role="status">{search.total} results{search.truncated ? ` · showing ${search.entries.length}` : ""}</p>
    <ul className={styles.results}>{search.entries.map((entry) => <li key={`${entry.kind}:${entry.id}`}><button onClick={() => choose(entry)}><small>{entry.kind}</small> {entry.label}</button></li>)}</ul>
    {selected && <section aria-label="Explore details"><h3>{selected.label}</h3><p>{selected.detail}</p>
      {!selected.componentIds.length && !selected.flowIds.length && <p>No current canvas references.</p>}
      {selected.kind === "component" && <div className={styles.actions}>{(["upstream", "downstream"] as const).map((direction) => <button key={direction} onClick={() => onFocus(exploreReachability(ir, selected.id, direction), selected.id)}>Highlight {direction}</button>)}</div>}
      {selectedFlow && <dl>{Object.entries(flowFacts(selectedFlow)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
      <h4>Requirements and evidence</h4>{related.length ? <ul>{related.map((item) => <li key={`${item.kind}:${item.id}`}><button onClick={() => choose(item)}>{item.kind}: {item.label}</button><p>{item.detail}</p></li>)}</ul> : <p>No linked requirements or evidence supplied for this object.</p>}
    </section>}
    <section aria-label="Route probe"><h3>Route probe</h3>
      <label>Source<select aria-label="Route source" value={source} onChange={(event) => { setSource(event.target.value); setProbe(null); onFocus(emptyExploreFocus()); }}><option value="">Choose source</option>{ir.components.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Target<select aria-label="Route target" value={target} onChange={(event) => { setTarget(event.target.value); setProbe(null); onFocus(emptyExploreFocus()); }}><option value="">Choose target</option>{ir.components.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button disabled={!source || !target} onClick={() => { const result = probeArchitecture(ir, source, target); setProbe(result); onFocus(result.shortest ?? emptyExploreFocus()); }}>Find routes</button>
      {probe && <div role="status">{probe.shortest ? <><p>Shortest route: {probe.shortest.componentIds.map((id) => ir.components.find((item) => item.id === id)?.name ?? id).join(" → ")}</p>{probe.shortest.facts.map((flow, i) => <p key={`${flow.id}:${i}`}>{flow.id} · Protocol: {flow.protocol} · Authentication: {flow.authentication} · Encryption: {flow.encryption} · Classification: {flow.dataClassification}</p>)}</> : <p>No directed route exists.</p>}
        <p>{probe.paths.length} bounded simple routes. {probe.truncated ? `Partial search: ${probe.reasons.join(", ")}.` : "Search complete within configured limits."}</p>
        {probe.paths.map((path, i) => <button key={i} onClick={() => onFocus(path)}>Highlight route {i + 1}</button>)}
        <p>Depth 12 · 10 paths · 2,000 expansions · 30 ms. Shortest path is computed separately. No capacity, reachability at runtime or failover guarantee.</p>
      </div>}
    </section>
  </aside>;
}
