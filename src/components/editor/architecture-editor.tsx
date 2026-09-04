"use client";

import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  ArrowRight,
  Bot,
  Boxes,
  Circle,
  Diamond,
  Download,
  Eraser,
  FileText,
  Frame,
  Hand,
  LayoutDashboard,
  LockKeyhole,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Square,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { catalogByType, categoryMeta, nodeCatalog } from "@/lib/domain/catalog";
import { validateConnection } from "@/lib/domain/compatibility";
import { downloadText, safeFilename, toMermaid } from "@/lib/domain/export";
import { createConnector, createNode } from "@/lib/domain/factory";
import { autoLayout } from "@/lib/domain/layout";
import { diagramSchema, type ChangePlan, type Diagram, type ReviewFinding } from "@/lib/domain/schema";
import { clearQueuedProjectSave, loadQueuedProjectSave, queueProjectSave, saveDraft } from "@/lib/storage/drafts";
import { PrimitiveNode, type PrimitiveFlowNode } from "./primitive-node";
import { SemanticNode, type SemanticFlowNode } from "./semantic-node";
import styles from "./editor.module.css";

type EditorNode = SemanticFlowNode | PrimitiveFlowNode;
type Tool = "select" | "pan" | "rectangle" | "ellipse" | "diamond" | "frame" | "line" | "arrow" | "text" | "freehand" | "eraser";
type Panel = "components" | "review" | "docs" | "export" | null;
type PrimitiveTool = Exclude<Tool, "select" | "pan" | "eraser">;
type CanvasPoint = { x: number; y: number };
type DrawDraft = { kind: PrimitiveTool; start: CanvasPoint; current: CanvasPoint; points: CanvasPoint[] };

const drawableTools: PrimitiveTool[] = ["rectangle", "ellipse", "diamond", "frame", "line", "arrow", "text", "freehand"];

function defaultPrimitiveDimensions(kind: PrimitiveTool) {
  if (kind === "text") return { width: 180, height: 48 };
  if (kind === "freehand") return { width: 120, height: 70 };
  if (kind === "frame") return { width: 360, height: 240 };
  if (kind === "line" || kind === "arrow") return { width: 180, height: 20 };
  return { width: 150, height: 90 };
}

function draftBounds(draft: DrawDraft) {
  const points = draft.kind === "freehand" ? draft.points : [draft.start, draft.current];
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const fallback = defaultPrimitiveDimensions(draft.kind);
  const moved = Math.abs(draft.current.x - draft.start.x) > 5 || Math.abs(draft.current.y - draft.start.y) > 5;
  return {
    position: moved ? { x: minX, y: minY } : draft.start,
    dimensions: moved ? { width: Math.max(draft.kind === "line" || draft.kind === "arrow" ? 80 : 40, maxX - minX), height: Math.max(draft.kind === "line" || draft.kind === "arrow" ? 20 : 28, maxY - minY) } : fallback,
  };
}

const nodeTypes = { semantic: SemanticNode, primitive: PrimitiveNode };

function flowNodes(
  diagram: Diagram,
  onResize: (id: string, width: number, height: number) => void,
  onTextEditStart: () => void,
  onTextChange: (id: string, text: string) => void,
  onTextEditEnd: () => void,
  preview: DrawDraft | null,
): EditorNode[] {
  const semantic: SemanticFlowNode[] = diagram.nodes.map((component) => ({ id: component.id, type: "semantic", position: component.position, data: { component, onResize: (width, height) => onResize(component.id, width, height) }, width: component.dimensions.width, height: component.dimensions.height }));
  const primitives: PrimitiveFlowNode[] = diagram.primitives.map((primitive) => ({ id: primitive.id, type: "primitive", position: primitive.position, data: { primitive, onResize: (width, height) => onResize(primitive.id, width, height), onTextEditStart, onTextChange: (text) => onTextChange(primitive.id, text), onTextEditEnd }, width: primitive.dimensions.width, height: primitive.dimensions.height }));
  if (preview) {
    const bounds = draftBounds(preview);
    const relativePoints = preview.points.map((point) => ({ x: point.x - bounds.position.x, y: point.y - bounds.position.y }));
    primitives.push({
      id: "drawing-preview",
      type: "primitive",
      position: bounds.position,
      width: bounds.dimensions.width,
      height: bounds.dimensions.height,
      draggable: false,
      selectable: false,
      data: { primitive: { id: "drawing-preview", kind: preview.kind, position: bounds.position, dimensions: bounds.dimensions, text: "", style: preview.kind === "freehand" ? { points: JSON.stringify(relativePoints) } : { preview: "true" } } },
    });
  }
  return [...semantic, ...primitives];
}

function flowEdges(diagram: Diagram): Edge[] {
  return diagram.connectors.map((connector) => ({
    id: connector.id,
    source: connector.source,
    target: connector.target,
    sourceHandle: connector.sourcePort,
    targetHandle: connector.targetPort,
    label: connector.label || connector.type,
    type: "smoothstep",
    animated: connector.type === "event-stream",
    style: { stroke: "#8b9098", strokeWidth: 1.5, strokeDasharray: connector.style === "dashed" ? "5 5" : undefined },
    markerEnd: connector.type === "control-plane" ? undefined : { type: MarkerType.ArrowClosed, color: "#8b9098", width: 14, height: 14 },
  }));
}

function bump(diagram: Diagram): Diagram {
  return { ...diagram, version: diagram.version + 1, updatedAt: new Date().toISOString() };
}

function ArchitectureEditorInner({ initialDiagram, readOnly = false, persisted = false, projectId }: { initialDiagram: Diagram; readOnly?: boolean; persisted?: boolean; projectId?: string }) {
  const [diagram, setDiagram] = useState(() => diagramSchema.parse(initialDiagram));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [panel, setPanel] = useState<Panel>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [past, setPast] = useState<Diagram[]>([]);
  const [future, setFuture] = useState<Diagram[]>([]);
  const [dragSnapshot, setDragSnapshot] = useState<Diagram | null>(null);
  const [instance, setInstance] = useState<ReactFlowInstance<EditorNode, Edge> | null>(null);
  const [zoom, setZoom] = useState(100);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline">("saved");
  const [reviews, setReviews] = useState<ReviewFinding[]>([]);
  const [docs, setDocs] = useState("");
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [showSaveGate, setShowSaveGate] = useState(false);
  const [command, setCommand] = useState("");
  const [changePlan, setChangePlan] = useState<ChangePlan | null>(null);
  const [message, setMessage] = useState("");
  const [aiExpanded, setAiExpanded] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [drawDraft, setDrawDraft] = useState<DrawDraft | null>(null);
  const [shareLink, setShareLink] = useState<{ id: string; url: string } | null>(null);
  const latest = useRef(diagram);
  const editRevision = useRef(0);
  const savedRevision = useRef(0);
  const saveInFlight = useRef(false);
  const textEditSnapshot = useRef<Diagram | null>(null);
  const ignoreNextPaneClick = useRef(false);
  latest.current = diagram;

  const selectedNode = diagram.nodes.find((node) => node.id === selectedId);
  const selectedConnector = diagram.connectors.find((connector) => connector.id === selectedId);
  const categories = ["all", ...Object.keys(categoryMeta)];
  const filteredCatalog = nodeCatalog.filter((item) => (category === "all" || item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));

  const commit = useCallback((next: Diagram | ((current: Diagram) => Diagram)) => {
    if (readOnly) return;
    setDiagram((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      setPast((items) => [...items.slice(-49), current]);
      setFuture([]);
      editRevision.current += 1;
      return diagramSchema.parse(persisted ? { ...resolved, updatedAt: new Date().toISOString() } : bump(resolved));
    });
  }, [persisted, readOnly]);

  const resizeItem = useCallback((id: string, width: number, height: number) => {
    if (readOnly) return;
    commit((current) => ({
      ...current,
      nodes: current.nodes.map((node) => node.id === id ? { ...node, dimensions: { width: Math.round(width), height: Math.round(height) } } : node),
      primitives: current.primitives.map((item) => item.id === id ? { ...item, dimensions: { width: Math.round(width), height: Math.round(height) } } : item),
    }));
  }, [commit, readOnly]);

  const beginPrimitiveTextEdit = useCallback(() => {
    if (!readOnly && !textEditSnapshot.current) textEditSnapshot.current = structuredClone(latest.current);
  }, [readOnly]);

  const updatePrimitiveText = useCallback((id: string, text: string) => {
    if (readOnly) return;
    setDiagram((current) => ({ ...current, primitives: current.primitives.map((item) => item.id === id ? { ...item, text } : item) }));
  }, [readOnly]);

  const finishPrimitiveTextEdit = useCallback(() => {
    const snapshot = textEditSnapshot.current;
    if (readOnly || !snapshot) return;
    textEditSnapshot.current = null;
    setPast((items) => [...items.slice(-49), snapshot]);
    setFuture([]);
    editRevision.current += 1;
    setDiagram((current) => diagramSchema.parse(persisted ? { ...current, updatedAt: new Date().toISOString() } : bump(current)));
  }, [persisted, readOnly]);

  const nodes = useMemo(() => flowNodes(diagram, resizeItem, beginPrimitiveTextEdit, updatePrimitiveText, finishPrimitiveTextEdit, drawDraft), [diagram, resizeItem, beginPrimitiveTextEdit, updatePrimitiveText, finishPrimitiveTextEdit, drawDraft]);
  const edges = useMemo(() => flowEdges(diagram), [diagram]);

  useEffect(() => {
    if (readOnly || persisted) return;
    const timer = window.setInterval(async () => {
      setSaveState(navigator.onLine ? "saving" : "offline");
      const current = latest.current;
      await saveDraft({ id: current.id, diagram: current, status: "ready", createdAt: current.createdAt, updatedAt: current.updatedAt });
      setSaveState(navigator.onLine ? "saved" : "offline");
    }, 6000);
    return () => window.clearInterval(timer);
  }, [persisted, readOnly]);

  useEffect(() => {
    if (!persisted || readOnly) return;
    const timer = window.setInterval(async () => {
      if (saveInFlight.current || editRevision.current === savedRevision.current) return;
      const revisionAtStart = editRevision.current;
      const snapshot = latest.current;
      saveInFlight.current = true;
      setSaveState(navigator.onLine ? "saving" : "offline");
      try {
        const response = await fetch(`/api/v1/diagrams/${snapshot.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ baseVersion: snapshot.version, diagram: snapshot }),
        });
        const body = await response.json();
        if (response.status === 409) throw new Error("A newer version exists. Reload the project before saving again.");
        if (!response.ok) throw new Error(body.error ?? "Project save failed.");
        const saved = body.saved?.[0];
        if (!saved?.version) throw new Error("Project save did not return a version.");
        await clearQueuedProjectSave(snapshot.id);
        savedRevision.current = revisionAtStart;
        setDiagram((current) => current.version === snapshot.version ? { ...current, version: saved.version, updatedAt: new Date().toISOString() } : current);
        setSaveState("saved");
      } catch (error) {
        const isConflict = error instanceof Error && error.message.includes("newer version");
        if (!isConflict) await queueProjectSave({ diagramId: snapshot.id, baseVersion: snapshot.version, diagram: snapshot });
        setSaveState("offline");
        setMessage(isConflict && error instanceof Error ? error.message : "Saved on this device. We will retry when you are back online.");
      } finally {
        saveInFlight.current = false;
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [persisted, readOnly]);

  useEffect(() => {
    if (!persisted || readOnly) return;
    async function flushQueuedSave() {
      if (!navigator.onLine || saveInFlight.current) return;
      const queued = await loadQueuedProjectSave(latest.current.id);
      if (!queued) return;
      saveInFlight.current = true;
      setSaveState("saving");
      try {
        const response = await fetch(`/api/v1/diagrams/${queued.diagramId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ baseVersion: queued.baseVersion, diagram: queued.diagram }),
        });
        const body = await response.json();
        if (response.status === 409) throw new Error("A newer version exists. Your local changes remain on this device.");
        if (!response.ok) throw new Error(body.error ?? "Project save failed.");
        await clearQueuedProjectSave(queued.diagramId);
        setSaveState("saved");
        setMessage("Saved queued changes.");
      } catch (error) {
        setSaveState("offline");
        setMessage(error instanceof Error ? error.message : "Your changes remain saved on this device.");
      } finally {
        saveInFlight.current = false;
      }
    }
    const onOffline = () => setSaveState("offline");
    const onOnline = () => { setSaveState("saving"); void flushQueuedSave(); };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    void flushQueuedSave();
    return () => { window.removeEventListener("offline", onOffline); window.removeEventListener("online", onOnline); };
  }, [persisted, readOnly]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (readOnly || isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if ((event.metaKey || event.ctrlKey) && key === "y") { event.preventDefault(); redo(); return; }
      if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); removeSelected(); return; }
      if (key === "v") setTool("select");
      if (key === "h") setTool("pan");
      if (key === "c") setPanel((current) => current === "components" ? null : "components");
      if (key === "enter" && (selectedNode || selectedConnector)) setInspectorOpen(true);
      if (key === "r") setTool("rectangle");
      if (key === "o") setTool("ellipse");
      if (key === "d") setTool("diamond");
      if (key === "f") setTool("frame");
      if (key === "l") setTool("line");
      if (key === "a") setTool("arrow");
      if (key === "t") setTool("text");
      if (key === "p") setTool("freehand");
      if (key === "escape") { setTool("select"); setPanel(null); setInspectorOpen(false); setSelectedId(null); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function undo() {
    const previous = past.at(-1);
    if (!previous || readOnly) return;
    setFuture((items) => [diagram, ...items]);
    setPast((items) => items.slice(0, -1));
    setDiagram(previous);
  }

  function redo() {
    const next = future[0];
    if (!next || readOnly) return;
    setPast((items) => [...items, diagram]);
    setFuture((items) => items.slice(1));
    setDiagram(next);
  }

  function onNodesChange(changes: NodeChange<EditorNode>[]) {
    for (const change of changes) {
      if (change.type === "select" && change.selected) setSelectedId(change.id);
      if (change.type === "position" && change.position && !readOnly) {
        setDiagram((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === change.id ? { ...node, position: change.position! } : node), primitives: current.primitives.map((item) => item.id === change.id ? { ...item, position: change.position! } : item) }));
      }
    }
  }

  function finishNodeDrag() {
    if (!dragSnapshot || readOnly) return;
    setPast((items) => [...items.slice(-49), dragSnapshot]);
    setFuture([]);
    editRevision.current += 1;
    setDiagram((current) => diagramSchema.parse(persisted ? { ...current, updatedAt: new Date().toISOString() } : bump(current)));
    setDragSnapshot(null);
  }

  function onConnect(connection: Connection) {
    if (readOnly || !connection.source || !connection.target) return;
    const source = diagram.nodes.find((node) => node.id === connection.source);
    const target = diagram.nodes.find((node) => node.id === connection.target);
    if (!source || !target) return;
    const validation = validateConnection(source, target);
    if (!validation.valid) { setMessage(validation.reason); return; }
    const connectorType = tool === "line" ? "control-plane" : "http-rest";
    const connector = createConnector(crypto.randomUUID(), source.id, target.id, connectorType, connectorType === "control-plane" ? "relationship" : "HTTPS");
    commit((current) => ({ ...current, connectors: [...current.connectors, connector] }));
    setMessage(validation.reason);
  }

  function addComponent(semanticType: string, dropPosition?: { x: number; y: number }) {
    const item = catalogByType.get(semanticType)!;
    const position = dropPosition ?? instance?.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }) ?? { x: 240, y: 180 };
    const node = createNode(semanticType, crypto.randomUUID(), item.name, position.x, position.y);
    commit((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
    setPanel(null);
  }

  function addPrimitive(kind: PrimitiveTool, position: CanvasPoint, dimensions = defaultPrimitiveDimensions(kind), style: Record<string, string> = {}) {
    if (readOnly) return;
    const id = crypto.randomUUID();
    commit((current) => ({ ...current, primitives: [...current.primitives, { id, kind, position, dimensions, text: "", style }] }));
    setSelectedId(id);
    setTool("select");
  }

  function onPaneClick(event: React.MouseEvent) {
    if (ignoreNextPaneClick.current) { ignoreNextPaneClick.current = false; return; }
    setSelectedId(null);
    setInspectorOpen(false);
    if (drawableTools.includes(tool as PrimitiveTool)) {
      const position = instance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? { x: 200, y: 200 };
      addPrimitive(tool as PrimitiveTool, position);
    }
  }

  function canvasPoint(event: React.MouseEvent) {
    return instance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? { x: event.clientX, y: event.clientY };
  }

  function isPaneEvent(event: React.MouseEvent) {
    return event.target instanceof HTMLElement && Boolean(event.target.closest(".react-flow__pane"));
  }

  function startDrawing(event: React.MouseEvent) {
    if (readOnly || !drawableTools.includes(tool as PrimitiveTool) || !isPaneEvent(event)) return;
    const point = canvasPoint(event);
    setDrawDraft({ kind: tool as PrimitiveTool, start: point, current: point, points: [point] });
  }

  function updateDrawing(event: React.MouseEvent) {
    if (!drawDraft || !isPaneEvent(event)) return;
    const point = canvasPoint(event);
    setDrawDraft((current) => {
      if (!current) return current;
      if (current.kind !== "freehand") return { ...current, current: point };
      const previous = current.points.at(-1);
      if (previous && Math.hypot(previous.x - point.x, previous.y - point.y) < 3) return current;
      return { ...current, current: point, points: [...current.points, point] };
    });
  }

  function finishDrawing() {
    if (!drawDraft) return;
    ignoreNextPaneClick.current = true;
    const draft = drawDraft;
    setDrawDraft(null);
    if (draft.kind === "freehand" && draft.points.length < 2) { setMessage("Drag to draw freehand ink."); return; }
    const bounds = draftBounds(draft);
    const relativePoints = draft.points.map((point) => ({ x: Math.round(point.x - bounds.position.x), y: Math.round(point.y - bounds.position.y) }));
    addPrimitive(draft.kind, bounds.position, bounds.dimensions, draft.kind === "freehand" ? { points: JSON.stringify(relativePoints) } : {});
  }

  function onCanvasDragOver(event: React.DragEvent) {
    if (!event.dataTransfer.types.includes("application/buildrax-component")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onCanvasDrop(event: React.DragEvent) {
    const semanticType = event.dataTransfer.getData("application/buildrax-component");
    if (!semanticType || readOnly) return;
    event.preventDefault();
    const position = instance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? { x: 240, y: 180 };
    addComponent(semanticType, position);
  }

  function removeById(id: string) {
    if (readOnly) return;
    commit((current) => ({ ...current, nodes: current.nodes.filter((node) => node.id !== id), primitives: current.primitives.filter((item) => item.id !== id), connectors: current.connectors.filter((edge) => edge.id !== id && edge.source !== id && edge.target !== id) }));
    setSelectedId(null);
    setInspectorOpen(false);
    setTool("select");
  }

  function removeSelected() {
    if (!selectedId) { setTool("eraser"); setMessage("Select an object to delete it."); return; }
    removeById(selectedId);
  }

  function updateSelected(patch: Record<string, string>) {
    if (!selectedId) return;
    commit((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedId ? { ...node, ...patch } : node), primitives: current.primitives.map((item) => item.id === selectedId ? { ...item, text: patch.text ?? item.text } : item) }));
  }

  function updateSelectedConnector(patch: Partial<Diagram["connectors"][number]>) {
    if (!selectedConnector) return;
    commit((current) => ({ ...current, connectors: current.connectors.map((connector) => connector.id === selectedConnector.id ? { ...connector, ...patch } : connector) }));
  }

  async function runLayout() {
    const next = await autoLayout(diagram);
    commit(next);
    setTimeout(() => instance?.fitView({ padding: .2, duration: 500 }), 40);
  }

  async function runReview() {
    setPanel("review"); setLoadingPanel(true);
    try {
      const response = await fetch("/api/v1/ai/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setReviews(body.findings);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Review failed."); }
    finally { setLoadingPanel(false); }
  }

  async function generateDocs() {
    setPanel("docs"); setLoadingPanel(true);
    try {
      const response = await fetch("/api/v1/ai/documentation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setDocs(body.markdown);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Documentation failed."); }
    finally { setLoadingPanel(false); }
  }

  async function requestChange() {
    if (command.trim().length < 4) return;
    try {
      const response = await fetch("/api/v1/ai/change-plans", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram, command }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setChangePlan(body.plan);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not prepare the change."); }
  }

  async function toggleShareLink() {
    if (!projectId) return;
    try {
      if (shareLink) {
        const response = await fetch("/api/v1/share-links", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: shareLink.id }) });
        if (!response.ok) throw new Error((await response.json()).error ?? "Could not revoke the share link.");
        setShareLink(null);
        setMessage("Read-only share link revoked.");
        return;
      }
      const response = await fetch("/api/v1/share-links", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not create a share link.");
      const url = `${location.origin}${body.url}`;
      setShareLink({ id: body.id, url });
      await navigator.clipboard?.writeText(url);
      setMessage("Read-only link copied. It expires in seven days.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Share link action failed."); }
  }

  function applyChangePlan() {
    if (!changePlan || changePlan.baseVersion !== diagram.version) { setMessage("The diagram changed. Request a fresh preview."); setChangePlan(null); return; }
    commit((current) => ({ ...current, nodes: [...current.nodes.filter((node) => !changePlan.removedNodeIds.includes(node.id)).map((node) => changePlan.changedNodes.find((change) => change.before.id === node.id)?.after ?? node), ...changePlan.addedNodes], connectors: [...current.connectors.filter((edge) => !changePlan.removedConnectorIds.includes(edge.id) && !changePlan.removedNodeIds.includes(edge.source) && !changePlan.removedNodeIds.includes(edge.target)), ...changePlan.addedConnectors] }));
    setChangePlan(null); setCommand("");
  }

  async function exportFile(format: "json" | "mermaid" | "markdown" | "png" | "svg") {
    if (format === "json") return downloadText(JSON.stringify(diagram, null, 2), safeFilename(diagram.title, "json"), "application/json");
    if (format === "mermaid") return downloadText(toMermaid(diagram), safeFilename(diagram.title, "mmd"), "text/plain");
    if (format === "markdown") {
      let markdown = docs;
      if (!markdown) {
        const response = await fetch("/api/v1/ai/documentation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram }) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Documentation export failed.");
        markdown = body.markdown;
        setDocs(markdown);
      }
      return downloadText(markdown, safeFilename(diagram.title, "md"), "text/markdown");
    }
    const viewport = document.querySelector(`.${styles.reactFlow} .react-flow__viewport`) as HTMLElement | null;
    if (!viewport) return;
    const image = await import("html-to-image");
    const dataUrl = format === "png" ? await image.toPng(viewport, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--bg") }) : await image.toSvg(viewport, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--bg") });
    const anchor = document.createElement("a"); anchor.href = dataUrl; anchor.download = safeFilename(diagram.title, format); anchor.click();
  }

  const toolbar: Array<{ tool: Exclude<Tool, "select" | "pan">; label: string; icon: React.ReactNode }> = [
    { tool: "rectangle", label: "Rectangle (R)", icon: <Square size={17} /> }, { tool: "ellipse", label: "Ellipse (O)", icon: <Circle size={17} /> },
    { tool: "diamond", label: "Diamond (D)", icon: <Diamond size={17} /> }, { tool: "frame", label: "Frame (F)", icon: <Frame size={17} /> },
    { tool: "line", label: "Line (L) — place a relationship", icon: <Minus size={17} /> }, { tool: "arrow", label: "Arrow (A) — place a directional arrow", icon: <ArrowRight size={17} /> },
    { tool: "text", label: "Text (T)", icon: <Type size={17} /> }, { tool: "freehand", label: "Freehand (P)", icon: <Pencil size={17} /> }, { tool: "eraser", label: "Delete selected", icon: <Eraser size={17} /> },
  ];

  return <div className={styles.screen}>
    <header className={styles.topbar}>
      <Brand /><span>/</span><div className={styles.crumb}><input aria-label="Diagram title" value={diagram.title} readOnly={readOnly} onChange={(event) => setDiagram((current) => ({ ...current, title: event.target.value }))} onBlur={() => commit((current) => current)} /><span className={styles.status}><span className={styles.statusDot} />{saveState === "saved" ? persisted ? "Saved" : "Saved locally" : saveState === "saving" ? "Saving…" : "Offline · queued"}</span></div>
      <div className={styles.topActions}><button className={styles.topButton} onClick={runLayout}><LayoutDashboard size={14} /><span>Auto layout</span></button><button className={styles.topButton} onClick={runReview}><ShieldCheck size={14} /><span>Review</span></button><button className={styles.topButton} onClick={generateDocs}><FileText size={14} /><span>Docs</span></button><button className={styles.topButton} onClick={() => setPanel("export")}><Download size={14} /><span>Export</span></button>{persisted && projectId && <button className={styles.topButton} onClick={() => void toggleShareLink()}><Share2 size={14} /><span>{shareLink ? "Revoke share" : "Share"}</span></button>}<ThemeToggle />{!readOnly && <button className={styles.topButton} onClick={() => persisted ? setMessage("Project is saved automatically.") : setShowSaveGate(true)}><Save size={14} /><span>Save</span></button>}</div>
    </header>
    <main className={styles.workspace}>
      <div className={`${styles.canvas} ${inspectorOpen && (selectedNode || selectedConnector) && panel === null ? styles.canvasWithInspector : ""}`} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}>
        <ReactFlow<EditorNode, Edge> className={styles.reactFlow} nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={setInstance} onNodesChange={onNodesChange} onConnect={onConnect} onNodeClick={(_, node) => { if (tool === "eraser") removeById(node.id); else { setSelectedId(node.id); setInspectorOpen(false); } }} onNodeDoubleClick={(_, node) => { setSelectedId(node.id); setInspectorOpen(true); }} onEdgeClick={(_, edge) => { if (tool === "eraser") removeById(edge.id); else { setSelectedId(edge.id); setInspectorOpen(false); } }} onEdgeDoubleClick={(_, edge) => { setSelectedId(edge.id); setInspectorOpen(true); }} onNodeDragStart={() => setDragSnapshot(structuredClone(diagram))} onNodeDragStop={finishNodeDrag} onPaneClick={onPaneClick} onPaneMouseMove={updateDrawing} onMouseDown={startDrawing} onMouseUp={finishDrawing} onMove={(_, viewport) => setZoom(Math.round(viewport.zoom * 100))} panOnDrag={tool === "pan" || readOnly} panActivationKeyCode="Space" nodesDraggable={!readOnly && tool === "select"} nodesConnectable={!readOnly && (tool === "select" || tool === "line" || tool === "arrow")} elementsSelectable={tool === "select" || readOnly} selectionOnDrag={tool === "select"} selectionKeyCode="Shift" multiSelectionKeyCode="Shift" deleteKeyCode={null} fitView minZoom={.15} maxZoom={2.5}>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-strong)" /><MiniMap pannable zoomable bgColor="var(--surface)" maskColor="color-mix(in srgb, var(--bg) 74%, transparent)" nodeColor={(node) => node.type === "semantic" ? categoryMeta[(node.data as SemanticFlowNode["data"]).component.category].color : "var(--text-secondary)"} />
        </ReactFlow>
      </div>
      <div className={styles.mobileNotice}>Mobile light-edit mode: pan, zoom, select and edit labels. Use desktop for drawing and connection creation.</div>
      {!readOnly && <div className={styles.toolbar} aria-label="Canvas tools">{toolbar.map((item, index) => <span key={item.tool} style={{ display: "contents" }}>{index === 2 || index === 6 || index === 8 ? <span className={styles.toolDivider} /> : null}<button className={`${styles.tool} ${tool === item.tool ? styles.toolActive : ""}`} title={item.label} data-tooltip={item.label} aria-label={item.label} onClick={() => item.tool === "eraser" ? removeSelected() : setTool(item.tool)}>{item.icon}</button></span>)}<span className={styles.toolDivider} /><button className={`${styles.tool} ${panel === "components" ? styles.toolActive : ""}`} title="Components (C)" data-tooltip="Components (C)" aria-label="Open semantic components" onClick={() => setPanel(panel === "components" ? null : "components")}><Boxes size={18} /></button></div>}
      <div className={styles.bottomBar}><button className={tool === "select" ? styles.bottomToolActive : ""} title="Pointer / select (V)" data-tooltip="Pointer / select (V)" aria-label="Pointer / select" onClick={() => setTool("select")}><MousePointer2 size={15} /></button><button className={tool === "pan" ? styles.bottomToolActive : ""} title="Hand / pan (H)" data-tooltip="Hand / pan (H)" aria-label="Hand / pan" onClick={() => setTool("pan")}><Hand size={15} /></button><span className={styles.bottomDivider} /><button title="Undo" data-tooltip="Undo" aria-label="Undo" onClick={undo} disabled={!past.length}><Undo2 size={15} /></button><button title="Redo" data-tooltip="Redo" aria-label="Redo" onClick={redo} disabled={!future.length}><Redo2 size={15} /></button><span className={styles.bottomDivider} /><button title="Zoom out" data-tooltip="Zoom out" aria-label="Zoom out" onClick={() => instance?.zoomOut()}><ZoomOut size={15} /></button><button className={styles.zoom} title="Fit canvas" data-tooltip="Fit canvas" onClick={() => instance?.fitView({ padding: .18 })}>{zoom}%</button><button title="Zoom in" data-tooltip="Zoom in" aria-label="Zoom in" onClick={() => instance?.zoomIn()}><ZoomIn size={15} /></button></div>
      {diagram.assumptions.length > 0 && <div className={styles.assumptions}><strong>{diagram.assumptions.length} assumptions</strong><br />{diagram.assumptions[0].text}</div>}
      {!readOnly && (aiExpanded ? <div className={`${styles.aiBar} ${inspectorOpen && (selectedNode || selectedConnector) && panel === null ? styles.aiBarWithInspector : ""}`}><Sparkles size={14} /><input autoFocus value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") requestChange(); if (event.key === "Escape") setAiExpanded(false); }} placeholder="Describe an architecture change…" aria-label="AI architecture change" /><button className={styles.aiSend} onClick={requestChange} aria-label="Preview AI change"><Send size={14} /></button><button className={styles.aiClose} onClick={() => setAiExpanded(false)} aria-label="Collapse AI change input"><X size={14} /></button></div> : <button className={`${styles.aiLauncher} ${inspectorOpen && (selectedNode || selectedConnector) && panel === null ? styles.aiLauncherWithInspector : ""}`} onClick={() => setAiExpanded(true)} aria-label="Open AI architecture change" aria-expanded="false"><Sparkles size={15} /><span>Ask AI</span></button>)}
      {panel === "components" && <aside className={styles.drawer} aria-label="Semantic Components"><div className={styles.panelHead}><strong>Components</strong><button className={styles.close} onClick={() => setPanel(null)} aria-label="Close"><X size={14} /></button></div><div className={styles.search}><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search components" /></div><div className={styles.categories}>{categories.map((item) => <button key={item} className={category === item ? styles.categoryActive : ""} onClick={() => setCategory(item)}>{item === "all" ? "All" : categoryMeta[item as keyof typeof categoryMeta].label}</button>)}</div><div className={styles.componentList}>{filteredCatalog.map((item) => <button key={item.semanticType} draggable className={styles.componentItem} title={`Drag ${item.name} onto the canvas`} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/buildrax-component", item.semanticType); }} onClick={() => addComponent(item.semanticType)}><span className={styles.componentCode} style={{ "--item-color": categoryMeta[item.category].color } as React.CSSProperties}>{item.shortCode}</span><span className={styles.componentText}><strong>{item.name}</strong><span>{item.description}</span></span><Plus size={14} /></button>)}</div></aside>}
      {panel === null && (selectedNode || selectedConnector) && inspectorOpen && <aside className={styles.inspector}><div className={styles.panelHead}><strong>{selectedConnector ? "Connection" : "Inspector"}</strong><button className={styles.close} onClick={() => setInspectorOpen(false)} aria-label="Close inspector"><X size={14} /></button></div><div className={styles.inspectorBody}>{selectedNode ? <><div className={styles.metaCard}>{categoryMeta[selectedNode.category].label} · {selectedNode.semanticType}<br />Version {diagram.version}</div><label className={styles.field}><span>Name</span><input value={selectedNode.name} onChange={(event) => updateSelected({ name: event.target.value })} /></label><label className={styles.field}><span>Description</span><textarea value={selectedNode.description} onChange={(event) => updateSelected({ description: event.target.value })} /></label><label className={styles.field}><span>Technology</span><input value={selectedNode.technology} onChange={(event) => updateSelected({ technology: event.target.value })} placeholder="Provider-neutral" /></label><label className={styles.field}><span>Provider</span><input value={selectedNode.provider} onChange={(event) => updateSelected({ provider: event.target.value })} placeholder="Not selected" /></label><button className={styles.dangerButton} onClick={removeSelected}>Delete component</button></> : selectedConnector ? <><div className={styles.metaCard}>{selectedConnector.source} → {selectedConnector.target}<br />Version {diagram.version}</div><label className={styles.field}><span>Connection type</span><select value={selectedConnector.type} onChange={(event) => updateSelectedConnector({ type: event.target.value as Diagram["connectors"][number]["type"] })}>{["http-rest", "grpc", "websocket", "async-message", "pub-sub", "event-stream", "database-read-write", "cache", "object-transfer", "model-inference", "vector-retrieval", "tool-call", "control-plane"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label className={styles.field}><span>Label</span><input value={selectedConnector.label} onChange={(event) => updateSelectedConnector({ label: event.target.value })} placeholder="Describe the relationship" /></label><label className={styles.field}><span>Protocol</span><input value={selectedConnector.protocol} onChange={(event) => updateSelectedConnector({ protocol: event.target.value })} placeholder="HTTPS, gRPC, AMQP…" /></label><label className={styles.field}><span>Authentication</span><input value={selectedConnector.authentication} onChange={(event) => updateSelectedConnector({ authentication: event.target.value })} placeholder="OAuth, mTLS, API key…" /></label><label className={styles.field}><span>Encryption</span><input value={selectedConnector.encryption} onChange={(event) => updateSelectedConnector({ encryption: event.target.value })} placeholder="TLS 1.3" /></label><button className={styles.dangerButton} onClick={removeSelected}>Delete connection</button></> : null}</div></aside>}
      {(panel === "review" || panel === "docs" || panel === "export") && <aside className={styles.sidePanel}><div className={styles.panelHead}><strong>{panel === "review" ? "Architecture review" : panel === "docs" ? "Documentation" : "Export"}</strong><button className={styles.close} onClick={() => setPanel(null)} aria-label="Close"><X size={14} /></button></div><div className={styles.sidePanelBody}>{loadingPanel ? <p>Preparing version {diagram.version}…</p> : panel === "review" ? <><p>Advisory findings for version {diagram.version}. Validate recommendations with your engineering and security teams.</p>{reviews.length ? reviews.map((finding) => <article className={styles.finding} key={finding.id}><div className={`${styles.findingTop} ${styles[`severity_${finding.severity}`]}`}><span>{finding.lens}</span><span>{finding.severity}</span></div><p>{finding.rationale}</p><strong>{finding.recommendation}</strong></article>) : <p>No review has been run for this version.</p>}</> : panel === "docs" ? <pre className={styles.docs}>{docs || "Generate documentation to create a version-bound implementation brief."}</pre> : <><p>Guest exports contain only the diagram model and visible content.</p>{(["png", "svg", "json", "mermaid", "markdown"] as const).map((format) => <button className={styles.componentItem} key={format} onClick={() => exportFile(format)}><span className={styles.componentCode} style={{ "--item-color": "var(--text-secondary)" } as React.CSSProperties}>{format.slice(0, 3).toUpperCase()}</span><span className={styles.componentText}><strong>{format.toUpperCase()}</strong><span>{format === "png" || format === "svg" ? "Current canvas view" : "Validated semantic model"}</span></span><Download size={14} /></button>)}</>}</div></aside>}
      {message && <button className={styles.assumptions} onClick={() => setMessage("")} role="status">{message}</button>}
    </main>
    {showSaveGate && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="save-title"><div className={styles.modal}><LockKeyhole size={22} /><h2 id="save-title">Save your architecture</h2><p>Create a free workspace to preserve this diagram, its documentation and AI review. Your local draft remains intact if you cancel.</p><div className={styles.modalActions}><Button variant="tertiary" onClick={() => setShowSaveGate(false)}>Keep working locally</Button><ButtonLink href={`/dashboard?migrate=${diagram.id}`}>Continue to sign in</ButtonLink></div></div></div>}
    {changePlan && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="change-title"><div className={styles.modal}><Bot size={22} /><h2 id="change-title">Preview architecture change</h2><p>Nothing changes until you apply this preview. Applying creates one undoable transaction.</p><div className={styles.diff}><div className={styles.diffRow}><span>Components added</span><strong>+{changePlan.addedNodes.length}</strong></div><div className={styles.diffRow}><span>Components changed</span><strong>{changePlan.changedNodes.length}</strong></div><div className={styles.diffRow}><span>Components removed</span><strong>-{changePlan.removedNodeIds.length}</strong></div></div>{changePlan.warnings.map((warning) => <p key={warning}>{warning}</p>)}<div className={styles.modalActions}><Button variant="tertiary" onClick={() => setChangePlan(null)}>Cancel</Button><Button onClick={applyChangePlan}>Apply change</Button></div></div></div>}
  </div>;
}

export function ArchitectureEditor(props: { initialDiagram: Diagram; readOnly?: boolean; persisted?: boolean; projectId?: string }) {
  return <ReactFlowProvider><ArchitectureEditorInner {...props} /></ReactFlowProvider>;
}
