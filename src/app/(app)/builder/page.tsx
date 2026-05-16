"use client";

import { Suspense, type DragEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import * as LucideIcons from "lucide-react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  GitBranch,
  LayoutDashboard,
  Library,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  Save,
  Search,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ExpectedVsExactReport as ExpectedVsExactReportView } from "@/components/guidance/ExpectedVsExactReport";
import { HelpGuidePanel } from "@/components/guidance/HelpGuidePanel";
import { NodeEducationPopover } from "@/components/guidance/NodeEducationPopover";
import { PlainLanguageExplanationPanel } from "@/components/guidance/PlainLanguageExplanationPanel";
import { TermTooltip } from "@/components/guidance/TermTooltip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { NodePropertiesPanel } from "@/components/NodePropertiesPanel";
import { ExportType, generateExport } from "@/lib/backend/exports";
import { generateMermaid, validateMermaid } from "@/lib/backend/mermaid";
import { runWorkflowReview } from "@/lib/backend/review";
import { runWorkflowSimulation } from "@/lib/backend/simulation";
import {
  BeginnerNodeExplanation,
  buildExpectedFlow,
  compareExpectedToActual,
  explainNodeForBeginner,
  explainReviewRun,
  explainSimulationRun,
  formatExpectedVsExactReport,
} from "@/lib/guidance/explanations";
import { getDefaultNodeData, getNodePackLabel, NODE_DEFINITIONS, NODE_PACK_ORDER } from "@/lib/graph/catalog";
import { nodeTypes } from "@/components/nodes";
import { ReviewResult, SimulationResult, WorkflowGraph } from "@/lib/graph/types";
import { cn } from "@/lib/utils";

type FlowNode = Node<Record<string, unknown>, string>;
type FlowEdge = Edge;
type FlowInstance = ReactFlowInstance<FlowNode, FlowEdge>;
type BuilderStage = "build" | "review" | "simulate" | "mermaid" | "export";
type ConsoleLevel = "info" | "success" | "warning" | "error";

interface ConsoleEntry {
  id: string;
  level: ConsoleLevel;
  message: string;
  timestamp: string;
}

const LOCAL_DRAFT_KEY = "buildrax:backend-builder-draft:v1";

const starterNodes: FlowNode[] = [
  { id: "api-1", type: "http_trigger", position: { x: 60, y: 160 }, data: getDefaultNodeData("http_trigger") },
  { id: "validator-1", type: "request_validator", position: { x: 390, y: 90 }, data: getDefaultNodeData("request_validator") },
  { id: "auth-1", type: "auth_node", position: { x: 390, y: 260 }, data: getDefaultNodeData("auth_node") },
  { id: "db-1", type: "database_write", position: { x: 735, y: 160 }, data: getDefaultNodeData("database_write") },
  { id: "logger-1", type: "logger", position: { x: 1080, y: 160 }, data: getDefaultNodeData("logger") },
];

const starterEdges: FlowEdge[] = [
  { id: "api-validator", source: "api-1", target: "validator-1", animated: true },
  { id: "validator-auth", source: "validator-1", target: "auth-1", animated: true },
  { id: "auth-db", source: "auth-1", target: "db-1", animated: true },
  { id: "db-logger", source: "db-1", target: "logger-1", animated: true },
];

function BuilderNodeLibraryIcon({ iconName }: { iconName?: string }) {
  const Icon = iconName
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
    : TerminalSquare;
  const SafeIcon = Icon || TerminalSquare;
  return <SafeIcon className="h-4 w-4" />;
}

function makeGraph(name: string, description: string, nodes: FlowNode[], edges: FlowEdge[]): WorkflowGraph {
  return {
    version: "1.0",
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type || "custom",
      position: node.position,
      data: node.data || {},
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      animated: edge.animated,
      label: typeof edge.label === "string" ? edge.label : undefined,
    })),
    metadata: { name, description, mode: "design", tags: ["backend-architecture"] },
  };
}

function BuilderCanvas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { theme } = useTheme();
  const workflowIdFromUrl = searchParams.get("id") || "";
  const [workflowId, setWorkflowId] = useState(workflowIdFromUrl);
  const [workflowName, setWorkflowName] = useState("Backend Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("Design, review, simulate, and export a backend architecture before implementation.");
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(starterEdges);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [query, setQuery] = useState("");
  const [activePack, setActivePack] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>("Local draft");
  const [activeStage, setActiveStage] = useState<BuilderStage>("build");
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [mermaidDraft, setMermaidDraft] = useState("");
  const [mermaidCompilerMessage, setMermaidCompilerMessage] = useState("Compiler idle.");
  const [exportContent, setExportContent] = useState("");
  const [selectedExportType, setSelectedExportType] = useState<ExportType>("developer_handoff");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState<Exclude<BuilderStage, "build"> | null>(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [isCustomNodeOpen, setIsCustomNodeOpen] = useState(false);
  const [flowInstance, setFlowInstance] = useState<FlowInstance | null>(null);
  const [isCanvasDragActive, setIsCanvasDragActive] = useState(false);
  const [customNodeName, setCustomNodeName] = useState("");
  const [customNodeRole, setCustomNodeRole] = useState("custom_operation");
  const [customNodeDescription, setCustomNodeDescription] = useState("");
  const [customNodeDependencies, setCustomNodeDependencies] = useState("");
  const [customNodeOutputs, setCustomNodeOutputs] = useState("");
  const [customNodeFailureModes, setCustomNodeFailureModes] = useState("validation_error\ntimeout\ndependency_error");
  const [nodeGuide, setNodeGuide] = useState<BeginnerNodeExplanation | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([
    {
      id: "boot",
      level: "info",
      message: "Sandbox console ready. Run review, simulation, Mermaid, and exports from this builder.",
      timestamp: "ready",
    },
  ]);

  const logToConsole = useCallback((level: ConsoleLevel, message: string) => {
    setConsoleEntries((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        level,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...current,
    ].slice(0, 80));
  }, []);

  const graph = useMemo(() => makeGraph(workflowName, workflowDescription, nodes, edges), [workflowName, workflowDescription, nodes, edges]);
  const expectedFlow = useMemo(() => buildExpectedFlow(graph, "happy_path"), [graph]);
  const expectedVsExactReport = useMemo(() => compareExpectedToActual(expectedFlow, simulationResult), [expectedFlow, simulationResult]);
  const reviewExplanation = useMemo(() => explainReviewRun(graph, reviewResult), [graph, reviewResult]);
  const simulationExplanation = useMemo(() => explainSimulationRun(graph, simulationResult), [graph, simulationResult]);
  const validation = useMemo(() => {
    const problems: string[] = [];
    if (nodes.length === 0) problems.push("Add at least one backend node.");
    const roles = nodes.map((node) => String(node.data?.node_role || ""));
    if (!roles.includes("trigger") && !roles.includes("api_endpoint")) problems.push("Add an entry point.");
    if ((roles.includes("trigger") || roles.includes("api_endpoint")) && !nodes.some((node) => node.type === "rate_limiter")) problems.push("Public API flows should include a rate limiter.");
    if (!roles.some((role) => ["observer", "operations_response", "availability_monitor", "compliance_observer"].includes(role))) problems.push("Add observability coverage.");
    return problems;
  }, [nodes]);

  const filteredDefinitions = useMemo(() => {
    const q = query.toLowerCase();
    return NODE_DEFINITIONS.filter((definition) => {
      const packMatch = activePack === "all" || definition.pack === activePack;
      const queryMatch = !q || [definition.title, definition.description, definition.category, definition.type].join(" ").toLowerCase().includes(q);
      return packMatch && queryMatch;
    });
  }, [activePack, query]);

  useEffect(() => {
    if (!workflowIdFromUrl) {
      const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (raw) {
        try {
          const draft = JSON.parse(raw) as { name?: string; description?: string; nodes?: FlowNode[]; edges?: FlowEdge[] };
          setWorkflowName(draft.name || "Backend Workflow");
          setWorkflowDescription(draft.description || "");
          setNodes(draft.nodes || starterNodes);
          setEdges(draft.edges || starterEdges);
        } catch {
          localStorage.removeItem(LOCAL_DRAFT_KEY);
        }
      }
    }
  }, [setEdges, setNodes, workflowIdFromUrl]);

  useEffect(() => {
    if (workflowIdFromUrl) {
      fetch(`/api/workflows/${workflowIdFromUrl}`)
        .then((response) => response.json())
        .then((workflow) => {
          if (workflow.error) throw new Error(workflow.error);
          setWorkflowId(workflow._id || workflowIdFromUrl);
          setWorkflowName(workflow.name || workflow.graph?.metadata?.name || "Backend Workflow");
          setWorkflowDescription(workflow.description || workflow.graph?.metadata?.description || "");
          setNodes((workflow.graph?.nodes || workflow.nodes || []) as FlowNode[]);
          setEdges((workflow.graph?.edges || workflow.edges || []) as FlowEdge[]);
          setLastSavedAt(workflow.updatedAt ? `Saved ${new Date(workflow.updatedAt).toLocaleTimeString()}` : "Saved");
        })
        .catch((error) => toast.error(error.message || "Failed to load workflow"));
    }
  }, [setEdges, setNodes, workflowIdFromUrl]);

  useEffect(() => {
    if (!workflowId) {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({ name: workflowName, description: workflowDescription, nodes, edges }));
    }
  }, [edges, nodes, workflowDescription, workflowId, workflowName]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) => addEdge({ ...connection, animated: true }, current));
  }, [setEdges]);

  const addNode = useCallback((type: string, position?: { x: number; y: number }, source: "click" | "drop" = "click") => {
    const definition = NODE_DEFINITIONS.find((item) => item.type === type);
    const id = `${type}-${Date.now()}`;
    const column = nodes.length % 4;
    const row = Math.floor(nodes.length / 4);
    const newNode: FlowNode = {
      id,
      type,
      position: position || { x: 80 + column * 320, y: 80 + row * 180 },
      data: { ...getDefaultNodeData(type), label: definition?.title || type },
    };
    setNodes((current) => [...current, newNode]);
    setSelectedNode(newNode);
    logToConsole("info", `${definition?.title || type} ${source === "drop" ? "dropped on the canvas" : "added"}. Open the node guide from the inspector whenever you want role, input, output, and failure details.`);
  }, [logToConsole, nodes.length, setNodes]);

  const startNodeDrag = (event: DragEvent<HTMLButtonElement>, type: string) => {
    event.dataTransfer.setData("application/buildrax-node", type);
    event.dataTransfer.setData("text/plain", type);
    event.dataTransfer.effectAllowed = "move";
    setIsCanvasDragActive(true);
  };

  const onCanvasDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsCanvasDragActive(true);
  }, []);

  const onCanvasDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setIsCanvasDragActive(false);
      const type = event.dataTransfer.getData("application/buildrax-node") || event.dataTransfer.getData("text/plain");
      if (!type || !NODE_DEFINITIONS.some((definition) => definition.type === type)) return;

      const position = flowInstance?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) || {
        x: 120 + (nodes.length % 4) * 280,
        y: 120 + Math.floor(nodes.length / 4) * 160,
      };
      addNode(type, position, "drop");
    },
    [addNode, flowInstance, nodes.length]
  );

  const addCustomNode = () => {
    const label = customNodeName.trim() || "Custom Backend Node";
    const description = customNodeDescription.trim() || "Custom node with user-defined behavior, dependencies, and failure modes.";
    const id = `custom-${Date.now()}`;
    const column = nodes.length % 4;
    const row = Math.floor(nodes.length / 4);
    const newNode: FlowNode = {
      id,
      type: "custom",
      position: { x: 80 + column * 320, y: 80 + row * 180 },
      data: {
        label,
        description,
        node_role: customNodeRole.trim() || "custom_operation",
        inputs: "default",
        outputs: customNodeOutputs.trim() || "default",
        dependencies: customNodeDependencies.trim(),
        failure_modes: customNodeFailureModes.trim() || "validation_error\ntimeout\ndependency_error",
        review_rules: "Document ownership, retries, idempotency, observability, and data contracts.",
      },
    };
    setNodes((current) => [...current, newNode]);
    setSelectedNode(newNode);
    setCustomNodeName("");
    setCustomNodeDescription("");
    setCustomNodeDependencies("");
    setCustomNodeOutputs("");
    setCustomNodeFailureModes("validation_error\ntimeout\ndependency_error");
    logToConsole("success", `Custom node added: ${label}.`);
  };

  const updateNodeData = (id: string, data: Record<string, unknown>) => {
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== id) return node;
        if (data.__replace__) return { ...node, data: data.__replace__ as Record<string, unknown> };
        const updated = { ...node, data: { ...node.data, ...data } };
        setSelectedNode(updated);
        return updated;
      })
    );
  };

  const saveWorkflow = async () => {
    if (!session?.user) {
      toast.error("Sign in or continue as guest before saving.");
      router.push("/login");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(workflowId ? `/api/workflows/${workflowId}` : "/api/workflows", {
        method: workflowId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, description: workflowDescription, graph, nodes: graph.nodes, edges: graph.edges, lifecycle: validation.length > 0 ? "draft" : "configured" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Save failed");
      const id = payload._id || payload.workflowId || workflowId;
      setWorkflowId(id);
      setLastSavedAt(`Saved ${new Date().toLocaleTimeString()}`);
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      toast.success("Workflow saved");
      if (!workflowId && id) router.replace(`/builder?id=${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const runReview = async () => {
    setActiveStage("review");
    setActiveModal("review");
    setIsProcessing(true);
    logToConsole("info", "Review started. Checking architecture completeness, security, reliability, data flow, and observability.");
    try {
      const localResult = runWorkflowReview(graph);
      setReviewResult(localResult);
      logToConsole(
        localResult.status === "blocked" ? "warning" : "success",
        `Review finished with ${localResult.issues.length} findings and ${localResult.scores.overall}/100 overall score.`
      );

      if (workflowId) {
        const response = await fetch(`/api/workflows/${workflowId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ graph }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Review persistence failed");
        if (payload.result) setReviewResult(payload.result);
        logToConsole("success", "Review result saved to this workflow.");
      } else {
        logToConsole("info", "Workflow is unsaved. Review ran in the local sandbox without saving the workflow.");
      }

      toast.success("Review complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Review failed";
      toast.error(message);
      logToConsole("error", message);
    } finally {
      setIsProcessing(false);
    }
  };

  const runSimulation = async () => {
    setActiveStage("simulate");
    setActiveModal("simulate");
    setIsProcessing(true);
    logToConsole("info", "Simulation started with the Happy Path scenario.");
    try {
      const localResult = runWorkflowSimulation(graph, "happy_path");
      setSimulationResult(localResult);
      localResult.trace.slice(0, 8).forEach((step) => {
        logToConsole(step.status === "completed" ? "success" : step.status === "warning" ? "warning" : "error", `${step.label}: ${step.message}`);
      });
      logToConsole(
        localResult.status === "completed" ? "success" : localResult.status === "warning" ? "warning" : "error",
        `Simulation ${localResult.status}. ${localResult.summary}`
      );
      logToConsole("info", `Overall report: ${localResult.trace.length} trace steps, ${localResult.missingFallback.length} missing fallbacks, ${localResult.affectedDownstreamNodes.length} downstream impacts.`);

      if (workflowId) {
        const response = await fetch(`/api/workflows/${workflowId}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ graph, scenarioId: "happy_path" }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Simulation persistence failed");
        if (payload.result) setSimulationResult(payload.result);
        logToConsole("success", "Simulation run saved to this workflow.");
      } else {
        logToConsole("info", "Workflow is unsaved. Simulation ran in the local sandbox without saving the workflow.");
      }

      toast.success("Simulation complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Simulation failed";
      toast.error(message);
      logToConsole("error", message);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateBuilderMermaid = async () => {
    setActiveStage("mermaid");
    setActiveModal("mermaid");
    setIsProcessing(true);
    logToConsole("info", "Mermaid generation started. Sanitizing node labels and graph edges.");
    try {
      let code = generateMermaid(graph);
      const validationResult = validateMermaid(code);
      if (!validationResult.valid) throw new Error(validationResult.errors.join(" "));
      setMermaidCompilerMessage(`Compiled successfully. ${validationResult.warnings.length} warning(s).`);

      if (workflowId) {
        const response = await fetch(`/api/workflows/${workflowId}/mermaid/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ graph }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Mermaid persistence failed");
        code = payload.mermaid || payload.code || code;
        logToConsole("success", "Mermaid diagram generated and saved to this workflow.");
      } else {
        logToConsole("info", "Workflow is unsaved. Mermaid was generated locally without saving the workflow.");
      }

      setMermaidCode(code);
      setMermaidDraft(code);
      toast.success("Mermaid generated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mermaid generation failed";
      toast.error(message);
      logToConsole("error", message);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateBuilderExport = async (type: ExportType = selectedExportType) => {
    setActiveStage("export");
    setActiveModal("export");
    setSelectedExportType(type);
    setIsProcessing(true);
    const label = type === "developer_handoff" ? "Developer handoff" : type === "workflow_json" ? "Workflow JSON" : type === "simulation_report" ? "Simulation report" : type;
    logToConsole("info", `${label} export started. Compiling deterministic graph artifacts.`);
    try {
      let content = generateExport(graph, type);
      if (type === "simulation_report" || type === "developer_handoff") {
        content = `${content}\n\n${formatExpectedVsExactReport(expectedVsExactReport)}`;
      }
      setExportContent(content);

      if (workflowId) {
        const response = await fetch(`/api/workflows/${workflowId}/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, graph }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Export persistence failed");
        logToConsole("success", `${label} export saved to this workflow.`);
      } else {
        logToConsole("info", "Workflow is unsaved. Export was generated locally without saving the workflow.");
      }

      logToConsole("success", `${label} export generated and loaded into preview.`);
      toast.success(`${label} generated`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
      logToConsole("error", message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyExportContent = async () => {
    if (!exportContent) {
      toast.error("Generate an export first.");
      return;
    }
    await navigator.clipboard.writeText(exportContent);
    logToConsole("success", "Export content copied to clipboard.");
    toast.success("Export copied");
  };

  const compileMermaidDraft = () => {
    setActiveStage("mermaid");
    setActiveModal("mermaid");
    const validationResult = validateMermaid(mermaidDraft);
    if (validationResult.valid) {
      setMermaidCode(mermaidDraft);
      setMermaidCompilerMessage(`Compiled successfully. ${validationResult.warnings.length} warning(s).`);
      logToConsole("success", "Mermaid compiler validated the diagram source.");
      toast.success("Mermaid compiled");
      return;
    }
    const message = validationResult.errors.join(" ");
    setMermaidCompilerMessage(message);
    logToConsole("error", `Mermaid compiler failed: ${message}`);
    toast.error("Mermaid compile failed");
  };

  const stageStatus: Record<BuilderStage, "active" | "complete" | "pending"> = {
    build: validation.length === 0 ? "complete" : "active",
    review: reviewResult ? "complete" : "pending",
    simulate: simulationResult ? "complete" : "pending",
    mermaid: mermaidCode ? "complete" : "pending",
    export: exportContent ? "complete" : "pending",
  };

  const consoleTone: Record<ConsoleLevel, string> = {
    info: "text-slate-300",
    success: "text-emerald-300",
    warning: "text-amber-300",
    error: "text-rose-300",
  };

  const stageDialogTitle: Record<Exclude<BuilderStage, "build">, string> = {
    review: "Architecture Review",
    simulate: "Simulation Report",
    mermaid: "Mermaid Compiler",
    export: "Export Center",
  };

  const stageDialogDescription: Record<Exclude<BuilderStage, "build">, string> = {
    review: "Deterministic checks for completeness, security, reliability, scalability, observability, and operations.",
    simulate: "Sandbox trace, impact summary, bottleneck estimate, and overall execution report.",
    mermaid: "Generate, edit, compile, validate, and copy the workflow flowchart source.",
    export: "Generate practical handoff artifacts from the current workflow graph.",
  };

  return (
    <div className="builder-shell flex h-screen min-h-0 flex-col overflow-hidden text-[#F5F7FB]">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 overflow-x-auto border-b border-white/10 bg-[#0A0D14]/90 px-4 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-300" asChild>
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2F7BFF]/30 bg-[#2F7BFF]/10">
            <Workflow className="h-4 w-4 text-[#6EA4FF]" />
          </div>
          <div className="min-w-0">
            <input
              className="h-6 w-[260px] max-w-[42vw] truncate bg-transparent text-sm font-semibold outline-none"
              value={workflowName}
              onChange={(event) => setWorkflowName(event.target.value)}
            />
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{lastSavedAt}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <HelpGuidePanel compact onOpen={() => setNodeGuide(null)} />
          <ThemeToggle compact />
          <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10 bg-white/[0.03]" onClick={runReview} disabled={isProcessing}>
            {isProcessing && activeStage === "review" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />} Review
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10 bg-white/[0.03]" onClick={runSimulation} disabled={isProcessing}>
            {isProcessing && activeStage === "simulate" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />} Simulate
          </Button>
          <Button variant="outline" size="sm" className="hidden h-8 rounded-lg border-white/10 bg-white/[0.03] md:inline-flex" onClick={generateBuilderMermaid} disabled={isProcessing}>
            {isProcessing && activeStage === "mermaid" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <GitBranch className="mr-2 h-3.5 w-3.5" />} Mermaid
          </Button>
          <Button variant="outline" size="sm" className="hidden h-8 rounded-lg border-white/10 bg-white/[0.03] md:inline-flex" onClick={() => generateBuilderExport("developer_handoff")} disabled={isProcessing}>
            {isProcessing && activeStage === "export" ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />} Export
          </Button>
          <Button size="sm" className="h-8 rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={saveWorkflow} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />} Save
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
      <div
        className="grid h-full min-h-0 min-w-[1120px] transition-[grid-template-columns]"
        style={{ gridTemplateColumns: `${isLeftCollapsed ? "52px" : "280px"} minmax(520px,1fr) ${isRightCollapsed ? "52px" : "320px"}` }}
      >
        <aside className="flex min-h-0 flex-col border-r border-white/10 bg-[#0A0D14]/78">
          <div className="flex items-center justify-between border-b border-white/10 p-3">
            {!isLeftCollapsed ? <p className="text-xs font-semibold text-white">Node Library</p> : null}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400 hover:text-white" onClick={() => setIsLeftCollapsed((value) => !value)}>
              {isLeftCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          {isLeftCollapsed ? (
            <div className="flex flex-1 flex-col items-center gap-3 py-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-[#6EA4FF]" onClick={() => setIsLeftCollapsed(false)}>
                <Library className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-slate-400"
                onClick={() => {
                  setIsLeftCollapsed(false);
                  setIsCustomNodeOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b border-white/10 p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <Input className="h-9 rounded-lg border-white/10 bg-black/20 pl-8 text-xs" placeholder="Search backend nodes" value={query} onChange={(event) => setQuery(event.target.value)} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["all", ...NODE_PACK_ORDER].map((pack) => (
                    <button
                      key={pack}
                      className={cn("rounded-md border px-2 py-1 text-[10px]", activePack === pack ? "border-[#2F7BFF]/40 bg-[#2F7BFF]/15 text-[#9EC0FF]" : "border-white/10 bg-white/[0.03] text-slate-400")}
                      onClick={() => setActivePack(pack)}
                    >
                      {pack === "all" ? "All" : getNodePackLabel(pack)}
                    </button>
                  ))}
                </div>
              </div>
              <ScrollArea className="min-h-0 flex-1 overflow-hidden">
                <div className="space-y-2 p-3">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-[11px] leading-5 text-slate-400">
                    Drag or click nodes to model an <TermTooltip term="API" />, <TermTooltip term="queue" />, <TermTooltip term="cache" />, or worker-based backend path.
                  </div>
                  <div className="rounded-lg border border-[#2F7BFF]/25 bg-[#2F7BFF]/10">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 p-3 text-left"
                      onClick={() => setIsCustomNodeOpen((value) => !value)}
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">Custom Node</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Define a backend component for this workflow.</p>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 shrink-0 text-[#9EC0FF] transition-transform", isCustomNodeOpen && "rotate-90")} />
                    </button>
                    {isCustomNodeOpen ? (
                      <div className="space-y-2 border-t border-[#2F7BFF]/20 p-3 pt-3">
                        <Input className="h-8 rounded-md border-white/10 bg-black/20 text-xs" placeholder="Node name" value={customNodeName} onChange={(event) => setCustomNodeName(event.target.value)} />
                        <Input className="h-8 rounded-md border-white/10 bg-black/20 text-xs" placeholder="Role, e.g. fraud_scoring_service" value={customNodeRole} onChange={(event) => setCustomNodeRole(event.target.value)} />
                        <Textarea className="min-h-14 rounded-md border-white/10 bg-black/20 text-xs" placeholder="Description / behavior" value={customNodeDescription} onChange={(event) => setCustomNodeDescription(event.target.value)} />
                        <Textarea className="min-h-14 rounded-md border-white/10 bg-black/20 text-xs" placeholder="Dependencies, one per line" value={customNodeDependencies} onChange={(event) => setCustomNodeDependencies(event.target.value)} />
                        <Textarea className="min-h-14 rounded-md border-white/10 bg-black/20 text-xs" placeholder="Outputs, contracts, or emitted events" value={customNodeOutputs} onChange={(event) => setCustomNodeOutputs(event.target.value)} />
                        <Textarea className="min-h-14 rounded-md border-white/10 bg-black/20 text-xs" placeholder="Failure modes, one per line" value={customNodeFailureModes} onChange={(event) => setCustomNodeFailureModes(event.target.value)} />
                        <Button className="h-8 w-full rounded-md bg-[#2F7BFF] text-xs text-white hover:bg-[#5B96FF]" onClick={addCustomNode}>
                          <Plus className="mr-2 h-3.5 w-3.5" /> Add Custom Node
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {filteredDefinitions.map((definition) => (
                    <button
                      key={definition.type}
                      type="button"
                      draggable
                      onDragStart={(event) => startNodeDrag(event, definition.type)}
                      onDragEnd={() => setIsCanvasDragActive(false)}
                      onClick={() => addNode(definition.type)}
                      className="builder-node-card group w-full cursor-grab rounded-xl border p-3 text-left transition active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("builder-node-card__icon mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", definition.colorClass)}>
                          <BuilderNodeLibraryIcon iconName={definition.icon} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-white">{definition.title}</p>
                                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-500">
                                  {getNodePackLabel(definition.pack)}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{definition.description}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <Plus className="h-3.5 w-3.5 text-[#6EA4FF]" />
                              <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-500">
                                Drag
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-slate-600">{definition.category}</p>
                            <p className="text-[10px] font-medium text-slate-500 transition group-hover:text-[#8DB5FF]">Click to add</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </aside>

        <main
          className="buildrax-canvas-shell relative min-h-0 bg-[#080C14]"
          onDragOver={onCanvasDragOver}
          onDrop={onCanvasDrop}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as globalThis.Node | null)) return;
            setIsCanvasDragActive(false);
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            onInit={setFlowInstance}
            colorMode={theme}
            onDragOver={onCanvasDragOver}
            onDrop={onCanvasDrop}
            onNodeClick={(_, node) => {
              setSelectedNode(node);
            }}
            onPaneClick={() => {
              setSelectedNode(null);
              setNodeGuide(null);
            }}
            className="buildrax-builder-flow bg-[#080C14]"
          >
            <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(120,150,255,0.16)" />
            <MiniMap pannable zoomable className="!bg-[#101726] !border !border-white/10" />
            <Controls className="!border-white/10 !bg-[#101726] !text-white" />
          </ReactFlow>
          {isCanvasDragActive ? (
            <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-xl border border-dashed border-[#2F7BFF]/70 bg-[#2F7BFF]/10 text-sm font-semibold text-[#B8D2FF] shadow-[0_0_0_1px_rgba(47,123,255,0.25)] backdrop-blur-[1px]">
              Drop node on the canvas
            </div>
          ) : null}
          <div className={cn("absolute bottom-4 left-4 right-4 rounded-lg border border-white/10 bg-[#0A0D14]/92 backdrop-blur-xl", isTerminalCollapsed ? "p-2" : "p-3")}>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <TerminalSquare className="h-3.5 w-3.5 text-[#6EA4FF]" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Terminal / Step Compiler</p>
                </div>
                {!isTerminalCollapsed ? <p className="mt-1 text-xs text-slate-300">{validation.length === 0 ? "Workflow has a complete baseline shape." : validation.join(" ")}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {validation.length === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}
                <span className="text-xs text-slate-400">{nodes.length} nodes / {edges.length} edges</span>
                <Button variant="ghost" size="icon" className="pointer-events-auto h-7 w-7 rounded-md text-slate-400 hover:text-white" onClick={() => setIsTerminalCollapsed((value) => !value)}>
                  {isTerminalCollapsed ? <ChevronLeft className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4 rotate-90" />}
                </Button>
              </div>
            </div>
            {!isTerminalCollapsed ? (
              <div className="mt-2 grid max-h-40 gap-2 overflow-y-auto md:grid-cols-2">
                {consoleEntries.length === 0 ? (
                  <p className="text-[11px] text-slate-600">No compiler output.</p>
                ) : (
                  consoleEntries.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-[10px] uppercase tracking-[0.16em]", consoleTone[entry.level])}>{entry.level}</span>
                        <span className="text-[10px] text-slate-600">{entry.timestamp}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{entry.message}</p>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </main>

        <aside className="flex min-h-0 flex-col border-l border-white/10 bg-[#0A0D14]/78">
          <div className="flex items-start justify-between gap-2 border-b border-white/10 p-3">
            {!isRightCollapsed ? (
              <div>
                <p className="text-xs font-semibold text-white">Inspector</p>
                <p className="mt-1 text-[11px] text-slate-500">Configure workflow metadata and selected node details.</p>
              </div>
            ) : null}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400 hover:text-white" onClick={() => setIsRightCollapsed((value) => !value)}>
              {isRightCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
            </Button>
          </div>
          {isRightCollapsed ? (
            <div className="flex flex-1 flex-col items-center gap-3 py-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-[#6EA4FF]" onClick={() => setIsRightCollapsed(false)}>
                <ClipboardCheck className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400" onClick={runReview}>
                <ShieldCheck className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400" onClick={runSimulation}>
                <Play className="h-4 w-4" />
              </Button>
            </div>
          ) : (
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <div className="space-y-4 p-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <Label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Description</Label>
                <Textarea className="mt-2 min-h-24 rounded-lg border-white/10 bg-black/20 text-xs" value={workflowDescription} onChange={(event) => setWorkflowDescription(event.target.value)} />
              </div>
              <NodePropertiesPanel
                selectedNode={selectedNode}
                updateNodeData={updateNodeData}
                onOpenGuide={
                  selectedNode
                    ? () =>
                        setNodeGuide(
                          explainNodeForBeginner({
                            id: selectedNode.id,
                            type: selectedNode.type || "custom",
                            position: selectedNode.position,
                            data: selectedNode.data || {},
                          })
                        )
                    : undefined
                }
              />
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">Builder Journey</p>
                    <p className="mt-1 text-[11px] text-slate-500">Open each stage as a focused compiler modal.</p>
                  </div>
                  <Badge className="rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[10px] text-[#9EC0FF]">{activeStage}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1">
                  {[
                    { id: "build" as BuilderStage, label: "Build", icon: Workflow, action: () => setActiveStage("build") },
                    { id: "review" as BuilderStage, label: "Review", icon: ShieldCheck, action: runReview },
                    { id: "simulate" as BuilderStage, label: "Sim", icon: Play, action: runSimulation },
                    { id: "mermaid" as BuilderStage, label: "Map", icon: GitBranch, action: generateBuilderMermaid },
                    { id: "export" as BuilderStage, label: "Export", icon: Download, action: () => generateBuilderExport("developer_handoff") },
                  ].map((step) => (
                    <button
                      key={step.id}
                      onClick={step.action}
                      disabled={isProcessing && activeStage !== step.id}
                      className={cn(
                        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border px-1 text-[10px] transition",
                        activeStage === step.id
                          ? "border-[#2F7BFF]/45 bg-[#2F7BFF]/15 text-[#B8D2FF]"
                          : "border-white/10 bg-black/15 text-slate-400 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {isProcessing && activeStage === step.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <step.icon className="h-3.5 w-3.5" />}
                      <span className="leading-none">{step.label}</span>
                      <span className={cn("h-1.5 w-1.5 rounded-full", stageStatus[step.id] === "complete" ? "bg-emerald-300" : stageStatus[step.id] === "active" ? "bg-amber-300" : "bg-slate-600")} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-9 rounded-lg border-white/10 bg-white/[0.03] text-xs" asChild>
                  <Link href="/dashboard"><LayoutDashboard className="mr-2 h-3.5 w-3.5" /> Dashboard</Link>
                </Button>
                <Button variant="outline" className="h-9 rounded-lg border-white/10 bg-white/[0.03] text-xs" asChild>
                  <Link href="/templates"><Library className="mr-2 h-3.5 w-3.5" /> Templates</Link>
                </Button>
              </div>
            </div>
          </ScrollArea>
          )}
        </aside>
      </div>
      </div>

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="grid max-h-[88vh] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-white/10 bg-[#0A0D14] text-[#F5F7FB] shadow-2xl">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">{stageDialogTitle[activeModal]}</h2>
                    <p className="mt-1 text-xs text-slate-500">{stageDialogDescription[activeModal]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">{isProcessing && activeStage === activeModal ? "running" : stageStatus[activeModal]}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-slate-400 hover:text-white" onClick={() => setActiveModal(null)}>x</Button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto p-5">
                {activeModal === "review" ? (
                  <div className="space-y-4">
                    <PlainLanguageExplanationPanel explanation={reviewExplanation} />
                    <div className="grid gap-3 md:grid-cols-4">
                      {[
                        ["Overall", reviewResult?.scores.overall ?? 0],
                        ["Security", reviewResult?.scores.security ?? 0],
                        ["Reliability", reviewResult?.scores.reliability ?? 0],
                        ["Observability", reviewResult?.scores.observability ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-semibold text-white">{reviewResult ? reviewResult.summary : "Run review to generate findings."}</p>
                      <div className="mt-3 space-y-2">
                        {(reviewResult?.issues || []).slice(0, 8).map((issue) => (
                          <div key={issue.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Badge className="rounded-md border-white/10 bg-white/[0.04] text-[10px] text-slate-300">{issue.severity}</Badge>
                              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-600">{issue.category}</span>
                            </div>
                            <p className="mt-2 text-xs font-semibold text-white">{issue.description}</p>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{issue.suggestedFix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeModal === "simulate" ? (
                  <div className="space-y-4">
                    <PlainLanguageExplanationPanel explanation={simulationExplanation} />
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                        <p className="mt-2 text-xl font-semibold text-white">{simulationResult?.status || "not run"}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Trace Steps</p>
                        <p className="mt-2 text-xl font-semibold text-white">{simulationResult?.trace.length || 0}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Fallback Gaps</p>
                        <p className="mt-2 text-xl font-semibold text-white">{simulationResult?.missingFallback.length || 0}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Impacts</p>
                        <p className="mt-2 text-xl font-semibold text-white">{simulationResult?.affectedDownstreamNodes.length || 0}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-semibold text-white">Overall Report</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{simulationResult?.summary || "Run simulation to generate the overall report."}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">{simulationResult?.bottleneckEstimate || "No bottleneck estimate yet."}</p>
                    </div>
                    <ExpectedVsExactReportView report={expectedVsExactReport} />
                    <div className="space-y-2">
                      {(simulationResult?.trace || []).map((step) => (
                        <div key={`${step.nodeId}-${step.label}`} className="rounded-md border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-white">{step.label}</p>
                            <Badge className="rounded-md border-white/10 bg-white/[0.04] text-[10px] text-slate-300">{step.status} / {step.estimatedLatencyMs}ms</Badge>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{step.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeModal === "mermaid" ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">Compiler Source</p>
                        <Button size="sm" className="h-8 rounded-md bg-[#2F7BFF] text-xs text-white hover:bg-[#5B96FF]" onClick={compileMermaidDraft}>
                          <ClipboardCheck className="mr-2 h-3.5 w-3.5" /> Compile
                        </Button>
                      </div>
                      <Textarea className="mt-3 min-h-[360px] rounded-md border-white/10 bg-black/30 font-mono text-xs text-slate-200" value={mermaidDraft} onChange={(event) => setMermaidDraft(event.target.value)} />
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-sm font-semibold text-white">Compiler Output</p>
                      <p className={cn("mt-2 text-xs", mermaidCompilerMessage.includes("successfully") ? "text-emerald-300" : "text-amber-300")}>{mermaidCompilerMessage}</p>
                      <pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/30 p-3 text-[11px] leading-relaxed text-slate-300">{mermaidCode || "Generate Mermaid to preview compiled source."}</pre>
                    </div>
                  </div>
                ) : null}

                {activeModal === "export" ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { label: "Developer Handoff", type: "developer_handoff" as ExportType, detail: "Markdown handoff with summary, nodes, state, review, and open questions." },
                        { label: "Workflow JSON", type: "workflow_json" as ExportType, detail: "Portable JSON graph with review score metadata." },
                        { label: "Simulation Report", type: "simulation_report" as ExportType, detail: "Markdown trace, status, bottleneck, and fallback report." },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => generateBuilderExport(item.type)}
                          disabled={isProcessing}
                          className={cn(
                            "rounded-lg border p-3 text-left transition hover:border-[#2F7BFF]/45 hover:bg-[#2F7BFF]/10",
                            selectedExportType === item.type ? "border-[#2F7BFF]/45 bg-[#2F7BFF]/12" : "border-white/10 bg-white/[0.03]"
                          )}
                        >
                          <FileText className="h-4 w-4 text-[#6EA4FF]" />
                          <p className="mt-2 text-xs font-semibold text-white">{item.label}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.detail}</p>
                          <span className="mt-3 inline-flex rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-slate-300">
                            {isProcessing && selectedExportType === item.type ? "Generating..." : selectedExportType === item.type && exportContent ? "Generated" : "Generate"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <ExpectedVsExactReportView report={expectedVsExactReport} />
                    <div className="rounded-lg border border-white/10 bg-black/30">
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {selectedExportType === "developer_handoff" ? "Developer Handoff" : selectedExportType === "workflow_json" ? "Workflow JSON" : "Simulation Report"}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-600">{selectedExportType}</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 rounded-md border-white/10 bg-white/[0.03] text-xs" onClick={copyExportContent} disabled={!exportContent}>
                          Copy
                        </Button>
                      </div>
                      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap p-4 text-[11px] leading-relaxed text-slate-300">{exportContent || "Choose an export type above to generate and preview the artifact."}</pre>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-white/10 bg-[#050812] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="h-3.5 w-3.5 text-[#6EA4FF]" />
                    <p className="text-xs font-semibold text-white">Compiler Progress</p>
                  </div>
                  <button className="text-[10px] text-slate-500 transition hover:text-white" onClick={() => setConsoleEntries([])}>Clear</button>
                </div>
                <div className="mt-2 grid max-h-28 gap-2 overflow-y-auto md:grid-cols-2">
                  {consoleEntries.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="rounded-md border border-white/10 bg-white/[0.025] px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-[10px] uppercase tracking-[0.16em]", consoleTone[entry.level])}>{entry.level}</span>
                        <span className="text-[10px] text-slate-600">{entry.timestamp}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{entry.message}</p>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </div>
      ) : null}
      <NodeEducationPopover explanation={nodeGuide} onClose={() => setNodeGuide(null)} />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0A0D14] text-slate-400">Loading builder...</div>}>
      <BuilderCanvas />
    </Suspense>
  );
}
