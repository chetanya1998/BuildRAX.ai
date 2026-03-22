import Link from "next/link";
import { BrainCircuit, CheckCircle2, ChevronRight, Lock, Play, Star, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const MISSIONS = [
  {
    title: "1. What is a Prompt?",
    description: "Learn how to give instructions to an AI model.",
    status: "completed",
    xp: 30,
    time: "2 mins"
  },
  {
    title: "2. Exploring LLM Settings",
    description: "Understand temperature, tokens, and model choices.",
    status: "active",
    xp: 50,
    time: "5 mins"
  },
  {
    title: "3. Adding Memory",
    description: "Teach your AI to remember past conversations.",
    status: "locked",
    xp: 75,
    time: "10 mins"
  },
  {
    title: "4. Using External Tools",
    description: "Give your AI access to calculators and web search.",
    status: "locked",
    xp: 100,
    time: "15 mins"
  },
  {
    title: "5. Multi-Agent Workflows",
    description: "Orchestrate multiple AIs working together.",
    status: "locked",
    xp: 200,
    time: "20 mins"
  }
];

export default function LearnPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="h-16 flex items-center px-6 border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-card/50">
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full mr-4" asChild>
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <span>BuildRAX Academy</span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-10 mt-4">
        {/* Header section */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">
            Curriculum
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Level up your AI skills</h1>
          <p className="text-muted-foreground text-lg">
            Complete interactive missions to understand how AI works behind the scenes. Earn XP and unlock advanced builder features.
          </p>
        </section>

        {/* Progress Overview */}
        <section className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center gap-8 justify-between border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
          <div className="relative z-10 flex-1 w-full">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-medium">Your Progress</h3>
                <p className="text-sm text-muted-foreground">Level 2: Flow Explorer</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">150</span>
                <span className="text-sm text-muted-foreground"> / 500 XP</span>
              </div>
            </div>
            <Progress value={30} className="w-full h-3 bg-background" />
          </div>
          <div className="relative z-10 shrink-0">
            <div className="w-24 h-24 rounded-full bg-background border border-border/40 flex items-center justify-center flex-col shadow-xl">
              <Trophy className="w-8 h-8 text-yellow-500 mb-1" />
              <span className="text-xs font-bold">Lvl 2</span>
            </div>
          </div>
        </section>

        {/* Missions List */}
        <section>
          <div className="space-y-4">
            {MISSIONS.map((mission, index) => {
              const isActive = mission.status === "active";
              const isCompleted = mission.status === "completed";
              const isLocked = mission.status === "locked";

              return (
                <div 
                  key={index} 
                  className={`p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                    isActive ? "bg-card border-primary/50 shadow-lg shadow-primary/5" : 
                    isCompleted ? "bg-card/30 border-border/40" : 
                    "bg-background/50 border-border/20 opacity-70"
                  }`}
                >
                  <div className="shrink-0">
                    {isCompleted ? (
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : isActive ? (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-20" />
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center text-muted-foreground">
                        <Lock className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`text-lg font-medium ${isLocked ? "text-muted-foreground" : ""}`}>
                      {mission.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                      <Star className="w-3 h-3 mr-1 fill-amber-500" /> {mission.xp} XP
                    </div>
                    <span className="text-xs text-muted-foreground">{mission.time}</span>
                  </div>

                  <div className="shrink-0 ml-4 hidden sm:block">
                    {isActive ? (
                      <Button className="rounded-full px-6">Start Mission</Button>
                    ) : isCompleted ? (
                      <Button variant="ghost" className="rounded-full text-muted-foreground">Review</Button>
                    ) : (
                      <Button variant="ghost" disabled className="rounded-full">Locked</Button>
                    )}
                  </div>
                  
                  <div className="sm:hidden block shrink-0">
                     <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
