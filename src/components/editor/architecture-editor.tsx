"use client";

import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  applyNodeChanges,
  type Connection,
  type Edge,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  ArrowRight,
  Bold,
  BringToFront,
  Bot,
  Boxes,
  CheckSquare,
  Circle,
  Code2,
  Copy,
  Diamond,
  Download,
  Eraser,
  FileText,
  FolderKanban,
  Frame,
  GripVertical,
  Hand,
  History,
  ImagePlus,
  Italic,
  LayoutDashboard,
  List,
  ListOrdered,
  LockKeyhole,
  Map,
  Minus,
  MousePointer2,
  PanelRightClose,
  PenLine,
  Pencil,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  SendToBack,
  Sparkles,
  Square,
  Type,
  Underline,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { architectureIRFromDiagram, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import { catalogByType, categoryMeta, nodeCatalog } from "@/lib/domain/catalog";
import { validateConnection } from "@/lib/domain/compatibility";
import { architectureIRToMermaid, downloadText, safeFilename } from "@/lib/domain/export";
import { createConnector, createNode } from "@/lib/domain/factory";
import { autoLayout } from "@/lib/domain/layout";
import { diagramSchema, type ChangePlan, type Diagram, type ReviewFinding } from "@/lib/domain/schema";
import { clearQueuedProjectSave, loadQueuedProjectSave, queueProjectSave, saveDraft } from "@/lib/storage/drafts";
import { persistPrivatePresentationImages } from "@/lib/storage/private-assets";
import { PrimitiveNode, type PrimitiveFlowNode } from "./primitive-node";
import { SemanticNode, type SemanticFlowNode } from "./semantic-node";
import { SemanticCatalogIcon } from "./semantic-catalog-icon";
import styles from "./editor.module.css";

type EditorNode = SemanticFlowNode | PrimitiveFlowNode;
type Tool = "select" | "pan" | "rectangle" | "circle" | "diamond" | "frame" | "line" | "arrow" | "text" | "freehand" | "eraser";
type Panel = "components" | "review" | "docs" | "export" | "history" | null;
type VersionSummary = {
  version: number;
  ir_version: number;
  diagram_checksum: string;
  presentation_state: string;
  diagram_state: string;
  ir_state: string;
  created_at: string;
};
type PrimitiveTool = Exclude<Tool, "select" | "pan" | "eraser" | "circle"> | "ellipse" | "image";
type CanvasPoint = { x: number; y: number };
type DrawDraft = { kind: PrimitiveTool; start: CanvasPoint; current: CanvasPoint; points: CanvasPoint[]; lockAspect?: boolean; style?: Record<string, string> };
type TransientPositions = Record<string, CanvasPoint>;
type ArrowStyle = "start" | "end" | "both" | "none";
type ArrowTexture = "solid" | "dashed" | "dotted";

function sameSelection(left: string[], right: string[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

const drawableTools: PrimitiveTool[] = ["rectangle", "diamond", "frame", "line", "arrow", "text", "freehand"];

// The supplied Figma export contains exact SVG artwork for these AI/ML nodes.
// We crop that local, exported sheet in the catalog instead of linking users out
// to Figma or redrawing its paths.
const figmaIconCrop: Partial<Record<string, { x: number; y: number }>> = {
  "hosted-llm": { x: 148, y: 249 },
  "embedding-model": { x: 556, y: 249 },
  "ai-agent": { x: 1168, y: 249 },
  "retrieval-service": { x: 352, y: 409 },
};

function defaultPrimitiveDimensions(kind: PrimitiveTool) {
  if (kind === "image") return { width: 280, height: 180 };
  if (kind === "text") return { width: 260, height: 56 };
  if (kind === "freehand") return { width: 120, height: 70 };
  if (kind === "frame") return { width: 360, height: 240 };
  if (kind === "line" || kind === "arrow") return { width: 180, height: 20 };
  if (kind === "diamond") return { width: 120, height: 120 };
  return { width: 150, height: 90 };
}

function draftBounds(draft: DrawDraft) {
  const points = draft.kind === "freehand" ? draft.points : [draft.start, draft.current];
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const fallback = draft.lockAspect ? { width: 120, height: 120 } : defaultPrimitiveDimensions(draft.kind);
  const moved = Math.abs(draft.current.x - draft.start.x) > 5 || Math.abs(draft.current.y - draft.start.y) > 5;
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const side = Math.max(rawWidth, rawHeight);
  const constrained = draft.lockAspect ? { width: side, height: side } : { width: rawWidth, height: rawHeight };
  return {
    position: moved ? { x: minX, y: minY } : draft.start,
    dimensions: moved ? { width: Math.max(draft.kind === "line" || draft.kind === "arrow" ? 80 : 40, constrained.width), height: Math.max(draft.kind === "line" || draft.kind === "arrow" ? 20 : 28, constrained.height) } : fallback,
  };
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }, padding = 32) {
  return a.x < b.x + b.width + padding && a.x + a.width + padding > b.x && a.y < b.y + b.height + padding && a.y + a.height + padding > b.y;
}

function nextOpenPosition(diagram: Diagram, preferred: CanvasPoint) {
  const size = { width: 220, height: 112 };
  const occupied = [
    ...diagram.nodes.map((node) => ({ x: node.position.x, y: node.position.y, width: node.dimensions.width, height: node.dimensions.height })),
    ...diagram.primitives.map((item) => ({ x: item.position.x, y: item.position.y, width: item.dimensions.width, height: item.dimensions.height })),
  ];

  for (let ring = 0; ring < 12; ring += 1) {
    const offset = ring * 48;
    const candidates = ring === 0 ? [preferred] : [
      { x: preferred.x + offset, y: preferred.y }, { x: preferred.x, y: preferred.y + offset },
      { x: preferred.x - offset, y: preferred.y }, { x: preferred.x, y: preferred.y - offset },
      { x: preferred.x + offset, y: preferred.y + offset }, { x: preferred.x - offset, y: preferred.y + offset },
    ];
    const available = candidates.find((position) => !occupied.some((item) => overlaps({ ...position, ...size }, item)));
    if (available) return available;
  }

  return { x: preferred.x + diagram.nodes.length * 48, y: preferred.y + diagram.nodes.length * 48 };
}

const nodeTypes = { semantic: SemanticNode, primitive: PrimitiveNode };

function flowNodes(
  diagram: Diagram,
  onResize: (id: string, width: number, height: number) => void,
  onTextEditStart: () => void,
  onTextChange: (id: string, text: string) => void,
  onTextEditEnd: () => void,
  onTextEditCancel: () => void,
  editingTextId: string | null,
  onTextEditActivate: (id: string) => void,
  connectorMode: boolean,
  preview: DrawDraft | null,
  transientPositions: TransientPositions,
  selectedIds: string[],
  renamingNodeId: string | null,
  onRenameStart: () => void,
  onNodeNameChange: (id: string, name: string) => void,
  onRenameEnd: () => void,
  onRenameCancel: () => void,
): EditorNode[] {
  const selected = new Set(selectedIds);
  const semantic: SemanticFlowNode[] = diagram.nodes.map((component, index) => ({ id: component.id, type: "semantic", position: transientPositions[component.id] ?? component.position, selected: selected.has(component.id), zIndex: typeof component.metadata.zIndex === "number" ? component.metadata.zIndex : index, data: { component, showConnectors: connectorMode, onResize: (width, height) => onResize(component.id, width, height), isRenaming: component.id === renamingNodeId, onRenameStart, onNameChange: (name) => onNodeNameChange(component.id, name), onRenameEnd, onRenameCancel }, width: component.dimensions.width, height: component.dimensions.height }));
  const primitives: PrimitiveFlowNode[] = diagram.primitives.map((primitive, index) => ({ id: primitive.id, type: "primitive", position: transientPositions[primitive.id] ?? primitive.position, selected: selected.has(primitive.id), zIndex: Number(primitive.style.zIndex ?? diagram.nodes.length + index), data: { primitive, onResize: (width, height) => onResize(primitive.id, width, height), isEditing: editingTextId === primitive.id, onTextEditActivate: () => onTextEditActivate(primitive.id), onTextEditStart, onTextChange: (text) => onTextChange(primitive.id, text), onTextEditEnd, onTextEditCancel }, width: primitive.dimensions.width, height: primitive.dimensions.height }));
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
      data: { primitive: { id: "drawing-preview", kind: preview.kind, position: bounds.position, dimensions: bounds.dimensions, text: "", style: preview.kind === "freehand" ? { points: JSON.stringify(relativePoints) } : { preview: "true", ...preview.style } } },
    });
  }
  return [...semantic, ...primitives];
}

function flowEdges(diagram: Diagram, selectedId: string | null): Edge[] {
  return diagram.connectors.map((connector) => ({
    id: connector.id,
    source: connector.source,
    target: connector.target,
    sourceHandle: connector.sourcePort,
    targetHandle: connector.targetPort,
    label: connector.label || connector.type,
    type: connector.routing === "straight" ? "straight" : connector.routing === "curved" ? "default" : "smoothstep",
    animated: connector.type === "event-stream",
    selected: connector.id === selectedId,
    style: { stroke: "#8b9098", strokeWidth: 1.5, strokeDasharray: connector.style === "dashed" ? "6 5" : connector.style === "dotted" ? "1 6" : undefined, strokeLinecap: connector.style === "dotted" ? "round" : undefined },
    markerStart: connector.direction === "bidirectional" ? { type: MarkerType.ArrowClosed, color: "#8b9098", width: 14, height: 14 } : undefined,
    markerEnd: connector.type === "control-plane" ? undefined : { type: MarkerType.ArrowClosed, color: "#8b9098", width: 14, height: 14 },
  }));
}

function bump(diagram: Diagram): Diagram {
  return { ...diagram, version: diagram.version + 1, updatedAt: new Date().toISOString() };
}

function inlineMarkdown(value: string) {
  return value.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("_") && part.endsWith("_")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function MermaidPreview({ source }: { source: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", themeVariables: { background: "transparent", primaryColor: "#e9efff", primaryTextColor: "#131722", primaryBorderColor: "#4f7cff", lineColor: "#6d7480", secondaryColor: "#f4f6fb", tertiaryColor: "#ffffff" } });
        const result = await mermaid.render(`buildrax-${reactId.replace(/:/g, "")}`, source);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = result.svg;
          setError("");
        }
      } catch {
        if (!cancelled) setError("This Mermaid block has a syntax issue. Edit the source and try again.");
      }
    }
    void render();
    return () => { cancelled = true; };
  }, [reactId, source]);

  return <figure className={styles.mermaidPreview}><figcaption>Mermaid diagram · rendered from editable DSL</figcaption><div ref={containerRef} className={styles.mermaidRendered} aria-label="Rendered Mermaid diagram" />{error && <p className={styles.mermaidError}>{error}</p>}<details><summary>View Mermaid source</summary><pre>{source}</pre></details></figure>;
}

function documentBlocks(markdown: string, diagram?: Diagram, onFocusNode: (id: string) => void = () => {}) {
  return markdown.trim().split(/\n{2,}/).filter(Boolean).map((block, index) => {
    if (block.startsWith(":::buildrax-canvas") && diagram) return <section className={styles.liveEmbed} key={index}><div><strong>Live canvas</strong><span>Version {diagram.version} · stays in sync</span></div><p>{diagram.nodes.length} components · {diagram.connectors.length} typed connections</p><div className={styles.embedNodes}>{diagram.nodes.slice(0, 8).map((node) => <button key={node.id} onClick={() => onFocusNode(node.id)}>{node.name}</button>)}</div></section>;
    if (block.startsWith(":::buildrax-node")) {
      const nodeId = block.split("\n")[1]?.trim();
      const node = diagram?.nodes.find((item) => item.id === nodeId);
      return node ? <button className={styles.nodeReference} key={index} onClick={() => onFocusNode(node.id)}>↗ Canvas node: {node.name}</button> : null;
    }
    if (block.startsWith("```")) {
      const [first, ...rest] = block.split("\n");
      const language = first.slice(3) || "text";
      const source = rest.filter((line) => line !== "```").join("\n");
      if (language === "mermaid") return <MermaidPreview key={index} source={source} />;
      return <pre className={styles.codeBlock} key={index}><code data-language={language}>{source}</code></pre>;
    }
    if (block.startsWith("# ")) return <h1 key={index}>{inlineMarkdown(block.slice(2))}</h1>;
    if (block.startsWith("## ")) return <h2 key={index}>{inlineMarkdown(block.slice(3))}</h2>;
    if (block.startsWith("### ")) return <h3 key={index}>{inlineMarkdown(block.slice(4))}</h3>;
    const lines = block.split("\n");
    if (lines.every((line) => /^\|/.test(line))) {
      const rows = lines.filter((line) => !/^\|?\s*:?-{3,}/.test(line)).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
      return <div className={styles.markdownTableWrap} key={index}><table className={styles.markdownTable}><thead><tr>{(rows[0] ?? []).map((cell, cellIndex) => <th key={cellIndex}>{inlineMarkdown(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inlineMarkdown(cell)}</td>)}</tr>)}</tbody></table></div>;
    }
    if (lines.every((line) => /^[-*] \[.\] /.test(line))) return <ul className={styles.taskList} key={index}>{lines.map((line, itemIndex) => <li key={itemIndex}><input type="checkbox" checked={line.slice(3, 4).toLowerCase() === "x"} readOnly />{inlineMarkdown(line.slice(6))}</li>)}</ul>;
    if (lines.every((line) => /^[-*] /.test(line))) return <ul key={index}>{lines.map((line, itemIndex) => <li key={itemIndex}>{inlineMarkdown(line.slice(2))}</li>)}</ul>;
    if (lines.every((line) => /^\d+\. /.test(line))) return <ol key={index}>{lines.map((line, itemIndex) => <li key={itemIndex}>{inlineMarkdown(line.replace(/^\d+\. /, ""))}</li>)}</ol>;
    if (lines.every((line) => /^> /.test(line))) return <blockquote key={index}>{lines.map((line) => line.slice(2)).join(" ")}</blockquote>;
    if (block === "---") return <hr key={index} />;
    const image = block.match(/^!\[([^\]]*)\]\((data:image\/[\w+.-]+;base64,[^)]+)\)$/);
    // eslint-disable-next-line @next/next/no-img-element -- document embeds are local data URLs, not remote content.
    if (image) return <img className={styles.documentImage} key={index} src={image[2]} alt={image[1] || "Document upload"} />;
    return <p key={index}>{inlineMarkdown(block)}</p>;
  });
}

function ArchitectureEditorInner({ initialDiagram, initialIR, initialIrVersion = 0, readOnly = false, persisted = false, projectId }: { initialDiagram: Diagram; initialIR?: ArchitectureIR; initialIrVersion?: number; readOnly?: boolean; persisted?: boolean; projectId?: string }) {
  const [diagram, setDiagram] = useState(() => diagramSchema.parse(initialDiagram));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
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
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [documentMode, setDocumentMode] = useState<"edit" | "preview">("preview");
  const [documentView, setDocumentView] = useState<"document" | "both">("both");
  const [documentPrompt, setDocumentPrompt] = useState("");
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [showSaveGate, setShowSaveGate] = useState(false);
  const [command, setCommand] = useState("");
  const [changePlan, setChangePlan] = useState<ChangePlan | null>(null);
  const [message, setMessage] = useState("");
  const [aiExpanded, setAiExpanded] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [drawDraft, setDrawDraft] = useState<DrawDraft | null>(null);
  const [transientPositions, setTransientPositions] = useState<TransientPositions>({});
  const [renderNodes, setRenderNodes] = useState<EditorNode[]>([]);
  const [pendingComponentType, setPendingComponentType] = useState<string | null>(null);
  const [arrowStyle, setArrowStyle] = useState<ArrowStyle>("end");
  const [arrowTexture, setArrowTexture] = useState<ArrowTexture>("solid");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [quickInsertPosition, setQuickInsertPosition] = useState<CanvasPoint | null>(null);
  const [pendingConnectionSourceId, setPendingConnectionSourceId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<{ id: string; url: string } | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [componentDetached, setComponentDetached] = useState(false);
  const [componentPalettePosition, setComponentPalettePosition] = useState({ x: 86, y: 78 });
  const [draggingComponentPalette, setDraggingComponentPalette] = useState(false);
  const latest = useRef(diagram);
  const selectedNodeIdsRef = useRef<string[]>(selectedNodeIds);
  const editRevision = useRef(0);
  const savedRevision = useRef(0);
  const saveInFlight = useRef(false);
  const irBase = useRef<ArchitectureIR>(initialIR ?? architectureIRFromDiagram(initialDiagram));
  const irVersion = useRef(initialIrVersion);
  const lastServerSaveAt = useRef(Date.now());
  const textEditSnapshot = useRef<Diagram | null>(null);
  const ignoreNextPaneClick = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const componentSearchRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLTextAreaElement>(null);
  const documentImageInputRef = useRef<HTMLInputElement>(null);
  const componentPaletteDrag = useRef<{ offsetX: number; offsetY: number } | null>(null);
  latest.current = diagram;
  selectedNodeIdsRef.current = selectedNodeIds;

  const selectedNode = diagram.nodes.find((node) => node.id === selectedId);
  const selectedConnector = diagram.connectors.find((connector) => connector.id === selectedId);
  const selectedPrimitive = diagram.primitives.find((item) => item.id === selectedId);
  const filteredCatalog = nodeCatalog.filter((item) => (category === "all" || item.category === category) && `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  const categoryKeys = Object.keys(categoryMeta) as Array<keyof typeof categoryMeta>;
  const componentGroups = categoryKeys
    .filter((key) => category === "all" || key === category)
    .map((key) => ({ key, items: filteredCatalog.filter((item) => item.category === key) }))
    .filter((group) => group.items.length > 0);
  const quickInsertSource = pendingConnectionSourceId ? diagram.nodes.find((item) => item.id === pendingConnectionSourceId) : undefined;
  const slashMatch = docs.match(/(?:^|\s)\/([a-z]*)$/i);
  const slashQuery = slashMatch?.[1]?.toLowerCase() ?? "";
  const semanticMermaid = useMemo(() => architectureIRToMermaid(architectureIRFromDiagram(diagram, irBase.current)), [diagram]);

  const selectOnly = useCallback((id: string | null) => {
    setSelectedId(id);
    const ids = id && (latest.current.nodes.some((node) => node.id === id) || latest.current.primitives.some((item) => item.id === id)) ? [id] : [];
    selectedNodeIdsRef.current = ids;
    setSelectedNodeIds(ids);
  }, []);

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

  const activatePrimitiveTextEdit = useCallback((id: string) => {
    if (readOnly) return;
    selectOnly(id);
    setInspectorOpen(false);
    setEditingTextId(id);
  }, [readOnly, selectOnly]);

  const updatePrimitiveText = useCallback((id: string, text: string) => {
    if (readOnly) return;
    setDiagram((current) => ({ ...current, primitives: current.primitives.map((item) => item.id === id ? { ...item, text } : item) }));
  }, [readOnly]);

  const finishPrimitiveTextEdit = useCallback(() => {
    const snapshot = textEditSnapshot.current;
    setEditingTextId(null);
    if (readOnly || !snapshot) return;
    textEditSnapshot.current = null;
    setPast((items) => [...items.slice(-49), snapshot]);
    setFuture([]);
    editRevision.current += 1;
    setDiagram((current) => diagramSchema.parse(persisted ? { ...current, updatedAt: new Date().toISOString() } : bump(current)));
  }, [persisted, readOnly]);

  const cancelPrimitiveTextEdit = useCallback(() => {
    const snapshot = textEditSnapshot.current;
    setEditingTextId(null);
    if (!snapshot) return;
    textEditSnapshot.current = null;
    setDiagram(snapshot);
  }, []);

  const beginNodeRename = useCallback(() => {
    if (!readOnly && !textEditSnapshot.current) textEditSnapshot.current = structuredClone(latest.current);
  }, [readOnly]);

  const updateNodeName = useCallback((id: string, name: string) => {
    if (readOnly) return;
    setDiagram((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === id ? { ...node, name } : node) }));
  }, [readOnly]);

  const finishNodeRename = useCallback(() => {
    const snapshot = textEditSnapshot.current;
    if (readOnly || !snapshot) return;
    textEditSnapshot.current = null;
    setRenamingNodeId(null);
    setPast((items) => [...items.slice(-49), snapshot]);
    setFuture([]);
    editRevision.current += 1;
    setDiagram((current) => diagramSchema.parse(persisted ? { ...current, updatedAt: new Date().toISOString() } : bump(current)));
  }, [persisted, readOnly]);

  const cancelNodeRename = useCallback(() => {
    const snapshot = textEditSnapshot.current;
    if (!snapshot) return;
    textEditSnapshot.current = null;
    setRenamingNodeId(null);
    setDiagram(snapshot);
  }, []);

  const modelNodes = useMemo(() => flowNodes(diagram, resizeItem, beginPrimitiveTextEdit, updatePrimitiveText, finishPrimitiveTextEdit, cancelPrimitiveTextEdit, editingTextId, activatePrimitiveTextEdit, !readOnly, drawDraft, transientPositions, selectedNodeIds, renamingNodeId, beginNodeRename, updateNodeName, finishNodeRename, cancelNodeRename), [diagram, resizeItem, beginPrimitiveTextEdit, updatePrimitiveText, finishPrimitiveTextEdit, cancelPrimitiveTextEdit, editingTextId, activatePrimitiveTextEdit, readOnly, drawDraft, transientPositions, selectedNodeIds, renamingNodeId, beginNodeRename, updateNodeName, finishNodeRename, cancelNodeRename]);
  const edges = useMemo(() => flowEdges(diagram, selectedId), [diagram, selectedId]);

  useEffect(() => { setRenderNodes(modelNodes); }, [modelNodes]);

  // Guest documentation is kept beside its draft, rather than inside the
  // diagram schema, so documents can evolve independently without invalidating
  // a versioned architecture snapshot. Persisted projects will graduate this
  // to the versioned documents API in the backend phase.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(`buildrax-document:${diagram.id}`);
    if (stored) setDocs(stored);
  }, [diagram.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !docs) return;
    window.localStorage.setItem(`buildrax-document:${diagram.id}`, docs);
  }, [diagram.id, docs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("buildrax:component-palette-position");
    if (!stored) return;
    try {
      const position = JSON.parse(stored) as { x?: unknown; y?: unknown };
      if (typeof position.x === "number" && typeof position.y === "number") setComponentPalettePosition({ x: position.x, y: position.y });
    } catch {
      // Ignore a stale session value and keep the safe default position.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !componentDetached) return;
    window.sessionStorage.setItem("buildrax:component-palette-position", JSON.stringify(componentPalettePosition));
  }, [componentDetached, componentPalettePosition]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = componentPaletteDrag.current;
      if (!drag) return;
      setComponentPalettePosition({
        x: Math.max(12, Math.min(event.clientX - drag.offsetX, window.innerWidth - 332)),
        y: Math.max(12, Math.min(event.clientY - drag.offsetY, window.innerHeight - 140)),
      });
    };
    const end = () => { componentPaletteDrag.current = null; setDraggingComponentPalette(false); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      setPanel("components");
      window.setTimeout(() => componentSearchRef.current?.focus(), 0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (readOnly || persisted) return;
    const timer = window.setTimeout(async () => {
      setSaveState(navigator.onLine ? "saving" : "offline");
      const current = latest.current;
      const ir = architectureIRFromDiagram(current, irBase.current);
      const presentation = presentationFromDiagram(current);
      irBase.current = ir;
      await saveDraft({
        id: current.id,
        diagram: current,
        architecture: { ir, presentation, irVersion: Math.max(1, irVersion.current) },
        status: "ready",
        createdAt: current.createdAt,
        updatedAt: current.updatedAt,
      });
      setSaveState(navigator.onLine ? "saved" : "offline");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [diagram, persisted, readOnly]);

  useEffect(() => {
    if (!persisted || readOnly) return;
    const timer = window.setTimeout(async () => {
      if (saveInFlight.current || editRevision.current === savedRevision.current) return;
      const revisionAtStart = editRevision.current;
      const snapshot = latest.current;
      const ir = architectureIRFromDiagram(snapshot, irBase.current);
      let presentation = presentationFromDiagram(snapshot);
      const idempotencyKey = crypto.randomUUID();
      saveInFlight.current = true;
      setSaveState(navigator.onLine ? "saving" : "offline");
      try {
        presentation = await persistPrivatePresentationImages({ diagramId: snapshot.id }, presentation);
        setDiagram((current) => ({
          ...current,
          primitives: current.primitives.map((primitive) => {
            const persistedPrimitive = presentation.primitives.find((item) => item.id === primitive.id);
            return persistedPrimitive?.kind === "image" ? { ...primitive, style: persistedPrimitive.style } : primitive;
          }),
        }));
        const response = await fetch(`/api/v1/diagrams/${snapshot.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey, baseVersion: snapshot.version, baseIrVersion: irVersion.current, ir, presentation }),
        });
        const body = await response.json();
        if (response.status === 409) throw new Error("A newer version exists. Reload the project before saving again.");
        if (!response.ok) throw new Error(body.error ?? "Project save failed.");
        const saved = body.saved?.[0];
        if (!saved?.version) throw new Error("Project save did not return a version.");
        await clearQueuedProjectSave(snapshot.id);
        savedRevision.current = revisionAtStart;
        irBase.current = body.snapshot?.ir ?? ir;
        irVersion.current = Number(saved.ir_version ?? body.snapshot?.irVersion ?? irVersion.current);
        lastServerSaveAt.current = Date.now();
        setDiagram((current) => current.version === snapshot.version ? { ...current, version: saved.version, updatedAt: new Date().toISOString() } : current);
        setSaveState("saved");
      } catch (error) {
        const isConflict = error instanceof Error && error.message.includes("newer version");
        if (!isConflict) await queueProjectSave({ diagramId: snapshot.id, idempotencyKey, baseVersion: snapshot.version, baseIrVersion: irVersion.current, ir, presentation, diagram: snapshot });
        setSaveState("offline");
        setMessage(isConflict && error instanceof Error ? error.message : "Saved on this device. We will retry when you are back online.");
      } finally {
        saveInFlight.current = false;
      }
    }, Math.min(5_000, Math.max(0, 30_000 - (Date.now() - lastServerSaveAt.current))));
    return () => window.clearTimeout(timer);
  }, [diagram, persisted, readOnly]);

  useEffect(() => {
    if (!persisted || readOnly) return;
    async function flushQueuedSave() {
      if (!navigator.onLine || saveInFlight.current) return;
      const queued = await loadQueuedProjectSave(latest.current.id);
      if (!queued) return;
      saveInFlight.current = true;
      setSaveState("saving");
      try {
        const persistedPresentation = await persistPrivatePresentationImages({ diagramId: queued.diagramId }, queued.presentation);
        setDiagram((current) => ({
          ...current,
          primitives: current.primitives.map((primitive) => {
            const persistedPrimitive = persistedPresentation.primitives.find((item) => item.id === primitive.id);
            return persistedPrimitive?.kind === "image" ? { ...primitive, style: persistedPrimitive.style } : primitive;
          }),
        }));
        const response = await fetch(`/api/v1/diagrams/${queued.diagramId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: queued.idempotencyKey,
            baseVersion: queued.baseVersion,
            baseIrVersion: queued.baseIrVersion,
            ir: queued.ir,
            presentation: persistedPresentation,
          }),
        });
        const body = await response.json();
        if (response.status === 409) throw new Error("A newer version exists. Your local changes remain on this device.");
        if (!response.ok) throw new Error(body.error ?? "Project save failed.");
        await clearQueuedProjectSave(queued.diagramId);
        const saved = body.saved?.[0];
        irBase.current = body.snapshot?.ir ?? queued.ir;
        irVersion.current = Number(saved?.ir_version ?? body.snapshot?.irVersion ?? queued.baseIrVersion);
        lastServerSaveAt.current = Date.now();
        if (saved?.version) setDiagram((current) => current.version === queued.baseVersion ? { ...current, version: saved.version, updatedAt: new Date().toISOString() } : current);
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
      if ((event.metaKey || event.ctrlKey) && key === "k") { event.preventDefault(); setAiExpanded(true); return; }
      if ((event.metaKey || event.ctrlKey) && key === "d") { event.preventDefault(); duplicateSelected(); return; }
      if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); removeSelected(); return; }
      if (key === "v") setTool("select");
      if (key === "h") setTool("pan");
      if (key === "n") setPanel((current) => current === "components" ? null : "components");
      if (key === "c") setTool("arrow");
      if (key === "s") setTool("rectangle");
      if (key === "enter" && (selectedNode || selectedConnector)) setInspectorOpen(true);
      if (key === "r") setTool("rectangle");
      if (key === "o") setTool("circle");
      if (key === "d") setTool("diamond");
      if (key === "f") setTool("frame");
      if (key === "l") setTool("line");
      if (key === "a") setTool("arrow");
      if (key === "t") setTool("text");
      if (key === "p") setTool("freehand");
      if (key === "escape") {
        if (pendingComponentType) { setPendingComponentType(null); setMessage("Component placement cancelled."); return; }
        if (drawDraft) { setDrawDraft(null); setMessage("Drawing cancelled."); return; }
        if (panel) { setPanel(null); return; }
        if (inspectorOpen) { setInspectorOpen(false); return; }
        setTool("select"); selectOnly(null);
      }
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
    setRenderNodes((current) => applyNodeChanges(changes, current));
    const selectionChanges = changes.filter((change) => change.type === "select");
    if (selectionChanges.length) {
      const next = new Set(selectedNodeIdsRef.current);
      for (const change of selectionChanges) {
        if (change.selected) next.add(change.id);
        else next.delete(change.id);
      }
      const resolved = [...next];
      selectedNodeIdsRef.current = resolved;
      setSelectedNodeIds((current) => sameSelection(current, resolved) ? current : resolved);
      setSelectedId((current) => resolved.includes(current ?? "") ? current : resolved.at(-1) ?? null);
    }
    const positions: TransientPositions = {};
    for (const change of changes) {
      // Pane clicks explicitly clear selection. React Flow also emits transient
      // deselect changes while a drawing is being committed; treating those as
      // authoritative hid the newly created text toolbar immediately.
      if (change.type === "position" && change.position && !readOnly) positions[change.id] = change.position;
    }
    if (Object.keys(positions).length) setTransientPositions((current) => ({ ...current, ...positions }));
  }

  function finishNodeDrag(_: unknown, node: EditorNode) {
    if (!dragSnapshot || readOnly) return;
    const selectedPositions = Object.fromEntries(renderNodes.filter((item) => selectedNodeIds.includes(item.id)).map((item) => [item.id, item.position]));
    const finalPositions = { ...transientPositions, ...selectedPositions, [node.id]: node.position };
    setPast((items) => [...items.slice(-49), dragSnapshot]);
    setFuture([]);
    editRevision.current += 1;
    setDiagram((current) => {
      const next = {
        ...current,
        nodes: current.nodes.map((item) => finalPositions[item.id] ? { ...item, position: finalPositions[item.id] } : item),
        primitives: current.primitives.map((item) => finalPositions[item.id] ? { ...item, position: finalPositions[item.id] } : item),
      };
      return diagramSchema.parse(persisted ? { ...next, updatedAt: new Date().toISOString() } : bump(next));
    });
    setTransientPositions({});
    setDragSnapshot(null);
  }

  function onConnect(connection: Connection) {
    if (readOnly || !connection.source || !connection.target) return;
    const source = diagram.nodes.find((node) => node.id === connection.source);
    const target = diagram.nodes.find((node) => node.id === connection.target);
    if (!source || !target) return;
    const validation = validateConnection(source, target);
    // Compatibility is advisory for manual canvas work. A user may deliberately
    // model an unusual dependency and should see it, not have a failed drag.
    const connectorType = !validation.valid || tool === "line" ? "control-plane" : "http-rest";
    const connector = createConnector(crypto.randomUUID(), source.id, target.id, connectorType, connectorType === "control-plane" ? "relationship" : "HTTPS");
    commit((current) => ({ ...current, connectors: [...current.connectors, connector] }));
    selectOnly(connector.id);
    setInspectorOpen(true);
    setMessage(validation.valid ? "Connection created. Select it to edit its details." : `Connection added as an explicit relationship. Advisory: ${validation.reason}`);
  }

  function onConnectStart(_: MouseEvent | TouchEvent, { nodeId }: { nodeId: string | null }) {
    setPendingConnectionSourceId(nodeId);
  }

  function onConnectEnd(event: MouseEvent | TouchEvent, connectionState: { isValid: boolean | null }) {
    const sourceId = pendingConnectionSourceId;
    if (!sourceId || connectionState.isValid) { setPendingConnectionSourceId(null); return; }
    const point = event instanceof MouseEvent
      ? { x: event.clientX, y: event.clientY }
      : event.changedTouches[0] ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY } : null;
    if (!point) return;
    setQuickInsertPosition(instance?.screenToFlowPosition(point) ?? { x: 240, y: 180 });
    setPanel("components");
    setMessage("Choose a component to connect to this node.");
  }

  function addComponent(semanticType: string, dropPosition?: { x: number; y: number }) {
    const item = catalogByType.get(semanticType)!;
    const preferred = dropPosition ?? instance?.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }) ?? { x: 240, y: 180 };
    const position = nextOpenPosition(diagram, preferred);
    const node = createNode(semanticType, crypto.randomUUID(), item.name, position.x, position.y);
    const source = pendingConnectionSourceId ? diagram.nodes.find((item) => item.id === pendingConnectionSourceId) : undefined;
    const validation = source ? validateConnection(source, node) : undefined;
    // Quick insert is an intentional user decision. If the semantic matrix
    // cannot infer a protocol, retain the relationship as a control-plane
    // connector so the user can refine it instead of silently dropping it.
    const connector = source
      ? createConnector(crypto.randomUUID(), source.id, node.id, validation?.valid ? "http-rest" : "control-plane", validation?.valid ? "HTTPS" : "relationship")
      : undefined;
    commit((current) => ({ ...current, nodes: [...current.nodes, node], connectors: connector ? [...current.connectors, connector] : current.connectors }));
    selectOnly(connector?.id ?? node.id);
    setPanel(null);
    setPendingComponentType(null);
    setPendingConnectionSourceId(null);
    if (connector) { setInspectorOpen(true); setMessage(validation?.valid ? "Connection created. Select it to edit its details." : "Connection created as a control-plane relationship. Choose its type in the inspector."); }
  }

  function chooseComponent(semanticType: string) {
    const item = catalogByType.get(semanticType);
    if (!item) return;
    if (quickInsertPosition) {
      addComponent(semanticType, quickInsertPosition);
      setQuickInsertPosition(null);
      return;
    }
    setPendingComponentType(semanticType);
    setPanel(null);
    setMessage(`Click the canvas to place ${item.name}.`);
  }

  function beginComponentPaletteDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (!componentDetached) return;
    componentPaletteDrag.current = {
      offsetX: event.clientX - componentPalettePosition.x,
      offsetY: event.clientY - componentPalettePosition.y,
    };
    setDraggingComponentPalette(true);
  }

  function addPrimitive(kind: PrimitiveTool, position: CanvasPoint, dimensions = defaultPrimitiveDimensions(kind), style: Record<string, string> = {}) {
    if (readOnly) return;
    const id = crypto.randomUUID();
    commit((current) => ({ ...current, primitives: [...current.primitives, { id, kind, position, dimensions, text: "", style }] }));
    selectOnly(id);
    if (kind === "text") setEditingTextId(id);
    if (kind !== "freehand") setTool("select");
  }

  function addImage(file?: File) {
    if (!file || readOnly) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file (PNG, JPEG, WebP, GIF, or SVG).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Images must be 3 MB or smaller so the local draft stays responsive.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src.startsWith("data:image/")) return;
      const image = new window.Image();
      image.onload = () => {
        const scale = Math.min(1, 420 / image.naturalWidth, 280 / image.naturalHeight);
        const dimensions = {
          width: Math.max(80, Math.round(image.naturalWidth * scale)),
          height: Math.max(60, Math.round(image.naturalHeight * scale)),
        };
        const center = instance?.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }) ?? { x: 240, y: 180 };
        addPrimitive("image", { x: center.x - dimensions.width / 2, y: center.y - dimensions.height / 2 }, dimensions, { src });
        setMessage("Image added. Select it to resize or change its layer order.");
      };
      image.onerror = () => setMessage("We could not read that image file.");
      image.src = src;
    };
    reader.readAsDataURL(file);
  }

  function duplicateSelected() {
    if (!selectedId || readOnly) return;
    const selectedComponent = diagram.nodes.find((node) => node.id === selectedId);
    if (selectedComponent) {
      const position = nextOpenPosition(diagram, { x: selectedComponent.position.x + 48, y: selectedComponent.position.y + 48 });
      const duplicate = { ...selectedComponent, id: crypto.randomUUID(), name: `${selectedComponent.name} copy`, position };
      commit((current) => ({ ...current, nodes: [...current.nodes, duplicate] }));
      selectOnly(duplicate.id);
      return;
    }
    const selectedPrimitive = diagram.primitives.find((item) => item.id === selectedId);
    if (selectedPrimitive) {
      const duplicate = { ...selectedPrimitive, id: crypto.randomUUID(), position: { x: selectedPrimitive.position.x + 32, y: selectedPrimitive.position.y + 32 } };
      commit((current) => ({ ...current, primitives: [...current.primitives, duplicate] }));
      selectOnly(duplicate.id);
      return;
    }
    setMessage("Select a component or canvas object to duplicate.");
  }

  function onPaneClick(event: React.MouseEvent) {
    if (ignoreNextPaneClick.current) { ignoreNextPaneClick.current = false; return; }
    const position = instance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? { x: 200, y: 200 };
    if (pendingComponentType) { addComponent(pendingComponentType, position); return; }
    // Drawing is completed by mouse down/move/up. Handling the subsequent pane
    // click here created a second shape and cleared the first shape's selection.
    if (tool === "circle" || drawableTools.includes(tool as PrimitiveTool)) return;
    selectOnly(null);
    setInspectorOpen(false);
  }

  function onPaneDoubleClick(event: React.MouseEvent) {
    if (readOnly || tool !== "select") return;
    setQuickInsertPosition(canvasPoint(event));
    setPanel("components");
    setMessage("Choose a component to insert at this position.");
  }

  function onCanvasDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!isPaneEvent(event)) return;
    onPaneDoubleClick(event);
  }

  function saveViewport(viewport: { x: number; y: number; zoom: number }) {
    const previous = latest.current.viewport;
    if (Math.abs(previous.x - viewport.x) < 1 && Math.abs(previous.y - viewport.y) < 1 && Math.abs(previous.zoom - viewport.zoom) < .001) return;
    editRevision.current += 1;
    setDiagram((current) => ({ ...current, viewport }));
  }

  function canvasPoint(event: React.MouseEvent) {
    return instance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? { x: event.clientX, y: event.clientY };
  }

  function isPaneEvent(event: React.MouseEvent) {
    return event.target instanceof HTMLElement && Boolean(event.target.closest(".react-flow__pane"));
  }

  function startDrawing(event: React.MouseEvent) {
    if (readOnly || (!drawableTools.includes(tool as PrimitiveTool) && tool !== "circle") || !isPaneEvent(event)) return;
    const point = canvasPoint(event);
    const kind: PrimitiveTool = tool === "circle" ? "ellipse" : tool as PrimitiveTool;
    setDrawDraft({ kind, start: point, current: point, points: [point], lockAspect: tool === "circle" || kind === "diamond" || event.shiftKey, style: kind === "arrow" ? { arrowStyle, arrowTexture } : tool === "circle" ? { shape: "circle" } : {} });
  }

  function updateDrawing(event: React.MouseEvent) {
    if (!drawDraft || !isPaneEvent(event)) return;
    const nativeEvent = event.nativeEvent as PointerEvent;
    const coalesced = typeof nativeEvent.getCoalescedEvents === "function" ? nativeEvent.getCoalescedEvents() : [nativeEvent];
    setDrawDraft((current) => {
      if (!current) return current;
      if (current.kind !== "freehand") return { ...current, current: canvasPoint(event) };
      const points = [...current.points];
      for (const nativeEvent of coalesced) {
        const point = instance?.screenToFlowPosition({ x: nativeEvent.clientX, y: nativeEvent.clientY }) ?? current.current;
        const previous = points.at(-1);
        if (!previous || Math.hypot(previous.x - point.x, previous.y - point.y) >= 1) points.push(point);
      }
      return { ...current, current: points.at(-1) ?? current.current, points };
    });
  }

  function finishDrawing() {
    if (!drawDraft) return;
    ignoreNextPaneClick.current = true;
    // React Flow emits its pane click after our mouse-up callback. Keep the
    // guard alive long enough for that event instead of clearing it in the
    // same turn, which was deselecting newly created text objects.
    window.setTimeout(() => { ignoreNextPaneClick.current = false; }, 180);
    const draft = drawDraft;
    setDrawDraft(null);
    if (draft.kind === "freehand" && draft.points.length < 2) { setMessage("Drag to draw freehand ink."); return; }
    const bounds = draftBounds(draft);
    const relativePoints = draft.points.map((point) => ({ x: Number((point.x - bounds.position.x).toFixed(2)), y: Number((point.y - bounds.position.y).toFixed(2)) }));
    addPrimitive(draft.kind, bounds.position, bounds.dimensions, draft.kind === "freehand" ? { points: JSON.stringify(relativePoints) } : draft.style ?? {});
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

  function removeById(id: string, keepTool = false) {
    if (readOnly) return;
    commit((current) => ({ ...current, nodes: current.nodes.filter((node) => node.id !== id), primitives: current.primitives.filter((item) => item.id !== id), connectors: current.connectors.filter((edge) => edge.id !== id && edge.source !== id && edge.target !== id) }));
    selectOnly(null);
    setInspectorOpen(false);
    if (!keepTool) setTool("select");
  }

  function removeSelected() {
    const ids = selectedNodeIds.length ? selectedNodeIds : selectedId ? [selectedId] : [];
    if (!ids.length) { setTool("eraser"); setMessage("Select an object to delete it."); return; }
    commit((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => !ids.includes(node.id)),
      primitives: current.primitives.filter((item) => !ids.includes(item.id)),
      connectors: current.connectors.filter((edge) => !ids.includes(edge.id) && !ids.includes(edge.source) && !ids.includes(edge.target)),
    }));
    selectOnly(null);
    setInspectorOpen(false);
    if (tool !== "eraser") setTool("select");
  }

  function updateSelected(patch: Record<string, string>) {
    if (!selectedId) return;
    commit((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedId ? { ...node, ...patch } : node), primitives: current.primitives.map((item) => item.id === selectedId ? { ...item, text: patch.text ?? item.text } : item) }));
  }

  function updateSelectedNodeAppearance(patch: Record<string, string>) {
    if (!selectedNode || readOnly) return;
    commit((current) => ({
      ...current,
      nodes: current.nodes.map((node) => node.id === selectedNode.id ? { ...node, metadata: { ...node.metadata, ...patch } } : node),
    }));
  }

  function updateSelectedPrimitiveStyle(patch: Record<string, string>) {
    if (!selectedPrimitive || readOnly) return;
    commit((current) => ({ ...current, primitives: current.primitives.map((item) => item.id === selectedPrimitive.id ? { ...item, style: { ...item.style, ...patch } } : item) }));
  }

  function moveSelectedLayer(direction: "front" | "back") {
    const ids = selectedNodeIds.length ? selectedNodeIds : selectedId ? [selectedId] : [];
    if (!ids.length || readOnly) return;
    const values = [...diagram.nodes.map((item, index) => typeof item.metadata.zIndex === "number" ? item.metadata.zIndex : index), ...diagram.primitives.map((item, index) => Number(item.style.zIndex ?? diagram.nodes.length + index))];
    const nextZIndex = direction === "front" ? Math.max(0, ...values) + 1 : Math.min(0, ...values) - 1;
    commit((current) => ({
      ...current,
      nodes: current.nodes.map((item) => ids.includes(item.id) ? { ...item, metadata: { ...item.metadata, zIndex: nextZIndex } } : item),
      primitives: current.primitives.map((item) => ids.includes(item.id) ? { ...item, style: { ...item.style, zIndex: String(nextZIndex) } } : item),
    }));
    setMessage(direction === "front" ? "Moved to front." : "Sent to back.");
  }

  async function copyDocumentation() {
    if (!docs) { setMessage("Generate documentation before copying it."); return; }
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(docs);
      else {
        const fallback = document.createElement("textarea");
        fallback.value = docs;
        fallback.setAttribute("readonly", "");
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        document.body.appendChild(fallback);
        fallback.select();
        const copied = document.execCommand("copy");
        fallback.remove();
        if (!copied) throw new Error("Clipboard command was rejected.");
      }
      setMessage("Documentation copied.");
    } catch { setMessage("Copy is unavailable in this browser. Use Markdown export instead."); }
  }

  async function openHistory() {
    if (!persisted) return;
    setPanel("history");
    setLoadingPanel(true);
    try {
      const response = await fetch(`/api/v1/diagrams/${diagram.id}/versions?limit=50`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Version history could not be loaded.");
      setVersions(body.versions ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Version history could not be loaded.");
    } finally { setLoadingPanel(false); }
  }

  async function restoreVersion(version: number) {
    if (!persisted || readOnly || version === diagram.version) return;
    setLoadingPanel(true);
    try {
      const response = await fetch(`/api/v1/diagrams/${diagram.id}/versions/${version}/restore`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Version could not be restored.");
      irBase.current = body.snapshot.ir;
      irVersion.current = body.saved?.ir_version ?? body.snapshot.irVersion;
      setDiagram(body.snapshot.materializedDiagram);
      setPast([]);
      setFuture([]);
      setMessage(`Version ${version} restored as version ${body.saved?.version ?? body.snapshot.diagramVersion}.`);
      await openHistory();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Version could not be restored.");
    } finally { setLoadingPanel(false); }
  }

  function insertDocumentation(template: string) {
    let nextLength = 0;
    setDocs((current) => {
      const withoutSlash = current.replace(/(?:^|\s)\/[a-z]*$/i, (match) => match.startsWith(" ") ? " " : "");
      const separator = withoutSlash.trim() ? "\n\n" : "";
      const next = `${withoutSlash}${separator}${template}`;
      nextLength = next.length;
      return next;
    });
    setDocumentMode("edit");
    requestAnimationFrame(() => {
      documentInputRef.current?.focus();
      documentInputRef.current?.setSelectionRange(nextLength, nextLength);
    });
  }

  function wrapDocumentation(prefix: string, suffix = prefix, fallback: string) {
    const input = documentInputRef.current;
    const start = input?.selectionStart ?? docs.length;
    const end = input?.selectionEnd ?? docs.length;
    const selected = docs.slice(start, end) || fallback;
    setDocs(`${docs.slice(0, start)}${prefix}${selected}${suffix}${docs.slice(end)}`);
    setDocumentMode("edit");
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  function updateFirstTable(mutator: (rows: string[][]) => string[][]) {
    const lines = docs.split("\n");
    const start = lines.findIndex((line) => line.trim().startsWith("|"));
    if (start < 0) { insertDocumentation("| Column | Value |\n| --- | --- |\n| Item | Details |"); return; }
    let end = start;
    while (end < lines.length && lines[end].trim().startsWith("|")) end += 1;
    const rows = lines.slice(start, end).filter((line) => !/^\|?\s*:?-{3,}/.test(line.trim())).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
    const nextRows = mutator(rows);
    const columnCount = nextRows[0]?.length ?? 2;
    const markdown = [
      `| ${nextRows[0].join(" | ")} |`,
      `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`,
      ...nextRows.slice(1).map((row) => `| ${row.join(" | ")} |`),
    ];
    lines.splice(start, end - start, ...markdown);
    setDocs(lines.join("\n"));
  }

  function addDocumentImage(file?: File) {
    if (!file || !file.type.startsWith("image/")) { setMessage("Choose an image to embed in the document."); return; }
    if (file.size > 2 * 1024 * 1024) { setMessage("Document images must be 2 MB or smaller."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (src.startsWith("data:image/")) insertDocumentation(`![${file.name}](${src})`);
    };
    reader.readAsDataURL(file);
  }

  function focusDocumentNode(id: string) {
    setSelectedId(id);
    setDocumentView("both");
    setPanel(null);
    requestAnimationFrame(() => instance?.fitView({ nodes: [{ id }], padding: .45, duration: 280 }));
  }

  async function draftDocumentationFromCanvas() {
    setLoadingPanel(true);
    try {
      const ir = architectureIRFromDiagram(diagram, irBase.current);
      const response = await fetch("/api/v1/ai/documentation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram, ir, presentation: presentationFromDiagram(diagram), irVersion: Math.max(1, irVersion.current), persist: false }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      const intro = documentPrompt.trim() ? `## AI draft: ${documentPrompt.trim()}\n\n` : "";
      setDocs((current) => `${current.trim()}${current.trim() ? "\n\n" : ""}${intro}${body.markdown}`);
      setDocumentPrompt("");
      setDocumentMode("edit");
      setMessage("AI draft added. Review it before sharing.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Documentation draft failed."); }
    finally { setLoadingPanel(false); }
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
      const ir = architectureIRFromDiagram(diagram, irBase.current);
      const response = await fetch("/api/v1/ai/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram, ir, presentation: presentationFromDiagram(diagram), irVersion: Math.max(1, irVersion.current), persist: persisted && saveState === "saved" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setReviews(body.findings);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Review failed."); }
    finally { setLoadingPanel(false); }
  }

  async function generateDocs() {
    setPanel("docs"); setLoadingPanel(true);
    try {
      const ir = architectureIRFromDiagram(diagram, irBase.current);
      const response = await fetch("/api/v1/ai/documentation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram, ir, presentation: presentationFromDiagram(diagram), irVersion: Math.max(1, irVersion.current), persist: persisted && saveState === "saved" }) });
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
    const ir = architectureIRFromDiagram(diagram, irBase.current);
    if (format === "json") return downloadText(JSON.stringify(ir, null, 2), safeFilename(ir.intent.title, "json"), "application/json");
    if (format === "mermaid") return downloadText(architectureIRToMermaid(ir), safeFilename(ir.intent.title, "mmd"), "text/plain");
    if (format === "markdown") {
      let markdown = docs;
      if (!markdown) {
        const response = await fetch("/api/v1/ai/documentation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ diagram, ir, presentation: presentationFromDiagram(diagram), irVersion: Math.max(1, irVersion.current), persist: false }) });
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
    { tool: "rectangle", label: "Rectangle (R)", icon: <Square size={17} /> }, { tool: "circle", label: "Circle (O)", icon: <Circle size={17} /> },
    { tool: "diamond", label: "Diamond (D)", icon: <Diamond size={17} /> }, { tool: "frame", label: "Frame (F)", icon: <Frame size={17} /> },
    { tool: "line", label: "Line (L) — place a relationship", icon: <Minus size={17} /> }, { tool: "arrow", label: "Arrow (A) — place a directional arrow", icon: <ArrowRight size={17} /> },
    { tool: "text", label: "Text (T)", icon: <Type size={17} /> }, { tool: "freehand", label: "Freehand (P)", icon: drawDraft?.kind === "freehand" ? <PenLine size={18} /> : <Pencil size={17} /> }, { tool: "eraser", label: "Eraser (X) — remove objects", icon: <Eraser size={17} /> },
  ];

  return <div className={styles.screen}>
    <header className={styles.topbar}>
      <Brand /><span>/</span><div className={styles.crumb}><input aria-label="Diagram title" value={diagram.title} readOnly={readOnly} onChange={(event) => setDiagram((current) => ({ ...current, title: event.target.value }))} onBlur={() => commit((current) => current)} /><span className={styles.status}><span className={styles.statusDot} />{saveState === "saved" ? persisted ? "Saved" : "Saved locally" : saveState === "saving" ? "Saving…" : "Offline · queued"}</span></div>
      <div className={styles.topActions}><ButtonLink href="/dashboard" variant="secondary"><FolderKanban size={14} /><span>Projects</span></ButtonLink><button className={styles.topButton} onClick={runLayout}><LayoutDashboard size={14} /><span>Auto layout</span></button><button className={styles.topButton} onClick={runReview}><ShieldCheck size={14} /><span>Review</span></button><button className={styles.topButton} onClick={generateDocs}><FileText size={14} /><span>Docs</span></button><button className={styles.topButton} onClick={() => setPanel("export")}><Download size={14} /><span>Export</span></button>{persisted && <button className={styles.topButton} onClick={() => void openHistory()}><History size={14} /><span>History</span></button>}{persisted && projectId && <button className={styles.topButton} onClick={() => void toggleShareLink()}><Share2 size={14} /><span>{shareLink ? "Revoke share" : "Share"}</span></button>}<ThemeToggle />{!readOnly && <button className={styles.topButton} onClick={() => persisted ? setMessage("Project is saved automatically.") : setShowSaveGate(true)}><Save size={14} /><span>Save</span></button>}</div>
    </header>
    <main className={styles.workspace}>
      <div className={`${styles.canvas} ${inspectorOpen && (selectedNode || selectedConnector) && panel === null ? styles.canvasWithInspector : ""}`} data-tool={tool} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop} onDoubleClick={onCanvasDoubleClick}>
        <ReactFlow<EditorNode, Edge> className={styles.reactFlow} nodes={renderNodes} edges={edges} nodeTypes={nodeTypes} onInit={setInstance} onNodesChange={onNodesChange} onConnect={onConnect} onConnectStart={onConnectStart} onConnectEnd={onConnectEnd} onNodeClick={(event, node) => { if (tool === "eraser") removeById(node.id, true); else { if (event.shiftKey || event.metaKey || event.ctrlKey) setSelectedId(node.id); else selectOnly(node.id); setInspectorOpen(false); } }} onNodeDoubleClick={(_, node) => { selectOnly(node.id); if (node.type === "semantic") { setRenamingNodeId(node.id); setInspectorOpen(false); } else if ((node.data as PrimitiveFlowNode["data"]).primitive.kind === "text") { activatePrimitiveTextEdit(node.id); } else { setInspectorOpen(true); } }} onEdgeClick={(_, edge) => { if (tool === "eraser") removeById(edge.id, true); else { selectOnly(edge.id); setInspectorOpen(false); } }} onEdgeDoubleClick={(_, edge) => { selectOnly(edge.id); setInspectorOpen(true); }} onNodeDragStart={() => setDragSnapshot(structuredClone(diagram))} onNodeDragStop={finishNodeDrag} onPaneClick={onPaneClick} onPaneMouseMove={updateDrawing} onMouseDown={startDrawing} onMouseUp={finishDrawing} onMove={(_, viewport) => setZoom((current) => current === Math.round(viewport.zoom * 100) ? current : Math.round(viewport.zoom * 100))} onMoveEnd={(_, viewport) => saveViewport(viewport)} panOnDrag={tool === "pan" || readOnly} panActivationKeyCode="Space" nodesDraggable={!readOnly && tool === "select" && editingTextId === null} nodesConnectable={!readOnly && (tool === "select" || tool === "line" || tool === "arrow")} elementsSelectable={tool === "select" || readOnly} selectionOnDrag={!readOnly && tool === "select"} selectionMode={SelectionMode.Partial} multiSelectionKeyCode="Shift" deleteKeyCode={null} snapToGrid={false} fitView={diagram.nodes.length > 0 || diagram.primitives.length > 0} fitViewOptions={{ padding: .18, maxZoom: 1 }} defaultViewport={diagram.viewport} minZoom={.15} maxZoom={2.5}>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-strong)" />{showMiniMap && <MiniMap pannable zoomable bgColor="var(--surface)" maskColor="color-mix(in srgb, var(--bg) 74%, transparent)" nodeColor={(node) => node.type === "semantic" ? categoryMeta[(node.data as SemanticFlowNode["data"]).component.category].color : "var(--text-secondary)"} />}
        </ReactFlow>
      </div>
      <div className={styles.mobileNotice}>Mobile light-edit mode: pan, zoom, select and edit labels. Use desktop for drawing and connection creation.</div>
      {!readOnly && <><input ref={imageInputRef} className={styles.visuallyHidden} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => { addImage(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /><div className={styles.toolbar} aria-label="Canvas tools">{toolbar.map((item, index) => { const isDrawingFreehand = item.tool === "freehand" && drawDraft?.kind === "freehand"; const label = isDrawingFreehand ? "Drawing freehand — release to finish" : item.label; return <span key={item.tool} style={{ display: "contents" }}>{index === 3 || index === 7 || index === 9 ? <span className={styles.toolDivider} /> : null}<button className={`${styles.tool} ${tool === item.tool ? styles.toolActive : ""} ${isDrawingFreehand ? styles.toolDrawing : ""}`} title={label} data-tooltip={label} aria-label={label} onClick={() => { setTool(item.tool); if (item.tool === "eraser") setMessage("Eraser is on. Click objects to remove them; choose another tool to stop."); }}>{item.icon}</button></span>; })}<span className={styles.toolDivider} /><button className={styles.tool} title="Add image" data-tooltip="Add image" aria-label="Add image" onClick={() => imageInputRef.current?.click()}><ImagePlus size={17} /></button><button className={`${styles.tool} ${panel === "components" ? styles.toolActive : ""}`} title="Components (N)" data-tooltip="Components (N)" aria-label="Open semantic components" onClick={() => setPanel(panel === "components" ? null : "components")}><Boxes size={18} /></button></div></>}
      {!readOnly && tool === "arrow" && <div className={styles.arrowPicker} role="group" aria-label="Arrow style"><button className={arrowStyle === "end" ? styles.pickerActive : ""} aria-label="End arrow" onClick={() => setArrowStyle("end")}>→</button><button className={arrowStyle === "start" ? styles.pickerActive : ""} aria-label="Start arrow" onClick={() => setArrowStyle("start")}>←</button><button className={arrowStyle === "both" ? styles.pickerActive : ""} aria-label="Both-end arrow" onClick={() => setArrowStyle("both")}>↔</button><button className={arrowStyle === "none" ? styles.pickerActive : ""} aria-label="Headless arrow" onClick={() => setArrowStyle("none")}>—</button><span className={styles.bottomDivider} />{(["solid", "dashed", "dotted"] as const).map((texture) => <button key={texture} className={arrowTexture === texture ? styles.pickerActive : ""} aria-label={`${texture} arrow`} onClick={() => setArrowTexture(texture)}>{texture === "solid" ? "━" : texture === "dashed" ? "┄" : "┈"}</button>)}</div>}
      {!readOnly && selectedPrimitive?.kind === "text" && <div className={styles.textFormatBar} role="group" aria-label="Text formatting"><button aria-label="Decrease font size" onClick={() => updateSelectedPrimitiveStyle({ fontSize: String(Math.max(12, Number(selectedPrimitive.style.fontSize ?? 20) - 2)) })}>A−</button><span>{selectedPrimitive.style.fontSize ?? "20"} px</span><button aria-label="Increase font size" onClick={() => updateSelectedPrimitiveStyle({ fontSize: String(Math.min(48, Number(selectedPrimitive.style.fontSize ?? 20) + 2)) })}>A+</button><span className={styles.bottomDivider} />{(["hand", "sans", "serif", "mono"] as const).map((font) => <button key={font} className={selectedPrimitive.style.fontFamily === font || (!selectedPrimitive.style.fontFamily && font === "sans") ? styles.pickerActive : ""} aria-label={`${font} font`} onClick={() => updateSelectedPrimitiveStyle({ fontFamily: font })}>{font === "hand" ? "✎" : font === "sans" ? "Aa" : font === "serif" ? "Ag" : "<>"}</button>)}<span className={styles.bottomDivider} /><button className={selectedPrimitive.style.fontWeight === "bold" ? styles.pickerActive : ""} aria-label="Bold text" onClick={() => updateSelectedPrimitiveStyle({ fontWeight: selectedPrimitive.style.fontWeight === "bold" ? "normal" : "bold" })}><Bold size={14} /></button><button className={selectedPrimitive.style.fontStyle === "italic" ? styles.pickerActive : ""} aria-label="Italic text" onClick={() => updateSelectedPrimitiveStyle({ fontStyle: selectedPrimitive.style.fontStyle === "italic" ? "normal" : "italic" })}><Italic size={14} /></button><button className={selectedPrimitive.style.textDecoration === "underline" ? styles.pickerActive : ""} aria-label="Underline text" onClick={() => updateSelectedPrimitiveStyle({ textDecoration: selectedPrimitive.style.textDecoration === "underline" ? "none" : "underline" })}><Underline size={14} /></button><label title="Text color"><span className={styles.textColorSwatch} style={{ background: selectedPrimitive.style.color ?? "#111827" }} /><input type="color" aria-label="Text color" value={selectedPrimitive.style.color ?? "#111827"} onChange={(event) => updateSelectedPrimitiveStyle({ color: event.target.value })} /></label></div>}
      {!readOnly && (selectedNode || selectedPrimitive) && <div className={styles.layerControls} role="group" aria-label="Selection actions">{selectedNode && <button aria-label="Edit node style" title="Edit node style" data-tooltip="Edit node style" onClick={() => setInspectorOpen(true)}><SlidersHorizontal size={15} /></button>}<button aria-label="Bring to front" title="Bring to front" data-tooltip="Bring to front" onClick={() => moveSelectedLayer("front")}><BringToFront size={15} /></button><button aria-label="Send to back" title="Send to back" data-tooltip="Send to back" onClick={() => moveSelectedLayer("back")}><SendToBack size={15} /></button></div>}
      <div className={styles.bottomBar}><button className={tool === "select" ? styles.bottomToolActive : ""} title="Pointer / select (V)" data-tooltip="Pointer / select (V)" aria-label="Pointer / select" onClick={() => { setTool("select"); setDrawDraft(null); setEditingTextId(null); }}><MousePointer2 size={15} /></button><button className={tool === "pan" ? styles.bottomToolActive : ""} title="Hand / pan (H)" data-tooltip="Hand / pan (H)" aria-label="Hand / pan" onClick={() => setTool("pan")}><Hand size={15} /></button><span className={styles.bottomDivider} /><button title={showMiniMap ? "Hide mini map" : "Show mini map"} data-tooltip={showMiniMap ? "Hide mini map" : "Show mini map"} aria-label="Toggle mini map" onClick={() => setShowMiniMap((current) => !current)}><Map size={15} /></button><button title="Undo" data-tooltip="Undo" aria-label="Undo" onClick={undo} disabled={!past.length}><Undo2 size={15} /></button><button title="Redo" data-tooltip="Redo" aria-label="Redo" onClick={redo} disabled={!future.length}><Redo2 size={15} /></button><span className={styles.bottomDivider} /><button title="Zoom out" data-tooltip="Zoom out" aria-label="Zoom out" onClick={() => instance?.zoomOut()}><ZoomOut size={15} /></button><button className={styles.zoom} title="Fit canvas" data-tooltip="Fit canvas" onClick={() => instance?.fitView({ padding: .18, duration: 300, maxZoom: 1 })}>{zoom}%</button><button title="Zoom in" data-tooltip="Zoom in" aria-label="Zoom in" onClick={() => instance?.zoomIn()}><ZoomIn size={15} /></button></div>
      {diagram.assumptions.length > 0 && <div className={styles.assumptions}><strong>{diagram.assumptions.length} assumptions</strong><br />{diagram.assumptions[0].text}</div>}
      {!readOnly && (aiExpanded ? <div className={`${styles.aiBar} ${inspectorOpen && (selectedNode || selectedConnector) && panel === null ? styles.aiBarWithInspector : ""}`}><Sparkles size={14} /><input autoFocus value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") requestChange(); if (event.key === "Escape") setAiExpanded(false); }} placeholder="Describe an architecture change…" aria-label="AI architecture change" /><button className={styles.aiSend} onClick={requestChange} aria-label="Preview AI change"><Send size={14} /></button><button className={styles.aiClose} onClick={() => setAiExpanded(false)} aria-label="Collapse AI change input"><X size={14} /></button></div> : <button className={`${styles.aiLauncher} ${inspectorOpen && (selectedNode || selectedConnector) && panel === null ? styles.aiLauncherWithInspector : ""}`} onClick={() => setAiExpanded(true)} aria-label="Open AI architecture change" aria-expanded="false"><Sparkles size={15} /><span>Ask AI</span></button>)}
      {panel === "components" && <aside className={`${styles.componentPalette} ${componentDetached ? styles.componentPaletteDetached : ""} ${draggingComponentPalette ? styles.componentPaletteMoving : ""}`} aria-label={quickInsertPosition ? "Connect a component" : "Semantic components"} style={componentDetached ? { left: componentPalettePosition.x, top: componentPalettePosition.y } : undefined}>
        <header className={styles.componentPaletteHeader}>
          <div className={styles.componentPaletteTitle}><strong>{quickInsertPosition ? "Connect a component" : "Components"}</strong><span>{quickInsertPosition ? `From ${quickInsertSource?.name ?? "selected component"}` : `${nodeCatalog.length} available`}</span></div>
          <div className={styles.panelActions}>
            {componentDetached && <button className={styles.paletteMoveHandle} aria-label="Move components palette" title="Drag to move palette" onPointerDown={beginComponentPaletteDrag}><GripVertical size={16} /></button>}
            <button className={styles.close} title={componentDetached ? "Dock components" : "Detach components"} onClick={() => setComponentDetached((current) => !current)} aria-label={componentDetached ? "Dock components" : "Detach components"}><PanelRightClose size={14} /></button>
            <button className={styles.close} onClick={() => { setPanel(null); setQuickInsertPosition(null); setPendingConnectionSourceId(null); }} aria-label="Close components"><X size={14} /></button>
          </div>
        </header>
        {quickInsertPosition && <div className={styles.quickInsertNotice}>Pick a target to place it at the cursor and create a connection.</div>}
        <div className={styles.componentPaletteBody}>
          <nav className={styles.categoryRail} aria-label="Component categories">
            <button className={category === "all" ? styles.categoryRailActive : ""} onClick={() => setCategory("all")} aria-label={`Show all ${nodeCatalog.length} components`} title="All components"><span className={styles.categoryMarker} /><span>All</span><em>{nodeCatalog.length}</em></button>
            {categoryKeys.map((key) => { const meta = categoryMeta[key]; const count = nodeCatalog.filter((item) => item.category === key).length; return <button key={key} className={category === key ? styles.categoryRailActive : ""} onClick={() => setCategory(key)} aria-label={`Filter ${meta.label} components, ${count} available`} title={`${meta.label} · ${count} components`} style={{ "--category-color": meta.color } as React.CSSProperties}><span className={styles.categoryMarker} /><span>{meta.label}</span><em>{count}</em></button>; })}
          </nav>
          <section className={styles.componentResults} aria-label="Component results">
            <div className={styles.paletteSearch}><Search size={16} /><input ref={componentSearchRef} autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { if (search) setSearch(""); else { setPanel(null); setQuickInsertPosition(null); } } if (event.key === "Enter" && filteredCatalog[0]) chooseComponent(filteredCatalog[0].semanticType); }} placeholder="Search components" aria-label="Search semantic components" /><kbd>⌘K</kbd></div>
            <div className={styles.resultSummary}><span>{filteredCatalog.length} result{filteredCatalog.length === 1 ? "" : "s"}</span><span>{quickInsertPosition ? "Select target" : "Click to place · drag to canvas"}</span></div>
            <div className={styles.componentResultList}>
              {componentGroups.map((group) => <section className={styles.componentGroup} key={group.key} aria-label={`${categoryMeta[group.key].label} components`}><h3 style={{ "--category-color": categoryMeta[group.key].color } as React.CSSProperties}><span />{categoryMeta[group.key].label}<em>{group.items.length}</em></h3>{group.items.map((item) => { const crop = figmaIconCrop[item.semanticType]; return <div key={item.semanticType} className={styles.componentResult} draggable data-component={item.semanticType} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/buildrax-component", item.semanticType); }}><span className={styles.componentResultIcon}>{crop ? <span className={styles.componentFigmaIcon} aria-label={`${item.name} Figma SVG icon`} style={{ backgroundImage: "url(/icons/figma-node-icons.svg)", backgroundSize: "960px 407.33px", backgroundPosition: `${-crop.x * 2 / 3}px ${-crop.y * 2 / 3}px` }} /> : <span className={styles.componentOpenIcon} style={{ "--item-color": categoryMeta[item.category].color } as React.CSSProperties} aria-label={`${item.name} open-source icon`}><SemanticCatalogIcon semanticType={item.semanticType} /></span>}</span><button className={styles.componentResultMain} aria-label={`Place ${item.name} on canvas`} onClick={() => chooseComponent(item.semanticType)}><strong>{item.name}</strong><span>{item.description}</span><small>{categoryMeta[item.category].label}{item.defaultProtocols.length ? ` · ${item.defaultProtocols.join(" / ")}` : ""}</small></button><span className={styles.componentDragGrip} title={`Drag ${item.name} onto the canvas`} aria-label={`Drag ${item.name} onto the canvas`}><GripVertical size={16} /></span><button className={styles.componentPlaceAction} aria-label={`Place ${item.name}`} onClick={() => chooseComponent(item.semanticType)}>{quickInsertPosition ? "Connect" : "Place"}</button></div>; })}</section>)}
              {!filteredCatalog.length && <div className={styles.componentEmpty}><strong>No components found</strong><p>Try a different search term or reset the active category.</p><button onClick={() => { setSearch(""); setCategory("all"); }}>Reset results</button></div>}
            </div>
          </section>
        </div>
      </aside>}
      {panel === null && (selectedNode || selectedConnector) && inspectorOpen && <aside className={styles.inspector}><div className={styles.panelHead}><strong>{selectedConnector ? "Connection" : "Inspector"}</strong><button className={styles.close} onClick={() => setInspectorOpen(false)} aria-label="Close inspector"><X size={14} /></button></div><div className={styles.inspectorBody}>{selectedNode ? <><div className={styles.metaCard}>{categoryMeta[selectedNode.category].label} · {selectedNode.semanticType}<br />Version {diagram.version}</div><div className={styles.appearanceEditor} aria-label="Node appearance"><strong>Node style</strong><label>Preset<select aria-label="Node style preset" value={String(selectedNode.metadata.appearanceVariant ?? "card")} onChange={(event) => updateSelectedNodeAppearance({ appearanceVariant: event.target.value })}><option value="card">Card</option><option value="tinted">Tinted</option><option value="outline">Outline</option></select></label><label>Corners<select aria-label="Node corner radius" value={String(selectedNode.metadata.borderRadius ?? "16")} onChange={(event) => updateSelectedNodeAppearance({ borderRadius: event.target.value })}><option value="8">Compact</option><option value="16">Rounded</option><option value="24">Soft</option></select></label><label>Accent<input type="color" aria-label="Node accent color" value={typeof selectedNode.metadata.accentColor === "string" ? selectedNode.metadata.accentColor : categoryMeta[selectedNode.category].color} onChange={(event) => updateSelectedNodeAppearance({ accentColor: event.target.value })} /></label><label>Fill<input type="color" aria-label="Node fill color" value={typeof selectedNode.metadata.fillColor === "string" ? selectedNode.metadata.fillColor : "#ffffff"} onChange={(event) => updateSelectedNodeAppearance({ fillColor: event.target.value })} /></label><label>Depth<select aria-label="Node shadow" value={String(selectedNode.metadata.shadow ?? "soft")} onChange={(event) => updateSelectedNodeAppearance({ shadow: event.target.value })}><option value="none">Flat</option><option value="soft">Soft</option><option value="raised">Raised</option></select></label></div><label className={styles.field}><span>Name</span><input value={selectedNode.name} onChange={(event) => updateSelected({ name: event.target.value })} /></label><label className={styles.field}><span>Description</span><textarea value={selectedNode.description} onChange={(event) => updateSelected({ description: event.target.value })} /></label><label className={styles.field}><span>Technology</span><input value={selectedNode.technology} onChange={(event) => updateSelected({ technology: event.target.value })} placeholder="Provider-neutral" /></label><label className={styles.field}><span>Provider</span><input value={selectedNode.provider} onChange={(event) => updateSelected({ provider: event.target.value })} placeholder="Not selected" /></label><button className={styles.dangerButton} onClick={removeSelected}>Delete component</button></> : selectedConnector ? <><div className={styles.metaCard}>{selectedConnector.source} → {selectedConnector.target}<br />Version {diagram.version}</div><label className={styles.field}><span>Connection type</span><select value={selectedConnector.type} onChange={(event) => updateSelectedConnector({ type: event.target.value as Diagram["connectors"][number]["type"] })}>{["http-rest", "grpc", "websocket", "async-message", "pub-sub", "event-stream", "database-read-write", "cache", "object-transfer", "model-inference", "vector-retrieval", "tool-call", "control-plane"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label className={styles.field}><span>Route</span><select value={selectedConnector.routing} onChange={(event) => updateSelectedConnector({ routing: event.target.value as Diagram["connectors"][number]["routing"] })}><option value="orthogonal">Orthogonal</option><option value="curved">Curved</option><option value="straight">Straight</option></select></label><label className={styles.field}><span>Line texture</span><select value={selectedConnector.style} onChange={(event) => updateSelectedConnector({ style: event.target.value as Diagram["connectors"][number]["style"] })}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></label><label className={styles.field}><span>Direction</span><select value={selectedConnector.direction} onChange={(event) => updateSelectedConnector({ direction: event.target.value as Diagram["connectors"][number]["direction"] })}><option value="unidirectional">One-way arrow</option><option value="bidirectional">Two-way arrows</option></select></label><label className={styles.field}><span>Label</span><input value={selectedConnector.label} onChange={(event) => updateSelectedConnector({ label: event.target.value })} placeholder="Describe the relationship" /></label><label className={styles.field}><span>Protocol</span><input value={selectedConnector.protocol} onChange={(event) => updateSelectedConnector({ protocol: event.target.value })} placeholder="HTTPS, gRPC, AMQP…" /></label><label className={styles.field}><span>Authentication</span><input value={selectedConnector.authentication} onChange={(event) => updateSelectedConnector({ authentication: event.target.value })} placeholder="OAuth, mTLS, API key…" /></label><label className={styles.field}><span>Encryption</span><input value={selectedConnector.encryption} onChange={(event) => updateSelectedConnector({ encryption: event.target.value })} placeholder="TLS 1.3" /></label><button className={styles.dangerButton} onClick={removeSelected}>Delete connection</button></> : null}</div></aside>}
      {panel === "history" && <aside className={styles.sidePanel}><div className={styles.panelHead}><strong>Version history</strong><button className={styles.close} onClick={() => setPanel(null)} aria-label="Close history"><X size={14} /></button></div><div className={styles.sidePanelBody}>{loadingPanel ? <p>Loading immutable history…</p> : versions.length ? <>{versions.map((item) => { const archived = [item.ir_state, item.presentation_state, item.diagram_state].includes("archived"); return <article className={styles.finding} key={item.version}><div className={styles.findingTop}><span>Version {item.version}</span><span>IR {item.ir_version}</span></div><p>{new Date(item.created_at).toLocaleString()} · {archived ? "Archived · opens on demand" : "Available now"}</p><button className={styles.topButton} disabled={item.version === diagram.version || loadingPanel} onClick={() => void restoreVersion(item.version)}><RotateCcw size={14} />{item.version === diagram.version ? "Current version" : "Restore as new head"}</button></article>; })}</> : <p>No version history is available yet.</p>}</div></aside>}
      {(panel === "review" || panel === "docs" || panel === "export") && <aside className={`${styles.sidePanel} ${panel === "docs" ? styles.docsPanel : ""}`}><div className={styles.panelHead}><strong>{panel === "review" ? "Architecture review" : panel === "docs" ? "Documentation" : "Export"}</strong><div className={styles.panelActions}>{panel === "docs" && <><button className={styles.close} title="Copy documentation" aria-label="Copy documentation" onClick={() => void copyDocumentation()}><Copy size={14} /></button><button className={styles.close} title="Export Markdown" aria-label="Export Markdown" onClick={() => void exportFile("markdown")}><Download size={14} /></button></>}<button className={styles.close} onClick={() => setPanel(null)} aria-label="Close"><X size={14} /></button></div></div><div className={styles.sidePanelBody}>{loadingPanel ? <p>Preparing version {diagram.version}…</p> : panel === "review" ? <><p>Advisory findings for version {diagram.version}. Validate recommendations with your engineering and security teams.</p>{reviews.length ? reviews.map((finding) => <article className={styles.finding} key={finding.id}><div className={`${styles.findingTop} ${styles[`severity_${finding.severity}`]}`}><span>{finding.lens}</span><span>{finding.severity}</span></div><p>{finding.rationale}</p><strong>{finding.recommendation}</strong></article>) : <p>No review has been run for this version.</p>}</> : panel === "docs" ? <article className={styles.docs}>{docs ? <><div className={styles.docsMeta}>Version {diagram.version} · {diagram.nodes.length} components · {diagram.connectors.length} connectors</div>{documentBlocks(docs)}</> : <p>Generate documentation to create a version-bound implementation brief.</p>}</article> : <><p>Guest exports contain only the diagram model and visible content.</p>{(["png", "svg", "json", "mermaid", "markdown"] as const).map((format) => <button className={styles.componentItem} key={format} onClick={() => exportFile(format)}><span className={styles.componentCode} style={{ "--item-color": "var(--text-secondary)" } as React.CSSProperties}>{format.slice(0, 3).toUpperCase()}</span><span className={styles.componentText}><strong>{format.toUpperCase()}</strong><span>{format === "png" || format === "svg" ? "Current canvas view" : "Validated semantic model"}</span></span><Download size={14} /></button>)}</>}</div></aside>}
      {panel === "docs" && <aside className={`${styles.documentWorkspace} ${documentView === "document" ? styles.documentFocus : ""}`} aria-label="Documentation workspace">
        <div className={styles.panelHead}>
          <div><strong>Documentation</strong><span className={styles.documentStatus}>Local draft · version {diagram.version}</span></div>
          <div className={styles.panelActions}>
            <button className={styles.close} title="Copy documentation" data-tooltip="Copy document as Markdown" aria-label="Copy documentation" onClick={() => void copyDocumentation()}><Copy size={14} /></button>
            <button className={styles.close} title="Export Markdown" data-tooltip="Download document as Markdown" aria-label="Export Markdown" onClick={() => void exportFile("markdown")}><Download size={14} /></button>
            <button className={styles.close} title="Close documentation" data-tooltip="Close documentation" aria-label="Close documentation" onClick={() => setPanel(null)}><X size={14} /></button>
          </div>
        </div>
        <div className={styles.documentToolbar} aria-label="Document view and formatting">
          <div className={styles.documentSegmented} role="group" aria-label="Documentation view">
            <button aria-label="Document view" data-tooltip="Show a wide document workspace" className={documentView === "document" ? styles.documentSelected : ""} onClick={() => setDocumentView("document")}>Document</button>
            <button aria-label="Split document and canvas view" data-tooltip="Keep document and canvas visible" className={documentView === "both" ? styles.documentSelected : ""} onClick={() => setDocumentView("both")}>Both</button>
            <button aria-label="Canvas view" data-tooltip="Return to the full canvas" onClick={() => setPanel(null)}>Canvas</button>
          </div>
          <div className={styles.documentSegmented} role="group" aria-label="Documentation mode">
            <button aria-label="Write document" data-tooltip="Edit the Markdown source" className={documentMode === "edit" ? styles.documentSelected : ""} onClick={() => setDocumentMode("edit")}>Write</button>
            <button aria-label="Read document" data-tooltip="Preview the formatted document" className={documentMode === "preview" ? styles.documentSelected : ""} onClick={() => setDocumentMode("preview")}>Read</button>
          </div>
        </div>
        {!readOnly && <div className={styles.documentQuickActions} role="toolbar" aria-label="Markdown insert tools">
          <button aria-label="Heading" title="Heading" data-tooltip="Insert a level-two heading" onClick={() => insertDocumentation("## Heading")}>H</button>
          <button aria-label="Bold" title="Bold" data-tooltip="Bold the selected text" onMouseDown={(event) => event.preventDefault()} onClick={() => wrapDocumentation("**", "**", "bold text")}><Bold size={14} /></button>
          <button aria-label="Italic" title="Italic" data-tooltip="Italicize the selected text" onMouseDown={(event) => event.preventDefault()} onClick={() => wrapDocumentation("_", "_", "italic text")}><Italic size={14} /></button>
          <button aria-label="Quote" title="Quote" data-tooltip="Insert a decision callout" onClick={() => insertDocumentation("> Callout or important decision")}>❝</button>
          <button aria-label="Bulleted list" title="Bulleted list" data-tooltip="Insert a bulleted list" onClick={() => insertDocumentation("- List item") }><List size={14} /></button>
          <button aria-label="Numbered list" title="Numbered list" data-tooltip="Insert a numbered list" onClick={() => insertDocumentation("1. First item") }><ListOrdered size={14} /></button>
          <button aria-label="Task list" title="Task list" data-tooltip="Insert an interactive checklist" onClick={() => insertDocumentation("- [ ] Task") }><CheckSquare size={14} /></button>
          <button aria-label="Insert table" title="Insert table" data-tooltip="Insert a Markdown table" onClick={() => insertDocumentation("| Column | Value |\n| --- | --- |\n| Item | Details |")}>▦</button>
          <button aria-label="Add table row" title="Add table row" data-tooltip="Add a row to the first table" onClick={() => updateFirstTable((rows) => [...rows, Array.from({ length: rows[0]?.length ?? 2 }, () => "Value")])}>+R</button>
          <button aria-label="Add table column" title="Add table column" data-tooltip="Add a column to the first table" onClick={() => updateFirstTable((rows) => rows.map((row, index) => [...row, index === 0 ? "Column" : "Value"]))}>+C</button>
          <button aria-label="Code block" title="Code block" data-tooltip="Insert a TypeScript code block" onClick={() => insertDocumentation("```typescript\n// implementation note\n```") }><Code2 size={14} /></button>
          <button aria-label="Divider" title="Divider" data-tooltip="Insert a section divider" onClick={() => insertDocumentation("---")}>—</button>
          <button aria-label="Embed live canvas" title="Embed live canvas" data-tooltip="Embed a live, synchronized canvas summary" onClick={() => insertDocumentation(":::buildrax-canvas\n:::")}>⌘</button>
          <button aria-label="Insert Mermaid diagram" title="Insert Mermaid diagram" data-tooltip="Insert the semantic architecture as Mermaid diagram code" onClick={() => insertDocumentation(`\`\`\`mermaid\n${semanticMermaid}\n\`\`\``)}>◈</button>
          <button aria-label="Link selected canvas node" title="Link selected canvas node" data-tooltip={selectedNode ? `Link ${selectedNode.name}` : "Select a canvas component before linking"} disabled={!selectedNode} onClick={() => selectedNode && insertDocumentation(`:::buildrax-node\n${selectedNode.id}\n:::`)}>↗</button>
          <button aria-label="Add document image" title="Add document image" data-tooltip="Embed an image up to 2 MB" onClick={() => documentImageInputRef.current?.click()}><ImagePlus size={14} /></button>
        </div>}
        {!readOnly && <input ref={documentImageInputRef} className={styles.visuallyHidden} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(event) => { addDocumentImage(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />}
        <div className={styles.documentBody}>
          {loadingPanel ? <p>Preparing version {diagram.version}…</p> : documentMode === "edit" ? <><textarea ref={documentInputRef} readOnly={readOnly} className={styles.documentEditor} aria-label="Documentation editor" value={docs} onChange={(event) => setDocs(event.target.value)} placeholder="# Architecture decision\n\nWrite in Markdown, or type / for quick insert." />
            {!readOnly && slashMatch && <div className={styles.slashMenu} role="menu" aria-label="Slash commands">{[
              ["heading", "## Heading"], ["table", "| Column | Value |\n| --- | --- |\n| Item | Details |"], ["callout", "> Important callout"], ["code", "```typescript\n// code\n```"], ["divider", "---"], ["diagram", ":::buildrax-canvas\n:::"], ["mermaid", `\`\`\`mermaid\n${semanticMermaid}\n\`\`\``],
            ].filter(([name]) => name.includes(slashQuery)).map(([name, template]) => <button key={name} role="menuitem" onClick={() => insertDocumentation(template)}><strong>/{name}</strong><span>Insert {name}</span></button>)}</div>}</> : <article className={styles.docs}>{docs ? <><div className={styles.docsMeta}>Version {diagram.version} · {diagram.nodes.length} components · {diagram.connectors.length} connectors</div>{documentBlocks(docs, diagram, focusDocumentNode)}</> : <p>Write a Markdown document, or use AI draft from canvas to create a version-bound brief.</p>}</article>}
        </div>
        {!readOnly && <div className={styles.documentAiBar}><Sparkles size={14} /><input aria-label="AI document prompt" title="Describe the documentation section to draft" value={documentPrompt} onChange={(event) => setDocumentPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void draftDocumentationFromCanvas(); }} placeholder="Draft an implementation note from this canvas…" /><button data-tooltip="Draft from the current diagram" aria-label="Draft documentation from canvas" onClick={() => void draftDocumentationFromCanvas()} disabled={loadingPanel}>Draft</button></div>}
      </aside>}
      {message && <button className={styles.assumptions} onClick={() => setMessage("")} role="status">{message}</button>}
    </main>
    {showSaveGate && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="save-title"><div className={styles.modal}><LockKeyhole size={22} /><h2 id="save-title">Save your architecture</h2><p>Create a free workspace to preserve this diagram, its documentation and AI review. Your local draft remains intact if you cancel.</p><div className={styles.modalActions}><Button variant="tertiary" onClick={() => setShowSaveGate(false)}>Keep working locally</Button><ButtonLink href={`/dashboard?migrate=${diagram.id}`}>Continue to sign in</ButtonLink></div></div></div>}
    {changePlan && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="change-title"><div className={styles.modal}><Bot size={22} /><h2 id="change-title">Preview architecture change</h2><p>Nothing changes until you apply this preview. Applying creates one undoable transaction.</p><div className={styles.diff}><div className={styles.diffRow}><span>Components added</span><strong>+{changePlan.addedNodes.length}</strong></div><div className={styles.diffRow}><span>Components changed</span><strong>{changePlan.changedNodes.length}</strong></div><div className={styles.diffRow}><span>Components removed</span><strong>-{changePlan.removedNodeIds.length}</strong></div></div>{changePlan.warnings.map((warning) => <p key={warning}>{warning}</p>)}<div className={styles.modalActions}><Button variant="tertiary" onClick={() => setChangePlan(null)}>Cancel</Button><Button onClick={applyChangePlan}>Apply change</Button></div></div></div>}
  </div>;
}

export function ArchitectureEditor(props: { initialDiagram: Diagram; initialIR?: ArchitectureIR; initialIrVersion?: number; readOnly?: boolean; persisted?: boolean; projectId?: string }) {
  return <ReactFlowProvider><ArchitectureEditorInner {...props} /></ReactFlowProvider>;
}
