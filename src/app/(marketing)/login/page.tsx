"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Github, LogIn, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { FancyLoader } from "@/components/ui/FancyLoader";
import { motion, AnimatePresence } from "framer-motion";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams?.get("error");
  
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Initializing Workspace...");

  // Simulated progression of loading steps
  useEffect(() => {
    if (!isGuestLoading) return;
    
    const steps = [
      "Authenticating Guest Session...",
      "Allocating Neural Pathways...",
      "Booting Architect AI Engine...",
      "Finalizing Dashboard Environment..."
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < steps.length) {
        setLoadingStep(steps[currentIndex]);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isGuestLoading]);

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    let deviceId = localStorage.getItem("buildrax_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("buildrax_device_id", deviceId);
    }
    
    // Attempt sign in without the hard redirect
    const res = await signIn("guest", { deviceId, redirect: false, callbackUrl: "/dashboard" });
    
    if (res?.ok) {
      // Let the beautiful animation run its course, then redirect naturally
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } else {
      // Fallback if something failed
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0B] overflow-hidden selection:bg-primary/30">
      
      {/* Left Panel: Epic Branding (Hidden on Small Screens) */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 border-r border-white-[0.05] bg-[#0D0D0E]/50 z-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
        </div>
        
        {/* Abstract Architectural Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none z-0" />

        <Link href="/" className="flex items-center gap-3 text-foreground font-black tracking-tight relative z-20 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <span className="text-3xl text-white">BuildRAX</span>
        </Link>

        <div className="relative z-20 max-w-lg mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3 h-3" /> Architect AI Platform
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight leading-[1.1]">
            Design the <br className="hidden xl:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Future of AI</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            Construct, deploy, and monitor powerful multi-agent systems via an intuitive node-based canvas. Welcome back to the frontier.
          </p>
          
          <div className="flex items-center gap-6 pt-6 opacity-60">
             <div className="flex flex-col gap-1">
                <span className="text-2xl font-black text-white">10x</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Faster Prototyping</span>
             </div>
             <div className="h-10 w-px bg-white/10" />
             <div className="flex flex-col gap-1">
                <span className="text-2xl font-black text-white">100+</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Pre-built Nodes</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Authentication Input */}
      <div className="flex-1 flex flex-col justify-center items-center relative z-20 p-6 lg:bg-[#0A0A0B]">
        
        {/* Mobile Logo Fallback */}
        <Link href="/" className="lg:hidden flex items-center gap-2 text-foreground font-semibold mb-12 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <span className="text-2xl tracking-tight text-white">BuildRAX</span>
        </Link>

        <div className="w-full max-w-md relative">
          <AnimatePresence mode="wait">
            {isGuestLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="w-full h-[400px] flex items-center justify-center"
              >
                <div className="flex flex-col items-center justify-center scale-125">
                   <FancyLoader text={loadingStep} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
                className="w-full glass-panel p-8 sm:p-10 rounded-[2.5rem] border border-white/5 bg-[#121214]/80 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-[1.2rem] bg-indigo-500/10 flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    <LogIn className="w-7 h-7 text-indigo-400" />
                  </div>
                  
                  <h2 className="text-3xl font-black tracking-tight text-white mb-3">Welcome Back</h2>
                  <p className="text-muted-foreground font-medium mb-8 leading-relaxed text-[15px]">
                    Sign in to authorize your deployment environments and resume building.
                  </p>

                  {error === "Configuration" && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-2xl mb-8 w-full text-left font-medium">
                      <strong>Configuration Offline:</strong> OAuth environment variables are missing. Please proceed via Guest Session safely.
                    </div>
                  )}

                  <div className="flex flex-col gap-4 w-full">
                    <Button 
                      variant="default" 
                      onClick={handleGuestLogin}
                      className="w-full h-14 rounded-2xl font-black text-[15px] bg-primary/90 hover:bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all flex items-center justify-between px-6 group"
                    >
                      <span className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                         Guest Session (Instant)
                      </span>
                      <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>
                    
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white-[0.05]" /></div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-[#121214] px-4 text-muted-foreground">Secure Login</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-12 rounded-xl bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10 font-bold transition-colors"
                        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                      >
                        <Github className="w-5 h-5 mr-2" /> GitHub
                      </Button>

                      <Button 
                        variant="outline" 
                        className="h-12 rounded-xl bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10 font-bold transition-colors"
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                        Google
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
       <div className="h-screen w-screen flex items-center justify-center bg-[#0A0A0B]">
          <FancyLoader text="Initializing Authentication Gateway..." />
       </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
