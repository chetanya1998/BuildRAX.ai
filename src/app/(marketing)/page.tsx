"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BrainCircuit,
  Play,
  Github,
  Sparkles,
  MousePointerClick,
  Cpu,
  Rocket,
} from "lucide-react";

import { HeroGlow } from "@/components/landing/HeroGlow";
import { CanvasPreview } from "@/components/landing/CanvasPreview";
import { LogoStrip } from "@/components/landing/LogoStrip";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTASection } from "@/components/landing/CTASection";

/* ─── Animation Variants ─── */
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: d, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/* ─── How-It-Works Steps ─── */
const steps = [
  {
    icon: <MousePointerClick className="w-5 h-5" />,
    title: "Pick a template",
    desc: "Choose from 12+ pre-built AI agent templates or start from scratch.",
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: "Wire the nodes",
    desc: "Drag-and-drop LLMs, tools, memory, and logic blocks on the visual canvas.",
  },
  {
    icon: <Rocket className="w-5 h-5" />,
    title: "Run & inspect",
    desc: "Execute your agent and watch data flow through every node in real time.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ─── Navbar ─── */}
      <header className="px-6 lg:px-10 py-4 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50 bg-background/80">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-6 h-6 text-cyan-400" />
          <span className="font-bold text-lg tracking-tight text-white">
            BuildRAX
          </span>
        </div>

        <nav className="hidden md:flex gap-8 text-[13.5px] font-medium text-gray-400">
          <Link
            href="#features"
            className="nav-link hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="nav-link hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#templates"
            className="nav-link hover:text-foreground transition-colors"
          >
            Templates
          </Link>
          <a
            href="https://github.com/chetanya1998/BuildRAX.ai"
            target="_blank"
            rel="noreferrer"
            className="nav-link hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Github className="w-3.5 h-3.5" /> GitHub
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-[13.5px] text-gray-400 hover:text-white"
            asChild
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            size="sm"
            className="rounded-full px-5 h-9 text-[13.5px] font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 hover:from-violet-400 hover:to-cyan-300 text-white shadow-md shadow-violet-500/25"
            asChild
          >
            <Link href="/demo">
              Start Free <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative px-6 pt-28 pb-8 md:pt-40 md:pb-12 flex flex-col items-center text-center">
          <HeroGlow />

          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <Badge
              variant="outline"
              className="mb-8 rounded-full px-4 py-1.5 border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-xs font-semibold tracking-wide"
            >
              <Sparkles className="w-3 h-3 mr-1.5" /> Now open source — v1.0
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight max-w-5xl mb-7 leading-[1.08] text-white"
            custom={0.1}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            build AI agents,{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient-hero">see every step.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed"
            custom={0.2}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            Drag, drop, and wire AI agents visually.
            Watch every prompt, tool call, and output flow in real time.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            custom={0.35}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <Button
              size="lg"
              className="rounded-full px-8 h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 hover:from-violet-400 hover:to-cyan-300 text-white shadow-lg shadow-violet-500/25"
              asChild
            >
              <Link href="/demo">
                Start Free Demo{" "}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 text-base font-medium bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
              asChild
            >
              <Link href="/templates">
                <Play className="w-4 h-4 mr-2" /> Explore Templates
              </Link>
            </Button>
          </motion.div>
        </section>

        {/* ─── Canvas Preview ─── */}
        <CanvasPreview />

        {/* ─── Logo Strip ─── */}
        <LogoStrip />

        {/* ─── Feature Showcase (Bento Grid) ─── */}
        <FeatureShowcase />

        {/* ─── Divider ─── */}
        <div className="feature-line w-full max-w-5xl mx-auto" />

        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="relative px-6 py-32">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-cyan-400 mb-4">
                Three simple steps
              </p>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
                From zero to running agent
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <motion.div
                  key={s.title}
                  className="bento-card p-7 text-center md:text-left"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                >
                  {/* Step indicator */}
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/15 to-cyan-400/15 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                      {s.icon}
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground tracking-widest">
                      STEP {i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-muted-foreground text-[14px] leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <Testimonials />

        {/* ─── CTA ─── */}
        <CTASection />
      </main>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-sm">BuildRAX</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/templates"
              className="hover:text-foreground transition-colors"
            >
              Templates
            </Link>
            <a
              href="https://github.com/chetanya1998/BuildRAX.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BuildRAX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
