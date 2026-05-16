"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Braces,
  Check,
  CircleDot,
  Code2,
  Database,
  FileJson,
  Fingerprint,
  Gauge,
  GitBranch,
  KeyRound,
  Layers3,
  LockKeyhole,
  Menu,
  MousePointer2,
  Network,
  Play,
  Rocket,
  Route,
  ScrollText,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingSandboxDemo } from "@/components/landing/LandingSandboxDemo";
import { PricingTiers } from "@/components/landing/PricingTiers";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const navLinks = [
  { label: "Product Overview", href: "#product-overview" },
  { label: "Templates", href: "#templates" },
  { label: "Sandbox", href: "#sandbox" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "https://github.com/chetanya1998/BuildRAX.ai" },
];

const architectureNodes = [
  { id: "client", label: "Client Request", sub: "POST /checkout", x: 44, y: 150, icon: MousePointer2 },
  { id: "gateway", label: "API Gateway", sub: "rate limit", x: 216, y: 80, icon: Server },
  { id: "auth", label: "Auth", sub: "RBAC", x: 216, y: 222, icon: KeyRound },
  { id: "payment", label: "Payment Service", sub: "idempotency missing", x: 418, y: 150, icon: Gauge, warning: true },
  { id: "db", label: "PostgreSQL", sub: "orders", x: 636, y: 78, icon: Database },
  { id: "queue", label: "Queue", sub: "retry policy", x: 636, y: 224, icon: Route },
  { id: "worker", label: "Worker", sub: "async job", x: 812, y: 150, icon: Boxes },
];

const architectureEdges = [
  ["client", "gateway"],
  ["client", "auth"],
  ["gateway", "payment"],
  ["auth", "payment"],
  ["payment", "db"],
  ["payment", "queue"],
  ["queue", "worker"],
];

const problems = [
  ["Backend logic stays unclear", "Product ideas are defined, but system behavior is not."],
  ["Edge cases are missed", "Retries, auth rules, queue failures, and webhook handling often come too late."],
  ["Diagrams do not validate behavior", "Most tools draw boxes. They do not help validate the workflow."],
  ["Engineering handoff is incomplete", "Teams need more than a PRD. They need a backend blueprint."],
];

const solutionBlocks = [
  {
    title: "Visual Builder",
    copy: "Design APIs, services, databases, queues, storage, workers, and integrations on a clean canvas.",
    icon: Workflow,
  },
  {
    title: "Review Engine",
    copy: "Run deterministic checks for missing auth, weak reliability, security issues, and incomplete flows.",
    icon: ShieldCheck,
  },
  {
    title: "Sandbox",
    copy: "Simulate happy paths, failure paths, timeouts, and load assumptions before implementation starts.",
    icon: Play,
  },
  {
    title: "Exports",
    copy: "Generate Mermaid diagrams, workflow JSON, handoff docs, and architecture-ready outputs.",
    icon: FileJson,
  },
];

const steps = [
  ["Start with a blank canvas or template", "Choose a backend use case like auth, payments, SaaS backend, queue systems, or custom flows."],
  ["Build the workflow visually", "Drag nodes, connect paths, configure behavior, and organize your backend clearly."],
  ["Review and simulate", "Run checks for missing pieces, then test failures, retries, timeouts, and flow behavior."],
  ["Export for engineering", "Generate diagrams, workflow specs, and technical outputs your team can build from."],
];

const features: Array<[string, string, LucideIcon]> = [
  ["Visual Backend Builder", "Create workflows using APIs, auth, queues, databases, workers, storage, and external services.", Network],
  ["Custom Node System", "Define reusable backend components with inputs, outputs, dependencies, and failure behavior.", CircleDot],
  ["Workflow Review", "Identify missing schemas, auth checks, retry logic, rate limits, observability, and more.", Activity],
  ["Simulation Sandbox", "Test success flows, error flows, third-party failures, and system assumptions before code is written.", Play],
  ["Mermaid Sandbox", "Generate, edit, preview, and export Mermaid diagrams directly from your architecture.", GitBranch],
  ["Developer-Ready Exports", "Export technical specs, workflow JSON, architecture docs, and API structure.", Code2],
  ["Built-in Security Thinking", "Validate backend flows against RBAC, signed webhooks, audit logs, and rate limiting.", LockKeyhole],
  ["Template Library", "Start fast with ready-made architecture flows for common backend use cases.", Layers3],
];

const showcaseTabs = [
  {
    id: "builder",
    label: "Builder",
    title: "Design your backend visually",
    copy: "Map services, APIs, queues, and databases in a clean drag-and-drop workflow builder that feels structured, not cluttered.",
    stats: ["8 nodes", "12 edges", "4 configured checks"],
  },
  {
    id: "review",
    label: "Review",
    title: "Catch the missing pieces early",
    copy: "See issues like missing idempotency, lack of auth, no retry policy, no audit logs, and incomplete failure handling.",
    stats: ["2 warnings", "6 checks passed", "1 critical path"],
  },
  {
    id: "sandbox",
    label: "Sandbox",
    title: "Test how the workflow behaves",
    copy: "Run scenarios for success, timeout, failure, retries, and load assumptions, then understand where the system breaks.",
    stats: ["timeout simulated", "retry path found", "p95 reviewed"],
  },
  {
    id: "mermaid",
    label: "Mermaid",
    title: "Generate backend diagrams instantly",
    copy: "Turn your workflow into Mermaid diagrams for documentation, collaboration, and developer communication.",
    stats: ["sequence", "flowchart", "export ready"],
  },
  {
    id: "export",
    label: "Export",
    title: "Take real outputs into execution",
    copy: "Export architecture specs, API structures, workflow JSON, and handoff documentation your team can actually use.",
    stats: ["spec.md", "workflow.json", "diagram.mmd"],
  },
];

const templates = [
  {
    title: "Authentication System",
    copy: "Plan signup, login, sessions, permissions, and audit records before engineering starts.",
    bestFor: "SaaS apps, dashboards, portals",
  },
  {
    title: "Payment Flow",
    copy: "Map checkout, payment provider calls, webhook verification, retries, and safe order updates.",
    bestFor: "Subscriptions, wallets, commerce",
  },
  {
    title: "Webhook Processor",
    copy: "Receive third-party events, verify signatures, queue processing, retry failures, and log outcomes.",
    bestFor: "Stripe, GitHub, CRM, partner events",
  },
  {
    title: "Queue + Worker Pipeline",
    copy: "Move slow work into background jobs with retry rules, worker capacity, and dead-letter handling.",
    bestFor: "Imports, emails, file jobs",
  },
  {
    title: "Multi-Tenant SaaS Backend",
    copy: "Design tenants, teams, billing access, role boundaries, and shared data rules.",
    bestFor: "B2B SaaS, team workspaces",
  },
  {
    title: "File Upload and Processing",
    copy: "Validate files, store objects, trigger background processing, and notify users when complete.",
    bestFor: "Media, documents, onboarding",
  },
  {
    title: "Notification Pipeline",
    copy: "Coordinate email, push, preferences, retry paths, and delivery observability.",
    bestFor: "Product alerts, lifecycle messages",
  },
  {
    title: "Creator Marketplace Backend",
    copy: "Map profiles, purchases, payouts, moderation, disputes, and event-driven workflows.",
    bestFor: "Marketplaces, creator tools",
  },
];

const securityItems = [
  "Authentication and authorization flow checks",
  "Rate limit and abuse protection guidance",
  "Webhook signature verification checks",
  "Audit log reminders for sensitive actions",
  "Data handling and storage awareness",
  "Retry, timeout, and circuit-breaker review",
  "Queue and dead-letter queue logic checks",
  "Deterministic workflow validation",
];

const audiences = [
  ["Founders", "Turn product ideas into backend blueprints before hiring or building."],
  ["Product Managers", "Translate product flows into technical workflows engineering can understand."],
  ["Backend Engineers", "Map system architecture faster, review dependencies, and share cleaner designs."],
  ["Fast-moving teams", "Avoid rework by validating architecture early instead of fixing broken backend logic later."],
];

function nodeCenter(id: string) {
  const node = architectureNodes.find((item) => item.id === id)!;
  return { x: node.x + 70, y: node.y + 32 };
}

function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      className={align === "center" ? "mx-auto mb-12 max-w-3xl text-center" : "mb-10 max-w-3xl"}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
    >
      {eyebrow ? (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6EA4FF]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-[#F5F7FB] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {copy ? <p className="mt-5 text-base leading-7 text-[#9CA8BF] sm:text-lg">{copy}</p> : null}
    </motion.div>
  );
}

function ArchitectureCanvas() {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-lg border border-[#78A0FF]/15 bg-[#0B111D] xl:min-h-[430px]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,150,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(120,150,255,0.045)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(47,123,255,0.18),transparent_45%)]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 980 420" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="blue-glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {architectureEdges.map(([fromId, toId], index) => {
          const from = nodeCenter(fromId);
          const to = nodeCenter(toId);
          const midX = (from.x + to.x) / 2;
          const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;

          return (
            <g key={`${fromId}-${toId}`}>
              <path d={path} stroke="rgba(120,150,255,0.14)" strokeWidth="1.5" fill="none" />
              <path
                d={path}
                stroke="rgba(47,123,255,0.55)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="8 10"
                filter="url(#blue-glow)"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-54" dur="2.6s" repeatCount="indefinite" />
              </path>
              <circle r="4" fill="#2F7BFF" filter="url(#blue-glow)">
                <animateMotion dur={`${2.4 + index * 0.18}s`} repeatCount="indefinite" path={path} />
                <animate attributeName="opacity" values="0;1;1;0" dur={`${2.4 + index * 0.18}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </svg>

      <div className="absolute left-4 right-4 top-4 flex items-center gap-3 rounded-md border border-white/[0.06] bg-[#060A11]/75 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-medium text-[#F5F7FB]">
          <Workflow className="size-3.5 text-[#2F7BFF]" />
          payment-service.workflow
        </div>
        <div className="ml-auto hidden gap-3 text-[10px] uppercase tracking-[0.18em] text-[#6F7B91] sm:flex">
          <span>7 nodes</span>
          <span>review active</span>
        </div>
      </div>

      {architectureNodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <motion.div
            key={node.id}
            className="absolute w-[140px] rounded-lg border border-[#78A0FF]/20 bg-[#101726]/90 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur transition hover:border-[#2F7BFF]/60 hover:shadow-[0_0_30px_rgba(47,123,255,0.18)]"
            style={{ left: `${(node.x / 980) * 100}%`, top: `${(node.y / 420) * 100}%` }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: [0, -3, 0] }}
            transition={{ delay: 0.1 + index * 0.08, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
          >
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-[#2F7BFF]/12 text-[#6EA4FF]">
                <Icon className="size-3.5" />
              </span>
              {node.warning ? (
                <span className="ml-auto rounded-full border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                  warn
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-xs font-semibold text-[#F5F7FB]">{node.label}</div>
            <div className={node.warning ? "mt-1 text-[10px] text-amber-200" : "mt-1 text-[10px] text-[#9CA8BF]"}>
              {node.sub}
            </div>
          </motion.div>
        );
      })}

      <motion.div
        className="absolute bottom-5 right-5 hidden w-56 rounded-lg border border-[#2F7BFF]/25 bg-[#07101D]/95 p-4 shadow-[0_0_30px_rgba(47,123,255,0.18)] md:block"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: [0, 1, 1], x: 0 }}
        transition={{ delay: 3.8, duration: 0.5, repeat: Infinity, repeatDelay: 6 }}
      >
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#F5F7FB]">
          <Braces className="size-4 text-[#2F7BFF]" />
          Export ready
        </div>
        <div className="space-y-2 text-[11px] text-[#9CA8BF]">
          <div className="flex items-center justify-between"><span>diagram.mmd</span><Check className="size-3 text-emerald-300" /></div>
          <div className="flex items-center justify-between"><span>workflow.json</span><Check className="size-3 text-emerald-300" /></div>
          <div className="flex items-center justify-between"><span>handoff.md</span><Check className="size-3 text-emerald-300" /></div>
        </div>
      </motion.div>
    </div>
  );
}

function HeroMock() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-6xl"
      initial={{ opacity: 0, y: 34 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.8 }}
    >
      <div className="absolute -inset-8 rounded-full bg-[#2F7BFF]/20 blur-[90px]" />
      <div className="relative overflow-hidden rounded-xl border border-[#78A0FF]/15 bg-[#0A0D14]/70 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#C3CAD8]">
            <Workflow className="size-3.5 text-[#2F7BFF]" />
            payment-service.workflow
          </div>
          <div className="ml-auto hidden items-center gap-5 text-[10px] uppercase tracking-[0.18em] text-[#6F7B91] sm:flex">
            <span>7 nodes</span>
            <span>review active</span>
            <span className="text-emerald-300">export ready</span>
          </div>
        </div>

        <div className="grid gap-3 p-3 lg:grid-cols-[240px_1fr_260px]">
          <div className="rounded-lg border border-[#78A0FF]/15 bg-[#07101D]/75 p-4">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-white">
              <Terminal className="size-4 text-[#2F7BFF]" />
              Workflow Console
            </div>
            <div className="space-y-2 font-mono text-[11px] leading-5 text-[#9CA8BF]">
              {[
                '> create "Payment Service"',
                "> connect gateway -> auth",
                "> run review",
                "✔ Auth check found",
                "⚠ Add idempotency",
              ].map((line) => (
                <div
                  key={line}
                  className={line.startsWith("✔") ? "text-emerald-300" : line.startsWith("⚠") ? "text-amber-300" : ""}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <ArchitectureCanvas />

          <div className="grid gap-3">
            <div className="rounded-lg border border-[#78A0FF]/15 bg-[#07101D]/75 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6EA4FF]">Review</div>
              {["Auth check found", "Retry path available", "Missing idempotency"].map((item, index) => (
                <div key={item} className="mb-2 flex items-center gap-2 rounded-md bg-white/[0.035] px-3 py-2 text-xs text-[#C3CAD8]">
                  {index === 2 ? <AlertTriangle className="size-3.5 text-amber-300" /> : <Check className="size-3.5 text-emerald-300" />}
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-[#78A0FF]/15 bg-[#07101D]/75 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6EA4FF]">Exports</div>
              {["diagram.mmd", "workflow.json", "handoff.md"].map((item) => (
                <div key={item} className="mb-2 flex items-center justify-between rounded-md bg-white/[0.035] px-3 py-2 font-mono text-xs text-[#9CA8BF]">
                  {item}
                  <Check className="size-3.5 text-emerald-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ShowcaseMock({ tab }: { tab: (typeof showcaseTabs)[number] }) {
  const commonCard = "group rounded-lg border border-[#78A0FF]/15 bg-[#0D1421]/75 shadow-[0_14px_34px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#2F7BFF]/45 hover:bg-[#101A2B]/90 hover:shadow-[0_18px_44px_rgba(15,23,42,0.20)]";

  const builderVisual = (
    <div className="grid min-h-[360px] gap-5 lg:grid-cols-[1fr_260px]">
      <div className={`${commonCard} relative overflow-hidden p-6`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,150,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(120,150,255,0.04)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="relative mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">{tab.title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#9CA8BF]">{tab.copy}</p>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
            live canvas
          </span>
        </div>
        <div className="relative grid gap-4 md:grid-cols-4">
          {["Request", "Gateway", "Auth", "Service"].map((item, index) => (
            <motion.div
              key={item}
              className="group/node relative rounded-lg border border-[#78A0FF]/20 bg-[#101726]/90 p-4 shadow-[0_0_24px_rgba(47,123,255,0.06)] transition hover:-translate-y-1 hover:border-[#2F7BFF]/60 hover:shadow-[0_0_34px_rgba(47,123,255,0.22)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: index * 0.08 }}
            >
              {index < 3 ? <div className="absolute left-full top-1/2 hidden h-px w-4 bg-[#2F7BFF]/70 md:block" /> : null}
              <div className="mb-10 flex size-10 items-center justify-center rounded-md bg-[#2F7BFF]/12 text-[#8DB5FF] transition group-hover/node:shadow-[0_0_24px_rgba(47,123,255,0.35)]">
                <Network className="size-4" />
              </div>
              <div className="text-sm font-semibold text-white">{item}</div>
              <div className="mt-2 text-xs text-[#9CA8BF]">configured node</div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className={`${commonCard} p-5`}>
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6EA4FF]">Node Library</div>
        {["API", "Database", "Queue", "Worker", "Webhook"].map((item) => (
          <div key={item} className="mb-2 flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-[#C3CAD8] transition hover:border-[#2F7BFF]/45 hover:bg-[#2F7BFF]/10 hover:text-white hover:shadow-[0_0_22px_rgba(47,123,255,0.14)]">
            <span>{item}</span>
            <CircleDot className="size-3 text-[#2F7BFF]" />
          </div>
        ))}
      </div>
    </div>
  );

  const reviewVisual = (
    <div className="grid min-h-[360px] gap-5 lg:grid-cols-[320px_1fr]">
      <div className={`${commonCard} flex min-h-[360px] flex-col items-center justify-center p-8 text-center`}>
        <div className="relative mx-auto flex size-44 items-center justify-center rounded-full border border-[#2F7BFF]/20 bg-[#2F7BFF]/8">
          <div className="absolute inset-4 rounded-full border-[10px] border-[#2F7BFF]/35" />
          <div className="relative flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-semibold leading-none text-white">82</div>
            <div className="mt-3 max-w-24 text-center text-[10px] uppercase leading-4 tracking-[0.18em] text-[#9CA8BF]">Architecture Score</div>
          </div>
        </div>
        <p className="mt-6 text-sm leading-6 text-[#9CA8BF]">{tab.copy}</p>
      </div>
      <div className={`${commonCard} p-6`}>
        <h3 className="text-xl font-semibold text-white">{tab.title}</h3>
        <div className="mt-6 grid gap-3">
          {[
            ["Auth check found", "Every protected endpoint has an authorization gate.", "pass"],
            ["Missing idempotency", "Payment retry can double-write order state.", "warn"],
            ["No audit event", "Sensitive billing action should emit an audit log.", "warn"],
            ["Retry path available", "Timeout scenario has a safe recovery branch.", "pass"],
          ].map(([title, copy, tone]) => (
            <motion.div
              key={title}
              className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-[#07101D]/75 p-4 shadow-[0_0_20px_rgba(47,123,255,0.04)] transition hover:-translate-y-0.5 hover:border-[#2F7BFF]/35 hover:bg-[#0D1726] hover:shadow-[0_0_28px_rgba(47,123,255,0.16)]"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 6 }}
            >
              <span className={tone === "pass" ? "text-emerald-400" : "text-amber-400"}>
                {tone === "pass" ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
              </span>
              <div>
                <div className="text-sm font-semibold text-white">{title}</div>
                <p className="mt-1 text-sm leading-5 text-[#9CA8BF]">{copy}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const sandboxVisual = (
    <div className={`${commonCard} min-h-[360px] p-6`}>
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h3 className="text-xl font-semibold text-white">{tab.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9CA8BF]">{tab.copy}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {["success", "timeout", "retry", "load"].map((item, index) => (
            <span key={item} className={index === 1 ? "rounded-full bg-amber-300/10 px-3 py-1 text-amber-200" : "rounded-full bg-[#2F7BFF]/10 px-3 py-1 text-[#8DB5FF]"}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["00ms", "Request starts", "Client submits checkout."],
          ["42ms", "Payment timeout", "Provider does not respond."],
          ["110ms", "Retry branch", "Backoff path activates."],
          ["180ms", "Recovered", "Order state is preserved."],
        ].map(([time, title, copy], index) => (
          <motion.div
            key={title}
            className="rounded-lg border border-[#78A0FF]/15 bg-[#07101D]/70 p-5 shadow-[0_0_20px_rgba(47,123,255,0.05)] transition hover:-translate-y-1 hover:border-[#2F7BFF]/55 hover:bg-[#101A2B] hover:shadow-[0_0_34px_rgba(47,123,255,0.18)]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="mb-8 text-xs font-mono text-[#6EA4FF]">{time}</div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <p className="mt-2 text-sm leading-5 text-[#9CA8BF]">{copy}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const mermaidVisual = (
    <div className="grid min-h-[360px] gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className={`${commonCard} p-5 font-mono text-sm leading-7 text-[#9CA8BF]`}>
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-white">
          <GitBranch className="size-4 text-[#2F7BFF]" />
          diagram.mmd
        </div>
        <div className="text-[#8DB5FF]">flowchart LR</div>
        <div>A[Client] --&gt; B[API Gateway]</div>
        <div>B --&gt; C[Auth Check]</div>
        <div>C --&gt; D[Payment Service]</div>
        <div>D --&gt; E[(PostgreSQL)]</div>
        <div>D -- timeout --&gt; F[Retry Queue]</div>
      </div>
      <div className={`${commonCard} relative overflow-hidden p-8`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,150,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(120,150,255,0.04)_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="relative mb-8">
          <h3 className="text-xl font-semibold text-white">{tab.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#9CA8BF]">{tab.copy}</p>
        </div>
        <div className="relative flex flex-wrap items-center justify-center gap-3">
          {["Client", "Gateway", "Auth", "Payment", "DB"].map((item) => (
            <div key={item} className="rounded-lg border border-[#2F7BFF]/25 bg-[#2F7BFF]/10 px-5 py-3 text-sm font-semibold text-white">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const exportVisual = (
    <div className={`${commonCard} min-h-[360px] p-6`}>
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h3 className="text-xl font-semibold text-white">{tab.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#9CA8BF]">{tab.copy}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Architecture Spec", "spec.md", ScrollText],
          ["Workflow JSON", "workflow.json", FileJson],
          ["Mermaid Diagram", "diagram.mmd", GitBranch],
        ].map(([title, file, Icon]) => (
          <motion.div
            key={title as string}
            className="rounded-lg border border-[#78A0FF]/15 bg-[#07101D]/80 p-5 shadow-[0_0_22px_rgba(47,123,255,0.06)] transition hover:-translate-y-1 hover:border-[#2F7BFF]/55 hover:bg-[#101A2B] hover:shadow-[0_0_36px_rgba(47,123,255,0.2)]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="mb-10 size-6 text-[#8DB5FF]" />
            <div className="text-sm font-semibold text-white">{title as string}</div>
            <div className="mt-2 flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2 font-mono text-xs text-[#9CA8BF]">
              {file as string}
              <Check className="size-3 text-emerald-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const visualByTab = {
    builder: builderVisual,
    review: reviewVisual,
    sandbox: sandboxVisual,
    mermaid: mermaidVisual,
    export: exportVisual,
  };

  return (
    <div className="relative">
      {visualByTab[tab.id as keyof typeof visualByTab]}
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(showcaseTabs[0]);

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#0A0D14] text-[#F5F7FB]">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(47,123,255,0.20),transparent_32%),radial-gradient(circle_at_80%_12%,rgba(81,120,255,0.12),transparent_28%),linear-gradient(180deg,#0A0D14_0%,#090D15_48%,#070A10_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,150,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(120,150,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_20%,black,transparent)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0D14]/82 px-5 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link href="/" className="shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg border border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#6EA4FF] shadow-[0_0_24px_rgba(47,123,255,0.22)]">
                <Network className="size-4.5" />
              </span>
              <div>
                <div className="text-base font-bold tracking-tight text-white">BuildRAX.ai</div>
                <div className="hidden text-[10px] font-medium text-[#6F7B91] sm:block">
                  Design backend systems before building them
                </div>
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#9CA8BF] md:flex">
            {navLinks.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <Link key={link.label} href={link.href} className="transition hover:text-white" target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle compact />
            <Button variant="ghost" size="sm" className="h-9 px-4 text-[#9CA8BF] hover:bg-white/[0.04] hover:text-white" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="h-9 rounded-lg bg-[#2F7BFF] px-4 font-semibold text-white shadow-[0_0_26px_rgba(47,123,255,0.32)] hover:bg-[#4D8EFF]" asChild>
              <Link href="/builder" prefetch={false}>Start Building</Link>
            </Button>
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-[#9CA8BF] transition hover:bg-white/[0.05] hover:text-white md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-x-0 top-[73px] z-40 border-b border-white/[0.06] bg-[#0A0D14]/96 px-5 py-5 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const external = link.href.startsWith("http");
                return (
                  <Link key={link.label} href={link.href} className="text-sm font-medium text-[#C3CAD8]" target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                );
              })}
              <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                <ThemeToggle className="h-10" />
                <Button variant="outline" className="h-10 border-[#78A0FF]/15 bg-white/[0.03]" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button className="h-10 bg-[#2F7BFF] text-white" asChild>
                  <Link href="/builder" prefetch={false}>Start Building</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main>
        <section className="relative px-5 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div
              className="mx-auto max-w-4xl text-center"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#78A0FF]/15 bg-[#2F7BFF]/10 px-3 py-1.5 text-xs font-semibold text-[#8DB5FF]">
                <Sparkles className="size-3.5" />
                Visual architecture workspace for modern software teams
              </div>
              <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.4rem]">
                Design backend workflows before writing code.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#9CA8BF] sm:text-lg">
                BuildRAX helps founders, product teams, and engineers visually map backend systems, run workflow checks, simulate behavior, and generate developer-ready architecture outputs.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" className="h-12 rounded-lg bg-[#2F7BFF] px-6 text-base font-semibold text-white shadow-[0_0_32px_rgba(47,123,255,0.35)] hover:bg-[#4D8EFF]" asChild>
                  <Link href="/builder" prefetch={false}>
                    Start Building <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              </div>
              <p className="mt-8 text-sm text-[#778398]">
                Built for founders, PMs, backend engineers, and fast-moving product teams.
              </p>
            </motion.div>

            <div className="mt-14">
              <HeroMock />
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-[#101726]/35 px-5 py-5 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-sm text-[#9CA8BF]">
            <span>From idea to architecture</span>
            <span className="hidden h-1 w-1 rounded-full bg-[#2F7BFF] sm:block" />
            <span>Deterministic checks</span>
            <span className="hidden h-1 w-1 rounded-full bg-[#2F7BFF] sm:block" />
            <span>Simulation before implementation</span>
            <span className="hidden h-1 w-1 rounded-full bg-[#2F7BFF] sm:block" />
            <span>Developer-ready exports</span>
          </div>
        </section>

        <section id="product-overview" className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Product overview"
              title="Describe your backend before writing code."
              copy="BuildRAX turns a product idea into a backend blueprint. You can see how requests move, catch missing auth, rate limits, queues, and failure handling, then export diagrams and developer handoff docs."
            />
            <div className="mb-10 grid gap-4 lg:grid-cols-2">
              {[
                ["Non-technical reading mode", "Start with the product outcome, choose a template, then follow guided explanations for each backend part, expected behavior, and exact simulation result."],
                ["Technical reading mode", "Work with a graph-based deterministic architecture workspace: node roles, contracts, review rules, simulations, Mermaid diagrams, and exportable handoff artifacts."],
              ].map(([title, copy]) => (
                <motion.div
                  key={title}
                  className="rounded-lg border border-[#78A0FF]/15 bg-[#101726]/70 p-6"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-70px" }}
                >
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#9CA8BF]">{copy}</p>
                </motion.div>
              ))}
            </div>
            <SectionHeading
              eyebrow="The problem"
              title="Most teams move from idea to code too fast."
              copy="Backend planning is usually scattered across docs, whiteboards, chats, and engineering meetings. That leads to missed failure paths, weak architecture decisions, and expensive rework later."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {problems.map(([title, copy], index) => (
                <motion.div
                  key={title}
                  className="rounded-lg border border-[#78A0FF]/15 bg-[#0F1724]/80 p-6 transition hover:border-[#2F7BFF]/55 hover:shadow-[0_0_34px_rgba(47,123,255,0.16)]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-amber-300/10 text-amber-200">
                    <AlertTriangle className="size-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#9CA8BF]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="The solution"
              title="Build the backend map first."
              copy="BuildRAX gives you a structured visual workspace to design backend systems, validate important logic, simulate real scenarios, and export clean architecture outputs."
            />
            <div className="grid gap-4 lg:grid-cols-4">
              {solutionBlocks.map((block, index) => {
                const Icon = block.icon;
                return (
                  <motion.div
                    key={block.title}
                    className="group rounded-lg border border-[#78A0FF]/15 bg-[#101726]/70 p-6 transition hover:-translate-y-1 hover:border-[#2F7BFF]/55 hover:shadow-[0_0_36px_rgba(47,123,255,0.18)]"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-70px" }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <div className="mb-5 flex size-11 items-center justify-center rounded-lg border border-[#2F7BFF]/20 bg-[#2F7BFF]/10 text-[#8DB5FF] transition group-hover:shadow-[0_0_26px_rgba(47,123,255,0.28)]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{block.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#9CA8BF]">{block.copy}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Process" title="How BuildRAX works" />
            <div className="relative grid gap-4 lg:grid-cols-4">
              <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-[#2F7BFF]/35 to-transparent lg:block" />
              {steps.map(([title, copy], index) => (
                <motion.div
                  key={title}
                  className="group relative overflow-hidden rounded-lg border border-[#78A0FF]/15 bg-[#0F1724]/88 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22),0_0_26px_rgba(47,123,255,0.06)] transition hover:border-[#2F7BFF]/60 hover:bg-[#111D30] hover:shadow-[0_26px_70px_rgba(0,0,0,0.28),0_0_44px_rgba(47,123,255,0.22)]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2F7BFF]/55 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="mb-8 flex size-10 items-center justify-center rounded-full border border-[#2F7BFF]/35 bg-[#0A0D14] text-sm font-bold text-[#8DB5FF] shadow-[0_0_26px_rgba(47,123,255,0.2)] transition group-hover:border-[#8DB5FF]/70 group-hover:shadow-[0_0_34px_rgba(47,123,255,0.38)]">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#9CA8BF]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Core features"
              title="Everything needed to plan backend systems with clarity"
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {features.map(([title, copy, Icon], index) => (
                <motion.div
                  key={title as string}
                  className="rounded-lg border border-[#78A0FF]/15 bg-[#0F1724]/75 p-5 transition hover:border-[#2F7BFF]/55 hover:bg-[#101A2B] hover:shadow-[0_0_32px_rgba(47,123,255,0.14)]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-[#2F7BFF]/10 text-[#8DB5FF]">
                    <Icon className="size-4.5" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#9CA8BF]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="showcase" className="px-5 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Workspace"
              title="A workspace built for backend thinking"
              copy="Switch between building, reviewing, simulating, diagramming, and export modes without leaving the same architecture context."
            />
            <div className="mx-auto mb-8 flex max-w-3xl justify-center">
              <div className="flex gap-2 overflow-x-auto rounded-lg border border-white/[0.06] bg-[#080C14]/80 p-1.5">
                {showcaseTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`min-w-fit rounded-md px-4 py-2 text-sm font-semibold transition ${
                      activeTab.id === tab.id
                        ? "bg-[#2F7BFF] text-white shadow-[0_0_22px_rgba(47,123,255,0.26)]"
                        : "text-[#9CA8BF] hover:bg-white/[0.04] hover:text-white"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <ShowcaseMock tab={activeTab} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section id="sandbox" className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Interactive sandbox"
              title="Watch backend behavior before anything is built."
              copy="Toggle a landing-page simulation, see nodes light up step by step, read terminal logs, and understand the plain-English meaning of each backend action."
            />
            <LandingSandboxDemo />
          </div>
        </section>

        <section id="templates" className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Templates"
              title="Choose a backend use case and see how it should work."
              copy="Templates are backend blueprints for common product flows. Pick the flow closest to your idea, see the required backend parts, customize the nodes, simulate behavior, and export a developer handoff."
            />
            <div className="mb-8 grid gap-3 md:grid-cols-3">
              {[
                ["100", "backend templates", "SaaS auth, subscription billing, RAG chatbot, marketplace escrow, wallet, approval workflows, and CI/CD pipelines."],
                ["10", "template categories", "SaaS, fintech, ecommerce, marketplaces, AI/RAG, education, health, mobility, operations, and consumer apps."],
                ["60", "backend node types", "APIs, webhooks, auth, RBAC, queues, workers, cache, storage, alerts, metrics, payments, and custom nodes."],
              ].map(([number, title, copy]) => (
                <div key={title} className="rounded-lg border border-[#78A0FF]/15 bg-[#101726]/70 p-5">
                  <p className="text-3xl font-semibold text-white">{number}</p>
                  <p className="mt-1 text-sm font-semibold text-[#B8D2FF]">{title}</p>
                  <p className="mt-3 text-xs leading-5 text-[#9CA8BF]">{copy}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {templates.map((template, index) => (
                <motion.div
                  key={template.title}
                  className="flex min-h-[260px] flex-col rounded-lg border border-[#78A0FF]/15 bg-[#0F1724]/72 p-5 transition hover:border-[#2F7BFF]/45 hover:bg-[#101A2B]/80"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <ScrollText className="size-5 text-[#8DB5FF]" />
                    <ArrowRight className="size-4 text-[#4F5D75]" />
                  </div>
                  <h3 className="font-semibold text-white">{template.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#9CA8BF]">{template.copy}</p>
                  <div className="mt-auto pt-5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#6EA4FF]">Best for</p>
                    <p className="mt-1 text-xs leading-5 text-[#9CA8BF]">{template.bestFor}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {["Pick the closest use case", "Edit the included nodes", "Add your custom services", "Simulate and export handoff"].map((item, index) => (
                <div key={item} className="flex min-h-24 flex-col justify-between rounded-lg border border-white/[0.06] bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6EA4FF]">Step {index + 1}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button className="h-11 rounded-lg bg-[#2F7BFF] px-6 text-sm font-semibold text-white hover:bg-[#4D8EFF]" asChild>
                <Link href="/templates">Open full template catalog</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHeading
              align="left"
              eyebrow="Reliability and security"
              title="Designed with backend reliability and security in mind"
              copy="BuildRAX is not just about drawing workflows. It helps teams think through architecture discipline."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {securityItems.map((item, index) => (
                <motion.div
                  key={item}
                  className="group flex items-start gap-3 rounded-lg border border-[#78A0FF]/15 bg-[#101726]/70 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18),0_0_22px_rgba(47,123,255,0.05)] transition hover:border-[#2F7BFF]/55 hover:bg-[#111D30] hover:shadow-[0_22px_56px_rgba(0,0,0,0.25),0_0_34px_rgba(47,123,255,0.18)]"
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 6, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ delay: index * 0.04 }}
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2F7BFF]/12 text-[#8DB5FF] transition group-hover:shadow-[0_0_22px_rgba(47,123,255,0.34)]">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-sm leading-6 text-[#C3CAD8]">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="Who it is for" title="Built for teams who need backend clarity" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {audiences.map(([title, copy], index) => (
                <motion.div
                  key={title}
                  className="group rounded-lg border border-[#78A0FF]/15 bg-[#0F1724]/76 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.2),0_0_24px_rgba(47,123,255,0.05)] transition hover:-translate-y-1 hover:border-[#2F7BFF]/60 hover:bg-[#111D30] hover:shadow-[0_28px_72px_rgba(0,0,0,0.28),0_0_42px_rgba(47,123,255,0.22)]"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ delay: index * 0.07 }}
                >
                  <div className="mb-5 flex size-11 items-center justify-center rounded-lg border border-[#2F7BFF]/20 bg-[#2F7BFF]/10 text-[#8DB5FF] transition group-hover:shadow-[0_0_28px_rgba(47,123,255,0.34)]">
                    <Fingerprint className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#9CA8BF]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Pricing"
              title="Try first. Paid plans are coming later."
              copy="BuildRAX is focused on the deterministic MVP today. Billing is informational only until saved workspaces, team features, and AI-assisted architecture are ready."
            />
            <PricingTiers />
          </div>
        </section>

        <section id="exports" className="px-5 py-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-[#78A0FF]/15 bg-[#101726]/78 p-8 text-center shadow-[0_0_70px_rgba(47,123,255,0.12)] sm:p-12">
            <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-lg bg-[#2F7BFF]/12 text-[#8DB5FF]">
              <Rocket className="size-6" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Start with a backend blueprint, not backend guesswork.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#9CA8BF] sm:text-lg">
              Build workflows visually, review important logic, simulate system behavior, and export architecture outputs your team can trust.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 rounded-lg bg-[#2F7BFF] px-6 text-base font-semibold text-white shadow-[0_0_32px_rgba(47,123,255,0.35)] hover:bg-[#4D8EFF]" asChild>
                <Link href="/builder" prefetch={false}>Start Building</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-[#778398]">No complex setup. Start visually in minutes.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg border border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#6EA4FF]">
                <Network className="size-4.5" />
              </span>
              <span className="font-bold text-white">BuildRAX.ai</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#9CA8BF]">
              Design backend systems before writing code. A visual architecture workspace for modern software teams.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#9CA8BF]">
            {[
              ["Product", "#product-overview"],
              ["Templates", "#templates"],
              ["Sandbox", "#sandbox"],
              ["Docs", "https://github.com/chetanya1998/BuildRAX.ai"],
              ["Pricing", "#pricing"],
              ["Privacy", "#privacy"],
              ["Terms", "#terms"],
              ["Contact", "#contact"],
            ].map(([item, href]) => (
              <Link key={item} href={href} className="hover:text-white" target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
