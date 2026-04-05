"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Play, Save, Share2,
  MessageSquare, Cpu, Database,
  Wrench, FileOutput, CheckCircle2, ChevronRight, Settings,
  Type, MessageSquareCode, Bot, Cog, TerminalSquare, Sparkles,
  Globe, Search, Newspaper, BookOpen, Warehouse, Table, Mail, 
  Slack, Disc, Twitter, Clock, Zap, Code, ShieldCheck, 
  Image as ImageIcon, Mic, AudioLines, ShoppingCart, CreditCard,
  Repeat, BrainCircuit, Layers, History as HistoryIcon
} from "lucide-react";
import Link from "next/link";
import { ExecutionPanel } from "@/components/ExecutionPanel";
import { PublishModal } from "@/components/PublishModal";
import { NodePropertiesPanel } from "@/components/NodePropertiesPanel";
import { VersionHistoryPanel } from "@/components/VersionHistoryPanel";
import { FancyLoader } from "@/components/ui/FancyLoader";

const initialNodes: any[] = [
  { id: "1", position: { x: 250, y: 150 }, data: { label: "Input Node", value: "" }, type: "inputNode" },
  { id: "2", position: { x: 500, y: 150 }, data: { label: "LLM Node" }, type: "llmNode" },
  { id: "3", position: { x: 750, y: 150 }, data: { label: "Output Node" }, type: "outputNode" },
];

const initialEdges: any[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: {} },
  { id: "e2-3", source: "2", target: "3", animated: true, style: {} },
];

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Predefined mock template data to load based on ?template=id
const templatesData: Record<string, { nodes: any[], edges: any[] }> = {
  "0": { // Resume Analyzer
    nodes: [
      { id: "1", position: { x: 250, y: 150 }, data: { value: "Resume Details:\nTarget Job:\n" }, type: "inputNode" },
      { id: "2", position: { x: 500, y: 150 }, data: { template: "Analyze this resume against the target job. {{default}}" }, type: "promptNode" },
      { id: "3", position: { x: 750, y: 150 }, data: { model: "gpt-4o", systemPrompt: "You are an expert HR reviewer.", temperature: 0.5 }, type: "llmNode" },
      { id: "4", position: { x: 1000, y: 150 }, data: { label: "Output" }, type: "outputNode" }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true },
      { id: "e3-4", source: "3", target: "4", animated: true }
    ]
  },
  "1": { // Research Synthesizer
    nodes: [
      { id: "1", position: { x: 250, y: 150 }, data: { value: "Context:\n" }, type: "inputNode" },
      { id: "2", position: { x: 500, y: 150 }, data: { template: "Summarize into 3 key themes. {{default}}" }, type: "promptNode" },
      { id: "3", position: { x: 750, y: 150 }, data: { model: "gpt-3.5-turbo", systemPrompt: "You are a research bot.", temperature: 0.2 }, type: "llmNode" },
      { id: "4", position: { x: 1000, y: 150 }, data: { label: "Output" }, type: "outputNode" }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true },
      { id: "e3-4", source: "3", target: "4", animated: true }
    ]
  }
};

import { nodeTypes } from "@/components/nodes";
import { PlusSquare } from "lucide-react";
import { INTEGRATION_REGISTRY, IntegrationApp } from "@/lib/integrations";

const NODE_LIBRARY = [
  // --- AI & LLM Models ---
  { type: "llmNode", label: "GPT-4o (OpenAI)", description: "Most capable model", icon: <Bot className="w-4 h-4" />, color: "text-purple-400 bg-purple-500/10", category: "AI Models" },
  { type: "llmNode", label: "Claude 3.5 Sonnet", description: "Nuanced & Fast", icon: <BrainCircuit className="w-4 h-4" />, color: "text-orange-400 bg-orange-500/10", category: "AI Models" },
  { type: "llmNode", label: "Gemini 1.5 Pro", description: "Large Context", icon: <Sparkles className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10", category: "AI Models" },
  { type: "llmNode", label: "Llama 3 (Local)", description: "Privacy-focused", icon: <TerminalSquare className="w-4 h-4" />, color: "text-green-400 bg-green-500/10", category: "AI Models" },
  { type: "imageGenNode", label: "DALL-E 3", description: "High-quality images", icon: <ImageIcon className="w-4 h-4" />, color: "text-pink-400 bg-pink-500/10", category: "AI Models" },

  // --- Search & intelligence ---
  { type: "searchNode", label: "Google Search", description: "Live web results", icon: <Search className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10", category: "Search" },
  { type: "scraperNode", label: "Web Scraper", description: "Extract page content", icon: <Globe className="w-4 h-4" />, color: "text-teal-400 bg-teal-500/10", category: "Search" },
  { type: "newsNode", label: "News Feed", description: "Latest headlines", icon: <Newspaper className="w-4 h-4" />, color: "text-red-400 bg-red-500/10", category: "Search" },
  { type: "wikiNode", label: "Wikipedia", description: "Knowledge lookup", icon: <BookOpen className="w-4 h-4" />, color: "text-slate-400 bg-slate-500/10", category: "Search" },

  // --- Data & Persistence ---
  { type: "memoryNode", label: "Vector Search", description: "Pinecone / Weaviate", icon: <Database className="w-4 h-4" />, color: "text-indigo-400 bg-indigo-500/10", category: "Data" },
  { type: "mongoNode", label: "MongoDB", description: "Read/Write JSON", icon: <Warehouse className="w-4 h-4" />, color: "text-green-400 bg-green-500/10", category: "Data" },
  { type: "sheetsNode", label: "Google Sheets", description: "Spreadsheet sync", icon: <Table className="w-4 h-4" />, color: "text-emerald-400 bg-emerald-500/10", category: "Data" },
  { type: "notionNode", label: "Notion", description: "Create pages/rows", icon: <Layers className="w-4 h-4" />, color: "text-slate-500 bg-slate-500/10", category: "Data" },
  { type: "airtableNode", label: "Airtable", description: "Low-code database", icon: <Table className="w-4 h-4" />, color: "text-blue-500 bg-blue-500/10", category: "Data" },

  // --- Communication ---
  { type: "emailNode", label: "Send Email", description: "SMTP / SendGrid", icon: <Mail className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10", category: "Communication" },
  { type: "twitterNode", label: "Twitter Post", description: "Automated tweet", icon: <Twitter className="w-4 h-4" />, color: "text-sky-400 bg-sky-500/10", category: "Communication" },


  // --- Logic & Process ---
  { type: "inputNode", label: "Input", description: "Receive initial data", icon: <Type className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10", category: "Logic" },
  { type: "promptNode", label: "Prompt", description: "Template strings", icon: <MessageSquareCode className="w-4 h-4" />, color: "text-orange-400 bg-orange-500/10", category: "Logic" },
  { type: "conditionNode", label: "Condition", description: "If/Else branching", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-yellow-400 bg-yellow-500/10", category: "Logic" },
  { type: "combineNode", label: "Combine", description: "Merge strings", icon: <PlusSquare className="w-4 h-4" />, color: "text-teal-400 bg-teal-500/10", category: "Logic" },
  { type: "loopNode", label: "Loop", description: "Iterate arrays", icon: <Repeat className="w-4 h-4" />, color: "text-pink-400 bg-pink-500/10", category: "Logic" },
  { type: "delayNode", label: "Delay", description: "Wait (Sleep)", icon: <Clock className="w-4 h-4" />, color: "text-slate-400 bg-slate-500/10", category: "Logic" },
  { type: "webhookNode", label: "Webhook", description: "API (GET/POST)", icon: <Zap className="w-4 h-4" />, color: "text-amber-400 bg-amber-500/10", category: "Logic" },
  { type: "codeNode", label: "JS Sandbox", description: "Custom logic", icon: <Code className="w-4 h-4" />, color: "text-gray-400 bg-gray-500/10", category: "Logic" },
  { type: "outputNode", label: "Output", description: "Final response", icon: <TerminalSquare className="w-4 h-4" />, color: "text-green-400 bg-green-500/10", category: "Logic" },

  // --- Multimodal & Auth ---
  { type: "whisperNode", label: "Whisper", description: "Voice-to-Text", icon: <Mic className="w-4 h-4" />, color: "text-cyan-400 bg-cyan-500/10", category: "Audio/Vision" },
  { type: "ttsNode", label: "Speech", description: "Text-to-Voice", icon: <AudioLines className="w-4 h-4" />, color: "text-violet-400 bg-violet-500/10", category: "Audio/Vision" },
  { type: "authNode", label: "Auth Guard", description: "API Key Security", icon: <ShieldCheck className="w-4 h-4" />, color: "text-zinc-400 bg-zinc-500/10", category: "Security" },
  { type: "stripeNode", label: "Stripe", description: "Invoices & Payments", icon: <CreditCard className="w-4 h-4" />, color: "text-indigo-400 bg-indigo-500/10", category: "Commerce" },
  { type: "shopifyNode", label: "Shopify", description: "Store products", icon: <ShoppingCart className="w-4 h-4" />, color: "text-lime-400 bg-lime-500/10", category: "Commerce" },
];

function BuilderCanvas() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("template") || null;

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [architectPrompt, setArchitectPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isArchitectSidebarOpen, setIsArchitectSidebarOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<Record<string, any>>({});
  const [activeSimulationNode, setActiveSimulationNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"build" | "architect">("build");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [setNodes, setEdges, selectedNode]);

  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      // Ensure we are in build mode to see the properties panel
      setViewMode("build");
    }
  }, [nodes]);

  const handleSimulation = async () => {
    setViewMode("architect"); // Switch to architect mode for simulation
    setIsArchitectSidebarOpen(true);
    try {
      setIsSimulating(true);
      setSimulationResults({});
      
      // Basic topological sort/execution order
      // For simulation, we'll just go through nodes that have all inputs ready
      const executionOrder = nodes.map(n => n.id); // Simple for now
      
      for (const nodeId of executionOrder) {
        setActiveSimulationNode(nodeId);
        // Simulate "Processing" time
        await new Promise(r => setTimeout(r, 800));
        
        const node = nodes.find(n => n.id === nodeId);
        let mockOutput = "Simulated data...";
        
        if (node?.type === "inputNode") mockOutput = node.data?.value || "User Input";
        if (node?.type === "llmNode") mockOutput = "AI generated response for this step.";
        if (node?.type === "outputNode") mockOutput = "Final result verified.";

        setSimulationResults(prev => ({ ...prev, [nodeId]: mockOutput }));
      }
      setActiveSimulationNode(null);
      // Optional: Add a small delay then reset or show summary
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateArchitecture = async () => {
    if (!architectPrompt.trim()) return;
    try {
      setIsGenerating(true);
      const res = await fetch("/api/architect/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: architectPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes);
        setEdges(data.edges);
        setArchitectPrompt("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeArchitecture = async () => {
    try {
      setIsAnalyzing(true);
      setIsArchitectSidebarOpen(true);
      const res = await fetch("/api/architect/analyze", {
        method: "POST",
        body: JSON.stringify({ nodes, edges }),
      });
      if (res.ok) {
        setAnalysisResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const workflowId = searchParams?.get("id") || null;

  useEffect(() => {
    async function loadWorkflow() {
      if (workflowId) {
        try {
          const res = await fetch(`/api/workflows/${workflowId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.nodes && data.edges) {
              setNodes(data.nodes);
              setEdges(data.edges);
            }
          }
        } catch (err) {
          console.error("Failed to load workflow:", err);
        }
      } else if (templateId && templatesData[templateId]) {
        setNodes(templatesData[templateId].nodes);
        setEdges(templatesData[templateId].edges);
      }
    }
    loadWorkflow();
  }, [templateId, workflowId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let nodeType = type;
      let appId = undefined;

      if (type.startsWith("integrationNode:")) {
        const parts = type.split(":");
        nodeType = parts[0];
        appId = parts[1];
      }

      const newNode = {
        id: `node_${Date.now()}`,
        type: nodeType,
        position,
        data: { label: `${nodeType} node`, appId, actionId: null },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: { ...node.data, ...newData }
        };
      }
      return node;
    }));
    setSelectedNode((prev: any) => prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev);
  };

  const handleLaunch = async () => {
    if (workflowId) {
      try {
        await fetch(`/api/workflows/${workflowId}/versions/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges, name: `Execution ${new Date().toLocaleTimeString()}` }),
        });
      } catch (err) {
        console.error("Failed to save version:", err);
      }
    }
    setIsExecutionPanelOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] overflow-hidden relative selection:bg-primary/30">
      {/* Unified Command Center Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.05] bg-card/40 backdrop-blur-3xl shrink-0 z-50">
        {/* Left Section: Meta & Mode Toggle */}
        <div className="flex items-center gap-4 w-[320px]">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5" asChild title="Back to Dashboard">
            <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>

          <div className="flex flex-col min-w-0 pr-4">
            <h1 className="text-sm font-bold tracking-tight truncate">Untitled Workflow</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">Autosaved</span>
            </div>
          </div>

          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08] shadow-inner ml-auto">
            <Button 
              size="sm" 
              variant="ghost"
              className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", 
                viewMode === "build" ? "bg-white/10 text-white shadow-lg shadow-white/5" : "text-muted-foreground hover:text-white")}
              onClick={() => setViewMode("build")}
            >
              Build
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", 
                viewMode === "architect" ? "bg-white/10 text-white shadow-lg shadow-white/5" : "text-muted-foreground hover:text-white")}
              onClick={() => setViewMode("architect")}
            >
              Architect
            </Button>
          </div>
        </div>

        {/* Center Section: Neural Command Center */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-indigo-500/50 rounded-2xl blur opacity-0 group-focus-within:opacity-40 transition duration-500" />
            <div className="relative flex items-center bg-[#0D0D0E] border border-white/[0.08] rounded-2xl w-[400px] xl:w-[500px] h-10 px-4 group-focus-within:border-primary/50 transition-all shadow-2xl">
              <Sparkles className="w-4 h-4 text-primary animate-pulse mr-3 group-focus-within:scale-110 transition-transform" />
              <input 
                type="text" 
                placeholder="Architect Prompt... (⌘ K)"
                className="flex-1 bg-transparent border-none outline-none text-xs font-semibold placeholder:text-muted-foreground/40 text-white"
                value={architectPrompt}
                onChange={(e) => setArchitectPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateArchitecture()}
              />
              <div className="flex items-center gap-1 ml-2">
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">↵</span>
                </kbd>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter hover:bg-white/10 text-primary"
                  disabled={isGenerating || !architectPrompt.trim()}
                  onClick={handleGenerateArchitecture}
                >
                  {isGenerating ? "Working..." : "Design"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-xl h-9 hover:bg-white/5 px-3 font-bold text-xs" onClick={handleAnalyzeArchitecture} disabled={isAnalyzing}>
            <Sparkles className={`w-3.5 h-3.5 mr-2 ${isAnalyzing ? "animate-spin" : "text-primary"}`} /> AI Audit
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("rounded-xl h-9 hover:bg-white/5 px-3 font-bold text-xs", isHistoryOpen ? "text-primary bg-primary/5" : "")}
            onClick={() => setIsHistoryOpen(true)}
          >
            <HistoryIcon className="w-3.5 h-3.5 mr-2" /> History
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("rounded-xl h-9 hover:bg-white/5 px-3 font-bold text-xs", isSimulating && "text-primary")}
            onClick={handleSimulation}
            disabled={isSimulating}
          >
            <Play className={cn("w-3.5 h-3.5 mr-2", isSimulating && "animate-pulse")} /> Simulate
          </Button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <Button onClick={handleLaunch} size="sm" className="rounded-xl h-10 bg-primary hover:primary/90 text-primary-foreground font-black text-xs shadow-lg shadow-primary/20 transition-all active:scale-95 group">
            Launch Agent
            <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Node Library Panel */}
        {isSidebarOpen && viewMode === "build" && (
          <aside className="w-72 border-r border-white-0.05 bg-gradient-to-b from-[#0D0D0E] to-[#0A0A0B] backdrop-blur-3xl flex flex-col shrink-0 overflow-y-auto hidden md:flex z-40 animate-in slide-in-from-left duration-500">
            <div className="p-6 border-b border-white/[0.05] bg-white/[0.01]">
              <h2 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Node Library</h2>
              <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-widest font-bold">Tools & Integrations</p>
            </div>
            
            <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
              {Array.from(new Set(NODE_LIBRARY.map(n => n.category))).map(category => (
                <div key={category} className="space-y-4">
                  <h3 className="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                    {category}
                  </h3>
                  <div className="grid gap-2.5">
                    {NODE_LIBRARY.filter(n => n.category === category).map((node) => (
                      <div 
                        key={node.label}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.06] cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.4),0_0_20px_rgba(124,58,237,0.1)] group active:scale-[0.98]"
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type)}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${node.color} group-hover:scale-110 group-hover:rotate-3 transition-all shadow-inner`}>
                          {node.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-white/90 group-hover:text-white transition-colors truncate">{node.label}</p>
                          <p className="text-[9px] text-muted-foreground/40 font-medium leading-tight mt-0.5 group-hover:text-muted-foreground/60 transition-colors truncate">{node.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <Separator className="bg-white/[0.05]" />
              
              <div className="pt-2 pb-4">
                <h2 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-2 mb-4">App Directory</h2>
                
                {Array.from(new Set(Object.values(INTEGRATION_REGISTRY).map(a => a.category))).map(category => (
                  <div key={`app-cat-${category}`} className="space-y-4 mt-6 first:mt-0">
                    <h3 className="text-[10px] font-black text-indigo-400/50 uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-400/40" />
                      {category}
                    </h3>
                    <div className="grid gap-2.5">
                      {Object.values(INTEGRATION_REGISTRY).filter(a => a.category === category).map((app) => {
                        const Icon = app.icon;
                        return (
                          <div 
                            key={app.id}
                            className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.06] cursor-grab active:cursor-grabbing hover:border-indigo-500/40 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.4),0_0_20px_rgba(99,102,241,0.15)] group active:scale-[0.98]"
                            draggable
                            onDragStart={(e) => onDragStart(e, `integrationNode:${app.id}`)}
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-inner bg-black/40 border border-white/5" style={{ color: app.color }}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-white/90 group-hover:text-white transition-colors truncate">{app.name}</p>
                              <p className="text-[9px] text-muted-foreground/40 font-medium leading-tight mt-0.5 group-hover:text-muted-foreground/60 transition-colors truncate">{app.actions.length} action(s)</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Center Canvas */}
        <main className="flex-1 relative overflow-hidden bg-[#0A0A0B]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)] opacity-[0.03] z-0" />
          <ReactFlow
            nodes={nodes.map(n => ({
              ...n,
              selected: n.id === activeSimulationNode || n.selected,
              data: {
                ...n.data,
                simulatedOutput: simulationResults[n.id],
                isSimulating: n.id === activeSimulationNode,
                onDelete: handleDeleteNode,
                onEdit: handleEditNode
              }
            }))}
            edges={edges.map(e => ({
              ...e,
              animated: isSimulating || e.animated,
              style: (e.source === activeSimulationNode || simulationResults[e.source]) 
                ? { stroke: "#7C3AED", strokeWidth: 3 } 
                : e.style
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            onSelectionChange={(params) => setSelectedNode(params.nodes[0] || null)}
            fitView
            className="z-10"
          >
            <Background 
              color="#7C3AED" 
              gap={32} 
              size={1.5} 
              variant={BackgroundVariant.Cross} 
              className="opacity-[0.06]" 
            />
            <Controls 
              className="bg-[#161618]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden [&_button]:border-white/[0.05] [&_button:hover]:bg-white/5 transition-all" 
              showInteractive={false} 
            />
            <MiniMap 
              nodeColor="#2A2A2E" 
              maskColor="rgba(0, 0, 0, 0.7)"
              className="!bg-[#161618]/90 backdrop-blur-3xl border border-white/[0.08] shadow-2xl origin-bottom-right" 
              style={{ height: 120, borderRadius: '1rem', overflow: 'hidden' }}
            />
            
            <Panel position="bottom-center" className="mb-6">
              <div className="bg-[#161618]/80 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/[0.08] text-[11px] font-bold text-muted-foreground flex items-center gap-3 shadow-[0_10px_50px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500/40 animate-ping" />
                </div>
                <span className="uppercase tracking-[0.1em]">System Status: Ready to execute</span>
              </div>
            </Panel>
          </ReactFlow>
        </main>
        
        {/* Right Properties Panel */}
        {viewMode === "build" && (
          <div className="w-80 border-l border-white/[0.05] bg-card/10 backdrop-blur-3xl p-6 flex flex-col hidden lg:flex animate-in slide-in-from-right duration-500 z-40 relative">
            <h2 className="text-[10px] font-bold mb-6 uppercase tracking-widest text-muted-foreground/60">Node Configuration</h2>
            <NodePropertiesPanel selectedNode={selectedNode} updateNodeData={updateNodeData} />
          </div>
        )}

      {/* AI Architect Analysis Sidebar */}
      {isArchitectSidebarOpen && (
        <aside className="w-80 border-l border-border/40 bg-card/50 backdrop-blur-xl p-5 flex flex-col z-40 shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between mb-6">
               <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Architect Feedback
               </h2>
               <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsArchitectSidebarOpen(false)}>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
               </Button>
            </div>

            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-background/50 rounded-2xl relative overflow-hidden">
                 <FancyLoader text="Analyzing Architecture..." />
              </div>
            ) : analysisResult ? (
              <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-thin">
                 {/* Rating */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-muted-foreground uppercase">System Rating</span>
                       <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-lg px-3 py-1">
                          {analysisResult.rating}/10
                       </Badge>
                    </div>
                    {/* Add conditional progress import or use native if available */}
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                       <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${analysisResult.rating * 10}%` }}
                       />
                    </div>
                 </div>

                 {/* Feedback */}
                 <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                       <p className="text-sm leading-relaxed">{analysisResult.feedback}</p>
                    </div>

                    <div className="space-y-3">
                       <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Critical Edge Cases</h3>
                       <div className="space-y-2">
                          {analysisResult.edgeCases?.map((ec: string, i: number) => (
                             <div key={i} className="flex gap-3 text-xs p-3 rounded-xl bg-surface/30 border border-border/20">
                                <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">!</div>
                                <span className="text-muted-foreground">{ec}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Suggestions</h3>
                       <div className="space-y-2">
                          {analysisResult.suggestions?.map((s: string, i: number) => (
                             <div key={i} className="flex gap-3 text-xs p-3 rounded-xl bg-primary/5 border border-primary/10">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-muted-foreground">{s}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/40 rounded-2xl">
                 <Sparkles className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                 <p className="text-sm text-muted-foreground">Click "Architect AI" to analyze your current system architecture.</p>
              </div>
            )}
          </aside>
        )}
      </div>

      <ExecutionPanel open={isExecutionPanelOpen} onOpenChange={setIsExecutionPanelOpen} />
      <PublishModal 
        open={isPublishModalOpen} 
        onOpenChange={setIsPublishModalOpen} 
        nodes={nodes}
        edges={edges}
      />
      <VersionHistoryPanel 
        open={isHistoryOpen} 
        onOpenChange={setIsHistoryOpen} 
        workflowId={workflowId || undefined} 
        onRestore={(v) => {
          setNodes(v.nodes);
          setEdges(v.edges);
          setIsHistoryOpen(false);
        }}
      />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#0A0A0B] flex items-center justify-center text-muted-foreground"><FancyLoader text="Initializing Workspace..." /></div>}>
      <BuilderCanvas />
    </Suspense>
  );
}
