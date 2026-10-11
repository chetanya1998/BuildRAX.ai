import { describe, expect, it } from "vitest";
import { buildArchitectureIR } from "./compiler";
import { buildInputTraceability } from "@/lib/intelligence/input";
import { buildExploreIndex, exploreReachability, flowFacts, probeArchitecture, searchArchitecture } from "./explore";

const request = { prompt: "Build a multi-tenant SaaS with background jobs." };
const ir = buildArchitectureIR(request);
describe("G02 Explore queries", () => {
  it("indexes all authorized record types and follows explicit traceability links", () => {
    const trace = buildInputTraceability(request);
    trace.requirements.items[0].architectureRefs = [{ kind: "flow", id: ir.flows[0].id }, { kind: "component", id: "deleted" }];
    const index = buildExploreIndex(ir, trace);
    expect(new Set(index.map((entry) => entry.kind))).toEqual(new Set(["component", "flow", "requirement", "evidence"]));
    const requirement = index.find((entry) => entry.id === trace.requirements.items[0].id)!;
    expect(requirement.flowIds).toEqual([ir.flows[0].id]);
    expect(requirement.componentIds.sort()).toEqual([ir.flows[0].source, ir.flows[0].target].sort());
    const evidence = index.find((entry) => entry.id === trace.requirements.items[0].evidenceRefs[0])!;
    expect(evidence.componentIds).toEqual(requirement.componentIds);
  });
  it("searches case-insensitively, bounds results and never resolves arbitrary references", () => {
    const index = buildExploreIndex(ir);
    expect(searchArchitecture(index, ir.components[0].id.toUpperCase()).entries.some((entry) => entry.id === ir.components[0].id)).toBe(true);
    expect(searchArchitecture(index, "", 1)).toMatchObject({ truncated: true, entries: [index[0]] });
    expect(searchArchitecture(index, "no such component exists").total).toBe(0);
  });
  it("preserves input and stable order while finding directional reachability", () => {
    const before = JSON.stringify(ir);
    const result = exploreReachability(ir, ir.flows[0].source, "downstream");
    expect(result.componentIds).toContain(ir.flows[0].target);
    expect(JSON.stringify(ir)).toBe(before);
    expect(buildExploreIndex({ ...ir, components: [...ir.components].reverse(), flows: [...ir.flows].reverse() })).toEqual(buildExploreIndex(ir));
  });
  it("labels unspecified flow facts Unknown", () => {
    expect(flowFacts({ ...ir.flows[0], protocol: undefined, security: { authentication: "", encryption: "", dataClassification: "unspecified" } })).toEqual({ protocol: "Unknown", authentication: "Unknown", encryption: "Unknown", dataClassification: "Unknown" });
  });
  it("separates bounded route enumeration from shortest-path reachability", () => {
    const flow = ir.flows[0];
    const result = probeArchitecture(ir, flow.source, flow.target, { maxDepth: 0, timeoutMs: 1000 });
    expect(result.shortest?.flowIds).toContain(flow.id);
    expect(result.paths).toEqual([]);
    expect(result.truncated).toBe(true);
    expect(result.reasons).toContain("depth");
  });
  it("rejects stale endpoints rather than inventing a route", () => {
    expect(() => probeArchitecture(ir, "removed", ir.components[0].id)).toThrow("Unknown component");
    expect(probeArchitecture({ ...ir, flows: [] }, ir.components[0].id, ir.components[1].id).shortest).toBeNull();
  });
});
