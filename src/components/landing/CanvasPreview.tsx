"use client";

import { motion } from "framer-motion";

/* ─── Node data ─── */
const nodes = [
  {
    id: "input",
    label: "USER INPUT",
    sub: "text prompt",
    icon: "⌨",
    color: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.3)",
    border: "rgba(34, 211, 238, 0.35)",
    bg: "rgba(34, 211, 238, 0.06)",
    x: 40,
    y: 120,
    w: 150,
    h: 70,
  },
  {
    id: "retriever",
    label: "RETRIEVER",
    sub: "vector search",
    icon: "🔍",
    color: "#a78bfa",
    glow: "rgba(167, 139, 250, 0.3)",
    border: "rgba(167, 139, 250, 0.35)",
    bg: "rgba(167, 139, 250, 0.06)",
    x: 280,
    y: 40,
    w: 150,
    h: 70,
  },
  {
    id: "llm",
    label: "LLM",
    sub: "gpt-4o",
    icon: "🧠",
    color: "#818cf8",
    glow: "rgba(129, 140, 248, 0.3)",
    border: "rgba(129, 140, 248, 0.35)",
    bg: "rgba(129, 140, 248, 0.06)",
    x: 280,
    y: 180,
    w: 150,
    h: 70,
  },
  {
    id: "memory",
    label: "MEMORY",
    sub: "conversation buffer",
    icon: "💾",
    color: "#e879f9",
    glow: "rgba(232, 121, 249, 0.3)",
    border: "rgba(232, 121, 249, 0.35)",
    bg: "rgba(232, 121, 249, 0.06)",
    x: 520,
    y: 40,
    w: 150,
    h: 70,
  },
  {
    id: "tools",
    label: "TOOLS",
    sub: "web search, calc",
    icon: "🔧",
    color: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.3)",
    border: "rgba(251, 191, 36, 0.35)",
    bg: "rgba(251, 191, 36, 0.06)",
    x: 520,
    y: 180,
    w: 150,
    h: 70,
  },
  {
    id: "output",
    label: "OUTPUT",
    sub: "structured json",
    icon: "📤",
    color: "#34d399",
    glow: "rgba(52, 211, 153, 0.3)",
    border: "rgba(52, 211, 153, 0.35)",
    bg: "rgba(52, 211, 153, 0.06)",
    x: 730,
    y: 120,
    w: 150,
    h: 70,
  },
];

/* ─── Connections between nodes [fromId, toId] ─── */
const edges: [string, string][] = [
  ["input", "retriever"],
  ["input", "llm"],
  ["retriever", "memory"],
  ["retriever", "llm"],
  ["llm", "tools"],
  ["tools", "output"],
  ["memory", "output"],
];

function getNodeCenter(id: string): { cx: number; cy: number } {
  const n = nodes.find((n) => n.id === id)!;
  return { cx: n.x + n.w / 2, cy: n.y + n.h / 2 };
}

export function CanvasPreview() {
  return (
    <div className="canvas-preview-wrapper w-full max-w-5xl mx-auto mt-16 px-4">
      <motion.div
        className="canvas-preview-card relative rounded-2xl border border-white/[0.08] bg-[#08080c]/90 backdrop-blur-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 0 80px -20px rgba(129, 140, 248, 0.15), 0 30px 60px -15px rgba(0,0,0,0.6)",
        }}
        initial={{ opacity: 0, y: 60, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 4 }}
        transition={{
          delay: 0.5,
          duration: 1,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="ml-3 flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500 tracking-wider">
              buildrax://
            </span>
            <span className="text-[11px] font-mono text-gray-300 tracking-wider">
              agent-pipeline.flow
            </span>
          </div>
          <div className="ml-auto flex items-center gap-4 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            <span>6 nodes</span>
            <span>7 edges</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">live</span>
            </span>
          </div>
        </div>

        {/* Canvas area */}
        <div className="relative w-full overflow-hidden" style={{ height: 320 }}>
          {/* Background grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <svg
            viewBox="0 0 920 300"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Glow filters */}
            <defs>
              {nodes.map((n) => (
                <filter key={`glow-${n.id}`} id={`glow-${n.id}`}>
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {/* Edge lines */}
            {edges.map(([fromId, toId], i) => {
              const from = getNodeCenter(fromId);
              const to = getNodeCenter(toId);
              const midX = (from.cx + to.cx) / 2;
              const path = `M ${from.cx} ${from.cy} C ${midX} ${from.cy}, ${midX} ${to.cy}, ${to.cx} ${to.cy}`;
              return (
                <g key={`${fromId}-${toId}`}>
                  {/* Base line */}
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(129, 140, 248, 0.12)"
                    strokeWidth="1.5"
                  />
                  {/* Dashed overlay */}
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(129, 140, 248, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="6 6"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-24"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </path>
                  {/* Flowing dot */}
                  <circle r="3.5" fill="rgba(129, 140, 248, 0.8)">
                    <animateMotion
                      dur={`${2.2 + i * 0.35}s`}
                      repeatCount="indefinite"
                      path={path}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;0"
                      dur={`${2.2 + i * 0.35}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Trailing glow dot */}
                  <circle r="6" fill="rgba(129, 140, 248, 0.2)">
                    <animateMotion
                      dur={`${2.2 + i * 0.35}s`}
                      repeatCount="indefinite"
                      path={path}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.6;0.6;0"
                      dur={`${2.2 + i * 0.35}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Node cards */}
            {nodes.map((n, i) => (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.8 + i * 0.12,
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94] as const,
                }}
              >
                {/* Node glow */}
                <rect
                  x={n.x - 4}
                  y={n.y - 4}
                  width={n.w + 8}
                  height={n.h + 8}
                  rx="14"
                  fill={n.glow}
                  opacity="0.15"
                  filter={`url(#glow-${n.id})`}
                />
                {/* Node background */}
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx="10"
                  fill={n.bg}
                  stroke={n.border}
                  strokeWidth="1"
                />
                {/* Node icon */}
                <text
                  x={n.x + 14}
                  y={n.y + 30}
                  fontSize="16"
                >
                  {n.icon}
                </text>
                {/* Node label */}
                <text
                  x={n.x + 36}
                  y={n.y + 28}
                  fill={n.color}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="var(--font-geist-mono)"
                  letterSpacing="0.08em"
                >
                  {n.label}
                </text>
                {/* Node subtitle */}
                <text
                  x={n.x + 36}
                  y={n.y + 46}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="10"
                  fontFamily="var(--font-geist-mono)"
                >
                  {n.sub}
                </text>
              </motion.g>
            ))}
          </svg>

          {/* Inner ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(129, 140, 248, 0.05) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center gap-6 px-5 py-2.5 border-t border-white/[0.06] bg-white/[0.02] text-[10px] font-mono text-gray-600 tracking-wider">
          <span>latency: <span className="text-cyan-400">124ms</span></span>
          <span>tokens: <span className="text-violet-400">1,847</span></span>
          <span>cost: <span className="text-emerald-400">$0.0024</span></span>
          <span className="ml-auto text-gray-600">v1.0.0</span>
        </div>
      </motion.div>
    </div>
  );
}
