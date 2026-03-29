"use client";

import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  Sparkles, 
  Search, 
  MessageSquare, 
  Hash, 
  Users, 
  Github, 
  Database, 
  FileText,
  Zap,
  Globe,
  Cpu
} from "lucide-react";

const integrations = [
  { icon: <BrainCircuit className="w-5 h-5 text-cyan-400" />, name: "OpenAI", color: "from-cyan-500/10 to-cyan-500/20" },
  { icon: <Sparkles className="w-5 h-5 text-violet-400" />, name: "Anthropic", color: "from-violet-500/10 to-violet-500/20" },
  { icon: <Search className="w-5 h-5 text-blue-400" />, name: "Google Gemini", color: "from-blue-500/10 to-blue-500/20" },
  { icon: <MessageSquare className="w-5 h-5 text-emerald-400" />, name: "Slack", color: "from-emerald-500/10 to-emerald-500/20" },
  { icon: <Hash className="w-5 h-5 text-indigo-400" />, name: "Discord", color: "from-indigo-500/10 to-indigo-500/20" },
  { icon: <Users className="w-5 h-5 text-orange-400" />, name: "HubSpot", color: "from-orange-500/10 to-orange-500/20" },
  { icon: <Github className="w-5 h-5 text-white" />, name: "GitHub", color: "from-white/5 to-white/10" },
  { icon: <Database className="w-5 h-5 text-fuchsia-400" />, name: "Salesforce", color: "from-fuchsia-500/10 to-fuchsia-500/20" },
  { icon: <FileText className="w-5 h-5 text-amber-400" />, name: "Notion", color: "from-amber-500/10 to-amber-500/20" },
];

export function IntegrationsShowcase() {
  return (
    <section className="relative px-6 py-24 overflow-hidden border-y border-white/[0.04]">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-cyan-400 mb-4">
              Ecosystem
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-6">
              Connect your favorite <br />
              <span className="text-gradient-hero">models and tools.</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
              BuildRAX is the glue for your AI stack. We provide native integrations for 50+ models, 
              databases, and productivity tools, all wiring together on a single canvas.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {integrations.map((item, i) => (
            <motion.div
              key={item.name}
              className="flex flex-col items-center group cursor-default"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center 
                bg-gradient-to-br ${item.color} 
                border border-white/[0.08] shadow-lg mb-3
                group-hover:border-cyan-500/30 group-hover:shadow-cyan-500/10 
                transition-all duration-300 transform group-hover:-translate-y-1
              `}>
                {item.icon}
              </div>
              <span className="text-[12px] font-medium text-gray-400 group-hover:text-white transition-colors duration-300">
                {item.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Floating background elements for extra "coolness" */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden sm:block hidden">
            <motion.div 
               className="absolute top-1/4 left-10 text-cyan-400/20"
               animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
                <Zap size={40} />
            </motion.div>
            <motion.div 
               className="absolute bottom-1/4 right-10 text-violet-400/20"
               animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
                <Globe size={48} />
            </motion.div>
            <motion.div 
               className="absolute top-1/2 right-1/4 text-cyan-400/10"
               animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
               transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
                <Cpu size={56} />
            </motion.div>
        </div>
      </div>
    </section>
  );
}
