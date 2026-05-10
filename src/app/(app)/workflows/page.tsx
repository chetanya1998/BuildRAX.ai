"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { Archive, Copy, FileCode2, GitBranch, MoreHorizontal, Play, Plus, RotateCcw, ShieldCheck, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/fetcher";

interface WorkflowListItem {
  _id: string;
  name: string;
  description?: string;
  lifecycle?: string;
  updatedAt: string;
  nodes?: unknown[];
  edges?: unknown[];
}

function statusClass(status?: string) {
  if (status === "has_critical_issues") return "border-rose-400/25 bg-rose-500/10 text-rose-200";
  if (status === "reviewed") return "border-blue-400/25 bg-blue-500/10 text-blue-200";
  if (status === "simulated") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  if (status === "exported") return "border-cyan-400/25 bg-cyan-500/10 text-cyan-200";
  if (status === "archived") return "border-slate-400/20 bg-slate-500/10 text-slate-300";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR("/api/workflows", fetcher);
  const [busyId, setBusyId] = useState<string | null>(null);
  const workflows = (data?.workflows || []) as WorkflowListItem[];

  const postAction = async (workflowId: string, action: "duplicate" | "archive" | "restore") => {
    setBusyId(workflowId);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/${action}`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `${action} failed`);
      toast.success(action === "duplicate" ? "Workflow duplicated" : action === "archive" ? "Workflow archived" : "Workflow restored");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${action} failed`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    setBusyId(workflowId);
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Delete failed");
      toast.success("Workflow deleted");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading && !data) return <WorkflowsSkeleton />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Architecture Inventory</Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Backend Workflows</h1>
          <p className="mt-1 text-sm text-slate-400">Manage drafts, reviewed architectures, simulations, exports, and archived backend plans.</p>
        </div>
        <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" asChild>
          <Link href="/workflows/new"><Plus className="mr-2 h-4 w-4" /> New Workflow</Link>
        </Button>
      </div>

      {workflows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-[#101726]/55">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_160px_210px] border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <span>Workflow</span>
            <span>Status</span>
            <span>Updated</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-white/10">
            {workflows.map((workflow) => (
              <div key={workflow._id} className="grid grid-cols-[minmax(0,1fr)_120px_160px_210px] items-center gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/builder?id=${workflow._id}`} className="truncate text-sm font-semibold text-white hover:text-[#9EC0FF]">{workflow.name}</Link>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{workflow.description || "No description provided."}</p>
                </div>
                <Badge className={`w-fit rounded-md border text-[10px] ${statusClass(workflow.lifecycle)}`}>{workflow.lifecycle || "draft"}</Badge>
                <p className="text-xs text-slate-500">{new Date(workflow.updatedAt).toLocaleDateString()}</p>
                <div className="flex justify-end gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.03]" asChild><Link href={`/builder?id=${workflow._id}`}><Workflow className="h-3.5 w-3.5" /></Link></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.03]" asChild><Link href={`/workflows/${workflow._id}/review`}><ShieldCheck className="h-3.5 w-3.5" /></Link></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.03]" asChild><Link href={`/workflows/${workflow._id}/simulate`}><Play className="h-3.5 w-3.5" /></Link></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]" disabled={busyId === workflow._id}>
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-white/10 bg-[#101726]">
                      <DropdownMenuItem onClick={() => postAction(workflow._id, "duplicate")}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => postAction(workflow._id, "archive")}><Archive className="mr-2 h-3.5 w-3.5" /> Archive</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => postAction(workflow._id, "restore")}><RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow._id}/mermaid`)}><GitBranch className="mr-2 h-3.5 w-3.5" /> Mermaid</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow._id}/exports`)}><FileCode2 className="mr-2 h-3.5 w-3.5" /> Exports</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteWorkflow(workflow._id)} className="text-rose-300 focus:text-rose-300"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-16 text-center">
          <Workflow className="mb-3 h-9 w-9 text-[#6EA4FF]" />
          <h3 className="text-base font-semibold text-white">No backend workflows yet</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">Create a workflow from a blank canvas, template, Mermaid diagram, or JSON import.</p>
          <Button className="mt-6 rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" asChild><Link href="/workflows/new">Start planning</Link></Button>
        </div>
      )}
    </div>
  );
}

function WorkflowsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-20 rounded-lg bg-white/[0.04]" />
      <Skeleton className="h-96 rounded-lg bg-white/[0.04]" />
    </div>
  );
}
