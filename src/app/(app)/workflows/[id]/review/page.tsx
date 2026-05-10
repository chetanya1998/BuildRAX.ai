"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RefreshCw, ShieldCheck, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewResult } from "@/lib/graph/types";

interface WorkflowPayload {
  _id: string;
  name: string;
  description?: string;
  graph?: unknown;
  metadata?: { latestReview?: ReviewResult };
}

const severityClass = {
  critical: "border-rose-400/30 bg-rose-500/10 text-rose-100",
  high: "border-orange-400/30 bg-orange-500/10 text-orange-100",
  medium: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  low: "border-blue-400/30 bg-blue-500/10 text-blue-100",
  info: "border-slate-400/20 bg-slate-500/10 text-slate-200",
};

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const [workflow, setWorkflow] = useState<WorkflowPayload | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}`)
      .then((response) => response.json())
      .then((payload) => {
        setWorkflow(payload);
        setReview(payload.metadata?.latestReview || null);
      })
      .catch(() => toast.error("Failed to load workflow"));
  }, [workflowId]);

  const runReview = async () => {
    setIsRunning(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/review`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Review failed");
      setReview(payload.result);
      toast.success("Review complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 text-slate-400" asChild><Link href="/workflows"><ArrowLeft className="mr-2 h-4 w-4" /> Workflows</Link></Button>
          <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Deterministic Review</Badge>
          <h1 className="text-2xl font-semibold text-white">{workflow?.name || "Workflow Review"}</h1>
          <p className="mt-1 text-sm text-slate-400">{workflow?.description || "Rule-based architecture, security, reliability, and observability checks."}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" asChild><Link href={`/builder?id=${workflowId}`}><Workflow className="mr-2 h-4 w-4" /> Builder</Link></Button>
          <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={runReview} disabled={isRunning}>{isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Run Review</Button>
        </div>
      </div>

      {review ? (
        <>
          <section className="grid gap-3 md:grid-cols-5">
            {Object.entries(review.scores).map(([label, score]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{score}</p>
              </div>
            ))}
          </section>
          <section className="rounded-lg border border-white/10 bg-[#101726]/55">
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              {review.status === "blocked" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
              <div>
                <h2 className="text-sm font-semibold text-white">{review.summary}</h2>
                <p className="text-xs text-slate-500">{review.issues.length} actionable findings</p>
              </div>
            </div>
            <div className="divide-y divide-white/10">
              {review.issues.length > 0 ? review.issues.map((issue) => (
                <div key={issue.id} className="grid gap-4 p-4 lg:grid-cols-[160px_minmax(0,1fr)_260px]">
                  <div>
                    <Badge className={`rounded-md border text-[10px] ${severityClass[issue.severity]}`}>{issue.severity}</Badge>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">{issue.category.replaceAll("_", " ")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{issue.description}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{issue.whyItMatters}</p>
                    <p className="mt-3 text-sm text-[#9EC0FF]">{issue.suggestedFix}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Pattern</p>
                    <p className="mt-1 text-xs font-medium text-white">{issue.designPatternReference}</p>
                    <p className="mt-2 text-xs text-slate-500">{issue.affectedNodeLabel || "Workflow-level check"}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-sm text-slate-400">No review issues found.</div>
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-16 text-center">
          <ShieldCheck className="mb-3 h-9 w-9 text-[#6EA4FF]" />
          <h2 className="text-base font-semibold text-white">No review run yet</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">Run deterministic checks to find architecture, security, reliability, and observability gaps.</p>
          <Button className="mt-6 rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={runReview}>Run review</Button>
        </div>
      )}
    </div>
  );
}
