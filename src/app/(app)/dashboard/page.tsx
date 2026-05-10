"use client";

import Link from "next/link";
import useSWR from "swr";
import type { LucideIcon } from "lucide-react";
import { Activity, ArrowRight, CheckCircle2, FileCode2, GitBranch, Layers, Library, Play, Plus, ShieldCheck, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from "@/lib/fetcher";

interface WorkflowItem {
  _id: string;
  name: string;
  description?: string;
  lifecycle?: string;
  updatedAt: string;
  nodes?: unknown[];
  edges?: unknown[];
}

function statusTone(status?: string) {
  if (status === "has_critical_issues") return "border-rose-400/25 bg-rose-500/10 text-rose-200";
  if (status === "reviewed") return "border-blue-400/25 bg-blue-500/10 text-blue-200";
  if (status === "simulated") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  if (status === "exported") return "border-cyan-400/25 bg-cyan-500/10 text-cyan-200";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard/summary", fetcher);
  const workflows = (data?.recentWorkflows || []) as WorkflowItem[];
  const reviewed = workflows.filter((item) => ["reviewed", "has_critical_issues"].includes(item.lifecycle || "")).length;
  const simulated = workflows.filter((item) => item.lifecycle === "simulated").length;
  const exported = workflows.filter((item) => item.lifecycle === "exported").length;

  if (isLoading && !data) return <DashboardSkeleton />;

  const statCards: Array<[string, number, LucideIcon, string]> = [
    ["Workflows", workflows.length, Layers, "Saved backend blueprints"],
    ["Reviewed", reviewed, ShieldCheck, "Rule-based review runs"],
    ["Simulated", simulated, Play, "Scenario simulations"],
    ["Exported", exported, FileCode2, "Developer artifacts"],
  ];
  const flowSteps: Array<[LucideIcon, string, string]> = [
    [CheckCircle2, "Build", "Drag backend components into a clear graph."],
    [ShieldCheck, "Review", "Run deterministic architecture and security checks."],
    [Play, "Simulate", "Test happy path, failure, timeout, load, and misuse."],
    [GitBranch, "Diagram", "Generate and edit Mermaid documentation."],
    [FileCode2, "Export", "Create developer-ready artifacts."],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-8">
      <section className="rounded-lg border border-white/10 bg-[#101726]/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Backend Architecture Workspace</Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Design backend workflows before writing code.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Map APIs, services, data stores, queues, webhooks, and operational controls. Review and simulate architecture before engineering commits to implementation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" asChild>
              <Link href="/workflows/new"><Plus className="mr-2 h-4 w-4" /> New Workflow</Link>
            </Button>
            <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" asChild>
              <Link href="/templates"><Library className="mr-2 h-4 w-4" /> Templates</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {statCards.map(([label, value, Icon, copy]) => (
          <div key={String(label)} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-[#6EA4FF]" />
            </div>
            <p className="text-3xl font-semibold text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{copy}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-white/10 bg-[#101726]/55">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Workflows</h2>
              <p className="text-xs text-slate-500">Continue reviewing, simulating, or exporting active backend plans.</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[#9EC0FF]" asChild>
              <Link href="/workflows">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="divide-y divide-white/10">
            {workflows.length > 0 ? workflows.slice(0, 6).map((workflow) => (
              <div key={workflow._id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-white">{workflow.name}</h3>
                    <Badge className={`rounded-md border text-[10px] ${statusTone(workflow.lifecycle)}`}>{workflow.lifecycle || "draft"}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{workflow.description || "No description provided."}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10 bg-white/[0.03]" asChild>
                    <Link href={`/builder?id=${workflow._id}`}><Workflow className="mr-1.5 h-3.5 w-3.5" /> Builder</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10 bg-white/[0.03]" asChild>
                    <Link href={`/workflows/${workflow._id}/review`}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Review</Link>
                  </Button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <Workflow className="mb-3 h-8 w-8 text-[#6EA4FF]" />
                <h3 className="text-sm font-semibold text-white">No backend workflows yet</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-500">Start from a blank canvas or a backend blueprint template.</p>
                <Button className="mt-5 rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" asChild>
                  <Link href="/workflows/new">Create first workflow</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-[#101726]/55 p-4">
            <h2 className="text-sm font-semibold text-white">MVP Flow</h2>
            <div className="mt-4 space-y-3">
              {flowSteps.map(([Icon, title, copy]) => (
                <div key={String(title)} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2F7BFF]/20 bg-[#2F7BFF]/10">
                    <Icon className="h-4 w-4 text-[#9EC0FF]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{title}</p>
                    <p className="text-xs leading-5 text-slate-500">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#2F7BFF]/20 bg-[#2F7BFF]/10 p-4">
            <Activity className="mb-3 h-5 w-5 text-[#9EC0FF]" />
            <h2 className="text-sm font-semibold text-white">No AI dependency</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">The core MVP runs without model providers, prompt generation, credits, or code execution. Every check is deterministic.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-40 rounded-lg bg-white/[0.04]" />
      <div className="grid gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 rounded-lg bg-white/[0.04]" />)}
      </div>
      <Skeleton className="h-96 rounded-lg bg-white/[0.04]" />
    </div>
  );
}
