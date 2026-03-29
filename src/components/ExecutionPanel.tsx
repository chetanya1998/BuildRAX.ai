import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Clock, Database, Layers, MessageSquareCode, TerminalSquare, Zap, Sparkles, Wand2, Info } from "lucide-react";
import { FancyLoader } from "@/components/ui/FancyLoader";

export function ExecutionPanel({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const handleOptimize = async (prompt: string) => {
    try {
      setIsOptimizing(true);
      const res = await fetch("/api/architect/optimize", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        setOptimizationResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const mockOriginalPrompt = "You are an expert travel planner. The user likes nature and temples, with a medium budget. Provide a structured 3-day itinerary.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl border-l border-border/40 bg-background/95 backdrop-blur-xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border/40 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <SheetTitle className="text-xl">Execution Trace</SheetTitle>
                <SheetDescription>Inspect how your AI workflow ran step-by-step.</SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mr-8">
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 1.2s</div>
              <div className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> 843 tokens</div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="flow" className="flex-1 flex flex-col">
          <div className="px-6 border-b border-white/[0.05] bg-white/[0.02]">
            <TabsList className="bg-transparent h-14 w-full justify-start gap-8 rounded-none p-0">
              <TabsTrigger value="flow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-[0.1em] text-[11px] font-black uppercase text-muted-foreground data-[state=active]:text-white h-full transition-all relative">
                Flow Steps
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 data-[state=active]:scale-x-100 transition-transform origin-left" />
              </TabsTrigger>
              <TabsTrigger value="prompt" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-[0.1em] text-[11px] font-black uppercase text-muted-foreground data-[state=active]:text-white h-full transition-all">
                Prompt
              </TabsTrigger>
              <TabsTrigger value="optimizer" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-[0.1em] text-[11px] font-black uppercase text-muted-foreground data-[state=active]:text-white h-full transition-all flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> Token Optimizer
              </TabsTrigger>
              <TabsTrigger value="output" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-[0.1em] text-[11px] font-black uppercase text-muted-foreground data-[state=active]:text-white h-full transition-all">
                Output
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-8">
            <TabsContent value="flow" className="m-0 space-y-6">
              <div className="relative pl-8 border-l border-white/[0.08] space-y-10 ml-4 py-2">
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-[#0A0A0B] border border-white/[0.1] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="bg-[#121214] border border-white/[0.05] p-5 rounded-2xl shadow-2xl hover:border-white/10 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 font-bold text-sm text-white/90">
                        <MessageSquareCode className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" /> Input Captured
                      </div>
                      <Badge variant="ghost" className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest bg-white/[0.03]">0ms</Badge>
                    </div>
                    <div className="bg-black/40 border border-white/[0.03] rounded-xl p-4 text-xs font-mono text-muted-foreground leading-relaxed">
                      "Help me plan a 3-day itinerary for Kyoto."
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-[#0A0A0B] border border-white/[0.1] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  </div>
                  <div className="bg-[#121214] border border-white/[0.05] p-5 rounded-2xl shadow-2xl hover:border-white/10 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 font-bold text-sm text-white/90">
                        <Database className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" /> Memory Retrieval
                      </div>
                      <Badge variant="ghost" className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest bg-white/[0.03]">+120ms</Badge>
                    </div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 mb-3 px-1">Retrieved Context</p>
                    <div className="bg-black/40 border border-white/[0.03] rounded-xl p-4 text-xs font-mono text-muted-foreground leading-relaxed">
                      {"{"}
                        "likes": ["nature", "temples"],
                        "budget": "medium"
                      {"}"}
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-[#0A0A0B] border border-white/[0.1] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-pulse" />
                  </div>
                  <div className="bg-[#18181B] border border-primary/20 p-5 rounded-2xl shadow-[0_10px_40px_rgba(var(--primary),0.15)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-2.5 font-bold text-sm text-white">
                        <BrainCircuit className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> Model Call (Claude 3.5)
                      </div>
                      <Badge variant="default" className="text-[10px] font-black bg-primary/10 text-primary border-primary/20 uppercase tracking-widest">+950ms</Badge>
                    </div>
                    <div className="flex gap-2 relative z-10">
                        <Badge variant="outline" className="text-[10px] font-bold bg-black/40 border-white/5 px-2.5 py-1">temperature: 0.7</Badge>
                        <Badge variant="outline" className="text-[10px] font-bold bg-black/40 border-white/5 px-2.5 py-1">max_tokens: 2000</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="m-0 space-y-6">
               <div className="rounded-xl border border-border/40 overflow-hidden">
                 <div className="bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                   System Prompt
                 </div>
                 <div className="p-4 bg-background/50 font-mono text-sm leading-relaxed text-blue-200">
                   {mockOriginalPrompt}
                 </div>
                 <div className="bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y border-border/40">
                   User Message
                 </div>
                 <div className="p-4 bg-background/50 font-mono text-sm leading-relaxed text-foreground">
                   Help me plan a 3-day itinerary for Kyoto.
                 </div>
               </div>

               <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold">Optimization Available</p>
                      <p className="text-[11px] text-muted-foreground">Reduce tokens and overhead by 15-20%.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-primary/20 hover:bg-primary/10" onClick={() => handleOptimize(mockOriginalPrompt)} disabled={isOptimizing}>
                    {isOptimizing ? "Working..." : "Optimize Now"}
                  </Button>
               </div>
            </TabsContent>

            <TabsContent value="optimizer" className="m-0 space-y-6">
                {!optimizationResult && !isOptimizing ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Token Optimizer</h3>
                      <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                        Analyze and refine your prompts for better LLM performance and reduced token usage.
                      </p>
                    </div>
                    <Button onClick={() => handleOptimize(mockOriginalPrompt)} className="rounded-full px-8">
                       Start Analysis
                    </Button>
                  </div>
                ) : isOptimizing ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <FancyLoader text="Optimizing Prompt Structure..." />
                  </div>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Efficiency Gain</p>
                          <p className="text-2xl font-black text-green-400">{optimizationResult.estimatedTokenReduction}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Cost reduction</p>
                          <p className="text-2xl font-black text-blue-400">~$0.024/run</p>
                       </div>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl border-primary/20 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                       <div className="flex items-center gap-2 mb-4 text-primary">
                          <Wand2 className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-widest">Optimized Output</h4>
                       </div>
                       <div className="bg-background/40 p-4 rounded-xl border border-white/5 font-mono text-sm leading-relaxed text-primary-foreground/90">
                          {optimizationResult.optimizedPrompt}
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 px-1">
                          <Info className="w-3.5 h-3.5" /> Key Improvements
                       </h4>
                       <div className="space-y-2">
                          {optimizationResult.improvements.map((improvement: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40">
                               <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary shrink-0">{i+1}</div>
                               <p className="text-xs text-muted-foreground/80 leading-relaxed">{improvement}</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground/60 italic p-2 rounded-lg bg-card/40 border border-white/5">
                      <strong>AI Explanation:</strong> {optimizationResult.explanation}
                    </p>

                    <Button className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20">
                       Apply to Workflow
                    </Button>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="context" className="m-0">
               <div className="flex flex-col items-center justify-center h-64 text-center">
                 <Layers className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                 <p className="text-muted-foreground">No additional tool context or documents retrieved.</p>
               </div>
            </TabsContent>
            
            <TabsContent value="output" className="m-0">
               <div className="glass-panel p-6 rounded-2xl border-border/40 prose prose-invert max-w-none">
                 <h3 className="text-white">Day 1: Eastern Kyoto (Higashiyama)</h3>
                 <ul>
                    <li><strong>Morning:</strong> Kiyomizu-dera Temple early to beat crowds.</li>
                    <li><strong>Lunch:</strong> Sannen-zaka area (street food).</li>
                    <li><strong>Afternoon:</strong> Kodai-ji Temple and Maruyama Park.</li>
                 </ul>
                 <p className="text-muted-foreground text-sm italic mt-8">Generated in 1.2s</p>
               </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
