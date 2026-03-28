"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BrainCircuit,
  Github,
  Sparkles,
  MousePointerClick,
  Cpu,
  Rocket,
  Menu,
  X,
} from "lucide-react";

import { HeroGlow } from "@/components/landing/HeroGlow";
import { CanvasPreview } from "@/components/landing/CanvasPreview";
import { LogoStrip } from "@/components/landing/LogoStrip";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { GamificationSection } from "@/components/landing/GamificationSection";
import { NewFeaturesSection } from "@/components/landing/NewFeaturesSection";
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

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#templates", label: "Templates" },
  { href: "https://github.com/chetanya1998/BuildRAX.ai", label: "GitHub", external: true },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background relative z-0">
      {/* ─── Global Background Mesh ─── */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/[0.06] blur-[120px]" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] rounded-full bg-fuchsia-600/[0.04] blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* ─── Navbar ─── */}
      <header className="px-5 sm:px-6 lg:px-10 py-4 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50 bg-background/80">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <BrainCircuit className="w-6 h-6 text-cyan-400" />
          <span className="font-bold text-lg tracking-tight text-white">
            BuildRAX<span className="text-cyan-400">.ai</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-8 text-[13.5px] font-medium text-gray-400">
          {navLinks.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="nav-link hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" /> {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="nav-link hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-[13.5px] text-gray-400 hover:text-white"
            asChild
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            size="sm"
            className="rounded-full px-5 h-9 text-[13.5px] font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 hover:from-violet-400 hover:to-cyan-300 text-white shadow-md shadow-violet-500/25"
            asChild
          >
            <a href="https://github.com/chetanya1998/BuildRAX.ai" target="_blank" rel="noreferrer">
              <Github className="w-3.5 h-3.5 mr-1.5" /> Explore the Project
            </a>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ─── Mobile menu ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-[61px] z-40 bg-background/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-6 flex flex-col gap-4"
          >
            {navLinks.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-300 hover:text-white text-[15px] font-medium flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Github className="w-4 h-4" /> {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-gray-300 hover:text-white text-[15px] font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              )
            )}
            <div className="pt-2 flex flex-col gap-3 border-t border-white/[0.06]">
              <Button variant="ghost" size="sm" className="justify-start text-gray-400 hover:text-white" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                className="rounded-full h-10 font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 text-white"
                asChild
              >
                <a href="https://github.com/chetanya1998/BuildRAX.ai" target="_blank" rel="noreferrer">
                  <Github className="w-4 h-4 mr-2" /> Explore the Project
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative px-5 sm:px-6 pt-24 pb-8 sm:pt-32 md:pt-40 md:pb-12 flex flex-col items-center text-center">
          <HeroGlow />

          {/* Badge */}
          <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible">
            <Badge
              variant="outline"
              className="mb-7 rounded-full px-4 py-1.5 border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-xs font-semibold tracking-wide"
            >
              <Sparkles className="w-3 h-3 mr-1.5" /> Now open source — v1.0
            </Badge>
          </motion.div>

          {/* Headline — includes "BuildRAX.ai" brand */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight max-w-5xl mb-6 leading-[1.06] text-white"
            custom={0.1}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <span className="text-gray-300 font-bold">BuildRAX.ai</span>
            <br />
            <span className="text-gradient-hero">build agents. see everything.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xl sm:max-w-2xl mb-10 leading-relaxed px-2"
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
            className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto"
            custom={0.35}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 hover:from-violet-400 hover:to-cyan-300 text-white shadow-lg shadow-violet-500/25"
              asChild
            >
              <a href="https://github.com/chetanya1998/BuildRAX.ai" target="_blank" rel="noreferrer">
                <Github className="w-4 h-4 mr-2" /> Explore the Project
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-medium bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
              asChild
            >
              <Link href="/login">
                Sign In & Build
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

        {/* ─── New Features ─── */}
        <NewFeaturesSection />

        {/* ─── Gamification ─── */}
        <GamificationSection />

        {/* ─── Divider ─── */}
        <div className="feature-line w-full max-w-5xl mx-auto" />

        {/* ─── How It Works ─── */}
        <section id="how-it-works" className="relative px-5 sm:px-6 py-20 sm:py-32">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-12 sm:mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-cyan-400 mb-4">
                Three simple steps
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
                From zero to running agent
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {steps.map((s, i) => (
                <motion.div
                  key={s.title}
                  className="bento-card p-6 sm:p-7 text-center md:text-left"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                >
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/15 to-cyan-400/15 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shrink-0">
                      {s.icon}
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground tracking-widest">
                      STEP {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-[14px] leading-relaxed">
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
      <footer className="px-5 sm:px-6 py-8 sm:py-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-white">
              BuildRAX<span className="text-cyan-400">.ai</span>
            </span>
          </Link>

          <div className="flex flex-wrap justify-center items-center gap-5 text-sm text-gray-500">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/templates" className="hover:text-white transition-colors">Templates</Link>
            <a
              href="https://github.com/chetanya1998/BuildRAX.ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} BuildRAX.ai. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
