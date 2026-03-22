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
  Type, MessageSquareCode, Bot, Cog, TerminalSquare, Sparkles
} from "lucide-react";
import Link from "next/link";
import { ExecutionPanel } from "@/components/ExecutionPanel";
import { PublishModal } from "@/components/PublishModal";

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
import { PlusSquare, Repeat } from "lucide-react";

const NODE_LIBRARY = [
  { type: "inputNode", label: "Input", description: "Receive initial data", icon: <Type className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10" },
  { type: "promptNode", label: "Prompt", description: "Template strings", icon: <MessageSquareCode className="w-4 h-4" />, color: "text-orange-400 bg-orange-500/10" },
  { type: "llmNode", label: "LLM", description: "Generate text", icon: <Bot className="w-4 h-4" />, color: "text-purple-400 bg-purple-500/10" },
  { type: "outputNode", label: "Output", description: "Final response", icon: <TerminalSquare className="w-4 h-4" />, color: "text-green-400 bg-green-500/10" },
  { type: "memoryNode", label: "Memory", description: "Vector search", icon: <Database className="w-4 h-4" />, color: "text-indigo-400 bg-indigo-500/10" },
  { type: "toolNode", label: "Tool", description: "Custom functions", icon: <Cog className="w-4 h-4" />, color: "text-red-400 bg-red-500/10" },
  { type: "conditionNode", label: "Condition", description: "If/Else branching", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-yellow-400 bg-yellow-500/10" },
  { type: "combineNode", label: "Combine", description: "Merge strings", icon: <PlusSquare className="w-4 h-4" />, color: "text-teal-400 bg-teal-500/10" },
  { type: "loopNode", label: "Loop", description: "Iterate arrays", icon: <Repeat className="w-4 h-4" />, color: "text-pink-400 bg-pink-500/10" }
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

  useEffect(() => {
    if (templateId && templatesData[templateId]) {
      setNodes(templatesData[templateId].nodes);
      setEdges(templatesData[templateId].edges);
    }
  }, [templateId, setNodes, setEdges]);

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

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
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

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] overflow-hidden relative selection:bg-primary/30">
      {/* Unified Command Center Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.05] bg-card/40 backdrop-blur-2xl shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5" asChild title="Back to Dashboard">
            <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>

          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight">Untitled Workflow</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">Autosaved</span>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Mode Toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
            <Button 
              size="sm" 
              variant={viewMode === "build" ? "secondary" : "ghost"}
              className={cn("h-8 px-4 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all", viewMode === "build" && "shadow-lg bg-white/10")}
              onClick={() => setViewMode("build")}
            >
              Build
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === "architect" ? "secondary" : "ghost"}
              className={cn("h-8 px-4 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all", viewMode === "architect" && "shadow-lg bg-white/10")}
              onClick={() => setViewMode("architect")}
            >
              Architect
            </Button>
          </div>
        </div>

        {/* Central Prompt Area (Command Center Style) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-white/5 border border-white/10 rounded-2xl w-[400px] lg:w-[500px] h-10 px-4 group focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-white/[0.08] transition-all shadow-2xl">
          <Sparkles className="w-4 h-4 text-primary animate-pulse mr-3 group-focus-within:scale-110 transition-transform" />
          <input 
            type="text" 
            placeholder="AI Architect Prompt..."
            className="flex-1 bg-transparent border-none outline-none text-xs font-semibold placeholder:text-muted-foreground/40"
            value={architectPrompt}
            onChange={(e) => setArchitectPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateArchitecture()}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-3 text-[10px] font-bold uppercase tracking-tighter hover:bg-white/10"
            disabled={isGenerating || !architectPrompt.trim()}
            onClick={handleGenerateArchitecture}
          >
            {isGenerating ? "Working..." : "Design"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-xl h-9 hover:bg-white/5 px-4 font-bold text-xs" onClick={handleAnalyzeArchitecture} disabled={isAnalyzing}>
            <Sparkles className={`w-3.5 h-3.5 mr-2 ${isAnalyzing ? "animate-spin" : "text-primary"}`} /> AI Audit
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("rounded-xl h-9 hover:bg-white/5 px-4 font-bold text-xs", isSimulating && "text-primary")}
            onClick={handleSimulation}
            disabled={isSimulating}
          >
            <Play className={cn("w-3.5 h-3.5 mr-2", isSimulating && "animate-pulse")} /> Simulate
          </Button>

          <div className="w-px h-8 bg-white/10 mx-1" />

          <Button onClick={() => setIsExecutionPanelOpen(true)} size="sm" className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-95">
            Launch Agent
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Node Library Panel */}
        {isSidebarOpen && viewMode === "build" && (
          <aside className="w-72 border-r border-white/[0.05] bg-card/10 backdrop-blur-3xl flex flex-col shrink-0 overflow-y-auto hidden md:flex z-40 animate-in slide-in-from-left duration-500">
            <div className="p-6 border-b border-white/[0.05]">
              <h2 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Node Library</h2>
              <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-tighter">Tools & Integrations</p>
            </div>
            
            <div className="flex-1 p-5 space-y-6">
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Available Nodes</h3>
                <div className="grid gap-3">
                  {NODE_LIBRARY.map((node) => (
                    <div 
                      key={node.type}
                      className="flex flex-col gap-1 p-3 rounded-xl border border-border/50 bg-background hover:bg-muted/50 cursor-grab hover:border-primary/50 transition-all shadow-sm hover:shadow"
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${node.color}`}>{node.icon}</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{node.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{node.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Center Canvas */}
        <main className="flex-1 relative bg-dot-pattern bg-[length:24px_24px]">
          <div className="absolute inset-0 bg-background/90 z-0 drop-shadow-2xl" />
          <ReactFlow
            nodes={nodes.map(n => ({
              ...n,
              selected: n.id === activeSimulationNode || n.selected,
              data: {
                ...n.data,
                simulatedOutput: simulationResults[n.id],
                isSimulating: n.id === activeSimulationNode
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
            <Background color="#ffffff" gap={24} size={1} variant={BackgroundVariant.Dots} className="opacity-[0.03]" />
            <Controls className="bg-card border-border/40 fill-foreground shadow-xl rounded-lg overflow-hidden" showInteractive={false} />
            <MiniMap 
              nodeColor="#16181D" 
              maskColor="rgba(10, 10, 11, 0.8)"
              className="bg-card/80 border border-border/40 rounded-lg shadow-xl" 
            />
            
            <Panel position="bottom-center" className="mb-4">
              <div className="glass-panel px-4 py-2 rounded-full text-xs text-muted-foreground flex items-center gap-2 shadow-xl">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Ready to execute
              </div>
            </Panel>
          </ReactFlow>
        </main>
        
        {/* Right Properties Panel Placeholder */}
        {viewMode === "build" && (
          <div className="w-80 border-l border-white/[0.05] bg-card/10 backdrop-blur-3xl p-6 flex flex-col hidden lg:flex animate-in slide-in-from-right duration-500">
            <h2 className="text-[10px] font-bold mb-6 uppercase tracking-widest text-muted-foreground/60">Node Configuration</h2>
            {selectedNode ? (
            <div className="space-y-4">
              <div className="mb-2 pb-2 border-b border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{selectedNode.type} Node</p>
                <p className="text-sm font-medium">{selectedNode.id}</p>
              </div>
              
              {selectedNode.type === "inputNode" && (
                <div className="space-y-2">
                  <Label className="text-xs">Input Value</Label>
                  <Textarea 
                    className="text-sm"
                    value={selectedNode.data?.value || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                  />
                </div>
              )}
              
              {selectedNode.type === "promptNode" && (
                <div className="space-y-2">
                  <Label className="text-xs">Template String</Label>
                  <Textarea 
                    className="text-sm h-32"
                    placeholder="Use {{input}} for variables"
                    value={selectedNode.data?.template || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { template: e.target.value })}
                  />
                </div>
              )}
              
              {selectedNode.type === "llmNode" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Model</Label>
                    <Select 
                      value={selectedNode.data?.model || "gpt-3.5-turbo"}
                      onValueChange={(val) => updateNodeData(selectedNode.id, { model: val })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="llama3">Llama 3 (Ollama)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">System Prompt</Label>
                    <Textarea 
                      className="text-sm h-32"
                      value={selectedNode.data?.systemPrompt || ""}
                      onChange={(e) => updateNodeData(selectedNode.id, { systemPrompt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Temperature ({selectedNode.data?.temperature || 0.7})</Label>
                    <Slider 
                      max={2} step={0.1} 
                      value={[selectedNode.data?.temperature || 0.7]}
                      onValueChange={(vals) => updateNodeData(selectedNode.id, { temperature: (vals as number[])[0] })}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-4 text-center border-2 border-dashed border-border/40 rounded-xl">
              <Settings className="w-8 h-8 mb-2 opacity-50" />
              <p>Select a node to edit its properties</p>
            </div>
          )}
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
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                 <p className="text-sm text-muted-foreground">Architect AI is reviewing your system design...</p>
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
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#0A0A0B] flex items-center justify-center text-muted-foreground">Loading builder...</div>}>
      <BuilderCanvas />
    </Suspense>
  );
}
