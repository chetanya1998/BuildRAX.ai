import { z } from "zod";
import { diagramSchema, type Diagram } from "@/lib/domain/schema";
import { presentationObjectSchema, resolvePresentationObject } from "./presentation-objects";

export const presentationObjectCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("put"), object: presentationObjectSchema }).strict(),
  z.object({ type: z.literal("remove"), id: z.string().min(1).max(120), expectedRevision: z.number().int().min(1) }).strict(),
]);
export const PRESENTATION_COMMAND_IMPACT = "presentation-only" as const;

/** A pure transform for commit(current => ...); the existing editor owns
 * undo/redo, save/version bumps and authorization. No alternate history engine. */
export function applyPresentationObjectCommand(input: Diagram, commandInput: unknown, options: { readOnly: boolean }): Diagram {
  if (options.readOnly) throw new Error("Presentation commands are unavailable in read-only mode.");
  const diagram = diagramSchema.parse(input);
  const command = presentationObjectCommandSchema.parse(commandInput);
  const objects = diagram.presentationObjects ?? [];
  if (command.type === "remove") {
    const existing = objects.find((item) => item.id === command.id);
    if (!existing || existing.revision !== command.expectedRevision) throw new Error("Presentation object revision conflict.");
    return diagramSchema.parse({ ...diagram, presentationObjects: objects.filter((item) => item.id !== command.id) });
  }
  const existing = objects.find((item) => item.id === command.object.id);
  if (command.object.revision !== (existing?.revision ?? 0) + 1) throw new Error("Presentation object revision conflict.");
  if (existing && existing.kind !== command.object.kind) throw new Error("Presentation object kind cannot change in place.");
  const resolution = resolvePresentationObject(command.object, { componentIds: diagram.nodes.map((item) => item.id), flowIds: diagram.connectors.map((item) => item.id), primitiveIds: diagram.primitives.map((item) => item.id) });
  if (resolution.missingTargets.length) throw new Error("Presentation command references unavailable targets.");
  return diagramSchema.parse({ ...diagram, presentationObjects: existing ? objects.map((item) => item.id === command.object.id ? command.object : item) : [...objects, command.object] });
}
