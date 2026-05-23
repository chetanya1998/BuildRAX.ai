"use client";

import Link from "next/link";
import useSWR from "swr";
import type { LucideIcon } from "lucide-react";
import { 
  FileCode2, 
  Layers, 
  Play, 
  Plus, 
  ShieldCheck, 
  Workflow, 
  FileBox,
  MoreVertical,
  Clock
} from "lucide-react";
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

const quickTemplates = [
  { name: "Blank Project", desc: "Start from scratch", href: "/workflows/new", icon: Plus, isPrimary: true },
  { name: "SaaS Auth Backend", desc: "Sessions, permissions", href: "/templates/auth", icon: FileBox, isPrimary: false },
  { name: "AI Agent Skills", desc: "Generate tool schemas", href: "/templates/agent", icon: FileBox, isPrimary: false },
  { name: "Queue Worker", desc: "Async processing", href: "/templates/queue", icon: FileBox, isPrimary: false },
];

export default function DashboardPage() {
  const { data, isLoading } = useSWR("/api/dashboard/summary", fetcher);
  const workflows = (data?.recentWorkflows || []) as WorkflowItem[];
  const reviewed = workflows.filter((item) => ["reviewed", "has_critical_issues"].includes(item.lifecycle || "")).length;
  const simulated = workflows.filter((item) => item.lifecycle === "simulated").length;
  const exported = workflows.filter((item) => item.lifecycle === "exported").length;

  if (isLoading && !data) return <DashboardSkeleton />;

  const statCards: Array<[string, number, LucideIcon]> = [
    ["Saved Workflows", workflows.length, Layers],
    ["Reviewed", reviewed, ShieldCheck],
    ["Simulated", simulated, Play],
    ["Exported", exported, FileCode2],
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 pb-16 md:p-8">
      
      {/* Top Section: Start New Project */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-slate-300">Start a new project</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {quickTemplates.map((template) => (
            <Link 
              key={template.name} 
              href={template.href}
              className={`group relative flex h-40 flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                template.isPrimary 
                ? "border-[#2F7BFF]/30 bg-[#2F7BFF]/10 hover:border-[#2F7BFF] hover:bg-[#2F7BFF]/20" 
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${template.isPrimary ? "bg-[#2F7BFF] text-white" : "bg-white/[0.08] text-slate-300 group-hover:bg-white/[0.15]"}`}>
                <template.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-white">{template.name}</p>
              <p className="mt-1 text-xs text-slate-500">{template.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Middle Section: Subtle Stats */}
      <section className="flex flex-wrap items-center gap-6 rounded-xl border border-white/5 bg-white/[0.01] p-4 text-sm">
        <span className="font-medium text-slate-400">Activity:</span>
        {statCards.map(([label, value, Icon]) => (
          <div key={label} className="flex items-center gap-2 text-slate-300">
            <Icon className="h-4 w-4 text-slate-500" />
            <span className="font-semibold text-white">{value}</span>
            <span className="text-slate-500">{label}</span>
          </div>
        ))}
      </section>

      {/* Bottom Section: Recent Projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Recent projects</h2>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-white" asChild>
            <Link href="/workflows">View all</Link>
          </Button>
        </div>
        
        {workflows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {workflows.map((workflow) => (
              <div 
                key={workflow._id} 
                className="group relative flex flex-col rounded-xl border border-white/10 bg-[#101726]/50 p-5 transition-all hover:border-[#2F7BFF]/40 hover:shadow-[0_8px_24px_rgba(47,123,255,0.08)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <h3 className="mb-1 truncate font-semibold text-white">{workflow.name}</h3>
                <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {workflow.description || "No description provided. Add one to help identify this project."}
                </p>
                
                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <Badge className={`rounded border px-1.5 py-0 text-[9px] uppercase tracking-wider ${statusTone(workflow.lifecycle)}`}>
                    {workflow.lifecycle || "draft"}
                  </Badge>
                </div>

                <Link href={`/builder?id=${workflow._id}`} className="absolute inset-0 z-10">
                  <span className="sr-only">Open {workflow.name}</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01] py-20 text-center">
            <Workflow className="mb-4 h-10 w-10 text-slate-600" />
            <h3 className="text-sm font-semibold text-white">No projects yet</h3>
            <p className="mt-1 text-xs text-slate-500">Create a blank project or start from a template above.</p>
          </div>
        )}
      </section>

    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 md:p-8">
      <div className="space-y-4">
        <Skeleton className="h-5 w-32 bg-white/[0.04]" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-xl bg-white/[0.04]" />)}
        </div>
      </div>
      <Skeleton className="h-14 rounded-xl bg-white/[0.04]" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-32 bg-white/[0.04]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl bg-white/[0.04]" />)}
        </div>
      </div>
    </div>
  );
}
