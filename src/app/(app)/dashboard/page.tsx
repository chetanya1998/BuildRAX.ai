"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, BrainCircuit, Activity, Archive, PauseCircle, ArrowRight, Layers, Plus } from "lucide-react";

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR("/api/dashboard/summary", fetcher);

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    console.error("Error fetching dashboard data:", error);
  }

  const { user, recentWorkflows } = data || {};
  
  // Calculate mock stats based on recent workflows for the command center
  const total = recentWorkflows?.length || 0;
  const activeCount = Math.floor(total * 0.6) || 0;
  const inactiveCount = Math.floor(total * 0.3) || 0;
  const archiveCount = total - activeCount - inactiveCount;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-10">
      
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 px-6 py-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-3 bg-primary/10 text-primary border-primary/20 text-xs">
              <Sparkles className="w-3 h-3 mr-1" /> Level {user?.level || 1}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Builder"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.xpToNextLevel || 350} XP to next level
            </p>
            <div className="mt-3 w-48">
              <Progress value={user?.progressPercentage || 30} className="h-1.5 bg-surface-secondary rounded-full" />
            </div>
          </div>
          <Button className="rounded-xl px-5 h-9 text-sm font-medium" asChild>
            <Link href="/builder">
              <BrainCircuit className="w-4 h-4 mr-2" /> Launch AI Architect
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 hover:border-green-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Flows</p>
            <Activity className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Running in production</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/30 p-4 hover:border-yellow-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inactive</p>
            <PauseCircle className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold">{inactiveCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Drafts and paused</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/30 p-4 hover:border-muted-foreground/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Archived</p>
            <Archive className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{archiveCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Cold storage</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 ml-1">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Quick Start</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-4">
        <Link href="/builder" className="block outline-none group focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl">
          <div className="h-full rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent p-5 hover:border-sky-500/40 hover:bg-sky-500/15 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-sky-500/20 rounded-lg text-sky-400">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-white">Create Blank Workflow</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">Start from scratch with the visual AI architect canvas. Build custom automation logic exactly how you need it.</p>
            <div className="flex items-center text-sm font-semibold text-sky-400 group-hover:text-sky-300">
              Open Canvas <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        <Link href="/templates" className="block outline-none group focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl">
          <div className="h-full rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 hover:border-emerald-500/40 hover:bg-emerald-500/15 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-white">Start from Template</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6">Deploy production-ready setups instantly. Choose from 50+ pre-built marketing, sales, scraping, and analytics pipelines.</p>
            <div className="flex items-center text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
              Browse Templates <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden">
          <Badge className="bg-primary text-primary-foreground mb-2 text-[10px] font-bold tracking-widest uppercase rounded-md">New Feature</Badge>
          <h4 className="font-semibold mb-1">Expanded Node Library</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            35+ advanced nodes including Stripe, Twitter, Pinecone, and Claude 3.5.
          </p>
          <Button variant="link" className="p-0 h-auto text-primary text-xs font-semibold flex items-center gap-1" asChild>
            <Link href="/builder">Try it out <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/20 p-4">
          <Badge variant="outline" className="mb-2 text-[10px] font-bold tracking-widest uppercase border-secondary/50 text-secondary rounded-md">Templates</Badge>
          <h4 className="font-semibold mb-1">100+ Enterprise Blueprints</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Launch production-ready systems for B2B, Fintech, E-Commerce, HR, and more.
          </p>
          <Button variant="link" className="p-0 h-auto text-foreground text-xs font-medium flex items-center gap-1" asChild>
            <Link href="/templates">Browse Library <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Manage your projects</p>
        <Button variant="ghost" className="text-primary hover:text-primary/80 text-xs h-8" asChild>
          <Link href="/workflows" className="flex items-center gap-1">
            My Workflows <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      <Skeleton className="h-[300px] w-full rounded-[2rem] bg-card/40 border border-border/40 shimmer" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Skeleton className="h-8 w-48 bg-primary/10" />
          <div className="grid sm:grid-cols-3 gap-5">
            <Skeleton className="h-[120px] rounded-2xl bg-card/30 border border-border/40 shimmer" />
            <Skeleton className="h-[120px] rounded-2xl bg-card/30 border border-border/40 shimmer" />
            <Skeleton className="h-[120px] rounded-2xl bg-card/30 border border-border/40 shimmer" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-secondary/10" />
          <div className="space-y-4">
            <Skeleton className="h-[180px] rounded-2xl bg-card/20 border border-border/40 shimmer" />
            <Skeleton className="h-[160px] rounded-2xl bg-card/20 border border-border/40 shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
