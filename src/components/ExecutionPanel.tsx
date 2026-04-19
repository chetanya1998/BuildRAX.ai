import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Clock, Gauge, Medal, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { NodeExecutionResult } from "@/lib/graph/types";

interface BenchmarkScore {
  variantId: string;
  model?: string;
  totalScore?: number;
  latencyMs: number;
  assertionPassRate: number;
  tokenUsage: number;
  cost: number;
}

interface ExecutionPanelData {
  mode: string;
  summary?: {
    status?: string;
    latencyMs?: number;
    tokenUsage?: number;
    cost?: number;
    warnings?: string[];
  };
  analysis?: {
    score?: number;
    feedback?: string;
    flaws?: string[];
    suggestedScenarios?: string[];
  };
  nodeResults?: NodeExecutionResult[];
  scores?: BenchmarkScore[];
  winnerVariantId?: string;
}

interface ExecutionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runData: ExecutionPanelData | null;
}

function renderValue(value: unknown) {
  if (value === undefined || value === null) return "None";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ExecutionPanel({ open, onOpenChange, runData }: ExecutionPanelProps) {
  const summary = runData?.summary || {};
  const analysis = runData?.analysis || {};
  const nodeResults = runData?.nodeResults || [];
  const scores = runData?.scores || [];
  const isBenchmark = scores.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col border-l border-white/10 bg-[#05070d]/96 p-0 backdrop-blur-2xl sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(8,12,20,0.96)_0%,rgba(7,10,16,0.9)_100%)] px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                <BrainCircuit className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <SheetTitle className="text-xl text-white">
                  {isBenchmark ? "Benchmark Results" : "Runtime Trace"}
                </SheetTitle>
                <SheetDescription className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {runData?.mode === "test"
                    ? "Inspect the test-mode scenario output."
                    : runData?.mode === "live"
                      ? "Inspect the live execution output."
                      : "Compare workflow variants and identify the winner."}
                </SheetDescription>
              </div>
            </div>
            <div className="mr-8 hidden items-center gap-4 text-sm text-muted-foreground lg:flex">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {summary.latencyMs || 0}ms
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" /> {summary.tokenUsage || 0} tokens
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="summary" className="flex-1 flex flex-col">
          <div className="border-b border-white/8 px-6 py-4">
            <TabsList className={`grid h-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1 ${isBenchmark ? "grid-cols-4" : "grid-cols-3"}`}>
              <TabsTrigger value="summary" className="rounded-xl py-2 text-xs">Summary</TabsTrigger>
              <TabsTrigger value="flow" className="rounded-xl py-2 text-xs">Node Trace</TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-xl py-2 text-xs">Analysis</TabsTrigger>
              {isBenchmark ? (
                <TabsTrigger value="benchmark" className="rounded-xl py-2 text-xs">
                  Benchmark
                </TabsTrigger>
              ) : null}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="summary" className="m-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                  <p className="text-lg font-bold text-white">{summary.status || "idle"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Cost</p>
                  <p className="text-lg font-bold text-white">${summary.cost || 0}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Latency</p>
                  <p className="text-lg font-bold text-white">{summary.latencyMs || 0}ms</p>
                </div>
              </div>

              {Array.isArray(summary.warnings) && summary.warnings.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-yellow-500" /> Warnings
                  </h4>
                  {summary.warnings.map((warning: string, index: number) => (
                    <div key={`warning-${index}`} className="rounded-2xl border border-yellow-500/20 bg-yellow-500/8 p-4 text-sm leading-relaxed text-yellow-50/90">
                      {warning}
                    </div>
                  ))}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="flow" className="m-0 space-y-4">
              {nodeResults.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
                  No node-level trace available yet.
                </div>
              ) : (
                nodeResults.map((result: NodeExecutionResult) => (
                  <div key={result.nodeId} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{result.nodeType}</p>
                        <p className="text-[11px] text-muted-foreground">{result.nodeId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={result.status === "failed" ? "destructive" : "secondary"}>
                          {result.status}
                        </Badge>
                        <Badge variant="outline">{result.metrics?.latencyMs || 0}ms</Badge>
                      </div>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-white/8 bg-black/30 p-3 text-[11px] text-muted-foreground">
                      {renderValue(result.outputs)}
                    </pre>
                    {result.error ? (
                      <div className="text-xs text-red-400">{result.error}</div>
                    ) : null}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="analysis" className="m-0 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Score</p>
                  <p className="text-xl font-black text-white">{analysis.score || 0}/100</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Feedback</p>
                  <p className="text-sm leading-relaxed text-white/90">{analysis.feedback || "No analysis available."}</p>
                </div>
              </div>

              {Array.isArray(analysis.flaws) && analysis.flaws.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Flaws
                  </h4>
                  {analysis.flaws.map((flaw: string, index: number) => (
                    <div key={`flaw-${index}`} className="rounded-2xl border border-red-500/20 bg-red-500/8 p-3 text-sm leading-relaxed">
                      {flaw}
                    </div>
                  ))}
                </div>
              ) : null}

              {Array.isArray(analysis.suggestedScenarios) && analysis.suggestedScenarios.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Suggested Scenarios
                  </h4>
                  {analysis.suggestedScenarios.map((scenario: string, index: number) => (
                    <div key={`scenario-${index}`} className="rounded-2xl border border-sky-400/20 bg-sky-500/8 p-3 text-sm leading-relaxed">
                      {scenario}
                    </div>
                  ))}
                </div>
              ) : null}
            </TabsContent>

            {isBenchmark ? (
              <TabsContent value="benchmark" className="m-0 space-y-4">
                {scores.map((score: BenchmarkScore) => (
                  <div key={score.variantId} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{score.variantId}</p>
                        <p className="text-[11px] text-muted-foreground">{score.model || "model"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {runData?.winnerVariantId === score.variantId ? (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                            <Medal className="w-3.5 h-3.5 mr-1" /> Winner
                          </Badge>
                        ) : null}
                        <Badge variant="outline">
                          <Gauge className="w-3.5 h-3.5 mr-1" /> {score.totalScore}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-3">Latency: {score.latencyMs}ms</div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-3">Assertion Pass: {Math.round(score.assertionPassRate * 100)}%</div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-3">Tokens: {score.tokenUsage}</div>
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-3">Cost: ${score.cost}</div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            ) : null}
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
