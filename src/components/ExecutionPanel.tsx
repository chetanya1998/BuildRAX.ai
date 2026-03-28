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
          <div className="px-6 border-b border-border/40">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
              <TabsTrigger value="flow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-wide text-muted-foreground data-[state=active]:text-foreground h-full">Flow Steps</TabsTrigger>
              <TabsTrigger value="prompt" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-wide text-muted-foreground data-[state=active]:text-foreground h-full">Prompt</TabsTrigger>
              <TabsTrigger value="optimizer" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-wide text-muted-foreground data-[state=active]:text-foreground h-full flex items-center gap-2 italic">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> Token Optimizer
              </TabsTrigger>
              <TabsTrigger value="context" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-wide text-muted-foreground data-[state=active]:text-foreground h-full">Context</TabsTrigger>
              <TabsTrigger value="output" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 tracking-wide text-muted-foreground data-[state=active]:text-foreground h-full">Output</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="flow" className="m-0 space-y-6">
              <div className="relative pl-6 border-l-2 border-border/40 space-y-8 ml-3">
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-background border-2 border-border/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-medium">
                        <MessageSquareCode className="w-4 h-4 text-blue-400" /> Input Captured
                      </div>
                      <span className="text-xs text-muted-foreground">0ms</span>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-sm font-mono text-muted-foreground">
                      "Help me plan a 3-day itinerary for Kyoto."
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-background border-2 border-border/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-medium">
                        <Database className="w-4 h-4 text-indigo-400" /> Memory Retrieval
                      </div>
                      <span className="text-xs text-muted-foreground">+120ms</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Found user preferences:</p>
                    <div className="bg-background/50 rounded-lg p-3 text-sm font-mono text-muted-foreground">
                      {"{"}
                        "likes": ["nature", "temples"],
                        "budget": "medium"
                      {"}"}
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-background border-2 border-border/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-primary/40 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-medium">
                        <BrainCircuit className="w-4 h-4 text-primary" /> Model Call (Claude 3.5)
                      </div>
                      <span className="text-xs text-muted-foreground">+950ms</span>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px] bg-background">temperature: 0.7</Badge>
                        <Badge variant="outline" className="text-[10px] bg-background">max_tokens: 2000</Badge>
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
