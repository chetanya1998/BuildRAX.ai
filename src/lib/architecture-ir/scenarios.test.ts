import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { createConnector, createDiagram, createNode } from "@/lib/domain/factory";
import { diagramSchema } from "@/lib/domain/schema";
import { buildArchitectureIR, compileArchitectureIR } from "./compiler";
import { architectureIRSchema, architectureIRProposalSchema } from "./schema";
import { architectureIRFromDiagram, canonicalSha256, createArchitectureSnapshot, materializeArchitecture, presentationFromDiagram } from "./snapshot";
import { scenarioSchema, scenariosSchema } from "./scenario-schema";
import { ScenarioPlayback, scenarioFromPath, seedPatternScenarios, validateScenario } from "./scenarios";
import { buildInputTraceability } from "@/lib/intelligence/input";
import { loadRecovery, recoveryArchitecture, recoveryKey, saveRecovery } from "@/lib/storage/drafts";

function fixture() {
  const diagram = createDiagram("Journey", ["a", "b", "c", "orphan"].map((id) => createNode("backend-service", id, id, 0, 0)), [createConnector("ab", "a", "b", "http-rest", "Request"), createConnector("bc", "b", "c", "http-rest", "Response")]);
  const ir = architectureIRFromDiagram(diagram);
  const scenario = scenarioFromPath(ir, { componentIds: ["a", "b", "c"], flowIds: ["ab", "bc"] }, { id: "journey", name: "A to C", patternId: "microservices" });
  return { diagram, ir, scenario };
}
describe("G03 scenario contracts and persistence", () => {
  it("does not add fields or alter legacy checksums when absent", async () => {
    const { ir, diagram } = fixture();
    expect(architectureIRSchema.parse(ir)).not.toHaveProperty("scenarios");
    expect(diagramSchema.parse(diagram)).not.toHaveProperty("scenarios");
    expect(await canonicalSha256(ir)).toBe(await canonicalSha256(architectureIRSchema.parse(ir)));
  });
  it("round-trips ordered versioned scenarios through compilation and snapshots", async () => {
    const { ir, diagram, scenario } = fixture(); ir.scenarios = [scenario];
    const compiled = compileArchitectureIR(ir);
    expect(compiled.scenarios).toEqual([scenario]);
    expect(architectureIRFromDiagram(compiled, ir).scenarios).toEqual([scenario]);
    const snapshot = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, presentation: presentationFromDiagram(diagram) });
    expect(snapshot.materializedDiagram.scenarios).toEqual([scenario]);
    expect(materializeArchitecture(snapshot.ir, snapshot.presentation, { id: diagram.id, version: 1 }).scenarios).toEqual([scenario]);
    expect(architectureIRProposalSchema.safeParse({ ...ir, provenance: undefined }).success).toBe(false);
  });
  it("recovers scenarios through the existing guest store without a new table", async () => {
    const { ir, diagram, scenario } = fixture(); diagram.scenarios = [scenario];
    const scope = { kind: "guest" as const };
    const record = { schemaVersion: 1 as const, key: recoveryKey(scope, diagram.id), scope, revision: 0, diagram, architecture: recoveryArchitecture(diagram, ir, 1), document: "", updatedAt: diagram.updatedAt };
    await saveRecovery(record, 0);
    const recovered = await loadRecovery(scope, diagram.id);
    expect(recovered?.diagram.scenarios).toEqual([scenario]);
    expect(recovered?.architecture.ir.scenarios).toEqual([scenario]);
  });
  it("retains stale saved scenarios but prevents missing and changed flow playback", () => {
    const { ir, scenario } = fixture(); ir.scenarios = [scenario];
    ir.flows[0].protocol = "gRPC";
    expect(validateScenario(scenario, ir).issues).toContainEqual({ stepId: "step-1", reason: "changed-flow" });
    ir.flows = ir.flows.slice(1);
    expect(architectureIRSchema.parse(ir).scenarios).toEqual([scenario]);
    expect(validateScenario(scenario, ir).issues).toContainEqual({ stepId: "step-1", reason: "missing-flow" });
    expect(new ScenarioPlayback(scenario).dispatch("play", ir)).toMatchObject({ phase: "invalid", focus: { componentIds: [], flowIds: [] } });
  });
  it("ignores position, input ordering and unrelated edits when checking bindings", () => {
    const { ir, scenario } = fixture();
    ir.components.reverse(); ir.flows.reverse(); ir.components[0].layoutHint = { x: 999, y: 300 };
    ir.intent.title = "Different display title";
    expect(validateScenario(scenario, ir).valid).toBe(true);
  });
  it("validates reference existence and their connection to each step", () => {
    const { ir, scenario } = fixture();
    const traceability = buildInputTraceability({ prompt: "Build a service with auditable event processing." });
    const requirement = traceability.requirements.items[0];
    requirement.architectureRefs = [{ kind: "flow", id: "ab" }];
    const bound = scenarioFromPath(ir, { componentIds: ["a", "b"], flowIds: ["ab"] }, { id: "bound", name: "Bound", patternId: "microservices", traceability });
    expect(bound.steps[0].requirementRefs).toContain(requirement.id);
    expect(validateScenario(bound, ir, traceability).valid).toBe(true);
    expect(validateScenario(bound, ir).valid).toBe(false);
    scenario.steps[0].evidenceRefs = ["ev_missing"];
    expect(validateScenario(scenario, ir, traceability).issues).toContainEqual({ stepId: "step-1", reason: "evidence-reference" });
    requirement.architectureRefs = [];
    expect(validateScenario(bound, ir, traceability).valid).toBe(false);
  });
  it("rejects duplicate IDs, discontinuous/empty/oversized paths and unknown patterns", () => {
    const { ir, scenario } = fixture();
    expect(scenariosSchema.safeParse([scenario, scenario]).success).toBe(false);
    expect(scenarioSchema.safeParse({ ...scenario, steps: [scenario.steps[0], scenario.steps[0]] }).success).toBe(false);
    expect(scenarioSchema.safeParse({ ...scenario, steps: [] }).success).toBe(false);
    expect(scenarioSchema.safeParse({ ...scenario, steps: Array(33).fill(scenario.steps[0]) }).success).toBe(false);
    expect(() => scenarioFromPath(ir, { componentIds: ["a"], flowIds: [] }, { id: "empty", name: "Empty", patternId: "microservices" })).toThrow();
    expect(validateScenario({ ...scenario, patternId: "invented" }, ir).issues).toContainEqual({ reason: "pattern" });
  });
  it("honors reverse direction only for bidirectional flows and permits bounded cycles", () => {
    const { ir } = fixture();
    const path = { componentIds: ["b", "a", "b"], flowIds: ["ab", "ab"] };
    const options = { id: "cycle", name: "Round trip", patternId: "microservices" };
    expect(() => scenarioFromPath(ir, path, options)).toThrow();
    ir.flows[0].direction = "bidirectional";
    const scenario = scenarioFromPath(ir, path, options);
    expect(validateScenario(scenario, ir).valid).toBe(true);
    const engine = new ScenarioPlayback(scenario);
    engine.dispatch("play", ir);
    engine.dispatch("tick", ir);
    expect(engine.dispatch("tick", ir).phase).toBe("completed");
  });
  it("seeds bounded deterministic proposals without overwriting canonical templates or saved scenarios", () => {
    const ir = buildArchitectureIR({ prompt: "Build a multi-tenant SaaS with background jobs.", templateId: "multi-tenant-saas" });
    const before = JSON.stringify(ir); const seeds = seedPatternScenarios(ir);
    expect(seeds.length).toBeGreaterThan(0); expect(seeds.length).toBeLessThanOrEqual(3);
    expect(seeds.every((item) => validateScenario(item, ir).valid)).toBe(true);
    expect(JSON.stringify(ir)).toBe(before);
    expect(seedPatternScenarios({ ...ir, components: [...ir.components].reverse(), flows: [...ir.flows].reverse() })).toEqual(seeds);
    ir.scenarios = [seeds[0]];
    expect(seedPatternScenarios(ir).some((item) => item.id === seeds[0].id)).toBe(false);
    expect(ir.scenarios).toEqual([seeds[0]]);
    expect(seedPatternScenarios({ ...ir, flows: [] })).toEqual([]);
    expect(seedPatternScenarios({ ...ir, provenance: { ...ir.provenance, templateId: "missing" } })).toEqual([]);
  });
});

describe("G03 deterministic playback", () => {
  it("plays and completes in order with no wraparound or model/network calls", () => {
    const { ir, scenario } = fixture(); const network = vi.spyOn(globalThis, "fetch");
    try {
      const engine = new ScenarioPlayback(scenario);
      expect(engine.frame(ir).phase).toBe("idle");
      expect(engine.dispatch("play", ir)).toMatchObject({ phase: "playing", index: 0, focus: { flowIds: ["ab"] } });
      expect(engine.dispatch("tick", ir)).toMatchObject({ phase: "playing", index: 1, focus: { flowIds: ["bc"] } });
      expect(engine.dispatch("tick", ir).phase).toBe("completed");
      expect(engine.dispatch("tick", ir).index).toBe(1);
      expect(network).not.toHaveBeenCalled();
    } finally { network.mockRestore(); }
  });
  it("pause, manual stepping, restart and exit have bounded transitions", () => {
    const { ir, scenario } = fixture(); const engine = new ScenarioPlayback(scenario);
    engine.dispatch("play", ir); engine.dispatch("pause", ir);
    expect(engine.dispatch("tick", ir)).toMatchObject({ phase: "paused", index: 0 });
    expect(engine.dispatch("previous", ir).index).toBe(0);
    expect(engine.dispatch("next", ir)).toMatchObject({ phase: "paused", index: 1 });
    expect(engine.dispatch("next", ir).phase).toBe("completed");
    expect(engine.dispatch("previous", ir).index).toBe(0);
    expect(engine.dispatch("restart", ir)).toMatchObject({ phase: "paused", index: 0 });
    expect(engine.dispatch("exit", ir)).toMatchObject({ phase: "idle", index: null, focus: { componentIds: [], flowIds: [] }, pulse: { iterations: 0 } });
    expect(engine.dispatch("tick", ir).phase).toBe("idle");
  });
  it("cancels on interruption and emits no animation for reduced motion", () => {
    const { ir, scenario } = fixture(); const engine = new ScenarioPlayback(scenario);
    expect(engine.dispatch("play", ir, { reducedMotion: true }).pulse.iterations).toBe(0);
    expect(engine.frame(ir).pulse.iterations).toBe(1);
    expect(engine.dispatch("tick", ir, { signal: AbortSignal.abort() })).toMatchObject({ phase: "idle", index: null });
  });
  it("invalidates mid-playback before highlighting stale flows, snapshots definitions and protects returned state", () => {
    const { ir, scenario } = fixture(); const before = JSON.stringify(ir); const engine = new ScenarioPlayback(scenario);
    scenario.steps.reverse();
    const frame = engine.dispatch("play", ir); frame.step!.flowId = "malicious"; frame.focus.flowIds.push("fake");
    expect(engine.frame(ir).focus.flowIds).toEqual(["ab"]);
    expect(JSON.stringify(ir)).toBe(before);
    ir.flows[0].label = "Changed meaning";
    expect(engine.frame(ir)).toMatchObject({ phase: "invalid", index: null, focus: { flowIds: [] } });
    expect(engine.dispatch("tick", ir).phase).toBe("invalid");
    expect(engine.dispatch("exit", ir).phase).toBe("idle");
  });
});
