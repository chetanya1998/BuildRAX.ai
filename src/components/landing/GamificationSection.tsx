"use client";

import { motion } from "framer-motion";
import { Trophy, Star, Target, Zap } from "lucide-react";

const engagementFeatures = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Earn XP",
    desc: "Gain experience points for every agent you build, template you publish, and successful execution you run.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "Level Up & Unlock",
    desc: "Climb the ranks from Novice to Architect. Unlock exclusive badges, themes, and advanced compute resources.",
    color: "from-violet-400 to-fuchsia-500",
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: "Community Recognition",
    desc: "Publish your top-performing architectures. Get rated by peers and dominate the monthly creator leaderboards.",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Complete Missions",
    desc: "Take on daily and weekly building challenges to push your skills and discover new AI integration patterns.",
    color: "from-emerald-400 to-teal-500",
  },
];

export function GamificationSection() {
  return (
    <section className="relative px-5 sm:px-6 py-20 sm:py-32 overflow-hidden bg-background">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-violet-400 mb-4">
                Platform Engagement
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6">
                Build harder. <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  Earn your rank.
                </span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-8">
                BuildRAX turns AI architecture into an engaging journey. Every action you take—from wiring nodes to deploying complex workflows—rewards you with XP and progression. Connect, compete, and climb the ranks of AI engineers.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {engagementFeatures.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${feat.color} text-white shadow-lg`}>
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Visual Showcase (e.g., a mock level progression card) */}
          <motion.div
            className="flex-1 w-full max-w-md lg:max-w-none relative"
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            <div className="relative aspect-[4/3] w-full rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-8">
              {/* Animated Rings */}
              <motion.div 
                className="absolute inset-0 border-[40px] border-violet-500/10 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute inset-4 border-[20px] border-cyan-500/10 rounded-full"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <div className="relative z-10 w-32 h-32 rounded-full border-4 border-violet-500 bg-black flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.4)] mb-6">
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-violet-400 to-cyan-400">
                  42
                </span>
              </div>
              
              <h4 className="text-2xl font-bold text-white mb-2">Master Architect</h4>
              <p className="text-gray-400 text-sm mb-6">Top 5% of Builders this month</p>
              
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-400">
                  <span>XP Progress</span>
                  <span className="text-cyan-400">8,450 / 10,000</span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "84.5%" }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Floating Element */}
            <motion.div 
              className="absolute -top-6 -right-6 bg-black border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex items-center gap-3"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Achievement Unlocked</p>
                <p className="text-sm font-semibold text-white">First Agent Deployed</p>
              </div>
            </motion.div>
            
          </motion.div>
        </div>
      </div>
    </section>
  );
}
