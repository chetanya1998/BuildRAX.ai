"use client";

import { useState, useCallback } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Panel,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Play, Save, Share2, 
  Type, MessageSquareCode, Database, 
  Bot, Cog, TerminalSquare
} from "lucide-react";
import Link from "next/link";
import { ExecutionPanel } from "@/components/ExecutionPanel";

const initialNodes = [
  { id: "1", position: { x: 250, y: 150 }, data: { label: "Input Node" }, type: "default" },
  { id: "2", position: { x: 500, y: 150 }, data: { label: "LLM Node" }, type: "default" },
  { id: "3", position: { x: 750, y: 150 }, data: { label: "Output Node" }, type: "default" },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

export default function BuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] overflow-hidden">
      {/* Topbar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/40 bg-card/50 backdrop-blur-md shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold truncate w-48">Untitled Workflow</h1>
            <span className="text-[10px] text-muted-foreground">Draft • Last saved just now</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden md:inline-flex bg-primary/5 text-primary border-primary/20">
            Lvl 2 Builder
          </Badge>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full">
             <Save className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button variant="outline" size="sm" className="rounded-full bg-background hidden sm:inline-flex" onClick={() => setIsPublishModalOpen(true)}>
             <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          <Button onClick={() => setIsExecutionPanelOpen(true)} size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
             <Play className="w-4 h-4 mr-2" /> Run Flow
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Node Library Panel */}
        {isSidebarOpen && (
          <aside className="w-64 border-r border-border/40 bg-card/30 flex flex-col shrink-0 overflow-y-auto hidden md:flex z-10">
            <div className="p-4 border-b border-border/40">
              <h2 className="text-sm font-medium">Node Library</h2>
              <p className="text-xs text-muted-foreground mt-1">Drag and drop to canvas</p>
            </div>
            
            <div className="flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Core</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 cursor-grab hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Type className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Input</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 cursor-grab hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400"><MessageSquareCode className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Prompt</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 cursor-grab hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400"><Bot className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">LLM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 cursor-grab hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400"><TerminalSquare className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Output</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/40" />
              
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Advanced</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 cursor-grab hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400"><Database className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Memory</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background/50 cursor-grab hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"><Cog className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tool</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Center Canvas */}
        <main className="flex-1 relative bg-surface">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-[#0A0A0B]"
          >
            <Background color="#ffffff" gap={24} size={1} variant={BackgroundVariant.Dots} className="opacity-5" />
            <Controls className="bg-card border-border/40 fill-foreground shadow-xl rounded-lg overflow-hidden" showInteractive={false} />
            <MiniMap 
              nodeColor="#16181D" 
              maskColor="rgba(10, 10, 11, 0.8)"
              className="bg-card/50 border border-border/40 rounded-lg shadow-xl" 
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
        <aside className="w-80 border-l border-border/40 bg-card/30 flex flex-col shrink-0 z-10 hidden xl:flex">
          <div className="p-4 border-b border-border/40">
            <h2 className="text-sm font-medium">Properties</h2>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <Cog className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Select a node on the canvas to configure its properties.</p>
          </div>
        </aside>
      </div>

      <ExecutionPanel open={isExecutionPanelOpen} onOpenChange={setIsExecutionPanelOpen} />
    </div>
  );
}
