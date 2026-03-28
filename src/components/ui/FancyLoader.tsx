"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function FancyLoader({ text = "Loading..." }: { text?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Intelligent progress simulation
    const finishCreep = setTimeout(() => setProgress(99), 3000);
    const intervals: NodeJS.Timeout[] = [];
    
    let current = 0;
    for (let i = 0; i < 20; i++) {
        intervals.push(setTimeout(() => {
            current += Math.floor(Math.random() * 8) + 2;
            if (current > 85) current = 85;
            setProgress(current);
        }, i * 50));
    }

    return () => {
        clearTimeout(finishCreep);
        intervals.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[300px]">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glowing Background / Aura */}
        <motion.div
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="absolute inset-0 bg-primary/20 blur-[32px] rounded-full"
        />

        {/* Spinning Geometric Outer Orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 grid place-items-center"
        >
            <div className="w-24 h-24 border-[1px] border-primary/20 rounded-full absolute mix-blend-screen" />
            <motion.div className="w-3 h-3 rounded-sm rotate-45 bg-pink-400 absolute top-0 shadow-[0_0_15px_rgba(244,114,182,0.8)]" />
            <motion.div className="w-2 h-2 rounded-full bg-violet-400 absolute bottom-2 right-4 shadow-[0_0_15px_rgba(167,139,250,0.8)]" />
        </motion.div>
        
        {/* Spinning Geometric Inner Orbit (Reverse) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 grid place-items-center"
        >
            <div className="w-16 h-16 border-[1px] border-cyan-500/30 rounded-full absolute mix-blend-screen" />
            <motion.div className="w-4 h-4 rounded-sm bg-cyan-400 absolute left-4 bottom-4 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary absolute top-2 right-4 shadow-[0_0_10px_currentColor]" />
        </motion.div>

        {/* Inner Counter */}
        <div className="z-10 text-primary font-mono text-2xl font-bold tracking-tighter drop-shadow-md">
            {progress}<span className="text-sm text-primary/60">%</span>
        </div>
      </div>
      
      {/* Text Label */}
      <motion.p 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-sm text-muted-foreground font-medium animate-pulse tracking-widest uppercase"
      >
        {text}
      </motion.p>
    </div>
  );
}
