import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createConnector, createDiagram, createNode } from "@/lib/domain/factory";
import { diagramSchema } from "@/lib/domain/schema";
import { architecturePresentationSchema, architectureIRFromDiagram, canonicalSha256, createArchitectureSnapshot, materializeArchitecture, migrateArchitectureSnapshot, presentationFromDiagram, validateArchitectureArtifact } from "./snapshot";
import { presentationObjectSchema, presentationObjectsSchema, presentationTargets, remapPresentationObjects, resolvePresentationObject, type PresentationObject } from "./presentation-objects";
import { applyPresentationObjectCommand, PRESENTATION_COMMAND_IMPACT } from "./presentation-commands";
import { loadRecovery, recoveryArchitecture, recoveryKey, saveRecovery, type RecoveryScope } from "@/lib/storage/drafts";

function fixture() {
  const diagram = createDiagram("Presentation fixture", [createNode("backend-service", "a", "A", 0, 0), createNode("backend-service", "b", "B", 300, 0)], [createConnector("ab", "a", "b", "http-rest")]);
  diagram.primitives = [{ id: "shape", kind: "rectangle", text: "", position: { x: 0, y: 0 }, dimensions: { width: 100, height: 100 }, style: {} }];
  const base = { schemaVersion: "1.0.0" as const, revision: 1, zIndex: 4 };
  const objects: PresentationObject[] = [
    { ...base, id: "note", kind: "note", text: "Review assumptions", position: { x: 30, y: 40 }, dimensions: { width: 200, height: 140 }, color: "#ffeebb" },
    { ...base, id: "annotation", kind: "annotation", text: "Confirm owner", anchor: { kind: "component", id: "a" }, offset: { x: 10, y: 20 } },
    { ...base, id: "highlight", kind: "highlight", targets: [{ kind: "flow", id: "ab" }], color: "#112233", opacity: .3 },
    { ...base, id: "group", kind: "group", name: "Visual boundary", members: [{ kind: "component", id: "a" }, { kind: "component", id: "b" }, { kind: "primitive", id: "shape" }] },
    { ...base, id: "focus", kind: "focus", name: "Entry point", targets: [{ kind: "component", id: "a" }], viewport: { x: 20, y: 30, zoom: 1.2 } },
  ];
  const ir = architectureIRFromDiagram(diagram);
  return { diagram, objects, ir, inventory: { componentIds: ["a", "b"], flowIds: ["ab"], primitiveIds: ["shape"] } };
}

describe("P01 presentation contracts", () => {
  it("retains all layers at the combined canvas and presentation object limits", () => {
    const { diagram, objects } = fixture();
    diagram.nodes = Array.from({ length: 150 }, (_, n) => createNode("backend-service", `node-${n}`, `Node ${n}`, n * 10, 0));
    diagram.connectors = Array.from({ length: 300 }, (_, n) => createConnector(`flow-${n}`, `node-${n % 150}`, `node-${(n + 1) % 150}`, "http-rest"));
    diagram.primitives = Array.from({ length: 300 }, (_, n) => ({ ...diagram.primitives[0], id: `shape-${n}` }));
    diagram.presentationObjects = Array.from({ length: 200 }, (_, n) => ({ ...objects[0], id: `note-${n}` }));
    const presentation = presentationFromDiagram(diagram);
    expect(presentation.layerOrder).toHaveLength(950);
    expect(architecturePresentationSchema.safeParse({ ...presentation, layerOrder: [...presentation.layerOrder, "overflow"] }).success).toBe(false);
  });
  it("leaves legacy documents and checksums unchanged with no new defaults", async () => {
    const { diagram } = fixture(); const presentation = presentationFromDiagram(diagram);
    expect(diagramSchema.parse(diagram)).toEqual(diagram);
    expect(architecturePresentationSchema.parse(presentation)).toEqual(presentation);
    expect(diagram).not.toHaveProperty("presentationObjects");
    expect(presentation).not.toHaveProperty("objects");
    expect(await canonicalSha256(presentation)).toBe(await canonicalSha256(architecturePresentationSchema.parse(presentation)));
  });
  it("round-trips every object type through snapshots and materialization without changing semantic truth", async () => {
    const { diagram, objects, ir } = fixture();
    const options = { diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, createdAt: diagram.createdAt, updatedAt: diagram.updatedAt };
    const before = await createArchitectureSnapshot({ ...options, presentation: presentationFromDiagram(diagram) });
    diagram.presentationObjects = objects;
    const presentation = presentationFromDiagram(diagram);
    const after = await createArchitectureSnapshot({ ...options, presentation });
    expect(after.checksums.ir).toBe(before.checksums.ir);
    expect(after.checksums.presentation).not.toBe(before.checksums.presentation);
    expect(after.checksums.diagram).not.toBe(before.checksums.diagram);
    expect(after.materializedDiagram.presentationObjects).toEqual(objects);
    expect(after.ir).not.toHaveProperty("presentationObjects");
    expect(presentationFromDiagram(after.materializedDiagram)).toEqual(presentation);
    expect(presentation.layerOrder).toEqual(expect.arrayContaining(objects.map((item) => item.id)));
    expect(architectureIRFromDiagram(after.materializedDiagram, ir)).toEqual(ir);
    expect(migrateArchitectureSnapshot(after)).toEqual(after);
  });
  it("does not apply saved focus or alter the actual viewport", () => {
    const { diagram, objects, ir } = fixture(); diagram.presentationObjects = objects;
    const presentation = presentationFromDiagram(diagram);
    expect(presentation.viewport).toEqual(diagram.viewport);
    expect(materializeArchitecture(ir, presentation, { id: diagram.id, version: 1 }).viewport).toEqual(diagram.viewport);
    expect(architecturePresentationSchema.safeParse({ ...presentation, activeFocus: "focus" }).success).toBe(false);
    expect(presentationObjectSchema.safeParse({ ...objects[4], selected: true }).success).toBe(false);
  });
  it("preserves objects through existing recovery and account scoping", async () => {
    for (const scope of [{ kind: "guest" }, { kind: "account", userId: "owner", workspaceId: "workspace" }] satisfies RecoveryScope[]) {
      const { diagram, ir, objects } = fixture(); diagram.presentationObjects = objects;
      const record = { schemaVersion: 1 as const, key: recoveryKey(scope, diagram.id), scope, revision: 0, diagram, architecture: recoveryArchitecture(diagram, ir, 1), document: "", updatedAt: diagram.updatedAt };
      await saveRecovery(record, 0);
      expect((await loadRecovery(scope, diagram.id))?.architecture.presentation.objects).toEqual(objects);
      expect((await loadRecovery(scope, diagram.id))?.diagram.presentationObjects).toEqual(objects);
      expect(await loadRecovery({ kind: "account", userId: "other", workspaceId: "workspace" }, diagram.id)).toBeUndefined();
    }
  });
  it("retains orphan content, warns and resolves only available targets", () => {
    const { diagram, objects, ir, inventory } = fixture(); diagram.presentationObjects = objects;
    ir.flows = []; diagram.connectors = [];
    const presentation = presentationFromDiagram(diagram);
    const result = validateArchitectureArtifact(ir, presentation);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "PRESENTATION_TARGET_MISSING", affectedIds: ["highlight"] }));
    expect(materializeArchitecture(ir, presentation, { id: diagram.id, version: 1 }).presentationObjects).toEqual(objects);
    expect(resolvePresentationObject(objects[2], { ...inventory, flowIds: [] })).toEqual({ activeTargets: [], missingTargets: [{ kind: "flow", id: "ab" }] });
  });
  it("rejects duplicate and colliding object IDs in diagram and server materialization", () => {
    const { diagram, objects, ir } = fixture();
    expect(presentationObjectsSchema.safeParse([objects[0], objects[0]]).success).toBe(false);
    expect(diagramSchema.safeParse({ ...diagram, presentationObjects: [{ ...objects[0], id: "a" }] }).success).toBe(false);
    const presentation = { ...presentationFromDiagram(diagram), objects: [{ ...objects[0], id: "ab" }] };
    expect(validateArchitectureArtifact(ir, presentation).valid).toBe(false);
    expect(() => materializeArchitecture(ir, presentation, { id: diagram.id, version: 1 })).toThrow();
  });
  it("rejects unsafe text, malformed styles, unbounded values and nested visual groups", () => {
    const { objects } = fixture();
    for (const patch of [{ text: "<script>" }, { color: "url(https://example.com)" }, { revision: 0 }, { zIndex: Infinity }, { dimensions: { width: 99_999, height: 50 } }, { position: { x: NaN, y: 0 } }]) {
      expect(presentationObjectSchema.safeParse({ ...objects[0], ...patch }).success).toBe(false);
    }
    expect(presentationObjectSchema.safeParse({ ...objects[3], members: [{ kind: "group", id: "self" }] }).success).toBe(false);
    expect(presentationObjectSchema.safeParse({ ...objects[3], members: [] }).success).toBe(false);
    expect(presentationObjectSchema.safeParse({ ...objects[4], targets: [{ kind: "component", id: "a" }, { kind: "component", id: "a" }] }).success).toBe(false);
    expect(presentationObjectsSchema.safeParse(Array.from({ length: 201 }, (_, n) => ({ ...objects[0], id: `note-${n}` }))).success).toBe(false);
  });
  it("remaps all IDs and references without changing canonical objects", () => {
    const { objects } = fixture(); const before = structuredClone(objects);
    const originals = [...new Set(objects.flatMap((item) => [item.id, ...presentationTargets(item).map((ref) => ref.id)]))];
    const mapping = new Map(originals.map((id) => [id, `clone-${id}`]));
    const cloned = remapPresentationObjects(objects, mapping);
    expect(objects).toEqual(before);
    for (const item of cloned) {
      expect(item.id.startsWith("clone-")).toBe(true);
      expect(item.revision).toBe(1);
      expect(presentationTargets(item).every((ref) => ref.id.startsWith("clone-"))).toBe(true);
    }
    if (cloned[0].kind === "note") cloned[0].position.x = 999;
    expect(objects).toEqual(before);
  });
  it("fails incomplete, reused or colliding clone maps instead of leaking old refs", () => {
    const { objects } = fixture();
    expect(() => remapPresentationObjects(objects, new Map())).toThrow();
    const ids = [...new Set(objects.flatMap((item) => [item.id, ...presentationTargets(item).map((ref) => ref.id)]))];
    expect(() => remapPresentationObjects(objects, new Map(ids.map((id) => [id, id])))).toThrow();
    expect(() => remapPresentationObjects(objects, new Map(ids.map((id) => [id, "same"])))).toThrow();
  });
});

describe("P01 pure transforms for the existing editor commit path", () => {
  it("creates, edits and removes presentation-only objects without altering source, semantic IR or version", () => {
    const { diagram, objects, ir } = fixture(); const before = structuredClone(diagram);
    const created = applyPresentationObjectCommand(diagram, { type: "put", object: objects[0] }, { readOnly: false });
    const edited = applyPresentationObjectCommand(created, { type: "put", object: { ...objects[0], revision: 2, text: "Updated" } }, { readOnly: false });
    const removed = applyPresentationObjectCommand(edited, { type: "remove", id: "note", expectedRevision: 2 }, { readOnly: false });
    expect(diagram).toEqual(before);
    expect(created.presentationObjects).toEqual([objects[0]]);
    expect(edited.presentationObjects?.[0]).toMatchObject({ text: "Updated", revision: 2 });
    expect(removed.presentationObjects).toEqual([]);
    for (const current of [created, edited, removed]) {
      expect(architectureIRFromDiagram(current, ir)).toEqual(ir);
      expect(current.version).toBe(diagram.version);
    }
    // The existing editor stores before/after Diagram snapshots for undo/redo;
    // these values remain valid without an independent command history.
    expect(diagramSchema.parse(created).presentationObjects).toEqual([objects[0]]);
    expect(PRESENTATION_COMMAND_IMPACT).toBe("presentation-only");
  });
  it("blocks read-only changes and refuses stale revisions or kind changes", () => {
    const { diagram, objects } = fixture();
    expect(() => applyPresentationObjectCommand(diagram, { type: "put", object: objects[0] }, { readOnly: true })).toThrow("read-only");
    const created = applyPresentationObjectCommand(diagram, { type: "put", object: objects[0] }, { readOnly: false });
    expect(() => applyPresentationObjectCommand(created, { type: "put", object: objects[0] }, { readOnly: false })).toThrow("revision");
    expect(() => applyPresentationObjectCommand(created, { type: "remove", id: "note", expectedRevision: 2 }, { readOnly: false })).toThrow("revision");
    expect(() => applyPresentationObjectCommand(created, { type: "put", object: { ...objects[4], id: "note", revision: 2 } }, { readOnly: false })).toThrow("kind");
  });
  it("rejects unavailable targets and wrong target kinds on new commands", () => {
    const { diagram, objects } = fixture();
    for (const anchor of [{ kind: "component", id: "missing" }, { kind: "flow", id: "a" }]) {
      expect(() => applyPresentationObjectCommand(diagram, { type: "put", object: { ...objects[1], anchor } }, { readOnly: false })).toThrow("unavailable");
    }
  });
});
