"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Braces, Check, FileJson, GitBranch, LayoutTemplate, Loader2, Plus, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDefaultNodeData } from "@/lib/graph/catalog";
import { WorkflowGraph } from "@/lib/graph/types";

type StartOptionId = "blank" | "template" | "mermaid" | "json";

const starts: Array<{ id: StartOptionId; title: string; copy: string; icon: typeof Workflow; action: string }> = [
  { id: "blank", title: "Blank Canvas", copy: "Start with a minimal API/auth/database/logging baseline.", icon: Workflow, action: "Create blank workflow" },
  { id: "template", title: "Template", copy: "Choose a backend blueprint from the template library.", icon: LayoutTemplate, action: "Open templates" },
  { id: "mermaid", title: "Import Mermaid", copy: "Paste an existing diagram and refine it in BuildRAX.", icon: GitBranch, action: "Paste Mermaid" },
  { id: "json", title: "Import JSON", copy: "Bring in a workflow JSON graph.", icon: FileJson, action: "Paste JSON" },
];

function blankGraph(name: string, description: string): WorkflowGraph {
  return {
    version: "1.0",
    metadata: { name, description, mode: "design", tags: ["backend-architecture"] },
    nodes: [
      { id: "api-1", type: "http_trigger", position: { x: 80, y: 120 }, data: getDefaultNodeData("http_trigger") },
      { id: "auth-1", type: "auth_node", position: { x: 410, y: 120 }, data: getDefaultNodeData("auth_node") },
      { id: "db-1", type: "database_write", position: { x: 740, y: 120 }, data: getDefaultNodeData("database_write") },
      { id: "logger-1", type: "logger", position: { x: 1070, y: 120 }, data: getDefaultNodeData("logger") },
    ],
    edges: [
      { id: "api-auth", source: "api-1", target: "auth-1", animated: true },
      { id: "auth-db", source: "auth-1", target: "db-1", animated: true },
      { id: "db-logger", source: "db-1", target: "logger-1", animated: true },
    ],
  };
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState("Backend Workflow");
  const [description, setDescription] = useState("Plan a production backend flow before implementation.");
  const [selected, setSelected] = useState<StartOptionId>("blank");
  const [importPayload, setImportPayload] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectStartingPoint = (optionId: StartOptionId) => {
    if (optionId === "template") {
      router.push("/templates");
      return;
    }
    if (optionId === "blank") {
      createWorkflow("blank");
      return;
    }
    setSelected(optionId);
  };

  const createWorkflow = async (mode: StartOptionId = selected) => {
    if (mode === "template") {
      router.push("/templates");
      return;
    }
    setIsCreating(true);
    try {
      let graph = blankGraph(name, description);
      if (mode === "json" && importPayload.trim()) {
        const parsed = JSON.parse(importPayload) as WorkflowGraph;
        graph = { ...parsed, metadata: { ...(parsed.metadata || {}), name, description } };
      }
      if (mode === "mermaid") {
        graph.metadata.assumptions = ["Imported Mermaid parsing is stored as source text for MVP refinement."];
        graph.metadata.mermaid = importPayload;
      }
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, graph, nodes: graph.nodes, edges: graph.edges, lifecycle: "draft" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to create workflow");
      toast.success("Workflow created");
      router.push(`/builder?id=${payload._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create workflow");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-10 md:p-8">
      <div>
        <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">New Workflow</Badge>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Choose a backend starting point.</h1>
        <p className="mt-1 text-sm text-slate-400">AI prompt generation is disabled for this MVP. Start from deterministic inputs.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {starts.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => selectStartingPoint(option.id)}
              disabled={isCreating}
              aria-pressed={selected === option.id}
              className={`group relative cursor-pointer rounded-lg border p-4 text-left shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(0,0,0,0.24),0_0_34px_rgba(47,123,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7BFF]/70 disabled:cursor-not-allowed disabled:opacity-60 ${
                selected === option.id
                  ? "border-[#2F7BFF]/70 bg-[#2F7BFF]/16 shadow-[0_0_34px_rgba(47,123,255,0.18)]"
                  : "border-white/10 bg-white/[0.03] hover:border-[#2F7BFF]/45 hover:bg-[#101726]/90"
              }`}
            >
              {selected === option.id ? (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#2F7BFF] text-white shadow-[0_0_18px_rgba(47,123,255,0.45)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : null}
              <option.icon className="mb-4 h-5 w-5 text-[#9EC0FF] transition group-hover:scale-110 group-hover:text-white" />
              <h2 className="text-sm font-semibold text-white">{option.title}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">{option.copy}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#9EC0FF] transition group-hover:text-white">
                {option.action}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>

        <aside className="rounded-lg border border-white/10 bg-[#101726]/55 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Workflow Name</Label>
              <Input className="rounded-lg border-white/10 bg-black/20" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Description</Label>
              <Textarea className="min-h-24 rounded-lg border-white/10 bg-black/20" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            {selected === "json" || selected === "mermaid" ? (
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{selected === "json" ? "Workflow JSON" : "Mermaid Source"}</Label>
                <Textarea className="min-h-40 rounded-lg border-white/10 bg-black/20 font-mono text-xs" value={importPayload} onChange={(event) => setImportPayload(event.target.value)} />
              </div>
            ) : null}
            <Button className="w-full rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={() => createWorkflow()} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Continue
            </Button>
            <Button variant="outline" className="w-full rounded-lg border-white/10 bg-white/[0.03]" asChild>
              <Link href="/workflows"><Braces className="mr-2 h-4 w-4" /> Back to workflows</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
