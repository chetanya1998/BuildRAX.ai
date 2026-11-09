import { z } from "zod";

const idSchema = z.string().min(1).max(120).refine((value) => !/[<>]/.test(value));
const textSchema = (max: number) => z.string().trim().min(1).max(max).refine((value) => !/[<>]/.test(value));
const point = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
export const presentationTargetSchema = z.object({ kind: z.enum(["component", "flow", "primitive"]), id: idSchema }).strict();
export type PresentationTarget = z.infer<typeof presentationTargetSchema>;
const targets = z.array(presentationTargetSchema).min(1).max(100).refine((items) => new Set(items.map((item) => `${item.kind}:${item.id}`)).size === items.length, "Targets must be unique");
const base = { schemaVersion: z.literal("1.0.0"), id: idSchema, revision: z.number().int().min(1), zIndex: z.number().int().min(-10_000).max(10_000) };

/** Saved visual definitions only. Active selection/focus/playback is transient
 * and intentionally rejected by these strict persisted schemas. */
export const presentationObjectSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("note"), text: textSchema(1_000), position: point,
    dimensions: z.object({ width: z.number().min(80).max(2_000), height: z.number().min(40).max(2_000) }).strict(), color }).strict(),
  z.object({ ...base, kind: z.literal("annotation"), text: textSchema(1_000), anchor: presentationTargetSchema, offset: point }).strict(),
  z.object({ ...base, kind: z.literal("highlight"), targets, color, opacity: z.number().min(.05).max(1) }).strict(),
  z.object({ ...base, kind: z.literal("group"), name: textSchema(120), members: targets }).strict(),
  z.object({ ...base, kind: z.literal("focus"), name: textSchema(120), targets,
    viewport: z.object({ x: z.number().finite(), y: z.number().finite(), zoom: z.number().min(.1).max(4) }).strict().optional() }).strict(),
]);
export const presentationObjectsSchema = z.array(presentationObjectSchema).max(200).refine((items) => new Set(items.map((item) => item.id)).size === items.length, "Presentation object IDs must be unique");
export type PresentationObject = z.infer<typeof presentationObjectSchema>;
export type PresentationInventory = { componentIds: readonly string[]; flowIds: readonly string[]; primitiveIds: readonly string[] };

export function presentationTargets(object: PresentationObject): PresentationTarget[] {
  return object.kind === "note" ? [] : object.kind === "annotation" ? [object.anchor] : object.kind === "group" ? object.members : object.targets;
}

/** Missing targets are retained for repair, not silently deleted or followed. */
export function resolvePresentationObject(object: PresentationObject, inventory: PresentationInventory) {
  const sets = { component: new Set(inventory.componentIds), flow: new Set(inventory.flowIds), primitive: new Set(inventory.primitiveIds) };
  const targets = presentationTargets(object);
  return { activeTargets: targets.filter((ref) => sets[ref.kind].has(ref.id)).map((ref) => ({ ...ref })),
    missingTargets: targets.filter((ref) => !sets[ref.kind].has(ref.id)).map((ref) => ({ ...ref })) };
}

/** Strict remapping for future common clone/duplicate commands: the caller must
 * supply fresh IDs for every object and referenced target. Never leak old refs. */
export function remapPresentationObjects(input: unknown, mapping: ReadonlyMap<string, string>): PresentationObject[] {
  const objects = presentationObjectsSchema.parse(input);
  const originals = new Set(objects.flatMap((object) => [object.id, ...presentationTargets(object).map((ref) => ref.id)]));
  const mapped = new Set<string>();
  for (const old of originals) {
    const next = idSchema.parse(mapping.get(old));
    if (originals.has(next) || mapped.has(next)) throw new Error("Clone IDs must be fresh and unique.");
    mapped.add(next);
  }
  const ref = (target: PresentationTarget): PresentationTarget => ({ ...target, id: mapping.get(target.id)! });
  return presentationObjectsSchema.parse(objects.map((object) => {
    const cloned = { ...object, id: mapping.get(object.id)!, revision: 1 };
    if (object.kind === "annotation") return { ...cloned, anchor: ref(object.anchor) };
    if (object.kind === "group") return { ...cloned, members: object.members.map(ref) };
    if (object.kind === "highlight" || object.kind === "focus") return { ...cloned, targets: object.targets.map(ref) };
    return cloned;
  }));
}
