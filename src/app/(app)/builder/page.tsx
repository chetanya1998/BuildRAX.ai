"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  GitBranch,
  Loader2,
  Play,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FancyLoader } from "@/components/ui/FancyLoader";
import { getDefaultNodeData, NODE_DEFINITIONS, NODE_PACK_ORDER } from "@/lib/graph/catalog";
import { DEFAULT_VIEWPORT } from "@/lib/graph/persistence";
import { CreditBalance, NodeExecutionResult, ScenarioDefinition, WorkflowGraph } from "@/lib/graph/types";
import { nodeTypes } from "@/components/nodes";

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
  const [libraryTab, setLibraryTab] = useState("nodes");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [scenario, setScenario] = useState(defaultScenario);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [benchmarkModels, setBenchmarkModels] = useState("gpt-4o,gpt-4.1-mini,claude-3-5-sonnet");
  const reactFlowInstanceRef = useRef<FlowViewportController | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const packedNodes = useMemo(
    () =>
      NODE_PACK_ORDER.map((pack) => ({
        pack,
        items: NODE_DEFINITIONS.filter((definition) => !definition.experimental && definition.pack === pack),
      })),
    []
  );

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

  if (!isHydrated) {
    return (
      <div className="h-screen w-screen bg-[#0A0A0B] flex items-center justify-center text-muted-foreground">
        <FancyLoader text="Initializing production workspace..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] overflow-hidden">
      <header className="h-16 border-b border-white/[0.05] bg-card/40 backdrop-blur-3xl px-5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" className="rounded-xl" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <Input
              value={workflowName}
              onChange={(event) => setWorkflowName(event.target.value)}
              className="h-9 bg-transparent border-none px-0 text-base font-bold focus-visible:ring-0"
            />
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {autosaveStatus}
            </p>
          </div>
          {sourceBlueprintSlug ? (
            <Badge variant="outline" className="hidden xl:inline-flex border-primary/20 text-primary">
              Blueprint: {sourceBlueprintSlug}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {session?.user ? (
            <Badge variant="outline" className="border-white/10 bg-white/5 hidden lg:inline-flex">
              {creditBalance?.availableCredits ?? "--"} credits
            </Badge>
          ) : (
            <Badge variant="outline" className="border-white/10 bg-white/5 hidden lg:inline-flex">
              Local draft mode
            </Badge>
          )}

          <Button variant="ghost" size="sm" className="rounded-xl" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => handleBenchmark()} disabled={isBenchmarking}>
            {isBenchmarking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitBranch className="w-4 h-4 mr-2" />}
            Benchmark
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => handleSimulation()} disabled={isSimulating}>
            {isSimulating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Simulate
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
          <Button size="sm" className="rounded-xl" onClick={() => handleExecution()} disabled={isExecuting}>
            {isExecuting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
            Execute
          </Button>
          {workflowId ? (
            <Button variant="ghost" size="icon" className="rounded-xl text-red-400 hover:text-red-300" onClick={handleDeleteWorkflow}>
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-white/[0.05] bg-card/20 backdrop-blur-3xl flex flex-col shrink-0">
          <Tabs value={libraryTab} onValueChange={setLibraryTab} className="flex-1 flex flex-col">
            <div className="p-4 border-b border-white/[0.05]">
              <TabsList className="grid grid-cols-3 w-full bg-black/20">
                <TabsTrigger value="nodes">Nodes</TabsTrigger>
                <TabsTrigger value="blueprints">Blueprints</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="nodes" className="flex-1 m-0 overflow-y-auto p-4 space-y-6">
              {packedNodes.map((group) => (
                <div key={group.pack} className="space-y-3">
                  <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {group.pack}
                  </h3>
                  <div className="grid gap-2">
                    {group.items.map((definition) => (
                      <div
                        key={definition.type}
                        draggable
                        onDragStart={(event) => onDragStart(event, definition.type)}
                        className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{definition.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {definition.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-white/10 text-[10px] uppercase">
                            {definition.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="blueprints" className="flex-1 m-0 overflow-y-auto p-4 space-y-4">
              <div className="space-y-3">
                <Input
                  value={blueprintQuery}
                  onChange={(event) => setBlueprintQuery(event.target.value)}
                  placeholder="Search enterprise blueprints..."
                  className="bg-black/20 border-white/10"
                />
                <Select value={selectedSector} onValueChange={(value) => setSelectedSector(value || "all")}>
                  <SelectTrigger className="bg-black/20 border-white/10">
                    <SelectValue placeholder="Filter by sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filteredBlueprints.map((blueprint) => (
                  <button
                    key={blueprint.slug}
                    type="button"
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left hover:border-primary/30 transition-all"
                    onClick={() => handleBlueprintApply(blueprint)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{blueprint.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {blueprint.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-primary/20 text-primary">
                        {blueprint.sector}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {(blueprint.tags || []).slice(0, 4).map((tag: string) => (
                        <span key={tag} className="text-[10px] text-muted-foreground bg-black/20 px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="flex-1 m-0 overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                  <Wand2 className="w-4 h-4" /> Prompt-to-System
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Describe the backend system or AI automation you want. The compiler will return an editable production graph.
                </p>
                <Textarea
                  value={promptInput}
                  onChange={(event) => setPromptInput(event.target.value)}
                  placeholder="Build a fintech fraud review system with API gateway, rate limits, case service, queue, MongoDB, LLM review, trace, and fallback handling."
                  className="min-h-[220px] bg-black/20 border-white/10"
                />
                <Button className="w-full rounded-xl" onClick={handleCompilePrompt} disabled={isCompilingPrompt}>
                  {isCompilingPrompt ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BrainCircuit className="w-4 h-4 mr-2" />
                  )}
                  Compile Prompt
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        <main className="flex-1 relative overflow-hidden">
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
            onSelectionChange={(selection) => setSelectedNode(selection.nodes[0] || null)}
            fitView
            className="bg-[#0A0A0B]"
          >
            <Background variant={BackgroundVariant.Cross} gap={32} size={1.5} color="#7C3AED" className="opacity-[0.05]" />
            <Controls className="bg-[#161618]/80 border border-white/[0.08] rounded-2xl overflow-hidden" showInteractive={false} />
            <MiniMap nodeColor="#2A2A2E" maskColor="rgba(0,0,0,0.7)" className="!bg-[#161618]/90 border border-white/[0.08]" />
            <Panel position="bottom-center" className="mb-4">
              <div className="rounded-full border border-white/10 bg-[#161618]/80 px-4 py-2 text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-3">
                <Workflow className="w-4 h-4 text-primary" />
                Design / Analysis / Simulation / Live Execution
              </div>
            </Panel>
          </ReactFlow>
        </main>

        <aside className="w-96 border-l border-white/[0.05] bg-card/20 backdrop-blur-3xl p-5 overflow-y-auto shrink-0 space-y-6">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={workflowDescription}
              onChange={(event) => setWorkflowDescription(event.target.value)}
              placeholder="What system are you designing and what should it optimize for?"
              className="min-h-[100px] bg-black/20 border-white/10"
            />
          </div>

          <Separator className="bg-white/5" />

          <div className="space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Scenario Configuration
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Traffic</Label>
                <Select
                  value={scenario.trafficProfile}
                  onValueChange={(value) =>
                    setScenario((current) => ({
                      ...current,
                      trafficProfile: value as ScenarioDefinition["trafficProfile"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10">
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
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Dependency Mode</Label>
                <Select
                  value={scenario.dependencyMode}
                  onValueChange={(value) =>
                    setScenario((current) => ({
                      ...current,
                      dependencyMode: value as ScenarioDefinition["dependencyMode"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10">
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
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Failure Mode</Label>
                <Select
                  value={scenario.failureMode}
                  onValueChange={(value) =>
                    setScenario((current) => ({
                      ...current,
                      failureMode: value as ScenarioDefinition["failureMode"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10">
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
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Queue Depth</Label>
                <Input
                  type="number"
                  value={scenario.queueDepth}
                  onChange={(event) =>
                    setScenario((current) => ({ ...current, queueDepth: Number(event.target.value) || 0 }))
                  }
                  className="bg-black/20 border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Timeout (ms)</Label>
                <Input
                  type="number"
                  value={scenario.timeoutMs}
                  onChange={(event) =>
                    setScenario((current) => ({ ...current, timeoutMs: Number(event.target.value) || 0 }))
                  }
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Benchmark Models</Label>
                <Input
                  value={benchmarkModels}
                  onChange={(event) => setBenchmarkModels(event.target.value)}
                  className="bg-black/20 border-white/10"
                  placeholder="gpt-4o,gpt-4.1-mini,claude-3-5-sonnet"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/5" />

          <NodePropertiesPanel selectedNode={selectedNode} updateNodeData={updateNodeData} />

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary text-sm font-semibold">
              <ShieldCheck className="w-4 h-4" /> Save and Access Model
            </div>
            <p className="text-[12px] text-muted-foreground">
              Anonymous users get local autosave. GitHub or Google sign-in unlocks cloud save, prompt compile, simulation, execution, benchmarks, credits, and billing.
            </p>
          </div>
        </aside>
      </div>

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
