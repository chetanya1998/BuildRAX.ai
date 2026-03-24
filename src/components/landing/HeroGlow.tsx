"use client";

import { motion } from "framer-motion";

/* ─── Isometric cube helper ─── */
function IsoCube({
  x,
  y,
  size,
  topColor,
  rightColor,
  leftColor,
  opacity = 1,
  delay = 0,
  float = true,
}: {
  x: number; y: number; size: number;
  topColor: string; rightColor: string; leftColor: string;
  opacity?: number; delay?: number; float?: boolean;
}) {
  const h = size * 0.577; // sin(30°) * size
  // Isometric cube: top, right, left faces
  const top = `${x},${y - h} ${x + size},${y} ${x},${y + h} ${x - size},${y}`;
  const right = `${x + size},${y} ${x + size},${y + h * 2} ${x},${y + h * 3} ${x},${y + h}`;
  const left = `${x - size},${y} ${x},${y + h} ${x},${y + h * 3} ${x - size},${y + h * 2}`;

  return (
    <motion.g
      animate={float ? { y: [0, -8, 0] } : {}}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      style={{ opacity }}
    >
      <polygon points={top} fill={topColor} />
      <polygon points={right} fill={rightColor} />
      <polygon points={left} fill={leftColor} />
    </motion.g>
  );
}

/* ─── Floating particle ─── */
function Particle({ cx, cy, r, color, delay }: { cx: number; cy: number; r: number; color: string; delay: number }) {
  return (
    <motion.circle
      cx={cx} cy={cy} r={r} fill={color}
      animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

export function HeroGlow() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Dot-grid overlay */}
      <div className="grid-bg absolute inset-0" />

      {/* Aurora band */}
      <div className="aurora-band" />

      {/* Soft secondary glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600, height: 400,
          top: "15%", left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* ─── Isometric scene ─── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Large hero cube — top right */}
        <IsoCube x={1240} y={160} size={72}
          topColor="rgba(34,211,238,0.18)"
          rightColor="rgba(99,102,241,0.22)"
          leftColor="rgba(79,70,229,0.22)"
          delay={0} />

        {/* Medium cube — top left */}
        <IsoCube x={210} y={200} size={52}
          topColor="rgba(168,85,247,0.15)"
          rightColor="rgba(139,92,246,0.18)"
          leftColor="rgba(109,40,217,0.18)"
          delay={1.2} />

        {/* Small accent cube — far right */}
        <IsoCube x={1360} y={350} size={34}
          topColor="rgba(232,121,249,0.18)"
          rightColor="rgba(192,38,211,0.18)"
          leftColor="rgba(162,28,175,0.18)"
          delay={0.8} />

        {/* Small cube — left mid */}
        <IsoCube x={80} y={420} size={28}
          topColor="rgba(34,211,238,0.14)"
          rightColor="rgba(6,182,212,0.16)"
          leftColor="rgba(8,145,178,0.16)"
          delay={2} />

        {/* Tiny cube — bottom right */}
        <IsoCube x={1310} y={560} size={22}
          topColor="rgba(251,191,36,0.14)"
          rightColor="rgba(245,158,11,0.16)"
          leftColor="rgba(217,119,6,0.16)"
          delay={1.5} />

        {/* Tiny cube — bottom left */}
        <IsoCube x={150} y={580} size={18}
          topColor="rgba(52,211,153,0.14)"
          rightColor="rgba(16,185,129,0.16)"
          leftColor="rgba(5,150,105,0.16)"
          delay={3} />

        {/* ── Connecting grid lines (isometric grid echo) ── */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`gl-${i}`}
            x1={900 + i * 60} y1={100}
            x2={1100 + i * 60} y2={300}
            stroke="rgba(129,140,248,0.06)"
            strokeWidth="1"
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`gr-${i}`}
            x1={1300 - i * 60} y1={100}
            x2={1100 - i * 60} y2={300}
            stroke="rgba(129,140,248,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* ── Floating particles ── */}
        <Particle cx={320} cy={140} r={3} color="rgba(34,211,238,0.5)" delay={0} />
        <Particle cx={1150} cy={240} r={2.5} color="rgba(168,85,247,0.5)" delay={1} />
        <Particle cx={700} cy={80} r={2} color="rgba(232,121,249,0.4)" delay={2} />
        <Particle cx={1050} cy={450} r={2} color="rgba(34,211,238,0.4)" delay={0.5} />
        <Particle cx={440} cy={520} r={3} color="rgba(251,191,36,0.35)" delay={1.8} />
        <Particle cx={960} cy={180} r={1.5} color="rgba(52,211,153,0.45)" delay={3} />
      </svg>

      {/* Noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Bottom edge fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
