import Link from "next/link";
import { BrainCircuit, CheckCircle2, ChevronRight, Lock, Play, Star, Trophy, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const xp = 150;
  const maxXP = 500;
  const progressPercent = Math.round((xp / maxXP) * 100);
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progressPercent) / 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0B] pb-32 overflow-hidden selection:bg-primary/30">
      <header className="h-16 flex items-center px-6 border-b border-white/[0.05] backdrop-blur-2xl sticky top-0 z-50 bg-card/40">
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-white/5 mr-4" asChild>
          <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex items-center gap-3 font-bold tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <span>BuildRAX Academy</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto space-y-16 mt-10 relative">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-50" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 opacity-30" />

        {/* Hero Section */}
        <section className="px-6 relative z-10 w-full">
          <div className="p-10 md:p-14 rounded-[2.5rem] bg-gradient-to-br from-[#161618] to-black border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center gap-12 justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10 space-y-6 flex-1 text-center md:text-left">
              <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5 uppercase tracking-widest text-[10px] font-extrabold hover:bg-primary/20">
                Academy Track
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-2xl">
                Master AI <br className="hidden md:block"/> Architecture
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-lg mx-auto md:mx-0">
                Complete dynamic missions to uncover the mechanisms of intelligent agents. Earn XP and legendary builder features.
              </p>
            </div>

            <div className="relative z-10 shrink-0 bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-inner backdrop-blur-xl group-hover:border-primary/20 transition-all duration-700">
              <div className="absolute -inset-4 bg-primary/20 blur-[50px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000" />
              <div className="text-center space-y-6 relative">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Level</h3>
                  <div className="text-2xl font-black text-white">Flow Explorer</div>
                </div>
                
                <div className="relative w-40 h-40 mx-auto">
                  <svg className="w-full h-full -rotate-90 scale-110 drop-shadow-2xl" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/[0.03]" />
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="url(#gradient)" 
                      strokeWidth="6" 
                      className="transition-all duration-1000 ease-in-out drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                      strokeLinecap="round" 
                      strokeDasharray={strokeDasharray} 
                      strokeDashoffset={strokeDashoffset} 
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Trophy className="w-10 h-10 text-amber-400 drop-shadow-lg mb-2 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex items-baseline gap-1 bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                      <span className="text-lg font-black text-white tracking-tighter">{xp}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">/ {maxXP} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gamified Pathway Layout */}
        <section className="relative px-6 w-full pb-32">
          {/* Main vertical path line for Desktop */}
          <div className="absolute top-10 bottom-10 left-12 md:left-1/2 w-0.5 md:-ml-px pointer-events-none">
            {/* The dashed uncompleted path */}
            <div className="absolute inset-0 w-full border-l-4 border-dashed border-white/[0.03]" />
            {/* The solid glowing completed path - approximate logic */}
            <div className="absolute top-0 w-full border-l-4 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.5)] h-[40%]" />
          </div>

          <div className="space-y-12 md:space-y-24 relative z-10 w-full max-w-4xl mx-auto">
            {MISSIONS.map((mission, index) => {
              const isActive = mission.status === "active";
              const isCompleted = mission.status === "completed";
              const isLocked = mission.status === "locked";
              const isLeftAlign = index % 2 === 0;

              return (
                <div key={index} className="relative w-full grid grid-cols-1 md:grid-cols-2 gap-0 group items-center py-4">
                  
                  {/* The Journey Node (Circle on Path) */}
                  <div className={`absolute left-[4.5rem] md:left-1/2 w-16 h-16 -ml-8 md:-translate-x-1/2 flex items-center justify-center rounded-full border-4 shadow-xl transition-all duration-500 z-20 shadow-[0_0_20px_-5px_rgba(0,0,0,0.8)]
                    ${isCompleted ? 'bg-[#0f1014] border-green-500/50 hover:scale-110 hover:border-green-500' : 
                      isActive ? 'bg-black border-primary ring-4 ring-primary/20 scale-110 shadow-[0_0_30px_rgba(var(--primary),0.4)]' : 
                      'bg-[#121214] border-white/10 text-white/20'}`}>
                    
                    {isCompleted && <CheckCircle2 className="w-7 h-7 text-green-500/80 drop-shadow-lg" />}
                    {isActive && (
                      <div className="relative group flex items-center justify-center cursor-pointer">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center z-10">
                           <Play className="w-4 h-4 text-white ml-0.5 fill-current" />
                        </div>
                      </div>
                    )}
                    {isLocked && <Lock className="w-5 h-5 text-current" />}
                  </div>

                  {/* Left Column (Desktop) */}
                  <div className={`hidden md:flex w-full justify-end pr-12 lg:pr-20`}>
                    {isLeftAlign && (
                      <div className={`w-full max-w-[420px] p-6 rounded-3xl transition-all duration-300 relative overflow-hidden backdrop-blur-2xl border
                        ${isActive ? 'bg-[#18181A] border-primary/30 shadow-[0_20px_50px_-10px_rgba(var(--primary),0.2)] hover:-translate-y-2 hover:shadow-[0_25px_60px_-10px_rgba(var(--primary),0.3)]' : 
                        isCompleted ? 'bg-[#121214]/90 border-white/5 hover:border-white/10 hover:-translate-y-1 opacity-90 hover:opacity-100' : 
                        'bg-white/[0.02] border-white/[0.02] opacity-50'}`}>
                         
                         {isActive && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                         )}

                         <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="flex justify-between items-start">
                               <h4 className={`text-xl font-bold tracking-tight ${isLocked ? "text-muted-foreground/50" : "text-white"}`}>
                                 {mission.title}
                               </h4>
                               {isActive && (
                                 <Badge className="bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest text-[9px] font-black animate-pulse whitespace-nowrap">Up Next</Badge>
                               )}
                            </div>
                            
                            <p className="text-[15px] font-medium text-muted-foreground leading-relaxed">
                               {mission.description}
                            </p>

                            <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none px-2 py-1 text-xs font-bold rounded-lg shadow-inner">
                                    <Star className="w-3.5 h-3.5 mr-1.5 fill-amber-500" /> {mission.xp} XP
                                  </Badge>
                                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-black/30 px-2 py-1.5 rounded-lg border border-white/5 shadow-inner">
                                     {mission.time}
                                  </span>
                               </div>

                               {isActive ? (
                                 <Button className="rounded-xl font-black bg-primary/90 hover:bg-primary shadow-lg hover:shadow-primary/30 active:scale-95 transition-all text-xs h-9 px-5">
                                   Start
                                 </Button>
                               ) : isCompleted ? (
                                 <Button variant="ghost" className="rounded-xl text-xs font-bold hover:bg-white/5 h-9">
                                   Review
                                 </Button>
                               ) : (
                                 <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-3 py-1 flex items-center gap-1.5">
                                   <Lock className="w-3 h-3" /> Locked
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Desktop) */}
                  <div className={`hidden md:flex w-full justify-start pl-12 lg:pl-20`}>
                    {!isLeftAlign && (
                      <div className={`w-full max-w-[420px] p-6 rounded-3xl transition-all duration-300 relative overflow-hidden backdrop-blur-2xl border
                        ${isActive ? 'bg-[#18181A] border-primary/30 shadow-[0_20px_50px_-10px_rgba(var(--primary),0.2)] hover:-translate-y-2 hover:shadow-[0_25px_60px_-10px_rgba(var(--primary),0.3)]' : 
                        isCompleted ? 'bg-[#121214]/90 border-white/5 hover:border-white/10 hover:-translate-y-1 opacity-90 hover:opacity-100' : 
                        'bg-white/[0.02] border-white/[0.02] opacity-50'}`}>
                         
                         {isActive && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                         )}

                         <div className="relative z-10 flex flex-col h-full gap-4">
                            <div className="flex justify-between items-start">
                               <h4 className={`text-xl font-bold tracking-tight ${isLocked ? "text-muted-foreground/50" : "text-white"}`}>
                                 {mission.title}
                               </h4>
                               {isActive && (
                                 <Badge className="bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest text-[9px] font-black animate-pulse whitespace-nowrap">Up Next</Badge>
                               )}
                            </div>
                            
                            <p className="text-[15px] font-medium text-muted-foreground leading-relaxed">
                               {mission.description}
                            </p>

                            <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-none px-2 py-1 text-xs font-bold rounded-lg shadow-inner">
                                    <Star className="w-3.5 h-3.5 mr-1.5 fill-amber-500" /> {mission.xp} XP
                                  </Badge>
                                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-black/30 px-2 py-1.5 rounded-lg border border-white/5 shadow-inner">
                                     {mission.time}
                                  </span>
                               </div>

                               {isActive ? (
                                 <Button className="rounded-xl font-black bg-primary/90 hover:bg-primary shadow-lg hover:shadow-primary/30 active:scale-95 transition-all text-xs h-9 px-5">
                                   Start
                                 </Button>
                               ) : isCompleted ? (
                                 <Button variant="ghost" className="rounded-xl text-xs font-bold hover:bg-white/5 h-9">
                                   Review
                                 </Button>
                               ) : (
                                 <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-3 py-1 flex items-center gap-1.5">
                                   <Lock className="w-3 h-3" /> Locked
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Layout Wrapper: Always on right */}
                  <div className="md:hidden flex-1 pl-28 pr-4 py-4 w-full">
                    <div className={`w-full p-5 rounded-3xl transition-all relative overflow-hidden backdrop-blur-md border border-white/5
                      ${isActive ? 'bg-[#18181A] border-primary/30 shadow-[0_15px_30px_-5px_rgba(var(--primary),0.2)]' : 
                      isCompleted ? 'bg-[#121214] opacity-90' : 'bg-transparent border-dashed opacity-50'}`}>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{mission.time} • {mission.xp} XP</span>
                        {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <h4 className={`text-lg font-bold mb-1 ${isLocked ? "text-muted-foreground/60" : "text-white"}`}>{mission.title}</h4>
                      <p className="text-sm font-medium text-muted-foreground">{mission.description}</p>
                      
                      {isActive && (
                        <Button className="w-full mt-4 rounded-xl font-bold bg-primary tracking-wide">
                          Play Mission
                        </Button>
                      )}
                    </div>
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
