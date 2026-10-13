import { ArchitectureGraph, type GraphPath } from "./graph";
import { architectureIRSchema, type ArchitectureIR, type ArchitectureIRFlow } from "./schema";
import { scenarioSchema, type Scenario } from "./scenario-schema";
import { patternRegistry } from "@/lib/intelligence/patterns";
import type { TraceabilityBundle } from "@/lib/intelligence/schema";

/** Fixed field ordering; position, theme and irrelevant graph edits do not stale a step. */
export function scenarioFlowSignature(flow: ArchitectureIRFlow) {
  return JSON.stringify([flow.id, flow.source, flow.sourcePort, flow.target, flow.targetPort,
    flow.type, flow.label, flow.protocol ?? "", flow.direction, flow.security.authentication,
    flow.security.encryption, flow.security.dataClassification, flow.resilience.retryPolicy, flow.resilience.latencyTarget]);
}
export type ScenarioIssue = { stepId?: string; reason: "schema" | "pattern" | "graph" | "missing-flow" | "changed-flow" | "direction" | "requirement-reference" | "evidence-reference" };

/** Invalid scenarios remain readable, but must never play on a changed graph. */
export function validateScenario(input: unknown, ir: ArchitectureIR, traceability?: TraceabilityBundle) {
  const parsed = scenarioSchema.safeParse(input);
  if (!parsed.success) return { valid: false, issues: [{ reason: "schema" }] as ScenarioIssue[] };
  const scenario = parsed.data; const issues: ScenarioIssue[] = [];
  if (!patternRegistry.some((pattern) => pattern.id === scenario.patternId)) issues.push({ reason: "pattern" });
  let graph: ArchitectureGraph;
  try { graph = new ArchitectureGraph(ir); } catch { return { valid: false, issues: [{ reason: "graph" }] as ScenarioIssue[] }; }
  const components = new Set(graph.componentIds());
  const requirements = new Map(traceability?.requirements.items.map((item) => [item.id, item]));
  const evidence = new Set(traceability?.evidence.items.map((item) => item.id));
  for (const step of scenario.steps) {
    const flow = ir.flows.find((item) => item.id === step.flowId);
    const issue = (reason: ScenarioIssue["reason"]) => issues.push({ stepId: step.id, reason });
    if (!flow) { issue("missing-flow"); continue; }
    if (scenarioFlowSignature(flow) !== step.flowSignature) issue("changed-flow");
    if (!components.has(step.from) || !components.has(step.to) || !graph.outgoing(step.from).some((arc) => arc.flowId === step.flowId && arc.to === step.to)) issue("direction");
    for (const ref of step.requirementRefs) {
      const requirement = requirements.get(ref);
      if (!requirement || !requirement.architectureRefs.some((ref) => ref.kind === "flow" ? ref.id === step.flowId : ref.id === step.from || ref.id === step.to)) issue("requirement-reference");
    }
    for (const ref of step.evidenceRefs) if (!evidence.has(ref) || !step.requirementRefs.some((id) => requirements.get(id)?.evidenceRefs.includes(ref))) issue("evidence-reference");
  }
  return { valid: issues.length === 0, issues };
}

/** Explicit proposal only. The caller saves through existing commit/history. */
export function scenarioFromPath(irInput: ArchitectureIR, path: GraphPath, options: { id: string; name: string; patternId: string; revision?: number; traceability?: TraceabilityBundle }): Scenario {
  const ir = architectureIRSchema.parse(irInput);
  if (!path.flowIds.length || path.flowIds.length > 32 || path.componentIds.length !== path.flowIds.length + 1) throw new Error("A scenario needs 1–32 ordered flows.");
  const scenario = scenarioSchema.parse({ schemaVersion: "1.0.0", id: options.id, revision: options.revision ?? 1, name: options.name, patternId: options.patternId,
    steps: path.flowIds.map((id, index) => {
      const flow = ir.flows.find((flow) => flow.id === id);
      if (!flow) throw new Error("Scenario references a missing flow.");
      const from = path.componentIds[index]; const to = path.componentIds[index + 1];
      const requirements = (options.traceability?.requirements.items ?? []).filter((item) => item.architectureRefs.some((ref) => ref.kind === "flow" ? ref.id === id : ref.id === from || ref.id === to));
      return { id: `step-${index + 1}`, flowId: id, from, to, flowSignature: scenarioFlowSignature(flow),
        requirementRefs: requirements.map((item) => item.id), evidenceRefs: [...new Set(requirements.flatMap((item) => item.evidenceRefs))] };
    }),
  });
  if (!validateScenario(scenario, ir, options.traceability).valid) throw new Error("Scenario path or traceability is invalid.");
  return scenario;
}

/** Seed bounded generic journeys only for a registered template pattern.
 * A path is not a proof of runtime behavior. No AI or invented login/checkout semantics. */
export function seedPatternScenarios(ir: ArchitectureIR, traceability?: TraceabilityBundle): Scenario[] {
  const pattern = patternRegistry.find((item) => item.id === ir.provenance.templateId);
  if (!pattern) return [];
  const graph = new ArchitectureGraph(ir);
  const sorted = [...ir.components].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const starts = sorted.filter((item) => item.category === "client").slice(0, 3);
  const ends = sorted.filter((item) => item.category === "data" || item.category === "messaging").slice(0, 6);
  const result: Scenario[] = [];
  let candidateIndex = 0;
  for (const source of starts) for (const target of ends) {
    if (result.length === 3) return result;
    const path = graph.shortestPath(source.id, target.id);
    if (!path || !path.flowIds.length || path.flowIds.length > 32) continue;
    const id = `scenario-${pattern.id}-${++candidateIndex}`;
    const proposal = scenarioFromPath(ir, path, { id, name: `${source.name} to ${target.name}`.slice(0, 160), patternId: pattern.id, traceability });
    // Existing versions are authoritative: never replace or silently repair them.
    if (!ir.scenarios?.some((item) => item.id === id)) result.push(proposal);
  }
  return result;
}

export type PlaybackAction = "play" | "pause" | "next" | "previous" | "restart" | "tick" | "exit";
export type PlaybackState = { phase: "idle" | "paused" | "playing" | "completed" | "invalid"; index: number | null; sequence: number };

/** One caller-driven tick per step; never owns timers, rendering or persistence. */
export class ScenarioPlayback {
  private readonly scenario: Scenario;
  private state: PlaybackState = { phase: "idle", index: null, sequence: 0 };
  constructor(input: unknown) { this.scenario = scenarioSchema.parse(input); }

  dispatch(action: PlaybackAction, ir: ArchitectureIR, options: { traceability?: TraceabilityBundle; signal?: AbortSignal; reducedMotion?: boolean } = {}) {
    if (action === "exit" || options.signal?.aborted) { this.state = { ...this.state, phase: "idle", index: null }; return this.frame(ir, options); }
    if (!validateScenario(this.scenario, ir, options.traceability).valid) { this.state = { ...this.state, phase: "invalid", index: null }; return this.frame(ir, options); }
    const last = this.scenario.steps.length - 1; const current = this.state.index ?? 0;
    if (action === "restart") this.state = { phase: "paused", index: 0, sequence: this.state.sequence + 1 };
    else if (action === "play") this.state = { ...this.state, phase: this.state.phase === "completed" ? "completed" : "playing", index: current };
    else if (action === "pause" && this.state.phase === "playing") this.state = { ...this.state, phase: "paused" };
    else if (action === "next" && this.state.index !== null) this.state = { phase: current === last ? "completed" : "paused", index: Math.min(current + 1, last), sequence: this.state.sequence + Number(current < last) };
    else if (action === "previous" && this.state.index !== null) this.state = { phase: "paused", index: Math.max(0, current - 1), sequence: this.state.sequence + Number(current > 0) };
    else if (action === "tick" && this.state.phase === "playing") this.state = { phase: current === last ? "completed" : "playing", index: Math.min(current + 1, last), sequence: this.state.sequence + Number(current < last) };
    return this.frame(ir, options);
  }

  frame(ir: ArchitectureIR, options: { traceability?: TraceabilityBundle; reducedMotion?: boolean } = {}) {
    const validation = validateScenario(this.scenario, ir, options.traceability);
    const state = !validation.valid && this.state.phase !== "idle" ? { ...this.state, phase: "invalid" as const, index: null } : this.state;
    const step = state.index === null ? null : this.scenario.steps[state.index];
    return { ...state, scenarioId: this.scenario.id, revision: this.scenario.revision, step: step ? structuredClone(step) : null, issues: validation.issues,
      focus: { componentIds: step ? [step.from, step.to] : [], flowIds: step ? [step.flowId] : [] },
      pulse: { key: `${this.scenario.id}:${state.sequence}`, iterations: step && !options.reducedMotion ? 1 : 0 },
    };
  }
}
