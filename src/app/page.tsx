import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BrainCircuit, Play, Layers, ShieldCheck, Github } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-row items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          <span className="font-semibold text-xl tracking-tight">BuildRAX</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#templates" className="hover:text-foreground transition-colors">Templates</Link>
          <Link href="#oss" className="hover:text-foreground transition-colors">Open Source</Link>
        </nav>
        <div className="flex flex-row items-center gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
             <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/demo">Start Free Demo</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 py-24 md:py-32 flex flex-col items-center text-center overflow-hidden">
          {/* Subtle Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" />
          
          <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 border-primary/30 bg-primary/5 text-primary">
            v1.0 is now open source
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight max-w-4xl mb-6">
            Learn AI by <span className="text-gradient-primary">building it visually.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Create agents, workflows, and AI tools with drag-and-drop blocks. See prompts, memory, tools, and outputs step by step. No black boxes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="rounded-full px-8 h-12 text-base font-medium" asChild>
              <Link href="/demo">
                Start Free Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-medium bg-background hover:bg-surface-secondary/50" asChild>
              <Link href="/templates">
                <Play className="w-4 h-4 mr-2" /> Explore Templates
              </Link>
            </Button>
          </div>
        </section>

        {/* Value Prop Section */}
        <section id="features" className="px-6 py-24 bg-card/30 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4">You shouldn't need a PhD to use AI.</h2>
              <p className="text-muted-foreground text-lg">BuildRAX reveals exactly what happens behind the scenes.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-3">Visual First</h3>
                <p className="text-muted-foreground leading-relaxed">Connect inputs, tools, memory, and LLMs using our intuitive drag-and-drop canvas. It feels just like Figma for logic.</p>
              </div>
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-6">
                  <BrainCircuit className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-3">Learning by Building</h3>
                <p className="text-muted-foreground leading-relaxed">Interactive missions guide you from absolute beginner to AI practitioner. Earn XP and badges as you experiment.</p>
              </div>
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-start text-left">
                <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-chart-3" />
                </div>
                <h3 className="text-xl font-medium mb-3">Total Transparency</h3>
                <p className="text-muted-foreground leading-relaxed">Watch the data flow. Inspect the exact prompt sent to the model, the retrieved context, and the raw output.</p>
              </div>
            </div>
          </div>
        </section>

        {/* OSS Banner */}
        <section id="oss" className="px-6 py-24 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5" />
          <div className="max-w-4xl text-center relative z-10">
            <h2 className="text-3xl font-semibold mb-6">Open Source and Free to Play</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              We believe AI learning should be accessible to everyone. BuildRAX is fully open source. Self-host it, contribute templates, or build extensions.
            </p>
            <Button variant="outline" size="lg" className="rounded-full bg-background" asChild>
              <a href="https://github.com/chetanya1998/BuildRAX.ai" target="_blank" rel="noreferrer">
                <Github className="w-5 h-5 mr-2" /> View on GitHub
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/40 text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <BrainCircuit className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold">BuildRAX</span>
        </div>
        <p>&copy; {new Date().getFullYear()} BuildRAX. All rights reserved.</p>
      </footer>
    </div>
  );
}
