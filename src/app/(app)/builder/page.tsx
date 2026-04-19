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
  scenarioPrompt?: string;
  modelProviderId?: string;
  modelId?: string;
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
  name: "Baseline Test",
  trafficProfile: "steady",
  dependencyMode: "safe_test",
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
  const [scenarioPrompt, setScenarioPrompt] = useState("");
  const [modelProviderId, setModelProviderId] = useState("");
  const [modelId, setModelId] = useState("google/gemma-4-26b-a4b-it");
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [benchmarkModels, setBenchmarkModels] = useState("google/gemma-4-26b-a4b-it,google/gemma-4-31b-it,gpt-4o");
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
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
          scenarioPrompt,
          benchmarkModels,
          promptInput,
          modelProviderId,
          modelId,
          viewport: reactFlowInstanceRef.current?.getViewport?.() || DEFAULT_VIEWPORT,
          updatedAt: new Date().toISOString(),
        })
      );
    },
    [
      benchmarkModels,
      currentGraph,
      modelId,
      modelProviderId,
      promptInput,
      scenario,
      scenarioPrompt,
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
          setScenarioPrompt(parsed.scenarioPrompt || "");
          setBenchmarkModels(parsed.benchmarkModels || benchmarkModels);
          setPromptInput(parsed.promptInput || "");
          setModelProviderId(parsed.modelProviderId || "");
          setModelId(parsed.modelId || "google/gemma-4-26b-a4b-it");
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
          scenarioPrompt,
          modelProviderId: modelProviderId || undefined,
          modelId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} workflow`);
      }

      setRunData(data);
      setIsRunPanelOpen(true);
      await fetchCreditBalance();
      toast.success(action === "simulate" ? "Scenario evaluation complete" : "Live execution complete");
    },
    [
      currentGraph,
      ensureCloudWorkflow,
      fetchCreditBalance,
      modelId,
      modelProviderId,
      scenario,
      scenarioPrompt,
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
      toast.error(error instanceof Error ? error.message : "Scenario evaluation failed");
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
        body: JSON.stringify({
          graph: currentGraph,
          modelProviderId: modelProviderId || undefined,
          modelId,
        }),
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
  }, [currentGraph, modelId, modelProviderId]);

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
                    modelId: model,
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
          modelProviderId: modelProviderId || undefined,
          modelId,
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
    modelId,
    modelProviderId,
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
        body: JSON.stringify({
          prompt: promptInput,
          modelProviderId: modelProviderId || undefined,
          modelId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Prompt compile failed");
      }

      applyGraph(data.graph);
      setLibraryTab("nodes");
      await fetchCreditBalance();
      setInspectorTab("workflow");
      toast.success("Workflow generated on the canvas");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Prompt compile failed");
    } finally {
      setIsCompilingPrompt(false);
    }
  }, [applyGraph, fetchCreditBalance, modelId, modelProviderId, promptInput, session?.user]);

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
      {/* ── Slim icon nav ── */}
      <aside className="builder-surface-muted flex w-[56px] shrink-0 flex-col items-center justify-between border-r border-white/5 py-3">
        <div className="space-y-4 flex flex-col items-center">
          <Link href="/dashboard" title="Dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200 builder-accent-ring">
            <BrainCircuit className="h-4 w-4" />
          </Link>

          <div className="space-y-1.5 flex flex-col items-center">
            {workspaceNavItems.map((item) => {
              const isActive = item.href === "/builder";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200",
                    isActive
                      ? "border-sky-400/30 bg-sky-500/14 text-sky-100"
                      : "border-transparent bg-white/[0.03] text-muted-foreground hover:border-white/10 hover:bg-white/[0.06] hover:text-foreground"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 pb-1">
          <div className="text-[9px] text-muted-foreground text-center leading-tight">
            {session?.user ? `${creditBalance?.availableCredits ?? "--"}` : "local"}
          </div>
          <Link href="/profile">
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="bg-sky-500/10 text-sky-100 text-[10px]">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "G"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </aside>

      {/* ── Library panel (collapsible) ── */}
      <aside className={cn("builder-surface-muted flex shrink-0 flex-col border-r border-white/5 transition-all duration-300 relative", libraryCollapsed ? "w-0 overflow-hidden" : "w-[260px]")}>
        {/* Panel header */}
        <div className="border-b border-white/5 px-3 py-3 flex items-center justify-between gap-2">
          <Tabs value={libraryTab} onValueChange={setLibraryTab} className="flex-1 min-w-0">
            <TabsList className="grid h-7 w-full grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-0.5">
              <TabsTrigger value="nodes" className="rounded-lg py-1 text-[11px]">Nodes</TabsTrigger>
              <TabsTrigger value="blueprints" className="rounded-lg py-1 text-[11px]">Blueprints</TabsTrigger>
              <TabsTrigger value="prompt" className="rounded-lg py-1 text-[11px]">Prompt</TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="text-[10px] text-muted-foreground shrink-0">{nodes.length}n</span>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 py-3 space-y-3">
            {libraryTab === "nodes" ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={nodeQuery}
                    onChange={(event) => setNodeQuery(event.target.value)}
                    placeholder="Search nodes..."
                    className="h-8 rounded-xl border-white/10 bg-black/20 pl-8 text-xs"
                  />
                </div>

                <div className="space-y-3">
                  {filteredNodeGroups.map((group) => (
                    <section key={group.pack} className="space-y-1">
                      <div className="flex items-center gap-1.5 px-1">
                        <div className={cn("h-1.5 w-1.5 rounded-full", packAccentClasses[group.pack])} />
                        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {formatModeLabel(group.pack)}
                        </h3>
                      </div>
                      <div className="space-y-0.5">
                        {group.items.map((definition) => (
                          <button
                            key={definition.type}
                            type="button"
                            draggable
                            onDragStart={(event) => onDragStart(event, definition.type)}
                            className="group w-full rounded-xl px-2.5 py-2 text-left transition-all duration-150 hover:bg-white/[0.05] hover:border-sky-400/20 border border-transparent"
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[9px] font-bold", packAccentClasses[group.pack])}>
                                {definition.category.slice(0, 2).toUpperCase()}
                              </div>
                              <p className="truncate text-xs font-medium flex-1">{definition.title}</p>
                              <Badge variant="outline" className="border-white/8 bg-transparent text-[9px] px-1.5 py-0 h-4 hidden group-hover:flex">
                                {definition.category}
                              </Badge>
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
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={blueprintQuery}
                      onChange={(event) => setBlueprintQuery(event.target.value)}
                      placeholder="Search blueprints..."
                      className="h-8 rounded-xl border-white/10 bg-black/20 pl-8 text-xs"
                    />
                  </div>
                  <Select value={selectedSector} onValueChange={(value) => setSelectedSector(value || "all")}>
                    <SelectTrigger className="h-8 rounded-xl border-white/10 bg-black/20 text-xs">
                      <SelectValue placeholder="All sectors" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector} value={sector} className="text-xs">
                          {sector === "all" ? "All sectors" : sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  {filteredBlueprints.map((blueprint) => (
                    <button
                      key={blueprint.slug}
                      type="button"
                      className="group w-full rounded-xl px-2.5 py-2.5 text-left transition-all duration-150 hover:bg-white/[0.05] border border-transparent hover:border-sky-400/20"
                      onClick={() => handleBlueprintApply(blueprint)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium leading-snug truncate flex-1">{blueprint.name}</p>
                        <Badge variant="outline" className="border-sky-400/20 bg-sky-500/8 text-sky-200 text-[9px] shrink-0 px-1.5 py-0 h-4">
                          {blueprint.sector}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">
                        {blueprint.description}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {libraryTab === "prompt" ? (
              <div className="space-y-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Describe the automation. BuildRAX will generate the workflow directly on the canvas.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Provider ID</Label>
                    <Input
                      value={modelProviderId}
                      onChange={(event) => setModelProviderId(event.target.value)}
                      placeholder="Optional saved provider ID"
                      className="h-8 rounded-xl border-white/10 bg-black/20 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Generation Model</Label>
                    <Input
                      value={modelId}
                      onChange={(event) => setModelId(event.target.value)}
                      placeholder="google/gemma-4-26b-a4b-it"
                      className="h-8 rounded-xl border-white/10 bg-black/20 text-xs"
                    />
                  </div>
                </div>
                <Textarea
                  value={promptInput}
                  onChange={(event) => setPromptInput(event.target.value)}
                  placeholder="Design a fintech fraud review platform with API gateway, MongoDB, risk classifier, LLM reviewer..."
                  className="min-h-[200px] rounded-2xl border-white/10 bg-black/20 text-xs"
                />
                <Button className="w-full rounded-xl h-8 text-xs" onClick={handleCompilePrompt} disabled={isCompilingPrompt}>
                  {isCompilingPrompt ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <BrainCircuit className="mr-1.5 h-3 w-3" />}
                  Generate workflow (1 credit)
                </Button>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5 text-[10px] leading-relaxed text-muted-foreground">
                  Describe {"->"} Generate {"->"} Review {"->"} Configure {"->"} Run Test {"->"} AI Audit {"->"} Scenario Evaluation {"->"} Live Execute {"->"} Report
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {/* ── Compact single-row header ── */}
        <header className="builder-surface-muted border-b border-white/5 px-4 py-2.5 flex items-center gap-3">
          {/* Left: collapse toggle + back + name */}
          <button
            onClick={() => setLibraryCollapsed((c) => !c)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground transition-colors"
            title={libraryCollapsed ? "Show library" : "Hide library"}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg border border-white/10 bg-white/[0.03] shrink-0" asChild>
            <Link href="/templates"><ArrowLeft className="h-3.5 w-3.5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <Input
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                className="h-7 w-auto max-w-[280px] border-none bg-transparent px-0 text-sm font-semibold text-white focus-visible:ring-0"
              />
              {sourceBlueprintSlug && (
                <Badge className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0 text-[10px] text-sky-200 hidden sm:inline-flex">
                  {sourceBlueprintSlug}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              {autosaveStatus} · {nodes.length}n {edges.length}e
            </p>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span className="ml-1 hidden sm:inline">AI Audit</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs" onClick={() => handleBenchmark()} disabled={isBenchmarking}>
              {isBenchmarking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
              <span className="ml-1 hidden sm:inline">Evaluate</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs" onClick={() => handleSimulation()} disabled={isSimulating}>
              {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              <span className="ml-1 hidden sm:inline">Run Test</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="ml-1 hidden sm:inline">Save</span>
            </Button>
            <Button size="sm" className="h-7 rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 px-3 text-xs" onClick={() => handleExecution()} disabled={isExecuting}>
              {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              <span className="ml-1">Live Execute</span>
            </Button>
            {workflowId ? (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-300" onClick={handleDeleteWorkflow}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <button
              onClick={() => setInspectorCollapsed((c) => !c)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground transition-colors"
              title={inspectorCollapsed ? "Show inspector" : "Hide inspector"}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="builder-grid-overlay relative min-w-0 flex-1 overflow-hidden">
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
              <Background variant={BackgroundVariant.Cross} gap={32} size={1} color="#94a3b8" className="opacity-[0.05]" />
              <Controls className="overflow-hidden rounded-xl border border-white/10 bg-[#09101c]/90 shadow-lg" showInteractive={false} />
              <MiniMap nodeColor="#12304d" maskColor="rgba(3,7,18,0.82)" className="!bottom-4 !right-4 !bg-[#09101c]/92 rounded-xl border border-white/10 shadow-lg" />
            </ReactFlow>
          </main>

          {/* ── Inspector panel (collapsible) ── */}
          <aside className={cn("builder-surface-muted flex shrink-0 flex-col border-l border-white/5 transition-all duration-300", inspectorCollapsed ? "w-0 overflow-hidden" : "w-[300px]")}>
            <Tabs value={inspectorTab} onValueChange={setInspectorTab} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-white/5 px-3 py-3">
                <TabsList className="grid h-7 w-full grid-cols-3 rounded-xl border border-white/10 bg-black/20 p-0.5">
                  <TabsTrigger value="workflow" className="rounded-lg py-1 text-[11px]">Workflow</TabsTrigger>
                  <TabsTrigger value="scenario" className="rounded-lg py-1 text-[11px]">Scenario</TabsTrigger>
                  <TabsTrigger value="node" className="rounded-lg py-1 text-[11px]">
                    {selectedNodeLabel ? selectedNodeLabel.slice(0, 8) : "Node"}
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-3 py-3">
                  <TabsContent value="workflow" className="m-0 space-y-3">
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
                      <Textarea
                        value={workflowDescription}
                        onChange={(event) => setWorkflowDescription(event.target.value)}
                        placeholder="What does this system do?"
                        className="mt-1.5 min-h-[100px] rounded-2xl border-white/10 bg-black/20 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
                        <p className="text-[10px] text-muted-foreground">Blueprint</p>
                        <p className="mt-1 font-medium text-white truncate text-[11px]">{sourceBlueprintSlug || "Custom"}</p>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
                        <p className="text-[10px] text-muted-foreground">Nodes / Edges</p>
                        <p className="mt-1 font-medium text-white text-[11px]">{nodes.length} / {edges.length}</p>
                      </div>
                    </div>

                    {!session?.user && (
                      <div className="rounded-xl border border-sky-400/20 bg-sky-500/8 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-100">
                          <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
                          Sign in for cloud saves
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          GitHub / Google sign-in unlocks cloud save, test runs, audits, and credits.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="scenario" className="m-0 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Situation to test</Label>
                      <Textarea
                        value={scenarioPrompt}
                        onChange={(event) => setScenarioPrompt(event.target.value)}
                        placeholder="Example: Slack is down, database is slow, or the customer message contains PII."
                        className="min-h-[92px] rounded-2xl border-white/10 bg-black/20 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Traffic</Label>
                        <Select
                          value={scenario.trafficProfile}
                          onValueChange={(value) =>
                            setScenario((current) => ({
                              ...current,
                              trafficProfile: value as ScenarioDefinition["trafficProfile"],
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 rounded-xl border-white/10 bg-black/20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="steady">Steady</SelectItem>
                            <SelectItem value="burst">Burst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Dependency</Label>
                        <Select
                          value={scenario.dependencyMode}
                          onValueChange={(value) =>
                            setScenario((current) => ({
                              ...current,
                              dependencyMode: value as ScenarioDefinition["dependencyMode"],
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 rounded-xl border-white/10 bg-black/20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixture">Fixture</SelectItem>
                            <SelectItem value="safe_test">Safe Test</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Failure</Label>
                        <Select
                          value={scenario.failureMode}
                          onValueChange={(value) =>
                            setScenario((current) => ({
                              ...current,
                              failureMode: value as ScenarioDefinition["failureMode"],
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 rounded-xl border-white/10 bg-black/20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="latency_spike">Latency Spike</SelectItem>
                            <SelectItem value="partial_outage">Partial Outage</SelectItem>
                            <SelectItem value="dependency_timeout">Dep. Timeout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Queue depth</Label>
                        <Input
                          type="number"
                          value={scenario.queueDepth}
                          onChange={(event) =>
                            setScenario((current) => ({ ...current, queueDepth: Number(event.target.value) || 0 }))
                          }
                          className="h-8 rounded-xl border-white/10 bg-black/20 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={scenario.timeoutMs}
                          onChange={(event) =>
                            setScenario((current) => ({ ...current, timeoutMs: Number(event.target.value) || 0 }))
                          }
                          className="h-8 rounded-xl border-white/10 bg-black/20 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Benchmark models</Label>
                        <Input
                          value={benchmarkModels}
                          onChange={(event) => setBenchmarkModels(event.target.value)}
                          className="h-8 rounded-xl border-white/10 bg-black/20 text-xs"
                          placeholder="gpt-4o,gpt-4.1-mini,..."
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="node" className="m-0">
                    <NodePropertiesPanel selectedNode={selectedNode} updateNodeData={updateNodeData} />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </aside>
        </div>
      </section>

      <ExecutionPanel open={isRunPanelOpen} onOpenChange={setIsRunPanelOpen} runData={runData} />

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md bg-card/95 border-white/10">
          <DialogHeader>
            <DialogTitle>Sign in to save and run</DialogTitle>
            <DialogDescription>
              Local autosave is active. Sign in to persist workflows, use credits, run test scenarios, perform AI audits, and execute live automations.
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
