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
import { BrainCircuit, Clock, Database, Layers, MessageSquareCode, TerminalSquare, Zap } from "lucide-react";

export function ExecutionPanel({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
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

            <TabsContent value="prompt" className="m-0">
               <div className="rounded-xl border border-border/40 overflow-hidden">
                 <div className="bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                   System Prompt
                 </div>
                 <div className="p-4 bg-background/50 font-mono text-sm leading-relaxed text-blue-200">
                   You are an expert travel planner. The user likes nature and temples, with a medium budget. Provide a structured 3-day itinerary.
                 </div>
                 <div className="bg-card/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y border-border/40">
                   User Message
                 </div>
                 <div className="p-4 bg-background/50 font-mono text-sm leading-relaxed text-foreground">
                   Help me plan a 3-day itinerary for Kyoto.
                 </div>
               </div>
            </TabsContent>

            <TabsContent value="context" className="m-0">
               <div className="flex flex-col items-center justify-center h-64 text-center">
                 <Layers className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                 <p className="text-muted-foreground">No additional tool context or documents retrieved.</p>
               </div>
            </TabsContent>
            
            <TabsContent value="output" className="m-0">
               <div className="glass-panel p-6 rounded-2xl border-border/40 prose prose-invert max-w-none">
                 <h3>Day 1: Eastern Kyoto (Higashiyama)</h3>
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
