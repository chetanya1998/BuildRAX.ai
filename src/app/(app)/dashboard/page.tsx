"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Plus, Sparkles, Clock, Globe, ArrowRight, Zap, Target } from "lucide-react";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Check if tutorial should be shown
    const tutorialSeen = localStorage.getItem("buildrax_tutorial_seen");
    if (!tutorialSeen) {
      setShowTutorial(true);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/summary");
      if (res.ok) {
        const json = await res.ok ? await res.json() : null;
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem("buildrax_tutorial_seen", "true");
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const { user, recentWorkflows, featuredTemplates } = data || {};

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}

      {/* Welcome Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden bg-card/40 border border-border/40 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/30 transition-colors duration-700" />
        <div className="relative z-10 max-w-2xl">
          <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 animate-pulse">
            <Sparkles className="w-3 h-3 mr-1" /> Level {user?.level || 1}: {user?.nextBadgeTarget || "AI Explorer"} ({user?.currentXp || 0}/{user?.currentXp + user?.xpToNextLevel || 500} XP)
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Welcome back, {user?.name?.split(" ")[0] || "Builder"}!
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg leading-relaxed">
            You're {user?.xpToNextLevel || 350} XP away from unlocking the "{user?.nextBadgeTarget || "Workflow Creator"}" badge. Keep experimenting with tools and memory nodes to level up.
          </p>
          <Progress value={user?.progressPercentage || 30} className="w-full h-3 mb-8 bg-surface-secondary rounded-full overflow-hidden" />
          <div className="flex flex-wrap gap-4">
            <Button className="rounded-2xl px-8 h-12 text-base font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-all" asChild>
              <Link href="/builder">
                <Plus className="w-5 h-5 mr-2" /> New Project
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl px-8 h-12 text-base bg-background/50 backdrop-blur-sm border-border/60 hover:bg-background/80 transition-all font-medium" asChild>
              <Link href="/learn">Continue Lesson</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <section className="col-span-1 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight">Recent Workflows</h2>
            </div>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium" asChild>
              <Link href="/projects" className="flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            {recentWorkflows?.length > 0 ? (
              recentWorkflows.map((workflow: any) => (
                <Card key={workflow._id} className="bg-card/30 border-border/40 hover:border-primary/50 hover:bg-card/50 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                  {workflow.isDemo && (
                    <Badge className="absolute top-3 right-3 bg-secondary/80 text-secondary-foreground text-[10px] uppercase font-bold backdrop-blur-sm">Demo</Badge>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-2 py-0.5">
                        {workflow.isPublic ? "Public" : "Private"}
                      </Badge>
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-md">
                        <Play className="w-4 h-4 text-primary fill-primary" />
                      </Button>
                    </div>
                    <CardTitle className="text-xl mt-3 group-hover:text-primary transition-colors">{workflow.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1.5 text-sm leading-relaxed">
                      {workflow.description || "No description provided for this workflow."}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-2 border-t border-border/10 mt-2 py-3 bg-secondary/5">
                    <Clock className="w-3.5 h-3.5" /> 
                    <span>Edited {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl bg-secondary/5 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No workflows found</h3>
                <p className="text-muted-foreground text-sm max-w-xs mb-6">Start your first AI journey by creating a new workflow from scratch.</p>
                <Button variant="secondary" className="rounded-xl px-6" asChild>
                  <Link href="/builder">Create First Workflow</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Suggested Templates */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary" />
            <h2 className="text-2xl font-semibold tracking-tight">Starter Templates</h2>
          </div>
          <div className="flex flex-col gap-4">
            {featuredTemplates?.map((tmpl: any, i: number) => (
              <div 
                key={tmpl._id || i} 
                className="p-5 rounded-2xl bg-card/20 border border-border/40 hover:bg-card/40 hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center group shadow-sm hover:shadow-md"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-base group-hover:text-primary transition-colors">{tmpl.name}</h4>
                  <p className="text-xs text-muted-foreground tracking-wide font-medium bg-secondary/20 inline-block px-2 py-0.5 rounded-lg">{tmpl.category || "General"}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed h-14 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/20 hover:border-border transition-all mt-2" asChild>
              <Link href="/templates" className="flex items-center justify-center gap-2">
                Explore Template Gallery <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
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
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Skeleton className="h-[180px] rounded-2xl" />
            <Skeleton className="h-[180px] rounded-2xl" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-[80px] rounded-xl" />
            <Skeleton className="h-[80px] rounded-xl" />
            <Skeleton className="h-[80px] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
