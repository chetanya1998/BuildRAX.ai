"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Plus, Clock, Layers, ArrowRight } from "lucide-react";

export default function WorkflowsPage() {
  const { data, error, isLoading } = useSWR("/api/workflows", fetcher);
  const workflows = data?.workflows || [];

  if (isLoading && !data) {
    return <WorkflowsSkeleton />;
  }
  
  if (error) {
    console.error("Error fetching workflows:", error);
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Workflows</h1>
          <p className="text-muted-foreground mt-1">Manage your saved drafts and active AI experiments.</p>
        </div>
        <Button className="rounded-xl px-6" asChild>
          <Link href="/builder">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.length > 0 ? (
          workflows.map((workflow: any) => (
            <Card key={workflow._id} className="bg-card/30 border-border/40 hover:border-primary/50 hover:bg-card/50 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col">
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
                <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">{workflow.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2 text-sm leading-relaxed">
                  {workflow.description || "No description provided for this workflow."}
                </CardDescription>
              </CardHeader>
              <div className="flex-1" />
              <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center justify-between border-t border-border/10 mt-4 py-3 bg-secondary/5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 
                  <span>Edited {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                </div>
                <Link href={`/builder?id=${workflow._id}`} className="text-primary hover:underline font-medium flex items-center gap-1">
                  Open <ArrowRight className="w-3 h-3" />
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl bg-secondary/5 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-base max-w-sm mb-8">Start your AI building journey by creating a blank workflow or using a template.</p>
            <Button className="rounded-xl px-8" asChild>
              <Link href="/builder">Create First Workflow</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowsSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-primary/10" />
          <Skeleton className="h-4 w-64 bg-muted/50" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl bg-primary/20" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-2xl bg-card/40 border border-border/40 shimmer" />
        ))}
      </div>
    </div>
  );
}
