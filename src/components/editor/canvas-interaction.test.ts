import { describe, expect, it } from "vitest";
import { canvasInteractionReducer, hasTransientInteraction, initialCanvasInteraction, interactionHint, interactionName, type DrawDraft } from "./canvas-interaction";

const draft: DrawDraft = {
  kind: "rectangle",
  start: { x: 10, y: 10 },
  current: { x: 30, y: 40 },
  points: [{ x: 10, y: 10 }],
};

describe("canvas interaction controller", () => {
  it("keeps one exclusive interaction when tools change", () => {
    const placing = canvasInteractionReducer(initialCanvasInteraction, { type: "begin-component-placement", componentType: "api-service" });
    const drawing = canvasInteractionReducer(placing, { type: "begin-drawing", draft });
    const erasing = canvasInteractionReducer(drawing, { type: "activate-tool", tool: "eraser" });

    expect(interactionName(drawing)).toBe("drawing");
    expect(drawing.pendingComponentType).toBeNull();
    expect(erasing).toEqual({ ...initialCanvasInteraction, tool: "eraser" });
  });

  it("cancels every transient interaction back to a safe selection state", () => {
    const connecting = canvasInteractionReducer(initialCanvasInteraction, { type: "begin-connection", sourceId: "node-a" });
    expect(hasTransientInteraction(connecting)).toBe(true);
    expect(canvasInteractionReducer(connecting, { type: "cancel" })).toEqual(initialCanvasInteraction);
  });

  it("preserves freehand as a repeatable tool after a completed stroke", () => {
    const freehand = canvasInteractionReducer(initialCanvasInteraction, { type: "begin-drawing", draft: { ...draft, kind: "freehand" } });
    const finished = canvasInteractionReducer(freehand, { type: "finish-drawing", keepTool: true });
    expect(finished.tool).toBe("freehand");
    expect(finished.drawDraft).toBeNull();
  });

  it("moves text editing and node renaming into mutually exclusive states", () => {
    const editing = canvasInteractionReducer(initialCanvasInteraction, { type: "begin-text-edit", id: "label-a" });
    const renaming = canvasInteractionReducer(editing, { type: "begin-node-rename", id: "node-a" });
    expect(renaming.editingTextId).toBeNull();
    expect(renaming.renamingNodeId).toBe("node-a");
    expect(interactionHint(renaming)).toMatch(/Escape restores/);
  });

  it("updates drawing geometry only while drawing", () => {
    const untouched = canvasInteractionReducer(initialCanvasInteraction, { type: "update-drawing", update: (current) => ({ ...current, current: { x: 80, y: 80 } }) });
    expect(untouched).toBe(initialCanvasInteraction);

    const drawing = canvasInteractionReducer(initialCanvasInteraction, { type: "begin-drawing", draft });
    const updated = canvasInteractionReducer(drawing, { type: "update-drawing", update: (current) => ({ ...current, current: { x: 80, y: 80 } }) });
    expect(updated.drawDraft?.current).toEqual({ x: 80, y: 80 });
  });
});
