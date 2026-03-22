"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, BrainCircuit, PlayCircle, Trophy, Activity, Archive, PauseCircle, BellRing, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const { user, recentWorkflows } = data || {};
  
  // Calculate mock stats based on recent workflows for the command center
  const total = recentWorkflows?.length || 0;
  const activeCount = Math.floor(total * 0.6) || 0;
  const inactiveCount = Math.floor(total * 0.3) || 0;
  const archiveCount = total - activeCount - inactiveCount;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Welcome & Command Center Banner */}
      <div className="glass-panel p-6 md:p-10 rounded-3xl relative overflow-hidden bg-card/40 border border-border/40 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/30 transition-colors duration-700" />
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" /> Level {user?.level || 1}: {user?.nextBadgeTarget || "AI Explorer"}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              Command Center
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg leading-relaxed">
              Welcome back, {user?.name?.split(" ")[0] || "Builder"}. You are {user?.xpToNextLevel || 350} XP away from leveling up. Your AI agents are standing by.
            </p>
            <div className="mb-8">
              <div className="flex justify-between text-xs font-semibold mb-2 text-muted-foreground">
                <span>Progress to {user?.nextBadgeTarget || "Next Level"}</span>
                <span>{user?.currentXp || 0} / {user?.currentXp + user?.xpToNextLevel || 500} XP</span>
              </div>
              <Progress value={user?.progressPercentage || 30} className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden" />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button className="rounded-2xl px-8 h-12 text-base font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-all bg-primary hover:bg-primary/90" asChild>
                <Link href="/builder">
                  <BrainCircuit className="w-5 h-5 mr-2" /> Launch AI Architect
                </Link>
              </Button>
            </div>
          </div>

          {/* Today's Mission Card */}
          <div className="bg-background/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden border-t-white/10">
            <div className="absolute top-0 right-0 p-4">
              <Trophy className="w-12 h-12 text-yellow-500/20" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Today's Mission</h3>
            <h2 className="text-xl font-bold mb-2">Master the AI Architect</h2>
            <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
              Learn how to connect multiple LLM nodes, vector databases, and integrations in our interactive tutorial space.
            </p>
            <Button variant="secondary" className="w-full rounded-xl bg-secondary/50 hover:bg-secondary text-secondary-foreground" asChild>
              <Link href="/learn">
                <PlayCircle className="w-4 h-4 mr-2" /> Start Tutorial (+500 XP)
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Statistics & Telemetry */}
        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">System Telemetry</h2>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-5">
            <Card className="bg-card/30 border-border/40 hover:border-primary/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                  Active Flows <Activity className="w-4 h-4 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{activeCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently running in production</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 hover:border-yellow-500/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                  Inactive <PauseCircle className="w-4 h-4 text-yellow-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{inactiveCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Drafts and paused systems</p>
              </CardContent>
            </Card>

            <Card className="bg-card/30 border-border/40 hover:border-muted-foreground/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                  Archived <Archive className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{archiveCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Cold storage workflows</p>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4 flex justify-between items-center px-2">
            <p className="text-sm text-muted-foreground">Need to manage your projects?</p>
            <Button variant="ghost" className="text-primary hover:text-primary/80" asChild>
              <Link href="/workflows" className="flex items-center gap-1">
                Go to My Workflows <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Updates & Announcements */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-secondary" />
            <h2 className="text-2xl font-semibold tracking-tight">System Updates</h2>
          </div>
          <div className="flex flex-col gap-4">
            
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
              <Badge className="bg-primary text-primary-foreground mb-3 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">New Feature</Badge>
              <h4 className="font-bold text-lg mb-2">Expanded Node Library</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The AI Architect now supports 35+ advanced nodes including Stripe, Twitter, Pinecone, and Claude 3.5. 
              </p>
              <Button variant="link" className="p-0 h-auto text-primary flex items-center gap-1 text-sm font-semibold" asChild>
                <Link href="/builder">Try it out <ArrowRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>

            <div className="p-5 rounded-2xl bg-card/20 border border-border/40">
              <Badge variant="outline" className="mb-3 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase border-secondary/50 text-secondary">Templates</Badge>
              <h4 className="font-bold text-base mb-2">30 New Agent Templates</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                We've added dozens of pre-configured AI Agent architectures. One-click clone directly to the Builder!
              </p>
              <Button variant="link" className="p-0 h-auto text-foreground flex items-center gap-1 text-sm font-medium" asChild>
                <Link href="/templates">Browse Library <ArrowRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      <Skeleton className="h-[300px] w-full rounded-3xl" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid sm:grid-cols-3 gap-5">
            <Skeleton className="h-[120px] rounded-2xl" />
            <Skeleton className="h-[120px] rounded-2xl" />
            <Skeleton className="h-[120px] rounded-2xl" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-[180px] rounded-2xl" />
            <Skeleton className="h-[160px] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
