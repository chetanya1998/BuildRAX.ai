import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, History, RotateCcw, BarChart3, ChevronRight, Zap, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Version {
  _id: string;
  name: string;
  createdAt: string;
  benchmarks: {
    latency: number;
    tokens: number;
    cost: number;
    successRate: number;
  };
}

export function VersionHistoryPanel({ 
  open, 
  onOpenChange, 
  workflowId,
  onRestore
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  workflowId?: string,
  onRestore: (version: any) => void
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && workflowId) {
      fetchVersions();
    }
  }, [open, workflowId]);

  const fetchVersions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/workflows/${workflowId}/versions`);
      if (res.ok) {
        setVersions(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-border/40 bg-background/95 backdrop-blur-xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border/40 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Version History</SheetTitle>
              <SheetDescription>Compare outputs and benchmark different iterations.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground animate-pulse">Loading history...</div>
            ) : versions.length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-50">
                <Clock className="w-12 h-12 mx-auto" />
                <p className="text-sm">No versions saved yet.</p>
              </div>
            ) : (
              versions.map((v, i) => (
                <div key={v._id} className="relative group">
                  {i < versions.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-border/40" />
                  )}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-border/40 bg-background flex items-center justify-center shrink-0 z-10 transition-colors group-hover:border-primary/50">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground group-hover:bg-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold tracking-tight">{v.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {formatDistanceToNow(new Date(v.createdAt))} ago
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => onRestore(v)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-card border border-border/40 space-y-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                             <Zap className="w-3 h-3 text-yellow-500" /> Latency
                          </p>
                          <p className="text-xs font-black">{v.benchmarks.latency}ms</p>
                        </div>
                        <div className="p-2 rounded-xl bg-card border border-border/40 space-y-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                             <BarChart3 className="w-3 h-3 text-blue-500" /> Accuracy
                          </p>
                          <p className="text-xs font-black">{v.benchmarks.successRate}%</p>
                        </div>
                      </div>

                      {i === 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10 text-[xs]">
                          <TrendingDown className="w-3 h-3 text-green-500" />
                          <span className="text-[10px] text-green-500/80 font-bold uppercase tracking-widest">
                            -12% token usage vs previous
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border/40 bg-card/30">
           <Button className="w-full h-11 rounded-2xl font-bold shadow-lg shadow-primary/20 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              Run Benchmarks
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
