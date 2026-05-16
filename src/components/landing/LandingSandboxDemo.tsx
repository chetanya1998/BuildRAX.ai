"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Play, Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const scenarios = {
  happy: {
    label: "Happy Path",
    icon: Check,
    active: 4,
    explanation: "The user request is checked, authorized, saved, and logged without warnings.",
    logs: ["request received", "payload valid", "user allowed", "database write complete", "success response returned"],
  },
  failure: {
    label: "Failure",
    icon: AlertTriangle,
    active: 3,
    explanation: "The payment step fails, so the system must retry, fall back, or alert an operator.",
    logs: ["request received", "auth passed", "provider failed", "fallback path required", "operator alert suggested"],
  },
  timeout: {
    label: "Timeout",
    icon: Timer,
    active: 2,
    explanation: "A slow dependency risks a poor user response unless the workflow has timeout handling.",
    logs: ["request received", "validation passed", "provider exceeded p95", "timeout warning raised"],
  },
  load: {
    label: "Load",
    icon: Zap,
    active: 1,
    explanation: "A traffic spike should be absorbed by rate limits, cache, queue, and workers.",
    logs: ["traffic spike detected", "rate limiter protects API", "queue absorbs jobs", "worker drains backlog"],
  },
};

const nodes = ["API", "Rate Limit", "Auth", "Service", "Database", "Logs"];

export function LandingSandboxDemo() {
  const [scenarioId, setScenarioId] = useState<keyof typeof scenarios>("happy");
  const scenario = scenarios[scenarioId];
  const activeNode = useMemo(() => nodes[Math.min(scenario.active, nodes.length - 1)], [scenario]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#78A0FF]/15 bg-[#080C14] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
      <div className="flex flex-wrap gap-2">
        {Object.entries(scenarios).map(([id, item]) => {
          const Icon = item.icon;
          return (
            <button
              key={id}
              onClick={() => setScenarioId(id as keyof typeof scenarios)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition",
                scenarioId === id ? "border-[#2F7BFF]/45 bg-[#2F7BFF]/15 text-[#B8D2FF]" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-[#0B111D]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,150,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(120,150,255,0.055)_1px,transparent_1px)] bg-[size:30px_30px]" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 320">
            <path d="M90 160 C 180 70, 280 70, 360 160 S 550 250, 670 160" stroke="rgba(47,123,255,.55)" strokeWidth="2" fill="none" strokeDasharray="8 12">
              <animate attributeName="stroke-dashoffset" from="0" to="-80" dur="2.2s" repeatCount="indefinite" />
            </path>
          </svg>
          <div className="absolute inset-0">
            {nodes.map((node, index) => {
              const left = 8 + index * 16.8;
              const top = index % 2 === 0 ? 42 : 26;
              const isActive = node === activeNode;
              return (
                <motion.button
                  key={node}
                  className={cn(
                    "absolute w-28 rounded-lg border p-3 text-left transition",
                    isActive ? "border-[#2F7BFF] bg-[#2F7BFF]/18 shadow-[0_12px_28px_rgba(47,123,255,0.22)]" : "border-white/10 bg-[#101726]/90"
                  )}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  animate={isActive ? { y: [0, -8, 0] } : { y: [0, -2, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                >
                  <Play className={cn("h-4 w-4", isActive ? "text-[#9EC0FF]" : "text-slate-500")} />
                  <p className="mt-2 text-xs font-semibold text-white">{node}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{isActive ? "active step" : "ready"}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#050812] p-4">
          <p className="text-sm font-semibold text-white">{scenario.label} simulation</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{scenario.explanation}</p>
          <div className="mt-5 space-y-2 font-mono text-[11px] text-slate-400">
            {scenario.logs.map((log, index) => (
              <motion.div
                key={log}
                className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
                initial={{ opacity: 0.35 }}
                animate={{ opacity: [0.5, 1, 0.7] }}
                transition={{ delay: index * 0.18, duration: 2, repeat: Infinity }}
              >
                <span className="text-[#6EA4FF]">{String(index + 1).padStart(2, "0")}</span> {log}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
