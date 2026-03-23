"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BrainCircuit, Box, FileText, Blocks, LayoutPanelTop, Play, MessageSquareCode, Mail, Slack, Twitter, Database, Globe, Bot, Zap, Code, Loader2, ArrowRight, Clock, CheckCircle2, Check, Star, User, Cpu, Workflow } from "lucide-react";
import { AGENT_TEMPLATES } from "@/lib/data/templates";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const iconMap: Record<string, React.ReactNode> = {
  Search: <Search className="w-5 h-5 text-blue-400" />,
  BrainCircuit: <BrainCircuit className="w-5 h-5 text-purple-400" />,
  MessageSquareCode: <MessageSquareCode className="w-5 h-5 text-green-400" />,
  Mail: <Mail className="w-5 h-5 text-red-400" />,
  Slack: <Slack className="w-5 h-5 text-pink-400" />,
  Twitter: <Twitter className="w-5 h-5 text-sky-400" />,
  Database: <Database className="w-5 h-5 text-indigo-400" />,
  Globe: <Globe className="w-5 h-5 text-emerald-400" />,
  Bot: <Bot className="w-5 h-5 text-orange-400" />,
  Zap: <Zap className="w-5 h-5 text-yellow-400" />,
  Code: <Code className="w-5 h-5 text-slate-400" />
};

export default function TemplatesPage() {
  const router = useRouter();
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const handleClone = async (id: string) => {
    try {
      setCloningId(id);
      const res = await fetch(`/api/templates/${id}/clone`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/builder?id=${data.workflowId}`);
      } else {
        console.error("Failed to clone");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-border/40 relative overflow-hidden bg-card/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Agent Template Gallery</h1>
            <p className="text-muted-foreground text-lg">Don't start from scratch. Clone any of our {AGENT_TEMPLATES.length} pre-configured agent architectures directly into the builder.</p>
          </div>
          <div className="flex w-full md:w-auto items-center relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <Input placeholder="Search templates..." className="pl-9 h-12 w-full md:w-64 bg-background/50 border-white/10 rounded-xl" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-card/20 border border-border/40 mb-8 inline-flex flex-wrap h-auto p-1.5 rounded-2xl">
          <TabsTrigger value="all" className="rounded-xl px-4 py-2">All Templates</TabsTrigger>
          <TabsTrigger value="writing" className="rounded-xl px-4 py-2">Writing</TabsTrigger>
          <TabsTrigger value="research" className="rounded-xl px-4 py-2">Research</TabsTrigger>
          <TabsTrigger value="automation" className="rounded-xl px-4 py-2">Automation</TabsTrigger>
          <TabsTrigger value="agents" className="rounded-xl px-4 py-2">Agents</TabsTrigger>
        </TabsList>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {AGENT_TEMPLATES.map((tmpl) => (
            <Card key={tmpl.id} onClick={() => setSelectedTemplate(tmpl)} className="bg-card/20 border-border/40 hover:border-primary/40 transition-all flex flex-col group cursor-pointer overflow-hidden relative rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-background/60 shadow-inner border border-white/5 flex items-center justify-center">
                    {iconMap[tmpl.iconName] || <Box className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-white/10 text-[10px] uppercase font-bold tracking-wider">
                    {tmpl.level}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">{tmpl.title}</CardTitle>
                <CardDescription className="text-sm mt-2 line-clamp-2 leading-relaxed h-10">
                  {tmpl.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 relative z-10">
                <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wider">
                  {tmpl.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-md bg-secondary/20 text-secondary-foreground">#{tag}</span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-white/5 flex justify-between items-center relative z-10 bg-black/10">
                <span className="text-xs text-muted-foreground font-medium">{tmpl.time} setup</span>
                <span className="text-primary text-xs font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                  View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Tabs>

      {/* Next-Gen Detailed Overview Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl bg-[#09090b] border border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-full max-h-[85vh]">
          {selectedTemplate && (
            <>
              {/* Left Sidebar - Stats & Metadata */}
              <div className="w-full md:w-72 bg-black/40 border-r border-white/5 p-8 flex flex-col gap-8 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Complexity</h4>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= selectedTemplate.complexity ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Nodes</h4>
                      <div className="text-xl font-bold tracking-tight">{selectedTemplate.nodeCount}</div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Setup</h4>
                      <div className="text-xl font-bold tracking-tight">{selectedTemplate.time.split(' ')[0]}<span className="text-xs text-muted-foreground ml-1 font-medium">m</span></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Integrations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.slice(0, 4).map((tag: string) => (
                        <div key={tag} className="px-2 py-1 rounded-md bg-secondary/10 border border-white/5 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-4 relative z-10">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-current" /> Pro Tip
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                      Combine this with the <strong>Logic Loop</strong> node for repetitive batch processing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-black to-[#0c0c0e] relative overflow-y-auto">
                {/* Hero Mesh Section */}
                <div className="relative p-10 pb-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-60" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-3xl bg-black/60 shadow-2xl flex items-center justify-center border border-white/10 ring-1 ring-primary/20 backdrop-blur-xl group">
                        {iconMap[selectedTemplate.iconName] || <Box className="w-10 h-10 text-primary" />}
                      </div>
                      <div className="space-y-2">
                        <Badge className="bg-primary/20 text-primary uppercase tracking-[0.15em] text-[10px] font-extrabold px-3 py-1 rounded-lg border border-primary/20 backdrop-blur-md">
                          {selectedTemplate.level} Template
                        </Badge>
                        <DialogTitle className="text-4xl font-extrabold tracking-tight text-white">{selectedTemplate.title}</DialogTitle>
                      </div>
                    </div>
                    <DialogDescription className="text-xl text-foreground/70 leading-relaxed font-medium max-w-2xl">
                      {selectedTemplate.description}
                    </DialogDescription>
                  </div>
                </div>

                <div className="p-10 pt-0 space-y-12">
                  {/* Architecture Flow Visualization */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80 flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5" /> Architecture Sequence
                    </h4>
                    <div className="flex items-center gap-3 p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 shadow-inner">
                      {selectedTemplate.nodeSequence.map((type: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="group relative">
                            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-help">
                              {type === 'inputNode' && <MessageSquareCode className="w-5 h-5 text-blue-400" />}
                              {type === 'llmNode' && <BrainCircuit className="w-5 h-5 text-purple-400" />}
                              {type === 'logicNode' && <Zap className="w-5 h-5 text-yellow-400" />}
                              {type === 'outputNode' && <ArrowRight className="w-5 h-5 text-green-400" />}
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black text-[9px] font-bold uppercase tracking-wider py-1 px-2 rounded-md border border-white/10 pointer-events-none z-20">
                              {type.replace('Node', '')}
                            </div>
                          </div>
                          {idx < selectedTemplate.nodeSequence.length - 1 && (
                            <div className="w-6 h-px bg-white/10" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                        <Blocks className="w-3.5 h-3.5" /> Overview
                      </h4>
                      <p className="text-foreground/80 leading-relaxed text-[15px] font-medium">
                        {selectedTemplate.detailedOverview}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Core Benefits
                      </h4>
                      <ul className="space-y-3">
                        {selectedTemplate.useCases?.map((uc: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-semibold text-foreground/80 group">
                            <Check className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-125" />
                            <span>{uc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Expected Output Card */}
                  <div className="relative group p-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center gap-6 transition-all group-hover:bg-white/[0.05] group-hover:translate-y-[-2px]">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                        <Zap className="w-6 h-6 text-primary fill-current" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Expected Output</h4>
                        <p className="text-[15px] text-foreground/90 font-bold tracking-tight">
                          {selectedTemplate.expectedOutput}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <DialogFooter className="sticky bottom-0 mt-auto p-10 pt-6 border-t border-white/5 bg-black/80 backdrop-blur-xl flex sm:justify-between items-center gap-6 z-20">
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary/50 flex items-center justify-center text-[10px] font-bold text-white shadow-lg ring-1 ring-white/5">
                          <User className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Join 1.2k+ architects</div>
                  </div>

                  <Button 
                    size="lg"
                    className="flex-1 sm:flex-none rounded-2xl px-12 py-7 shadow-[0_20px_40px_-15px_rgba(var(--primary),0.5)] hover:shadow-[0_25px_50px_-15px_rgba(var(--primary),0.6)] transition-all text-lg font-black bg-primary text-primary-foreground border-t border-white/20 relative overflow-hidden group min-w-[280px]" 
                    onClick={() => handleClone(selectedTemplate.id)}
                    disabled={cloningId === selectedTemplate.id}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    <span className="relative flex items-center justify-center">
                      {cloningId === selectedTemplate.id ? (
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      ) : (
                        <Workflow className="w-6 h-6 mr-3" />
                      )}
                      {cloningId === selectedTemplate.id ? "Initializing..." : "Clone Architecture"}
                    </span>
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
