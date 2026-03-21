import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Sparkles, Clock, Globe } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden bg-card/40 border border-border/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 max-w-2xl">
          <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" /> Level 2: Flow Explorer (150/500 XP)
          </Badge>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">Welcome back, Builder!</h1>
          <p className="text-muted-foreground mb-6">
            You're 350 XP away from unlocking the "Workflow Creator" badge. Keep experimenting with tools and memory nodes to level up.
          </p>
          <Progress value={30} className="w-full h-2 mb-6 bg-surface-secondary" />
          <div className="flex gap-4">
            <Button className="rounded-full px-6" asChild>
              <Link href="/builder/new">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full px-6 bg-background/50" asChild>
              <Link href="/learn">Continue Lesson</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <section className="col-span-1 md:col-span-2 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Recent Workflows</h2>
            <Button variant="link" className="text-muted-foreground" asChild>
              <Link href="/projects">View All</Link>
            </Button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-card/30 border-border/40 hover:border-primary/50 transition-colors group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary">Draft</Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg mt-2">Resume Analyzer</CardTitle>
                <CardDescription>Using Claude 3.5 Sonnet</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Edited 2 hours ago
              </CardFooter>
            </Card>

            <Card className="bg-card/30 border-border/40 hover:border-primary/50 transition-colors group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">
                    <Globe className="w-3 h-3 mr-1" /> Published
                  </Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg mt-2">Daily Planner Agent</CardTitle>
                <CardDescription>Input → Prompt → Tool → Output</CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Edited yesterday
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Suggested Templates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Starter Templates</h2>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { name: "Research Synthesizer", type: "Memory + LLM" },
              { name: "Content Generator", type: "Input + LLM" },
            ].map((tmpl, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card/20 border border-border/40 hover:bg-card/40 transition-colors cursor-pointer flex justify-between items-center group">
                <div>
                  <h4 className="font-medium text-sm">{tmpl.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{tmpl.type}</p>
                </div>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed text-muted-foreground" asChild>
              <Link href="/templates">Explore Gallery</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
