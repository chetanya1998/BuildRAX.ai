import { z } from "zod";
import { architectureIRSchema, type ArchitectureIR } from "./schema";

export type GraphArc = { flowId: string; from: string; to: string };
export type GraphPath = { componentIds: string[]; flowIds: string[] };
/** Membership lists, not an ordered walk: one group can contain many cycles. */
export type CyclicGroup = { componentIds: string[]; flowIds: string[] };
/** A semantic assertion supplied by the caller, never inferred from arrowheads. */
export type Dependency = { dependentId: string; dependencyId: string; flowId?: string };
export type PathSearchOptions = {
  maxDepth?: number;
  maxPaths?: number;
  maxExpansions?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
};
export type PathSearchResult = {
  paths: GraphPath[];
  truncated: boolean;
  reasons: Array<"depth" | "paths" | "expansions" | "time" | "cancelled">;
  expansions: number;
};

const topologySchema = architectureIRSchema.pick({ components: true, flows: true });
const dependencySchema = z.array(z.object({
  dependentId: z.string().min(1).max(120), dependencyId: z.string().min(1).max(120), flowId: z.string().min(1).max(120).optional(),
}).strict()).max(400);
const limitsSchema = z.object({
  maxDepth: z.number().int().min(0).max(100).default(20),
  maxPaths: z.number().int().min(1).max(1000).default(50),
  maxExpansions: z.number().int().min(1).max(100_000).default(10_000),
  timeoutMs: z.number().finite().min(0).max(1000).default(50),
});
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const sorted = (ids: Iterable<string>) => [...new Set(ids)].sort(compare);

/** Read-only topology snapshot; independent of presentation, AI and persistence. */
export class ArchitectureGraph {
  private readonly ids: string[];
  private readonly forward = new Map<string, GraphArc[]>();
  private readonly reverse = new Map<string, GraphArc[]>();
  private readonly requires = new Map<string, string[]>();
  private readonly requiredBy = new Map<string, string[]>();

  constructor(input: Pick<ArchitectureIR, "components" | "flows">, dependencies: readonly Dependency[] = []) {
    const { components, flows } = topologySchema.parse({ components: input.components, flows: input.flows });
    this.ids = sorted(components.map((component) => component.id));
    if (this.ids.length !== components.length) throw new Error("Duplicate component ID in graph.");
    for (const id of this.ids) {
      this.forward.set(id, []); this.reverse.set(id, []);
      this.requires.set(id, []); this.requiredBy.set(id, []);
    }
    const flowById = new Map<string, typeof flows[number]>();
    const add = (arc: GraphArc) => { this.forward.get(arc.from)!.push(arc); this.reverse.get(arc.to)!.push(arc); };
    for (const flow of flows) {
      if (flowById.has(flow.id)) throw new Error("Duplicate flow ID in graph.");
      this.assertId(flow.source); this.assertId(flow.target);
      if (flow.source === flow.target) throw new Error("Self flows are not supported by Architecture IR.");
      flowById.set(flow.id, flow);
      add({ flowId: flow.id, from: flow.source, to: flow.target });
      if (flow.direction === "bidirectional") add({ flowId: flow.id, from: flow.target, to: flow.source });
    }
    for (const arcs of this.forward.values()) arcs.sort((a, b) => compare(a.to, b.to) || compare(a.flowId, b.flowId));
    for (const arcs of this.reverse.values()) arcs.sort((a, b) => compare(a.from, b.from) || compare(a.flowId, b.flowId));
    for (const relation of dependencySchema.parse(dependencies)) {
      this.assertId(relation.dependentId); this.assertId(relation.dependencyId);
      if (relation.dependentId === relation.dependencyId) throw new Error("A component cannot depend on itself.");
      if (relation.flowId) {
        const flow = flowById.get(relation.flowId);
        if (!flow || ![flow.source, flow.target].includes(relation.dependentId) || ![flow.source, flow.target].includes(relation.dependencyId)) throw new Error("Dependency flow must connect the declared components.");
      }
      this.requires.get(relation.dependentId)!.push(relation.dependencyId);
      this.requiredBy.get(relation.dependencyId)!.push(relation.dependentId);
    }
    for (const index of [this.requires, this.requiredBy]) for (const [id, neighbors] of index) index.set(id, sorted(neighbors));
  }

  private assertId(id: string) {
    if (!this.forward.has(id)) throw new Error(`Unknown component ID: ${id}`);
  }
  componentIds() { return [...this.ids]; }
  incoming(id: string) { this.assertId(id); return this.reverse.get(id)!.map((arc) => ({ ...arc })); }
  outgoing(id: string) { this.assertId(id); return this.forward.get(id)!.map((arc) => ({ ...arc })); }

  private reachable(id: string, neighbors: (id: string) => string[]) {
    this.assertId(id);
    const visited = new Set([id]);
    const queue = [id];
    for (let index = 0; index < queue.length; index++) for (const next of neighbors(queue[index])) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
    visited.delete(id);
    return sorted(visited);
  }
  downstream(id: string) { return this.reachable(id, (node) => this.forward.get(node)!.map((arc) => arc.to)); }
  upstream(id: string) { return this.reachable(id, (node) => this.reverse.get(node)!.map((arc) => arc.from)); }
  dependencies(id: string, transitive = false) {
    this.assertId(id);
    return transitive ? this.reachable(id, (node) => this.requires.get(node)!) : [...this.requires.get(id)!];
  }
  dependents(id: string, transitive = false) {
    this.assertId(id);
    return transitive ? this.reachable(id, (node) => this.requiredBy.get(node)!) : [...this.requiredBy.get(id)!];
  }

  shortestPath(from: string, to: string): GraphPath | null {
    this.assertId(from); this.assertId(to);
    const queue = [from];
    const previous = new Map<string, GraphArc | null>([[from, null]]);
    for (let index = 0; index < queue.length && !previous.has(to); index++) {
      for (const arc of this.forward.get(queue[index])!) if (!previous.has(arc.to)) { previous.set(arc.to, arc); queue.push(arc.to); }
    }
    if (!previous.has(to)) return null;
    const componentIds = [to]; const flowIds: string[] = [];
    let current = to;
    while (current !== from) { const arc = previous.get(current)!; flowIds.push(arc.flowId); componentIds.push(arc.from); current = arc.from; }
    return { componentIds: componentIds.reverse(), flowIds: flowIds.reverse() };
  }

  /** Enumerate simple directed paths, preserving parallel flows as distinct paths. */
  allPaths(from: string, to: string, options: PathSearchOptions = {}, now: () => number = () => performance.now()): PathSearchResult {
    this.assertId(from); this.assertId(to);
    const limits = limitsSchema.parse(options);
    const deadline = now() + limits.timeoutMs;
    const paths: GraphPath[] = [];
    const reasons = new Set<PathSearchResult["reasons"][number]>();
    let expansions = 0;
    const stopped = () => {
      if (options.signal?.aborted) { reasons.add("cancelled"); return true; }
      if (now() >= deadline) { reasons.add("time"); return true; }
      return false;
    };
    const visited = new Set([from]); const nodes = [from]; const flows: string[] = [];
    const walk = (id: string): boolean => {
      if (stopped()) return false;
      if (id === to) {
        // Discover one extra path before claiming the path-count bound truncated.
        if (paths.length === limits.maxPaths) { reasons.add("paths"); return false; }
        paths.push({ componentIds: [...nodes], flowIds: [...flows] });
        return true;
      }
      for (const arc of this.forward.get(id)!) {
        if (stopped()) return false;
        if (visited.has(arc.to)) continue;
        if (flows.length >= limits.maxDepth) { reasons.add("depth"); continue; }
        if (expansions >= limits.maxExpansions) { reasons.add("expansions"); return false; }
        expansions++;
        visited.add(arc.to); nodes.push(arc.to); flows.push(arc.flowId);
        const complete = walk(arc.to);
        visited.delete(arc.to); nodes.pop(); flows.pop();
        if (!complete) return false;
      }
      return true;
    };
    walk(from);
    return { paths, truncated: reasons.size > 0, reasons: [...reasons].sort(compare), expansions };
  }

  orphans() { return this.ids.filter((id) => !this.forward.get(id)!.length && !this.reverse.get(id)!.length); }
  connectedComponents() {
    const remaining = new Set(this.ids); const groups: string[][] = [];
    for (const id of this.ids) if (remaining.has(id)) {
      const group = sorted([id, ...this.reachable(id, (node) => [...this.forward.get(node)!.map((arc) => arc.to), ...this.reverse.get(node)!.map((arc) => arc.from)])]);
      group.forEach((node) => remaining.delete(node)); groups.push(group);
    }
    return groups;
  }

  /** Cyclic strongly connected groups, not exponential elementary-cycle enumeration. */
  cycles(): CyclicGroup[] {
    const seen = new Set<string>(); const finish: string[] = [];
    const visit = (id: string) => { if (seen.has(id)) return; seen.add(id); for (const arc of this.forward.get(id)!) visit(arc.to); finish.push(id); };
    this.ids.forEach(visit);
    seen.clear();
    const groups: CyclicGroup[] = [];
    const collect = (id: string, group: Set<string>) => { if (seen.has(id)) return; seen.add(id); group.add(id); for (const arc of this.reverse.get(id)!) collect(arc.from, group); };
    for (const id of finish.reverse()) if (!seen.has(id)) {
      const group = new Set<string>(); collect(id, group);
      if (group.size > 1) groups.push({ componentIds: sorted(group), flowIds: sorted([...group].flatMap((node) => this.forward.get(node)!.filter((arc) => group.has(arc.to)).map((arc) => arc.flowId))) });
    }
    return groups.sort((a, b) => compare(a.componentIds[0], b.componentIds[0]));
  }

  impact(failedIds: readonly string[]) {
    failedIds.forEach((id) => this.assertId(id));
    const failed = new Set(failedIds);
    const impactedIds = sorted([...failed].flatMap((id) => this.dependents(id, true))).filter((id) => !failed.has(id));
    const affected = new Set([...failed, ...impactedIds]);
    const flowIds = sorted(this.ids.flatMap((id) => this.forward.get(id)!.filter((arc) => affected.has(arc.from) || affected.has(arc.to)).map((arc) => arc.flowId)));
    return { failedIds: sorted(failed), impactedIds, flowIds, basis: "explicit-dependencies-only" as const, structuralOnly: true as const };
  }
}
