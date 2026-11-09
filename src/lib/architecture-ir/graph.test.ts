import { describe, expect, it } from "vitest";
import { buildArchitectureIR } from "./compiler";
import { ArchitectureGraph, type Dependency } from "./graph";
import type { ArchitectureIR } from "./schema";

const base = buildArchitectureIR({ prompt: "Build a multi-tenant SaaS with background jobs." });
function fixture(ids: string[], edges: Array<[string, string, string, "bidirectional"?]>): ArchitectureIR {
  return { ...base,
    components: ids.map((id) => ({ ...base.components[0], id, name: id, category: "compute", semanticType: "backend-service" })),
    flows: edges.map(([id, source, target, direction]) => ({ ...base.flows[0], id, source, target, direction: direction ?? "unidirectional" })),
    assumptions: [],
  };
}
const linear = () => fixture(["a", "b", "c", "orphan"], [["ab", "a", "b"], ["bc", "b", "c"]]);
const noClock = () => 0;

describe("G01 deterministic graph engine", () => {
  it("indexes incoming/outgoing IDs and traverses a directed linear graph", () => {
    const graph = new ArchitectureGraph(linear());
    expect(graph.outgoing("a")).toEqual([{ flowId: "ab", from: "a", to: "b" }]);
    expect(graph.incoming("b")).toEqual([{ flowId: "ab", from: "a", to: "b" }]);
    expect(graph.downstream("a")).toEqual(["b", "c"]);
    expect(graph.upstream("c")).toEqual(["a", "b"]);
    expect(graph.upstream("a")).toEqual([]);
    expect(graph.shortestPath("a", "c")).toEqual({ componentIds: ["a", "b", "c"], flowIds: ["ab", "bc"] });
    expect(graph.shortestPath("c", "a")).toBeNull();
  });
  it("finds orphans and weakly connected components", () => {
    const graph = new ArchitectureGraph(linear());
    expect(graph.orphans()).toEqual(["orphan"]);
    expect(graph.connectedComponents()).toEqual([["a", "b", "c"], ["orphan"]]);
    expect(graph.allPaths("a", "orphan", {}, noClock)).toMatchObject({ paths: [], truncated: false });
    expect(graph.shortestPath("a", "a")).toEqual({ componentIds: ["a"], flowIds: [] });
  });
  it("selects stable shortest paths through branches and parallel flows", () => {
    const graph = new ArchitectureGraph(fixture(["d", "c", "b", "a"], [["ac", "a", "c"], ["cd", "c", "d"], ["ab2", "a", "b"], ["ab1", "a", "b"], ["bd", "b", "d"]]));
    expect(graph.shortestPath("a", "d")?.flowIds).toEqual(["ab1", "bd"]);
    expect(graph.allPaths("a", "d", {}, noClock)).toMatchObject({ truncated: false, paths: [
      { componentIds: ["a", "b", "d"], flowIds: ["ab1", "bd"] },
      { componentIds: ["a", "b", "d"], flowIds: ["ab2", "bd"] },
      { componentIds: ["a", "c", "d"], flowIds: ["ac", "cd"] },
    ] });
  });
  it("handles bidirectional flows without losing their original flow ID", () => {
    const graph = new ArchitectureGraph(fixture(["a", "b"], [["ab", "a", "b", "bidirectional"]]));
    expect(graph.shortestPath("b", "a")).toEqual({ componentIds: ["b", "a"], flowIds: ["ab"] });
    expect(graph.cycles()).toEqual([{ componentIds: ["a", "b"], flowIds: ["ab"] }]);
    expect(graph.downstream("a")).toEqual(["b"]);
    expect(graph.dependencies("a")).toEqual([]);
  });
  it("reports cyclic groups and terminates simple paths through cycles", () => {
    const graph = new ArchitectureGraph(fixture(["a", "b", "c", "d", "e", "f"], [["ab", "a", "b"], ["bc", "b", "c"], ["ca", "c", "a"], ["cd", "c", "d"], ["ef", "e", "f"], ["fe", "f", "e"]]));
    expect(graph.cycles()).toEqual([
      { componentIds: ["a", "b", "c"], flowIds: ["ab", "bc", "ca"] },
      { componentIds: ["e", "f"], flowIds: ["ef", "fe"] },
    ]);
    expect(graph.allPaths("a", "d", {}, noClock)).toMatchObject({ truncated: false, paths: [{ componentIds: ["a", "b", "c", "d"], flowIds: ["ab", "bc", "cd"] }] });
    expect(graph.allPaths("a", "a", {}, noClock).paths).toEqual([{ componentIds: ["a"], flowIds: [] }]);
  });
  it("keeps operational dependencies independent of traffic arrows", () => {
    const graph = new ArchitectureGraph(linear(), [
      { dependentId: "b", dependencyId: "a", flowId: "ab" },
      { dependentId: "c", dependencyId: "b", flowId: "bc" },
    ]);
    expect(graph.dependencies("c")).toEqual(["b"]);
    expect(graph.dependencies("c", true)).toEqual(["a", "b"]);
    expect(graph.dependents("a", true)).toEqual(["b", "c"]);
    expect(graph.impact(["a", "a"])).toEqual({ failedIds: ["a"], impactedIds: ["b", "c"], flowIds: ["ab", "bc"], basis: "explicit-dependencies-only", structuralOnly: true });
    expect(new ArchitectureGraph(linear()).impact(["a"]).impactedIds).toEqual([]);
    expect(graph.impact(["a", "b"]).impactedIds).toEqual(["c"]);
  });
  it("terminates cyclic dependency queries and deduplicates relations", () => {
    const graph = new ArchitectureGraph(linear(), [
      { dependentId: "a", dependencyId: "b" }, { dependentId: "b", dependencyId: "a" }, { dependentId: "a", dependencyId: "b" },
    ]);
    expect(graph.dependencies("a", true)).toEqual(["b"]);
    expect(graph.dependents("b")).toEqual(["a"]);
  });
  it("is invariant under input order and layout changes", () => {
    const original = linear();
    const shuffled = { ...original, components: [...original.components].reverse().map((node) => ({ ...node, layoutHint: { x: 9999, y: -100 } })), flows: [...original.flows].reverse() };
    const left = new ArchitectureGraph(original); const right = new ArchitectureGraph(shuffled);
    expect(right.componentIds()).toEqual(left.componentIds());
    expect(right.allPaths("a", "c", {}, noClock)).toEqual(left.allPaths("a", "c", {}, noClock));
    expect(right.connectedComponents()).toEqual(left.connectedComponents());
    expect(right.cycles()).toEqual(left.cycles());
  });
  it("snapshots topology and protects indexes from caller mutations", () => {
    const input = linear(); const dependencies: Dependency[] = [{ dependentId: "a", dependencyId: "b" }];
    const before = JSON.stringify(input);
    const graph = new ArchitectureGraph(input, dependencies);
    expect(JSON.stringify(input)).toBe(before);
    input.flows[0].target = "c"; dependencies[0].dependencyId = "c";
    graph.outgoing("a")[0].to = "orphan"; graph.componentIds().pop(); graph.dependencies("a").pop();
    expect(graph.shortestPath("a", "c")?.flowIds).toEqual(["ab", "bc"]);
    expect(graph.dependencies("a")).toEqual(["b"]);
  });
  it("reports a depth-limited partial search explicitly", () => {
    const graph = new ArchitectureGraph(linear());
    expect(graph.allPaths("a", "c", { maxDepth: 1 }, noClock)).toMatchObject({ paths: [], truncated: true, reasons: ["depth"] });
    expect(graph.allPaths("a", "c", { maxDepth: 2 }, noClock).truncated).toBe(false);
  });
  it("reports path truncation only when another valid path exists", () => {
    const graph = new ArchitectureGraph(fixture(["a", "b"], [["one", "a", "b"], ["two", "a", "b"]]));
    expect(graph.allPaths("a", "b", { maxPaths: 1 }, noClock)).toMatchObject({ truncated: true, reasons: ["paths"], paths: [{ componentIds: ["a", "b"], flowIds: ["one"] }] });
    expect(graph.allPaths("a", "b", { maxPaths: 2 }, noClock).truncated).toBe(false);
  });
  it("stops at expansion and time limits", () => {
    const graph = new ArchitectureGraph(linear());
    expect(graph.allPaths("a", "c", { maxExpansions: 1 }, noClock)).toMatchObject({ paths: [], expansions: 1, reasons: ["expansions"], truncated: true });
    let tick = 0;
    expect(graph.allPaths("a", "c", { timeoutMs: 1 }, () => tick++)).toMatchObject({ paths: [], reasons: ["time"], truncated: true });
    expect(graph.allPaths("a", "c", { timeoutMs: 0 }, noClock).reasons).toEqual(["time"]);
  });
  it("cancels without publishing a complete-search claim", () => {
    const signal = AbortSignal.abort();
    expect(new ArchitectureGraph(linear()).allPaths("a", "c", { signal }, noClock)).toEqual({ paths: [], truncated: true, reasons: ["cancelled"], expansions: 0 });
  });
  it("rejects invalid query limits and unknown IDs", () => {
    const graph = new ArchitectureGraph(linear());
    for (const options of [{ maxDepth: -1 }, { maxDepth: 101 }, { maxPaths: 0 }, { maxPaths: 1001 }, { maxExpansions: 100_001 }, { timeoutMs: NaN }, { timeoutMs: Infinity }]) expect(() => graph.allPaths("a", "c", options)).toThrow();
    expect(() => graph.shortestPath("missing", "a")).toThrow("Unknown component ID");
    expect(() => graph.incoming("missing")).toThrow();
    expect(() => graph.impact(["missing"])).toThrow();
  });
  it("preserves partial-search status when cancelled during traversal", () => {
    const controller = new AbortController();
    let ticks = 0;
    const result = new ArchitectureGraph(linear()).allPaths("a", "c", { signal: controller.signal }, () => {
      if (++ticks === 3) controller.abort();
      return 0;
    });
    expect(result).toMatchObject({ truncated: true, reasons: ["cancelled"], paths: [] });
  });
  it("handles the maximum IR component count and a deep cycle", () => {
    const ids = Array.from({ length: 100 }, (_, i) => `n${String(i).padStart(3, "0")}`);
    const edges: Array<[string, string, string]> = ids.slice(0, -1).map((id, i) => [`f${i}`, id, ids[i + 1]]);
    edges.push(["back", ids.at(-1)!, ids[0]]);
    const graph = new ArchitectureGraph(fixture(ids, edges));
    expect(graph.downstream(ids[0])).toHaveLength(99);
    expect(graph.cycles()[0].componentIds).toHaveLength(100);
    const result = graph.allPaths(ids[0], ids.at(-1)!, { maxDepth: 100 }, noClock);
    expect(result.truncated).toBe(false);
    expect(result.paths[0].flowIds).toHaveLength(99);
  });
  it("rejects ambiguous topology and unsupported dependency references", () => {
    expect(() => new ArchitectureGraph(fixture(["a", "a"], []))).toThrow("Duplicate component");
    expect(() => new ArchitectureGraph(fixture(["a", "b"], [["x", "a", "b"], ["x", "b", "a"]]))).toThrow("Duplicate flow");
    expect(() => new ArchitectureGraph(fixture(["a"], [["x", "a", "b"]]))).toThrow("Unknown component");
    expect(() => new ArchitectureGraph(fixture(["a"], [["x", "a", "a"]]))).toThrow("Self flows");
    expect(() => new ArchitectureGraph(linear(), [{ dependentId: "a", dependencyId: "missing" }])).toThrow();
    expect(() => new ArchitectureGraph(linear(), [{ dependentId: "a", dependencyId: "a" }])).toThrow();
    expect(() => new ArchitectureGraph(linear(), [{ dependentId: "a", dependencyId: "c", flowId: "ab" }])).toThrow("Dependency flow");
  });
  it("accepts blank architecture and leaves an empty impact empty", () => {
    const graph = new ArchitectureGraph(fixture([], []));
    expect(graph.componentIds()).toEqual([]); expect(graph.cycles()).toEqual([]);
    expect(graph.orphans()).toEqual([]); expect(graph.connectedComponents()).toEqual([]);
    expect(graph.impact([])).toMatchObject({ failedIds: [], impactedIds: [], flowIds: [] });
  });
  it("bounds a combinatorial graph without invoking AI or including presentation data", () => {
    const ids = Array.from({ length: 20 }, (_, i) => `n${String(i).padStart(2, "0")}`);
    const edges: Array<[string, string, string]> = [];
    ids.forEach((from, i) => ids.slice(i + 1).forEach((to) => edges.push([`${from}-${to}`, from, to])));
    const graph = new ArchitectureGraph(fixture(ids, edges));
    const result = graph.allPaths(ids[0], ids.at(-1)!, { maxPaths: 5, maxExpansions: 100 }, noClock);
    expect(result.truncated).toBe(true); expect(result.paths.length).toBeLessThanOrEqual(5);
    expect(result.expansions).toBeLessThanOrEqual(100);
    for (const path of result.paths) expect(Object.keys(path).sort()).toEqual(["componentIds", "flowIds"]);
  });
});
