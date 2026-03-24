"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";

/* Pre-generated star positions for cosmic background */
const stars = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.floor((i * 37 + 13) % 100)}%`,
  top: `${Math.floor((i * 53 + 7) % 100)}%`,
  delay: `${(i * 0.3) % 4}s`,
  size: i % 3 === 0 ? 3 : 2,
}));

export function CTASection() {
  return (
    <section className="relative px-6 py-32 overflow-hidden">
      {/* Star-field background */}
      <div className="absolute inset-0 -z-10">
        {stars.map((s) => (
          <div
            key={s.id}
            className="star-dot"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
        {/* Central glow */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 700,
            height: 700,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Glassmorphic card */}
      <motion.div
        className="relative max-w-3xl mx-auto text-center rounded-3xl border border-white/[0.06] bg-[#0c0c0f]/60 backdrop-blur-2xl p-12 md:p-16 overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Inner glow border */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent 40%, rgba(139, 92, 246, 0.08))",
          }}
        />

        <p className="relative text-[11px] font-medium tracking-[0.2em] uppercase text-cyan-400 mb-5">
          Open source &amp; free
        </p>
        <h2 className="relative text-4xl md:text-6xl font-semibold tracking-tight mb-6">
          Start building
          <br />
          <span className="text-gradient-hero">with full transparency.</span>
        </h2>
        <p className="relative text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
          BuildRAX is fully open source. Self-host it, contribute templates, or
          build extensions. AI learning should be accessible to everyone.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="rounded-full px-8 h-12 text-base font-semibold bg-gradient-to-r from-violet-500 to-cyan-400 hover:from-violet-400 hover:to-cyan-300 text-white shadow-lg shadow-violet-500/25"
            asChild
          >
            <Link href="/demo">
              Start Free Demo <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 h-12 text-base font-medium bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
            asChild
          >
            <a
              href="https://github.com/chetanya1998/BuildRAX.ai"
              target="_blank"
              rel="noreferrer"
            >
              <Github className="w-5 h-5 mr-2" /> View on GitHub
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
