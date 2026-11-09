import { z } from "zod";

const id = z.string().min(1).max(120);
const text = z.string().trim().min(1).max(160).refine((value) => !/[<>]/.test(value));
const refs = z.array(id).max(20).refine((items) => new Set(items).size === items.length, "References must be unique");

/** Semantic, versioned journeys. Runtime selection/timers/highlights are absent. */
export const scenarioSchema = z.object({
  schemaVersion: z.literal("1.0.0"), id, revision: z.number().int().min(1),
  name: text, patternId: z.string().min(1).max(80),
  steps: z.array(z.object({
    id, flowId: id, from: id, to: id,
    // Exact canonical flow content, not an assumed global architecture version.
    flowSignature: z.string().min(1).max(4_000),
    requirementRefs: refs, evidenceRefs: refs,
  }).strict()).min(1).max(32),
}).strict().superRefine((scenario, ctx) => {
  if (new Set(scenario.steps.map((step) => step.id)).size !== scenario.steps.length) ctx.addIssue({ code: "custom", path: ["steps"], message: "Step IDs must be unique" });
  scenario.steps.forEach((step, index) => {
    if (step.from === step.to || (index > 0 && scenario.steps[index - 1].to !== step.from)) ctx.addIssue({ code: "custom", path: ["steps", index], message: "Steps must form a continuous directed walk" });
  });
});
export const scenariosSchema = z.array(scenarioSchema).max(20).refine((items) => new Set(items.map((item) => item.id)).size === items.length, "Scenario IDs must be unique");
export type Scenario = z.infer<typeof scenarioSchema>;
