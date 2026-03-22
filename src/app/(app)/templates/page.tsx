"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BrainCircuit, Box, FileText, Blocks, LayoutPanelTop, Play, MessageSquareCode, Mail, Slack, Twitter, Database, Globe, Bot, Zap, Code, Loader2, ArrowRight } from "lucide-react";
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

      {/* Detailed Overview Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl bg-card border-border/40 rounded-3xl p-0 overflow-hidden">
          {selectedTemplate && (
            <>
              <div className="p-8 pb-4 border-b border-border/40 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-background shadow-inner flex items-center justify-center border border-white/10">
                    {iconMap[selectedTemplate.iconName] || <Box className="w-8 h-8 text-muted-foreground" />}
                  </div>
                  <div>
                    <Badge variant="secondary" className="mb-2 text-[10px] uppercase tracking-wider">{selectedTemplate.level}</Badge>
                    <DialogTitle className="text-2xl font-bold">{selectedTemplate.title}</DialogTitle>
                  </div>
                </div>
                <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                  {selectedTemplate.description}
                </DialogDescription>
              </div>
              
              <div className="p-8 pb-6 space-y-6 max-h-[60vh] overflow-y-auto">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Architecture Overview</h4>
                  <p className="text-foreground/80 leading-relaxed text-sm">{selectedTemplate.detailedOverview}</p>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Key Use Cases</h4>
                  <ul className="space-y-2">
                    {selectedTemplate.useCases?.map((uc: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{uc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Expected Output
                  </h4>
                  <p className="text-sm text-foreground/80">{selectedTemplate.expectedOutput}</p>
                </div>
              </div>

              <DialogFooter className="p-6 border-t border-border/40 bg-card/60 flex sm:justify-between items-center">
                <div className="flex gap-2 mb-4 sm:mb-0">
                  {selectedTemplate.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-[10px] uppercase border-white/10">{tag}</Badge>
                  ))}
                </div>
                <Button 
                  className="rounded-xl px-8 shadow-lg transition-all text-sm font-semibold h-11" 
                  onClick={() => handleClone(selectedTemplate.id)}
                  disabled={cloningId === selectedTemplate.id}
                >
                  {cloningId === selectedTemplate.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {cloningId === selectedTemplate.id ? "Cloning..." : `Clone & Build (${selectedTemplate.time})`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
