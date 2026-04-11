"use client";

import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  BrainCircuit,
  CreditCard,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Library,
  Loader2,
  Play,
  Rocket,
  Search,
  Save,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NodePropertiesPanel } from "@/components/NodePropertiesPanel";
import { ExecutionPanel } from "@/components/ExecutionPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FancyLoader } from "@/components/ui/FancyLoader";
import { getDefaultNodeData, NODE_DEFINITIONS, NODE_PACK_ORDER } from "@/lib/graph/catalog";
import { DEFAULT_VIEWPORT } from "@/lib/graph/persistence";
import { CreditBalance, NodeExecutionResult, ScenarioDefinition, WorkflowGraph } from "@/lib/graph/types";
import { nodeTypes } from "@/components/nodes";
import { cn } from "@/lib/utils";

const LOCAL_DRAFT_KEY = "buildrax:builder-draft:v2";
const PENDING_ACTION_KEY = "buildrax:pending-builder-action";

type FlowNode = Node<Record<string, unknown>, string>;
type FlowEdge = Edge;

interface BlueprintRecord {
  slug: string;
  name: string;
  description: string;
  sector: string;
  useCase: string;
  tags: string[];
  graph: WorkflowGraph;
}

interface BenchmarkScore {
  variantId: string;
  model?: string;
  totalScore?: number;
  assertionPassRate: number;
  latencyMs: number;
  tokenUsage: number;
  cost: number;
}

interface RunPanelData {
  mode: string;
  summary: {
    status: string;
    latencyMs: number;
    tokenUsage: number;
    cost: number;
    warnings: string[];
  };
  analysis?: Record<string, unknown>;
  nodeResults?: NodeExecutionResult[];
  scores?: BenchmarkScore[];
  winnerVariantId?: string;
  confidence?: number;
}

interface LocalDraft {
  workflowId?: string;
  workflowName?: string;
  workflowDescription?: string;
  sourceBlueprintSlug?: string;
  graph?: WorkflowGraph;
  scenario?: ScenarioDefinition;
  benchmarkModels?: string;
  promptInput?: string;
}

interface FlowViewportController {
  getViewport: () => { x: number; y: number; zoom: number };
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
}

const blankNodes: FlowNode[] = [
  {
    id: "gateway",
    type: "apiGatewayNode",
    position: { x: 80, y: 180 },
    data: { ...getDefaultNodeData("apiGatewayNode"), route: "/api/workflow" },
  },
  {
    id: "service",
    type: "serviceNode",
    position: { x: 340, y: 180 },
    data: { ...getDefaultNodeData("serviceNode"), serviceName: "orchestrator-service" },
  },
  {
    id: "output",
    type: "outputNode",
    position: { x: 620, y: 180 },
    data: { ...getDefaultNodeData("outputNode"), label: "Output" },
  },
];

const blankEdges: FlowEdge[] = [
  { id: "gateway-service", source: "gateway", target: "service", animated: true },
  { id: "service-output", source: "service", target: "output", animated: true },
];

const workspaceNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: Layers },
  { href: "/builder", label: "AI Architect", icon: BrainCircuit },
  { href: "/templates", label: "Templates", icon: Library },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/learn", label: "Learn", icon: GraduationCap },
] as const;

const packAccentClasses: Record<string, string> = {
  ai: "bg-sky-500/14 text-sky-300 border-sky-400/20",
  backend: "bg-violet-500/14 text-violet-300 border-violet-400/20",
  data: "bg-emerald-500/14 text-emerald-300 border-emerald-400/20",
  reliability: "bg-amber-500/14 text-amber-200 border-amber-400/20",
  security: "bg-rose-500/14 text-rose-200 border-rose-400/20",
  observability: "bg-cyan-500/14 text-cyan-200 border-cyan-400/20",
};

const defaultScenario: ScenarioDefinition = {
  name: "Baseline",
  trafficProfile: "steady",
  dependencyMode: "stub",
  failureMode: "none",
  timeoutMs: 1200,
  queueDepth: 25,
  assertionRules: [],
};

function makeGraph(args: {
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  tags?: string[];
  assumptions?: string[];
  riskWarnings?: string[];
  suggestedScenarios?: string[];
}): WorkflowGraph {
  return {
    version: "1.0",
    nodes: args.nodes as WorkflowGraph["nodes"],
    edges: args.edges.map((edge) => ({
      ...edge,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
    })) as WorkflowGraph["edges"],
    metadata: {
      name: args.name,
      description: args.description,
      mode: "design",
      tags: args.tags || [],
      assumptions: args.assumptions || [],
      riskWarnings: args.riskWarnings || [],
      suggestedScenarios: args.suggestedScenarios || [],
    },
  };
}

function formatModeLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function BuilderCanvas() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const queryWorkflowId = searchParams?.get("id") || "";
  const resumeAfterLogin = searchParams?.get("resume") === "1";

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(blankNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(blankEdges);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [workflowId, setWorkflowId] = useState<string>(queryWorkflowId);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [sourceBlueprintSlug, setSourceBlueprintSlug] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Local draft");
  const [promptInput, setPromptInput] = useState("");
  const [runData, setRunData] = useState<RunPanelData | null>(null);
  const [isRunPanelOpen, setIsRunPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompilingPrompt, setIsCompilingPrompt] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [blueprints, setBlueprints] = useState<BlueprintRecord[]>([]);
  const [blueprintQuery, setBlueprintQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [nodeQuery, setNodeQuery] = useState("");
  const [libraryTab, setLibraryTab] = useState("nodes");
  const [inspectorTab, setInspectorTab] = useState("workflow");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [scenario, setScenario] = useState(defaultScenario);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [benchmarkModels, setBenchmarkModels] = useState("gpt-4o,gpt-4.1-mini,claude-3-5-sonnet");
  const reactFlowInstanceRef = useRef<FlowViewportController | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deferredNodeQuery = useDeferredValue(nodeQuery);

  const packedNodes = useMemo(
    () =>
      NODE_PACK_ORDER.map((pack) => ({
        pack,
        items: NODE_DEFINITIONS.filter((definition) => !definition.experimental && definition.pack === pack),
      })),
    []
  );

  const filteredNodeGroups = useMemo(() => {
    const query = deferredNodeQuery.trim().toLowerCase();

    return packedNodes
      .map((group) => ({
        ...group,
        items: group.items.filter((definition) => {
          if (!query) return true;

          return (
            definition.title.toLowerCase().includes(query) ||
            definition.description.toLowerCase().includes(query) ||
            definition.category.toLowerCase().includes(query) ||
            definition.pack.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [deferredNodeQuery, packedNodes]);

  const sectors = useMemo(
    () => ["all", ...Array.from(new Set(blueprints.map((blueprint) => blueprint.sector)))],
    [blueprints]
  );

  const filteredBlueprints = useMemo(() => {
    return blueprints.filter((blueprint) => {
      const matchesSector = selectedSector === "all" || blueprint.sector === selectedSector;
      const query = blueprintQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        blueprint.name.toLowerCase().includes(query) ||
        blueprint.description.toLowerCase().includes(query) ||
        blueprint.useCase.toLowerCase().includes(query) ||
        (blueprint.tags || []).some((tag: string) => tag.toLowerCase().includes(query));

      return matchesSector && matchesQuery;
    });
  }, [blueprints, blueprintQuery, selectedSector]);

  const simulationOutputs = useMemo(() => {
    const results = runData?.nodeResults || [];
    return Object.fromEntries(
      results.map((result: NodeExecutionResult) => [result.nodeId, JSON.stringify(result.outputs)])
    );
  }, [runData]);

  const currentGraph = useMemo(
    () =>
      makeGraph({
        name: workflowName,
        description: workflowDescription,
        nodes,
        edges,
      }),
    [workflowName, workflowDescription, nodes, edges]
  );

  useEffect(() => {
    if (selectedNode) {
      setInspectorTab("node");
      return;
    }

    setInspectorTab((current) => (current === "node" ? "workflow" : current));
  }, [selectedNode]);

  const saveLocalDraft = useCallback(
    (nextWorkflowId = workflowId) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(
        LOCAL_DRAFT_KEY,
        JSON.stringify({
          workflowId: nextWorkflowId,
          workflowName,
          workflowDescription,
          sourceBlueprintSlug,
          graph: currentGraph,
          scenario,
          benchmarkModels,
          promptInput,
          viewport: reactFlowInstanceRef.current?.getViewport?.() || DEFAULT_VIEWPORT,
          updatedAt: new Date().toISOString(),
        })
      );
    },
    [
      benchmarkModels,
      currentGraph,
      promptInput,
      scenario,
      sourceBlueprintSlug,
      workflowDescription,
      workflowId,
      workflowName,
    ]
  );

  const fetchCreditBalance = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/credits/balance");
      if (res.ok) {
        setCreditBalance(await res.json());
      }
    } catch (error) {
      console.error("Failed to load credit balance", error);
    }
  }, [session?.user]);

  const loadBlueprintCatalog = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (blueprintQuery.trim()) query.set("q", blueprintQuery.trim());
      if (selectedSector !== "all") query.set("sector", selectedSector);

      const res = await fetch(`/api/templates/catalog?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBlueprints(data.blueprints || []);
      }
    } catch (error) {
      console.error("Failed to load blueprints", error);
    }
  }, [blueprintQuery, selectedSector]);

  const applyGraph = useCallback((graph: WorkflowGraph, options?: { sourceBlueprintSlug?: string }) => {
    setNodes(graph.nodes as FlowNode[]);
    setEdges(graph.edges as FlowEdge[]);
    setWorkflowName(graph.metadata.name || "Untitled Workflow");
    setWorkflowDescription(graph.metadata.description || "");
    setSourceBlueprintSlug(options?.sourceBlueprintSlug || "");
    setSelectedNode(null);
    setRunData(null);
    setAutosaveStatus("Local draft updated");
  }, [setEdges, setNodes]);

  const loadWorkflow = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/workflows/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load workflow");
        }

        const workflow = await res.json();
        const graph = workflow.graph || makeGraph({
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
        });

        applyGraph(graph, { sourceBlueprintSlug: workflow.sourceBlueprintSlug });
        setWorkflowId(workflow._id);
        setAutosaveStatus("Cloud workflow loaded");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load workflow");
      } finally {
        setIsHydrated(true);
      }
    },
    [applyGraph]
  );

  useEffect(() => {
    loadBlueprintCatalog();
  }, [loadBlueprintCatalog]);

  useEffect(() => {
    fetchCreditBalance();
  }, [fetchCreditBalance]);

  useEffect(() => {
    if (queryWorkflowId) {
      loadWorkflow(queryWorkflowId);
      return;
    }

    if (typeof window !== "undefined") {
      const draft = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft) as LocalDraft;
          if (parsed.graph) {
            applyGraph(parsed.graph, { sourceBlueprintSlug: parsed.sourceBlueprintSlug });
          }
          setWorkflowId(parsed.workflowId || "");
          setWorkflowName(parsed.workflowName || "Untitled Workflow");
          setWorkflowDescription(parsed.workflowDescription || "");
          setSourceBlueprintSlug(parsed.sourceBlueprintSlug || "");
          setScenario(parsed.scenario || defaultScenario);
          setBenchmarkModels(parsed.benchmarkModels || benchmarkModels);
          setPromptInput(parsed.promptInput || "");
          setAutosaveStatus("Recovered local draft");
        } catch (error) {
          console.error("Failed to restore local draft", error);
        }
      }
    }

    setIsHydrated(true);
  }, [applyGraph, benchmarkModels, loadWorkflow, queryWorkflowId]);

  const ensureCloudWorkflow = useCallback(async () => {
    if (!session?.user) {
      setShowLoginPrompt(true);
      return null;
    }

    if (workflowId) {
      return workflowId;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          graph: currentGraph,
          viewport: reactFlowInstanceRef.current?.getViewport?.() || DEFAULT_VIEWPORT,
          sourceBlueprintSlug,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create workflow");
      }

      const workflow = await res.json();
      setWorkflowId(workflow._id);
      saveLocalDraft(workflow._id);
      setAutosaveStatus("Cloud workflow created");
      await fetchCreditBalance();
      return workflow._id as string;
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save workflow");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [
    currentGraph,
    fetchCreditBalance,
    saveLocalDraft,
    session?.user,
    sourceBlueprintSlug,
    workflowDescription,
    workflowId,
    workflowName,
  ]);

  const persistCloudWorkflow = useCallback(async () => {
    if (!session?.user || !workflowId) return;

    try {
      setAutosaveStatus("Saving to cloud...");
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          graph: currentGraph,
          viewport: reactFlowInstanceRef.current?.getViewport?.() || DEFAULT_VIEWPORT,
          sourceBlueprintSlug,
          lifecycle: "draft",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Cloud autosave failed");
      }

      setAutosaveStatus("Cloud autosaved");
    } catch (error) {
      console.error(error);
      setAutosaveStatus("Cloud autosave failed");
    }
  }, [currentGraph, session?.user, sourceBlueprintSlug, workflowDescription, workflowId, workflowName]);

  useEffect(() => {
    if (!isHydrated) return;

    saveLocalDraft();
    setAutosaveStatus(session?.user && workflowId ? "Queued cloud autosave" : "Local draft autosaved");

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      if (session?.user && workflowId) {
        persistCloudWorkflow();
      }
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [currentGraph, isHydrated, persistCloudWorkflow, saveLocalDraft, session?.user, workflowId]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            id: `${connection.source}-${connection.sourceHandle || "default"}-${connection.target}-${connection.targetHandle || "default"}-${Date.now()}`,
            animated: true,
          },
          currentEdges
        )
      ),
    [setEdges]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data:
                  "__replace__" in newData
                    ? (newData.__replace__ as Record<string, unknown>)
                    : { ...node.data, ...newData },
              }
            : node
        )
      );
      setSelectedNode((currentSelected) =>
        currentSelected?.id === nodeId
          ? {
              ...currentSelected,
              data:
                "__replace__" in newData
                  ? (newData.__replace__ as Record<string, unknown>)
                  : { ...currentSelected.data, ...newData },
            }
          : currentSelected
      );
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode?.id, setEdges, setNodes]
  );

  const handleEditNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (node) {
        setSelectedNode(node);
      }
    },
    [nodes]
  );

  const handleSave = useCallback(async () => {
    if (!session?.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem(PENDING_ACTION_KEY, "save");
      }
      setShowLoginPrompt(true);
      return;
    }

    const id = await ensureCloudWorkflow();
    if (!id) return;
    await persistCloudWorkflow();
    toast.success("Workflow saved");
  }, [ensureCloudWorkflow, persistCloudWorkflow, session?.user]);

  const runAction = useCallback(
    async (path: string, action: "simulate" | "execute", idOverride?: string) => {
      const targetWorkflowId = idOverride || (await ensureCloudWorkflow());
      if (!targetWorkflowId) return;

      const res = await fetch(`/api/workflows/${targetWorkflowId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          graph: currentGraph,
          scenario,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} workflow`);
      }

      setRunData(data);
      setIsRunPanelOpen(true);
      await fetchCreditBalance();
      toast.success(action === "simulate" ? "Simulation complete" : "Execution complete");
    },
    [
      currentGraph,
      ensureCloudWorkflow,
      fetchCreditBalance,
      scenario,
      workflowDescription,
      workflowName,
    ]
  );

  const handleSimulation = useCallback(async (idOverride?: string) => {
    try {
      setIsSimulating(true);
      await runAction("simulate", "simulate", idOverride);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    } finally {
      setIsSimulating(false);
    }
  }, [runAction]);

  const handleExecution = useCallback(async (idOverride?: string) => {
    try {
      setIsExecuting(true);
      await runAction("execute", "execute", idOverride);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Execution failed");
    } finally {
      setIsExecuting(false);
    }
  }, [runAction]);

  const handleAnalyze = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      const res = await fetch("/api/architect/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: currentGraph }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }
      setRunData({
        mode: "analysis",
        analysis: data,
        summary: {
          status: "completed",
          latencyMs: 0,
          tokenUsage: 0,
          cost: 0,
          warnings: data.warnings || [],
        },
        nodeResults: [],
      });
      setIsRunPanelOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentGraph]);

  const handleBenchmark = useCallback(async (idOverride?: string) => {
    const models = benchmarkModels
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (models.length < 2) {
      toast.error("Add at least two models to benchmark");
      return;
    }

    if (!currentGraph.nodes.some((node) => node.type === "llmNode")) {
      toast.error("Benchmarking requires at least one LLM node in the graph");
      return;
    }

    if (!session?.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem(PENDING_ACTION_KEY, "benchmark");
      }
      setShowLoginPrompt(true);
      return;
    }

    const targetWorkflowId = idOverride || (await ensureCloudWorkflow());
    if (!targetWorkflowId) return;

    try {
      setIsBenchmarking(true);
      const variants = models.map((model, index) => ({
        variantId: model,
        label: `Variant ${index + 1}`,
        graph: {
          ...currentGraph,
          metadata: {
            ...currentGraph.metadata,
            name: `${workflowName} (${model})`,
          },
          nodes: currentGraph.nodes.map((node) =>
            node.type === "llmNode"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    model,
                  },
                }
              : node
          ),
        },
      }));

      const res = await fetch(`/api/workflows/${targetWorkflowId}/benchmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseGraph: currentGraph,
          variants,
          scenario,
          scoringConfig: {
            qualityMode: "llm_judge",
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Benchmark failed");
      }

      setRunData({
        mode: "benchmark",
        ...data,
        summary: {
          status: "completed",
          latencyMs: Math.max(...((data.scores || []) as BenchmarkScore[]).map((score) => score.latencyMs), 0),
          tokenUsage: ((data.scores || []) as BenchmarkScore[]).reduce((sum, score) => sum + (score.tokenUsage || 0), 0),
          cost: Number((((data.scores || []) as BenchmarkScore[]).reduce((sum, score) => sum + (score.cost || 0), 0)).toFixed(4)),
          warnings: [],
        },
        analysis: {
          score: Math.round((data.confidence || 0) * 100),
          feedback: `Winner: ${data.winnerVariantId || "n/a"}`,
          flaws: [],
          suggestedScenarios: [],
        },
      });
      setIsRunPanelOpen(true);
      await fetchCreditBalance();
      toast.success("Benchmark completed");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Benchmark failed");
    } finally {
      setIsBenchmarking(false);
    }
  }, [
    benchmarkModels,
    currentGraph,
    ensureCloudWorkflow,
    fetchCreditBalance,
    scenario,
    session?.user,
    workflowName,
  ]);

  useEffect(() => {
    if (!resumeAfterLogin || status !== "authenticated") return;

    const pendingAction = typeof window !== "undefined" ? localStorage.getItem(PENDING_ACTION_KEY) : null;

    async function resumePendingAction() {
      if (!pendingAction) return;

      const id = await ensureCloudWorkflow();
      if (!id) return;

      localStorage.removeItem(PENDING_ACTION_KEY);
      setShowLoginPrompt(false);

      if (pendingAction === "save") {
        toast.success("Workflow saved to your workspace");
      } else if (pendingAction === "simulate") {
        await handleSimulation(id);
      } else if (pendingAction === "execute") {
        await handleExecution(id);
      } else if (pendingAction === "benchmark") {
        await handleBenchmark(id);
      }
    }

    resumePendingAction();
  }, [ensureCloudWorkflow, handleBenchmark, handleExecution, handleSimulation, resumeAfterLogin, status]);

  const handleDeleteWorkflow = useCallback(async () => {
    if (!workflowId || !session?.user) {
      toast.error("Only saved workflows can be deleted");
      return;
    }

    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      setWorkflowId("");
      setWorkflowName("Untitled Workflow");
      setWorkflowDescription("");
      setSourceBlueprintSlug("");
      setNodes(blankNodes);
      setEdges(blankEdges);
      setSelectedNode(null);
      setRunData(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(LOCAL_DRAFT_KEY);
      }
      toast.success("Workflow deleted");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }, [session?.user, workflowId, setEdges, setNodes]);

  const handleCompilePrompt = useCallback(async () => {
    if (!promptInput.trim()) {
      toast.error("Describe the system you want to build");
      return;
    }

    if (!session?.user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      setIsCompilingPrompt(true);
      const res = await fetch("/api/prompt/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Prompt compile failed");
      }

      applyGraph(data.graph);
      setLibraryTab("nodes");
      await fetchCreditBalance();
      toast.success("Prompt compiled into an editable system graph");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Prompt compile failed");
    } finally {
      setIsCompilingPrompt(false);
    }
  }, [applyGraph, fetchCreditBalance, promptInput, session?.user]);

  const handleBlueprintApply = useCallback((blueprint: BlueprintRecord) => {
    applyGraph(blueprint.graph, { sourceBlueprintSlug: blueprint.slug });
    setSourceBlueprintSlug(blueprint.slug);
    setLibraryTab("nodes");
    toast.success(`Loaded blueprint: ${blueprint.name}`);
  }, [applyGraph]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstanceRef.current) return;

      const position = reactFlowInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((currentNodes) => currentNodes.concat(newNode as FlowNode));
    },
    [setNodes]
  );

  const onDragStart = useCallback((event: React.DragEvent, type: string) => {
    event.dataTransfer.setData("application/reactflow", type);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const selectedNodeLabel = selectedNode
    ? String(selectedNode.data?.label || selectedNode.type || "Selected node")
    : null;

  if (!isHydrated) {
    return (
      <div className="h-screen w-screen bg-[#0A0A0B] flex items-center justify-center text-muted-foreground">
        <FancyLoader text="Initializing production workspace..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden builder-shell text-foreground">
      <aside className="builder-surface-muted flex w-[84px] shrink-0 flex-col items-center justify-between border-r border-white/5 px-3 py-4">
        <div className="space-y-5">
          <Link href="/dashboard" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200 builder-accent-ring">
            <BrainCircuit className="h-5 w-5" />
          </Link>

          <div className="space-y-2">
            {workspaceNavItems.map((item) => {
              const isActive = item.href === "/builder";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200",
                    isActive
                      ? "border-sky-400/30 bg-sky-500/14 text-sky-100 shadow-[0_12px_32px_rgba(14,165,233,0.18)]"
                      : "border-transparent bg-white/[0.03] text-muted-foreground hover:border-white/10 hover:bg-white/[0.06] hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 text-center">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-2 py-2 text-[10px] text-muted-foreground">
            {session?.user ? `${creditBalance?.availableCredits ?? "--"} credits` : "local"}
          </div>
          <Link href="/profile" className="flex justify-center">
            <Avatar className="h-11 w-11 border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-sky-500/10 text-sky-100">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "GU"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </aside>

      <aside className="builder-surface-muted flex w-[340px] shrink-0 flex-col border-r border-white/5">
        <div className="border-b border-white/5 px-5 py-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/70">Build Space</p>
              <h2 className="mt-1 text-lg font-semibold">Library</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-muted-foreground">
              {nodes.length} nodes
            </div>
          </div>

          <Tabs value={libraryTab} onValueChange={setLibraryTab}>
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-white/10 bg-black/20 p-1">
              <TabsTrigger value="nodes" className="rounded-xl py-2 text-xs">Nodes</TabsTrigger>
              <TabsTrigger value="blueprints" className="rounded-xl py-2 text-xs">Blueprints</TabsTrigger>
              <TabsTrigger value="prompt" className="rounded-xl py-2 text-xs">Prompt</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-5 py-5">
            {libraryTab === "nodes" ? (
              <>
                <div className="builder-surface rounded-3xl p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-100">
                    <Search className="h-4 w-4 text-sky-300" />
                    Find production nodes
                  </div>
                  <Input
                    value={nodeQuery}
                    onChange={(event) => setNodeQuery(event.target.value)}
                    placeholder="Search AI, backend, data, reliability..."
                    className="h-11 rounded-2xl border-white/10 bg-black/20"
                  />
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Drag a node into the canvas or select a blueprint to start from a complete architecture.
                  </p>
                </div>

                <div className="space-y-4">
                  {filteredNodeGroups.map((group) => (
                    <section key={group.pack} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2.5 w-2.5 rounded-full border", packAccentClasses[group.pack])} />
                          <h3 className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                            {formatModeLabel(group.pack)}
                          </h3>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{group.items.length}</span>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((definition) => (
                          <button
                            key={definition.type}
                            type="button"
                            draggable
                            onDragStart={(event) => onDragStart(event, definition.type)}
                            className="builder-surface group w-full rounded-2xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/20"
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold", packAccentClasses[group.pack])}>
                                {definition.category.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-semibold">{definition.title}</p>
                                  <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[10px]">
                                    {definition.category}
                                  </Badge>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                  {definition.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </>
            ) : null}

            {libraryTab === "blueprints" ? (
              <>
                <div className="builder-surface rounded-3xl p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-100">
                    <Sparkles className="h-4 w-4 text-sky-300" />
                    Browse blueprint starters
                  </div>
                  <div className="space-y-3">
                    <Input
                      value={blueprintQuery}
                      onChange={(event) => setBlueprintQuery(event.target.value)}
                      placeholder="Search enterprise blueprints..."
                      className="h-11 rounded-2xl border-white/10 bg-black/20"
                    />
                    <Select value={selectedSector} onValueChange={(value) => setSelectedSector(value || "all")}>
                      <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/20">
                        <SelectValue placeholder="Filter by sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector === "all" ? "All sectors" : sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredBlueprints.map((blueprint) => (
                    <button
                      key={blueprint.slug}
                      type="button"
                      className="builder-surface group w-full rounded-3xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/20"
                      onClick={() => handleBlueprintApply(blueprint)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug">{blueprint.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {blueprint.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-sky-400/20 bg-sky-500/10 text-sky-200">
                          {blueprint.sector}
                        </Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(blueprint.tags || []).slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {libraryTab === "prompt" ? (
              <div className="builder-surface rounded-[28px] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-100">
                  <Wand2 className="h-4 w-4 text-sky-300" />
                  Prompt-to-System Compiler
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Describe the product, backend topology, AI layers, and constraints. We will compile it into a real editable graph with assumptions and warnings.
                </p>
                <Textarea
                  value={promptInput}
                  onChange={(event) => setPromptInput(event.target.value)}
                  placeholder="Design a fintech fraud review platform with API gateway, authentication, case orchestration service, queue, MongoDB, risk classifier, LLM reviewer, assertions, logs, and fallback handling."
                  className="mt-4 min-h-[260px] rounded-3xl border-white/10 bg-black/20"
                />
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-xs text-muted-foreground">
                  <span>Consumes 1 credit and opens directly in the visual builder.</span>
                  <Button className="rounded-2xl px-5" onClick={handleCompilePrompt} disabled={isCompilingPrompt}>
                    {isCompilingPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    Compile
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="builder-surface-muted border-b border-white/5 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.03]" asChild>
                  <Link href="/templates">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <Input
                    value={workflowName}
                    onChange={(event) => setWorkflowName(event.target.value)}
                    className="h-10 border-none bg-transparent px-0 text-2xl font-semibold tracking-tight text-white focus-visible:ring-0"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase tracking-[0.24em]">{autosaveStatus}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/60 sm:inline-block" />
                    <span>{nodes.length} nodes</span>
                    <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/60 sm:inline-block" />
                    <span>{edges.length} edges</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {sourceBlueprintSlug ? (
                  <Badge className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sky-100">
                    Blueprint: {sourceBlueprintSlug}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] px-3 py-1 text-muted-foreground">
                  {session?.user ? `${creditBalance?.availableCredits ?? "--"} credits available` : "Anonymous local draft"}
                </Badge>
                <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] px-3 py-1 text-muted-foreground">
                  {formatModeLabel(scenario.trafficProfile)} traffic
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Button variant="outline" className="rounded-2xl border-white/10 bg-white/[0.03]" onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyze
              </Button>
              <Button variant="outline" className="rounded-2xl border-white/10 bg-white/[0.03]" onClick={() => handleBenchmark()} disabled={isBenchmarking}>
                {isBenchmarking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />}
                Benchmark
              </Button>
              <Button variant="outline" className="rounded-2xl border-white/10 bg-white/[0.03]" onClick={() => handleSimulation()} disabled={isSimulating}>
                {isSimulating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Simulate
              </Button>
              <Button variant="outline" className="rounded-2xl border-white/10 bg-white/[0.03]" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
              <Button className="rounded-2xl bg-sky-500 text-slate-950 hover:bg-sky-400" onClick={() => handleExecution()} disabled={isExecuting}>
                {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                Execute
              </Button>
              {workflowId ? (
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={handleDeleteWorkflow}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="builder-grid-overlay relative min-w-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/10 to-transparent" />
            <div className="pointer-events-none absolute left-10 top-12 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

            <ReactFlow
              nodes={nodes.map((node) => ({
                ...node,
                data: {
                  ...node.data,
                  onDelete: handleDeleteNode,
                  onEdit: handleEditNode,
                  simulatedOutput: simulationOutputs[node.id],
                  isSimulating: isSimulating || isExecuting,
                },
              }))}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={(instance) => {
                reactFlowInstanceRef.current = instance;
              }}
              onDrop={onDrop}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onSelectionChange={(selection) => {
                const nextNode = selection.nodes[0] || null;
                setSelectedNode(nextNode);
                if (nextNode) {
                  setInspectorTab("node");
                }
              }}
              fitView
              className="bg-transparent"
            >
              <Background variant={BackgroundVariant.Cross} gap={36} size={1.2} color="#94a3b8" className="opacity-[0.06]" />
              <Controls className="overflow-hidden rounded-2xl border border-white/10 bg-[#09101c]/90 shadow-[0_24px_50px_rgba(0,0,0,0.32)]" showInteractive={false} />
              <MiniMap nodeColor="#12304d" maskColor="rgba(3,7,18,0.82)" className="!bottom-5 !right-5 !bg-[#09101c]/92 rounded-2xl border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.35)]" />
              <Panel position="top-left" className="mt-5 ml-5">
                <div className="builder-surface rounded-3xl px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/70">Workspace</p>
                  <p className="mt-1 text-sm font-medium text-white">Design production systems visually</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Drag nodes, compile from prompt, or load a blueprint and simulate the full flow.
                  </p>
                </div>
              </Panel>
              <Panel position="bottom-center" className="mb-5">
                <div className="builder-surface rounded-full px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Workflow className="h-4 w-4 text-sky-300" />
                    Design / Analysis / Simulation / Live Execution
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </main>

          <aside className="builder-surface-muted flex w-[360px] shrink-0 flex-col border-l border-white/5">
            <div className="border-b border-white/5 px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-sky-200/70">Inspector</p>
              <h2 className="mt-1 text-lg font-semibold">{selectedNodeLabel || "Workflow controls"}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedNodeLabel
                  ? "Adjust node settings, runtime behavior, and output shaping."
                  : "Tune metadata, scenario settings, and workspace access from one place."}
              </p>
            </div>

            <Tabs value={inspectorTab} onValueChange={setInspectorTab} className="flex min-h-0 flex-1 flex-col">
              <div className="px-5 pt-4">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-white/10 bg-black/20 p-1">
                  <TabsTrigger value="workflow" className="rounded-xl py-2 text-xs">Workflow</TabsTrigger>
                  <TabsTrigger value="scenario" className="rounded-xl py-2 text-xs">Scenario</TabsTrigger>
                  <TabsTrigger value="node" className="rounded-xl py-2 text-xs">Node</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-5 pb-5">
                <TabsContent value="workflow" className="m-0 space-y-5 pt-5">
                  <div className="builder-surface rounded-3xl p-4">
                    <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">System description</Label>
                    <Textarea
                      value={workflowDescription}
                      onChange={(event) => setWorkflowDescription(event.target.value)}
                      placeholder="Describe what this system is responsible for, its users, and the production goal."
                      className="mt-3 min-h-[140px] rounded-3xl border-white/10 bg-black/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="builder-surface rounded-3xl p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Blueprint</p>
                      <p className="mt-2 text-sm font-medium text-white">{sourceBlueprintSlug || "Custom workflow"}</p>
                    </div>
                    <div className="builder-surface rounded-3xl p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Autosave</p>
                      <p className="mt-2 text-sm font-medium text-white">{autosaveStatus}</p>
                    </div>
                  </div>

                  <div className="builder-surface rounded-3xl p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-100">
                      <SlidersHorizontal className="h-4 w-4 text-sky-300" />
                      Workspace summary
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                        <p className="text-muted-foreground">Nodes</p>
                        <p className="mt-1 text-lg font-semibold text-white">{nodes.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                        <p className="text-muted-foreground">Edges</p>
                        <p className="mt-1 text-lg font-semibold text-white">{edges.length}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="scenario" className="m-0 space-y-5 pt-5">
                  <div className="builder-surface rounded-3xl p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-sky-100">
                      <Workflow className="h-4 w-4 text-sky-300" />
                      Runtime scenario
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Traffic</Label>
                        <Select
                          value={scenario.trafficProfile}
                          onValueChange={(value) =>
                            setScenario((current) => ({
                              ...current,
                              trafficProfile: value as ScenarioDefinition["trafficProfile"],
                            }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="steady">Steady</SelectItem>
                            <SelectItem value="burst">Burst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Dependency mode</Label>
                        <Select
                          value={scenario.dependencyMode}
                          onValueChange={(value) =>
                            setScenario((current) => ({
                              ...current,
                              dependencyMode: value as ScenarioDefinition["dependencyMode"],
                            }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stub">Stub</SelectItem>
                            <SelectItem value="safe_test">Safe Test</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Failure mode</Label>
                        <Select
                          value={scenario.failureMode}
                          onValueChange={(value) =>
                            setScenario((current) => ({
                              ...current,
                              failureMode: value as ScenarioDefinition["failureMode"],
                            }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="latency_spike">Latency Spike</SelectItem>
                            <SelectItem value="partial_outage">Partial Outage</SelectItem>
                            <SelectItem value="dependency_timeout">Dependency Timeout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Queue depth</Label>
                        <Input
                          type="number"
                          value={scenario.queueDepth}
                          onChange={(event) =>
                            setScenario((current) => ({ ...current, queueDepth: Number(event.target.value) || 0 }))
                          }
                          className="h-11 rounded-2xl border-white/10 bg-black/20"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={scenario.timeoutMs}
                          onChange={(event) =>
                            setScenario((current) => ({ ...current, timeoutMs: Number(event.target.value) || 0 }))
                          }
                          className="h-11 rounded-2xl border-white/10 bg-black/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Benchmark models</Label>
                        <Input
                          value={benchmarkModels}
                          onChange={(event) => setBenchmarkModels(event.target.value)}
                          className="h-11 rounded-2xl border-white/10 bg-black/20"
                          placeholder="gpt-4o,gpt-4.1-mini,claude-3-5-sonnet"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="node" className="m-0 pt-5">
                  <div className="builder-surface rounded-3xl p-4">
                    <NodePropertiesPanel selectedNode={selectedNode} updateNodeData={updateNodeData} />
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {!session?.user ? (
              <div className="border-t border-white/5 px-5 py-5">
                <div className="rounded-3xl border border-sky-400/20 bg-sky-500/8 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
                    <ShieldCheck className="h-4 w-4 text-sky-300" />
                    Unlock cloud runs and billing
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Anonymous mode keeps local autosave active. GitHub or Google sign-in unlocks cloud save, prompt compile persistence, simulations, benchmarks, and credits.
                  </p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <ExecutionPanel open={isRunPanelOpen} onOpenChange={setIsRunPanelOpen} runData={runData} />

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md bg-card/95 border-white/10">
          <DialogHeader>
            <DialogTitle>Sign in to save and run</DialogTitle>
            <DialogDescription>
              Local autosave is already active. Use GitHub or Google to persist the workflow, consume credits, simulate, execute, and benchmark.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              className="rounded-xl border-white/10"
              onClick={() => signIn("github", { callbackUrl: "/builder?resume=1" })}
            >
              GitHub
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-white/10"
              onClick={() => signIn("google", { callbackUrl: "/builder?resume=1" })}
            >
              Google
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#0A0A0B] flex items-center justify-center"><FancyLoader text="Opening builder..." /></div>}>
      <BuilderCanvas />
    </Suspense>
  );
}
