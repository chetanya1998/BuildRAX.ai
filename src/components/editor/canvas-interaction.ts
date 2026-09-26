export type CanvasTool = "select" | "pan" | "rectangle" | "circle" | "diamond" | "frame" | "line" | "arrow" | "text" | "freehand" | "eraser";
export type PrimitiveTool = Exclude<CanvasTool, "select" | "pan" | "eraser" | "circle"> | "ellipse" | "image";
export type CanvasPoint = { x: number; y: number };
export type DrawDraft = { kind: PrimitiveTool; start: CanvasPoint; current: CanvasPoint; points: CanvasPoint[]; lockAspect?: boolean; style?: Record<string, string> };

export type CanvasInteractionState = {
  tool: CanvasTool;
  drawDraft: DrawDraft | null;
  pendingComponentType: string | null;
  editingTextId: string | null;
  renamingNodeId: string | null;
  pendingConnectionSourceId: string | null;
};

export const initialCanvasInteraction: CanvasInteractionState = {
  tool: "select",
  drawDraft: null,
  pendingComponentType: null,
  editingTextId: null,
  renamingNodeId: null,
  pendingConnectionSourceId: null,
};

export type CanvasInteractionAction =
  | { type: "activate-tool"; tool: CanvasTool }
  | { type: "begin-component-placement"; componentType: string }
  | { type: "finish-component-placement" }
  | { type: "begin-drawing"; draft: DrawDraft }
  | { type: "update-drawing"; update: (draft: DrawDraft) => DrawDraft }
  | { type: "finish-drawing"; keepTool?: boolean }
  | { type: "begin-text-edit"; id: string }
  | { type: "finish-text-edit" }
  | { type: "begin-node-rename"; id: string }
  | { type: "finish-node-rename" }
  | { type: "begin-connection"; sourceId: string | null }
  | { type: "finish-connection" }
  | { type: "cancel" };

function idle(tool: CanvasTool = "select"): CanvasInteractionState {
  return { ...initialCanvasInteraction, tool };
}

function drawingTool(kind: PrimitiveTool): CanvasTool {
  if (kind === "ellipse") return "circle";
  if (kind === "image") return "select";
  return kind;
}

export function canvasInteractionReducer(state: CanvasInteractionState, action: CanvasInteractionAction): CanvasInteractionState {
  switch (action.type) {
    case "activate-tool":
      return idle(action.tool);
    case "begin-component-placement":
      return { ...idle("select"), pendingComponentType: action.componentType };
    case "finish-component-placement":
      return { ...state, pendingComponentType: null };
    case "begin-drawing":
      return { ...idle(drawingTool(action.draft.kind)), drawDraft: action.draft };
    case "update-drawing":
      return state.drawDraft ? { ...state, drawDraft: action.update(state.drawDraft) } : state;
    case "finish-drawing":
      return idle(action.keepTool ? state.tool : "select");
    case "begin-text-edit":
      return { ...idle("select"), editingTextId: action.id };
    case "finish-text-edit":
      return { ...state, editingTextId: null };
    case "begin-node-rename":
      return { ...idle("select"), renamingNodeId: action.id };
    case "finish-node-rename":
      return { ...state, renamingNodeId: null };
    case "begin-connection":
      return action.sourceId
        ? { ...idle(["line", "arrow"].includes(state.tool) ? state.tool : "select"), pendingConnectionSourceId: action.sourceId }
        : { ...state, pendingConnectionSourceId: null };
    case "finish-connection":
      return { ...state, pendingConnectionSourceId: null };
    case "cancel":
      return idle();
  }
}

export function hasTransientInteraction(state: CanvasInteractionState) {
  return Boolean(state.drawDraft || state.pendingComponentType || state.editingTextId || state.renamingNodeId || state.pendingConnectionSourceId);
}

export function interactionName(state: CanvasInteractionState) {
  if (state.drawDraft) return "drawing";
  if (state.pendingComponentType) return "placing-component";
  if (state.editingTextId) return "editing-text";
  if (state.renamingNodeId) return "renaming-node";
  if (state.pendingConnectionSourceId) return "connecting";
  return state.tool;
}

export function interactionHint(state: CanvasInteractionState, componentName?: string) {
  if (state.pendingComponentType) return `Click the canvas to place ${componentName ?? "the component"}. Escape cancels.`;
  if (state.drawDraft) return `Drawing ${state.drawDraft.kind === "ellipse" ? "circle" : state.drawDraft.kind}. Release to finish; Escape cancels.`;
  if (state.pendingConnectionSourceId) return "Choose a target, or release on the canvas to add a connected component. Escape cancels.";
  if (state.editingTextId) return "Editing text. Enter commits; Escape restores the previous text.";
  if (state.renamingNodeId) return "Renaming component. Enter commits; Escape restores the previous name.";

  switch (state.tool) {
    case "select": return "Select, move, resize, or marquee objects.";
    case "pan": return "Drag the canvas to pan. Press V to return to selection.";
    case "eraser": return "Click an object to remove it. Escape returns to selection.";
    case "freehand": return "Drag to draw freehand ink. Escape returns to selection.";
    case "text": return "Drag or click to place text. Escape returns to selection.";
    case "line": return "Drag to place a line or connect compatible components.";
    case "arrow": return "Drag to place an arrow or connect compatible components.";
    default: return `Drag or click to place a ${state.tool}. Escape returns to selection.`;
  }
}
