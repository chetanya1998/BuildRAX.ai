import type { TraceabilityBundle } from "@/lib/intelligence/schema";
import { ArchitectureGraph, type GraphPath, type PathSearchOptions } from "./graph";
import type { ArchitectureIR, ArchitectureIRFlow } from "./schema";

export type ExploreFocus = { componentIds: string[]; flowIds: string[] };
export type ExploreEntry = ExploreFocus & {
  id: string;
  kind: "component" | "flow" | "requirement" | "evidence";
  label: string;
  detail: string;
};
export const emptyExploreFocus = (): ExploreFocus => ({ componentIds: [], flowIds: [] });
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Search only caller-authorized IR/traceability. Never fetch evidence sources. */
export function buildExploreIndex(ir: ArchitectureIR, traceability?: TraceabilityBundle): ExploreEntry[] {
  const components = new Set(ir.components.map((item) => item.id));
  const flows = new Map(ir.flows.map((item) => [item.id, item]));
  function focus(refs: Array<{ kind: "component" | "flow"; id: string }>): ExploreFocus {
    const flowIds = [...new Set(refs.filter((ref) => ref.kind === "flow" && flows.has(ref.id)).map((ref) => ref.id))];
    return { flowIds: flowIds.sort(compare), componentIds: [...new Set([
      ...refs.filter((ref) => ref.kind === "component" && components.has(ref.id)).map((ref) => ref.id),
      ...flowIds.flatMap((id) => [flows.get(id)!.source, flows.get(id)!.target]).filter((id) => components.has(id)),
    ])].sort(compare) };
  }
  const requirements = traceability?.requirements.items ?? [];
  return [
    ...ir.components.map((item): ExploreEntry => ({ id: item.id, kind: "component", label: item.name, detail: [item.description, item.semanticType, item.technology].filter(Boolean).join(" · "), componentIds: [item.id], flowIds: [] })),
    ...ir.flows.map((item): ExploreEntry => ({ id: item.id, kind: "flow", label: item.label, detail: `${item.source} → ${item.target} · ${item.type} · ${item.protocol || "Unknown protocol"}`, ...focus([{ kind: "flow", id: item.id }]) })),
    ...requirements.map((item): ExploreEntry => ({ id: item.id, kind: "requirement", label: item.statement, detail: `${item.state} · ${item.origin}${item.question ? ` · ${item.question}` : ""}`, ...focus(item.architectureRefs) })),
    ...(traceability?.evidence.items ?? []).map((item): ExploreEntry => ({ id: item.id, kind: "evidence", label: item.claim, detail: `${item.verification} · ${item.origin}`, ...focus(requirements.filter((requirement) => requirement.evidenceRefs.includes(item.id)).flatMap((requirement) => requirement.architectureRefs)) })),
  ].sort((a, b) => compare(a.kind, b.kind) || compare(a.label, b.label) || compare(a.id, b.id));
}

export function searchArchitecture(index: readonly ExploreEntry[], query: string, limit = 40) {
  const terms = query.trim().toLowerCase().slice(0, 300).split(/\s+/).filter(Boolean);
  const matches = index.filter((item) => terms.every((term) => `${item.id} ${item.kind} ${item.label} ${item.detail}`.toLowerCase().includes(term)));
  const bounded = Math.max(1, Math.min(100, Number.isFinite(limit) ? Math.floor(limit) : 40));
  return { entries: matches.slice(0, bounded), total: matches.length, truncated: matches.length > bounded };
}

const known = (value?: string) => value?.trim() && value !== "unspecified" ? value : "Unknown";
export function flowFacts(flow: ArchitectureIRFlow) {
  return { protocol: known(flow.protocol), authentication: known(flow.security.authentication), encryption: known(flow.security.encryption), dataClassification: known(flow.security.dataClassification) };
}

export function probeArchitecture(ir: ArchitectureIR, from: string, to: string, limits: PathSearchOptions = {}) {
  const graph = new ArchitectureGraph(ir);
  const paths = graph.allPaths(from, to, { maxDepth: 12, maxPaths: 10, maxExpansions: 2_000, timeoutMs: 30, ...limits });
  const describe = (path: GraphPath) => ({ ...path, facts: path.flowIds.map((id) => ({ id, ...flowFacts(ir.flows.find((flow) => flow.id === id)!) })) });
  const shortest = graph.shortestPath(from, to);
  return { ...paths, paths: paths.paths.map(describe), shortest: shortest ? describe(shortest) : null };
}

/** Flow reachability is not evidence of operational dependency or failover. */
export function exploreReachability(ir: ArchitectureIR, id: string, direction: "upstream" | "downstream"): ExploreFocus {
  const graph = new ArchitectureGraph(ir);
  const componentIds = [id, ...graph[direction](id)].sort(compare);
  const included = new Set(componentIds);
  return { componentIds, flowIds: ir.flows.filter((flow) => included.has(flow.source) && included.has(flow.target)).map((flow) => flow.id).sort(compare) };
}
