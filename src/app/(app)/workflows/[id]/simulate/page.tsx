"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Play, RefreshCw, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_SCENARIOS } from "@/lib/backend/simulation";
import { SimulationResult, SimulationScenarioId } from "@/lib/graph/types";

interface WorkflowPayload {
  _id: string;
  name: string;
  description?: string;
  metadata?: { latestSimulation?: SimulationResult };
}

const stepTone = {
  completed: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  failed: "border-rose-400/25 bg-rose-500/10 text-rose-100",
  blocked: "border-rose-400/25 bg-rose-500/10 text-rose-100",
  skipped: "border-slate-400/20 bg-slate-500/10 text-slate-200",
};

export default function SimulationPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const [workflow, setWorkflow] = useState<WorkflowPayload | null>(null);
  const [scenarioId, setScenarioId] = useState<SimulationScenarioId>("happy_path");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}`)
      .then((response) => response.json())
      .then((payload) => {
        setWorkflow(payload);
        setResult(payload.metadata?.latestSimulation || null);
      })
      .catch(() => toast.error("Failed to load workflow"));
  }, [workflowId]);

  const runSimulation = async (nextScenario = scenarioId) => {
    setIsRunning(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: nextScenario }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Simulation failed");
      setResult(payload.result);
      toast.success("Simulation complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Simulation failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 text-slate-400" asChild><Link href="/workflows"><ArrowLeft className="mr-2 h-4 w-4" /> Workflows</Link></Button>
          <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Simulation Sandbox</Badge>
          <h1 className="text-2xl font-semibold text-white">{workflow?.name || "Workflow Simulation"}</h1>
          <p className="mt-1 text-sm text-slate-400">{workflow?.description || "Run deterministic scenarios without executing real backend code."}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" asChild><Link href={`/builder?id=${workflowId}`}><Workflow className="mr-2 h-4 w-4" /> Builder</Link></Button>
          <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={() => runSimulation()} disabled={isRunning}>{isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Run</Button>
        </div>
      </div>

      <Tabs value={scenarioId} onValueChange={(value) => setScenarioId(value as SimulationScenarioId)}>
        <TabsList className="h-auto flex-wrap rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {DEFAULT_SCENARIOS.map((scenario) => (
            <TabsTrigger key={scenario.id} value={scenario.id} className="rounded-md px-3 py-2 text-xs" onClick={() => runSimulation(scenario.id)}>
              {scenario.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {result ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-lg border border-white/10 bg-[#101726]/55">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-white">Execution Trace</h2>
              <p className="mt-1 text-xs text-slate-500">{result.summary}</p>
            </div>
            <div className="divide-y divide-white/10">
              {result.trace.map((step, index) => (
                <div key={`${step.nodeId}-${index}`} className="grid gap-3 p-4 md:grid-cols-[40px_minmax(0,1fr)_120px]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-xs text-slate-400">{index + 1}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{step.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{step.message}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`rounded-md border text-[10px] ${stepTone[step.status]}`}>{step.status}</Badge>
                    <p className="mt-2 text-xs text-slate-500">{step.estimatedLatencyMs}ms</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <aside className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Status</p>
              <p className="mt-2 text-2xl font-semibold text-white">{result.status}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Bottleneck</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{result.bottleneckEstimate}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Missing Fallbacks</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{result.missingFallback.length > 0 ? result.missingFallback.join(", ") : "None detected for this scenario."}</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-16 text-center">
          <Play className="mb-3 h-9 w-9 text-[#6EA4FF]" />
          <h2 className="text-base font-semibold text-white">No simulation run yet</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">Choose a scenario and run deterministic graph simulation.</p>
          <Button className="mt-6 rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={() => runSimulation()}>Run simulation</Button>
        </div>
      )}
    </div>
  );
}
