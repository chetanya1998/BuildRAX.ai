"use client";

import { motion } from "framer-motion";
import { Users, History, Activity, Box, GitBranch } from "lucide-react";

const newFeatures = [
  {
    icon: <Users className="w-5 h-5 text-cyan-400" />,
    title: "Community Templates",
    desc: "Discover, clone, and remix architectures built by leading AI engineers. Read ratings and fork instantly.",
  },
  {
    icon: <Activity className="w-5 h-5 text-violet-400" />,
    title: "Agent Benchmarking",
    desc: "Test your AI workflows against standardized evaluation frameworks to ensure performance and reliability.",
  },
  {
    icon: <GitBranch className="w-5 h-5 text-fuchsia-400" />,
    title: "Version History",
    desc: "Track every prompt change and node update. Instantly roll back to previous functioning states if an edit fails.",
  },
  {
    icon: <Box className="w-5 h-5 text-emerald-400" />,
    title: "Isolated Executions",
    desc: "Run independent workflows per user with completely sandboxed state, ensuring data privacy and security.",
  },
];

export function NewFeaturesSection() {
  return (
    <section className="relative px-5 sm:px-6 py-24 sm:py-32 bento-grid-section bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-fuchsia-400 mb-4 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
              Latest Additions
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6">
              The ecosystem is growing.
            </h2>
            <p className="max-w-xl mx-auto text-gray-400 text-lg">
              We've just rolled out features designed to help you build collaboratively, reliably, and efficiently.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Visual Side */}
          <motion.div
            className="bento-card relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 backdrop-blur-md" />
            
            <div className="absolute top-4 left-4 right-4 flex gap-2">
              <div className="h-2 w-16 bg-white/20 flex-1 rounded-sm overflow-hidden">
                <motion.div className="h-full bg-cyan-400" animate={{ x: ["-100%", "0%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
              </div>
              <div className="h-2 w-16 bg-white/20 flex-1 rounded-sm overflow-hidden">
                <motion.div className="h-full bg-violet-400" animate={{ x: ["100%", "0%"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
              </div>
            </div>

            <div className="flex flex-col gap-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4">
              <motion.div 
                className="bg-black/80 border border-white/10 rounded-lg p-3 flex items-center gap-3 backdrop-blur-md"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
              >
                 <Users className="w-4 h-4 text-cyan-400" />
                 <span className="text-sm text-gray-300">Template forked by user_99</span>
              </motion.div>
              <motion.div 
                className="bg-black/80 border border-white/10 rounded-lg p-3 flex items-center gap-3 backdrop-blur-md translate-x-8"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                 <GitBranch className="w-4 h-4 text-fuchsia-400" />
                 <span className="text-sm text-gray-300">New version tagged: v1.0.4</span>
              </motion.div>
              <motion.div 
                className="bg-black/80 border border-white/10 rounded-lg p-3 flex items-center gap-3 backdrop-blur-md -translate-x-4"
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                 <Activity className="w-4 h-4 text-violet-400" />
                 <span className="text-sm text-gray-300">Benchmark: 94% accuracy vs baseline</span>
              </motion.div>
            </div>
            
          </motion.div>

          {/* List Side */}
          <div className="flex flex-col gap-8">
            {newFeatures.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0 shadow-lg">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">{feat.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
