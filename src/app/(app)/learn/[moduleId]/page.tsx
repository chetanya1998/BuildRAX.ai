"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Play, Settings2, Sparkles, TerminalSquare, Search, Lock, User, Bot, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LessonModulePage() {
  const params = useParams();
  // Using generic content for this UI scaffolding. Real data would be fetched by moduleId.
  const moduleId = params.moduleId || "1";

  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState([0.7]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const simulateRun = () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    
    // Simulate API call and success logic
    setTimeout(() => {
      setIsRunning(false);
      setOutput(`You asked the model: "${prompt}". With a temperature of ${temperature}, it generates a highly creative response!`);
      
      // If they met some condition (e.g. testing the playground) trigger success!
      if (!showSuccess) {
        setTimeout(() => setShowSuccess(true), 1000);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] overflow-hidden selection:bg-primary/30">
      {/* Top Header */}
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.05] bg-card/40 backdrop-blur-3xl z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-white/5" asChild>
            <Link href="/learn">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mission {moduleId}</span>
            <span className="text-white/20">•</span>
            <span className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-none">Exploring LLM Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1.5 bg-black/50 border border-white/5 px-3 py-1.5 rounded-full shadow-inner">
            <div className="flex gap-1">
              <div className="w-8 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
              <div className="w-8 h-1.5 rounded-full bg-primary/20"></div>
              <div className="w-8 h-1.5 rounded-full bg-white/5"></div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground ml-2 uppercase tracking-widest">1/3 Steps</span>
          </div>

          <Button variant="outline" className="h-8 text-xs font-bold border-white/10 hover:bg-white/5 rounded-lg">
            Exit Mission
          </Button>
        </div>
      </header>

      {/* Main Split Interface */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] relative">
        
        {/* Left Pane - Guidebook */}
        <div className="w-full lg:w-[40%] xl:w-[35%] h-full border-r border-white/5 bg-[#0D0D0E] overflow-y-auto custom-scrollbar flex flex-col relative z-20">
          <div className="p-8 lg:p-12 space-y-10 flex-1">
            
            {/* Mission Brief */}
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[9px] font-black pointer-events-none">
                <BookOpen className="w-3 h-3 mr-1.5" /> Lore
              </Badge>
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                Controlling Creativity
              </h1>
              <div className="prose prose-invert prose-sm max-w-none text-muted-foreground font-medium leading-relaxed">
                <p>
                  When you send a prompt to a Large Language Model (LLM), it predicts the next best word based on probabilities. But what if you want it to be more predictable? Or totally unhinged and creative?
                </p>
                <p>
                  That's what the <strong>Temperature</strong> setting is for. It ranges from <code>0.0</code> (strictly factual) to <code>1.0</code> (wildly creative).
                </p>
              </div>
            </div>

            {/* Current Objectives Checklist */}
            <div className="space-y-4 bg-black/40 border border-white/5 p-6 rounded-2xl shadow-inner backdrop-blur-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Current Objectives
              </h3>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3 group">
                  <div className="mt-0.5 w-5 h-5 rounded-full border border-primary/50 bg-primary/5 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-pulse" />
                  </div>
                  <span className="text-sm font-medium text-white">Experiment with the <span className="text-primary font-bold">Temperature</span> slider in the playground.</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <div className="mt-0.5 w-5 h-5 rounded-full border border-white/20 bg-transparent flex items-center justify-center shrink-0">
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Type a prompt asking the model to "Describe an alien planet".</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <div className="mt-0.5 w-5 h-5 rounded-full border border-white/20 bg-transparent flex items-center justify-center shrink-0">
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Run a test query to see the resulting output variance.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Footer of left pane */}
          <div className="p-6 border-t border-white/5 bg-[#0D0D0E]/80 backdrop-blur-xl sticky bottom-0">
             <Button variant="secondary" className="w-full h-12 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                Stuck? Give me a hint
             </Button>
          </div>
        </div>

        {/* Right Pane - Interactive Playground */}
        <div className="flex-1 h-full bg-[#121214] relative flex flex-col items-center justify-center overflow-hidden">
           
           {/* Background Grid Pattern */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_30%,transparent_100%)] pointer-events-none" />

           {/* Central Workspace Card */}
           <div className="w-full max-w-2xl px-6 relative z-10 flex flex-col h-full py-12">
              
              {/* Fake API/Node Configurator */}
              <div className="bg-[#18181A] border border-white/10 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative overflow-hidden group">
                         <div className="absolute inset-0 bg-indigo-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                         <TerminalSquare className="w-5 h-5 text-indigo-400 relative z-10" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Agent Model Config</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Sandbox Environment</p>
                      </div>
                   </div>
                   <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 font-black text-[10px] uppercase tracking-widest">
                      Live
                   </Badge>
                </div>

                {/* Configuration Area */}
                <div className="space-y-8 flex-1">
                  
                  {/* Parameter: Temperature */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-white flex items-center gap-2">
                           <Settings2 className="w-4 h-4 text-muted-foreground" />
                           Temperature
                        </label>
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded w-10 text-center border border-primary/20">
                           {temperature[0].toFixed(1)}
                        </span>
                     </div>
                     <Slider 
                       value={temperature} 
                       onValueChange={(val) => setTemperature(val as number[])}
                       max={1} 
                       step={0.1} 
                       className="cursor-pointer"
                     />
                     <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                        <span>Factual (0.0)</span>
                        <span>Creative (1.0)</span>
                     </div>
                  </div>

                  {/* Parameter: System Prompt */}
                  <div className="space-y-3">
                     <label className="text-sm font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Enter a test prompt
                     </label>
                     <div className="relative group">
                        <Textarea 
                          placeholder="e.g., 'Describe an alien planet made entirely of crystal.'"
                          className="min-h-[120px] resize-none bg-black/40 border-white/10 rounded-xl focus-visible:ring-primary/50 text-base font-medium p-4 leading-relaxed group-hover:border-white/20 transition-colors"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {prompt.length} chars
                        </div>
                     </div>
                  </div>

                  {/* Dynamic Output Simulator */}
                  {output && (
                    <div className="mt-6 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <Bot className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                       <div className="text-sm text-indigo-100 font-medium leading-relaxed">
                         {output}
                       </div>
                    </div>
                  )}
                </div>

                {/* Execution Footer */}
                <div className="pt-6 mt-6 border-t border-white/5 flex justify-end">
                  <Button 
                    onClick={simulateRun}
                    disabled={!prompt.trim() || isRunning}
                    className="h-12 px-8 rounded-xl font-black bg-primary/90 hover:bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all flex items-center gap-2 group relative overflow-hidden"
                  >
                    {isRunning ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                        <Sparkles className="w-4 h-4" />
                        Execute Test
                      </>
                    )}
                  </Button>
                </div>
              </div>

           </div>
           
           {/* Ultimate Success Overlay */}
           {showSuccess && (
              <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 animate-in fade-in duration-500">
                 <div className="bg-[#161618] border border-white/10 p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] text-center max-w-sm relative overflow-hidden mx-4 animate-in zoom-in-95 duration-500">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/20 rounded-full blur-[50px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 space-y-6">
                      <div className="w-20 h-20 mx-auto bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-bounce">
                         <Check className="w-10 h-10 text-green-500 line-drop-shadow" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Objective Complete!</h2>
                        <p className="text-sm font-medium text-muted-foreground">You have mastered the Temperature parameter.</p>
                      </div>
                      
                      <div className="py-2.5 px-4 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-flex flex-col items-center justify-center shadow-inner mt-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 mb-0.5">Reward</span>
                         <span className="text-xl font-black text-amber-400">+50 XP</span>
                      </div>

                      <Button className="w-full h-12 rounded-xl font-bold bg-white text-black hover:bg-white/90 shadow-xl transition-all mt-4">
                        Continue to Next Step
                      </Button>
                    </div>
                 </div>
              </div>
           )}

        </div>
      </main>
    </div>
  );
}
