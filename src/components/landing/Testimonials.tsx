"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "BuildRAX made me actually understand how RAG works. I could see the data flowing through each node in real time.",
    author: "ML Engineer",
    role: "AI Startup",
  },
  {
    quote:
      "I went from zero AI knowledge to building a working multi-agent system in a single afternoon. The visual approach changes everything.",
    author: "Full-Stack Developer",
    role: "SaaS Company",
  },
  {
    quote:
      "The transparency is incredible. Being able to inspect every prompt and token count helped me optimize my pipelines significantly.",
    author: "Data Scientist",
    role: "Research Lab",
  },
  {
    quote:
      "The mission-based learning system is addictive. I earned 500 XP before I even realized I'd learned prompt chaining.",
    author: "CS Student",
    role: "University",
  },
  {
    quote:
      "Finally, an AI tool where I can see exactly what's happening under the hood. No more guessing.",
    author: "Product Manager",
    role: "Enterprise",
  },
  {
    quote:
      "Self-hosting was a breeze with Docker. Had it running on our infra in under 10 minutes.",
    author: "DevOps Lead",
    role: "FinTech",
  },
];

const stats = [
  { value: "12+", label: "Agent Templates" },
  { value: "100%", label: "Open Source" },
  { value: "0", label: "Black Boxes" },
  { value: "∞", label: "Possibilities" },
];

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <div className="shrink-0 w-[340px] rounded-2xl bg-card/40 backdrop-blur-sm border border-white/[0.05] p-6 mx-3 select-none">
      <p className="text-[14px] leading-relaxed text-foreground/80 mb-5 italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-400/20 flex items-center justify-center text-xs font-semibold text-cyan-400">
          {author.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium">{author}</div>
          <div className="text-[11px] text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  /* Double the list for seamless marquee loop */
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Subtle divider */}
      <div className="feature-line w-full max-w-4xl mx-auto mb-20" />

      {/* Stats bar */}
      <motion.div
        className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-gradient-hero mb-1">
              {s.value}
            </div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Section header */}
      <motion.div
        className="text-center mb-12 px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-cyan-400 mb-4">
          What builders say
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Trusted by learners and engineers
        </h2>
      </motion.div>

      {/* Marquee */}
      <div className="marquee-mask">
        <div className="flex animate-marquee w-max">
          {doubled.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
