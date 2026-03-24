"use client";

import { motion } from "framer-motion";
import {
  Layers,
  BrainCircuit,
  Eye,
  Workflow,
  Zap,
  Shield,
} from "lucide-react";
import type { ReactNode } from "react";

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
  highlights: string[];
  accent: string; // tailwind color for accent
  span?: string;  // grid span class
}

const features: Feature[] = [
  {
    title: "Visual AI Builder",
    description:
      "Connect inputs, tools, memory, and LLMs on a drag-and-drop canvas. See the entire architecture at a glance — like Figma for AI logic.",
    icon: <Layers className="w-5 h-5" />,
    highlights: ["Drag-and-drop nodes", "Real-time data flow", "Live execution"],
    accent: "rgba(99, 102, 241, 0.8)",
    span: "md:col-span-2",
  },
  {
    title: "Learn by Building",
    description:
      "Interactive missions guide you from beginner to AI practitioner. Earn XP, unlock badges, and level up.",
    icon: <BrainCircuit className="w-5 h-5" />,
    highlights: ["Guided missions", "XP & gamification"],
    accent: "rgba(45, 212, 191, 0.8)",
  },
  {
    title: "Total Transparency",
    description:
      "Watch data flow through every node. Inspect prompts, retrieved context, and raw outputs. No black boxes.",
    icon: <Eye className="w-5 h-5" />,
    highlights: ["Prompt inspection", "Token tracking"],
    accent: "rgba(251, 191, 36, 0.8)",
  },
  {
    title: "Multi-Agent Orchestration",
    description:
      "Compose multiple agents that collaborate, delegate, and reason together in complex workflows.",
    icon: <Workflow className="w-5 h-5" />,
    highlights: ["Agent chaining", "Parallel execution"],
    accent: "rgba(139, 92, 246, 0.8)",
  },
  {
    title: "Instant Deployment",
    description:
      "One-click deploy your agents as APIs. Share, embed, or integrate into any application.",
    icon: <Zap className="w-5 h-5" />,
    highlights: ["API endpoints", "Webhooks"],
    accent: "rgba(251, 146, 60, 0.8)",
  },
  {
    title: "Open Source & Self-Hostable",
    description:
      "Fully open source. Self-host it, contribute templates, or build your own extensions.",
    icon: <Shield className="w-5 h-5" />,
    highlights: ["MIT License", "Docker ready"],
    accent: "rgba(52, 211, 153, 0.8)",
    span: "md:col-span-2",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

export function FeatureShowcase() {
  return (
    <section id="features" className="relative px-6 py-32">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-cyan-400 mb-4">
            Built for clarity
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5">
            You shouldn&apos;t need a PhD
            <br className="hidden md:block" /> to use AI.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            BuildRAX reveals exactly what happens behind the scenes — making AI
            accessible, visual, and deeply understandable.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className={`bento-card group p-7 md:p-8 ${f.span ?? ""}`}
            >
              {/* Accent bar */}
              <div
                className="w-8 h-1 rounded-full mb-5"
                style={{ background: f.accent }}
              />

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{
                  background: f.accent.replace(/[\d.]+\)$/, "0.1)"),
                  color: f.accent,
                }}
              >
                {f.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 tracking-tight">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-[14px] leading-relaxed mb-5">
                {f.description}
              </p>

              {/* Highlight pills */}
              <div className="flex flex-wrap gap-2">
                {f.highlights.map((h) => (
                  <span
                    key={h}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-muted-foreground"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
