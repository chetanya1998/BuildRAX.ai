"use client";

import { motion } from "framer-motion";

const brands = [
  "Vercel",
  "Notion",
  "Linear",
  "OpenAI",
  "Stripe",
  "Supabase",
];

export function LogoStrip() {
  return (
    <motion.section
      className="px-6 py-14"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <p className="text-center text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground/50 mb-8">
        Trusted by teams at
      </p>
      <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 max-w-3xl mx-auto">
        {brands.map((name) => (
          <span key={name} className="logo-strip-item">
            {name}
          </span>
        ))}
      </div>
    </motion.section>
  );
}
