"use client";

import { ArrowBendRightDown, ArrowRight, CheckCircle, CursorClick, Lightning, Play, Robot, Timer, Warning } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { useHydrated } from "@/lib/ui/use-hydrated";
import styles from "./landing.module.css";

type ScenarioId = "happy" | "auth" | "load";

const stages = [
  ["Client", "Request sent"],
  ["Gateway", "Policy check"],
  ["Identity", "Session verified"],
  ["Service", "Rules applied"],
  ["Database", "Version saved"],
] as const;

const scenarios: Record<ScenarioId, { label: string; description: string; outcome: string; stopAt: number; logs: string[] }> = {
  happy: {
    label: "Happy path",
    description: "A valid workspace member updates a versioned architecture and every control succeeds.",
    outcome: "Saved as diagram version 12",
    stopAt: 4,
    logs: ["request accepted", "workspace membership verified", "baseVersion matched", "validated snapshot saved", "audit event recorded"],
  },
  auth: {
    label: "Access denied",
    description: "A user outside the workspace attempts to open a private project. RLS stops the request.",
    outcome: "Blocked before project data loads",
    stopAt: 2,
    logs: ["session checked", "workspace membership missing", "RLS policy denied read", "privacy-safe event recorded"],
  },
  load: {
    label: "Traffic spike",
    description: "A burst is accepted at the edge, queued, and processed without duplicating the diagram version.",
    outcome: "Recovered with an idempotent retry",
    stopAt: 4,
    logs: ["rate threshold reached", "request queued", "worker resumed", "idempotency key matched", "single version committed"],
  },
};

export function ArchitectureSandbox() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("happy");
  const [activeStep, setActiveStep] = useState(0);
  const hydrated = useHydrated();
  const scenario = scenarios[scenarioId];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveStep((step) => step >= scenario.stopAt ? 0 : step + 1), 1050);
    return () => window.clearInterval(timer);
  }, [scenarioId, scenario.stopAt]);

  function selectScenario(id: ScenarioId) {
    setActiveStep(0);
    setScenarioId(id);
  }

  const visibleLogs = useMemo(() => scenario.logs.slice(0, activeStep >= scenario.stopAt ? scenario.logs.length : Math.min(activeStep + 1, scenario.logs.length)), [activeStep, scenario.logs, scenario.stopAt]);

  return <section id="sandbox" className={styles.sandboxSection}>
    <div className={styles.sandboxIntro}>
      <span className={styles.sectionKicker}>Interactive architecture walkthrough</span>
      <h2>Watch system behavior before anything is built.</h2>
      <p>Switch scenarios to see how the same semantic architecture explains authorization, versioning, resilience and audit behavior.</p>
      <span className={styles.sandboxNote}>choose a real-world scenario <ArrowBendRightDown size={34} weight="light" /></span>
    </div>
    <div className={styles.sandboxFrame}>
      <div className={styles.scenarioTabs} role="group" aria-label="Architecture simulation scenario">
        <button disabled={!hydrated} className={scenarioId === "happy" ? styles.scenarioActive : ""} aria-pressed={scenarioId === "happy"} onClick={() => selectScenario("happy")}><CheckCircle size={18} /> Happy path</button>
        <button disabled={!hydrated} className={scenarioId === "auth" ? styles.scenarioActive : ""} aria-pressed={scenarioId === "auth"} onClick={() => selectScenario("auth")}><Warning size={18} /> Access denied</button>
        <button disabled={!hydrated} className={scenarioId === "load" ? styles.scenarioActive : ""} aria-pressed={scenarioId === "load"} onClick={() => selectScenario("load")}><Lightning size={18} /> Traffic spike</button>
        <span className={styles.playing}><Timer size={16} /> Live walkthrough</span>
      </div>
      <div className={styles.sandboxGrid}>
        <div className={styles.stageArea}>
          <div className={styles.stageTop}><span><Robot size={17} /> BuildRAX reasoning trace</span><span>Scenario {Object.keys(scenarios).indexOf(scenarioId) + 1} / 3</span></div>
          <div className={styles.stageTrack}>
            {stages.map(([name, detail], index) => {
              const active = index === activeStep;
              const completed = index < activeStep && index <= scenario.stopAt;
              const blocked = scenarioId === "auth" && index === scenario.stopAt;
              return <div className={styles.stageUnit} key={name}>
                <article className={`${styles.stageNode} ${active ? styles.stageNodeActive : ""} ${completed ? styles.stageNodeComplete : ""} ${blocked && active ? styles.stageNodeBlocked : ""}`} aria-current={active ? "step" : undefined}>
                  <span className={styles.stageIcon}>{blocked ? <Warning size={16} /> : active ? <Play size={16} weight="fill" /> : completed ? <CheckCircle size={16} weight="fill" /> : <CursorClick size={16} />}</span>
                  <strong>{name}</strong><small>{index > scenario.stopAt ? "not reached" : active ? blocked ? "blocked here" : "active step" : detail}</small>
                </article>
                {index < stages.length - 1 && <ArrowRight className={`${styles.stageArrow} ${completed ? styles.stageArrowActive : ""}`} size={21} weight="bold" aria-hidden="true" />}
              </div>;
            })}
          </div>
        </div>
        <aside className={styles.tracePanel} aria-live="polite">
          <div className={styles.traceHeader}><span>What BuildRAX sees</span><span className={styles.tracePulse} /></div>
          <h3>{scenario.label}</h3>
          <p>{scenario.description}</p>
          <ol>{visibleLogs.map((log, index) => <li key={log}><span>{String(index + 1).padStart(2, "0")}</span>{log}</li>)}</ol>
          <div className={styles.traceOutcome}><CheckCircle size={18} weight="fill" /><span><small>Outcome</small><strong>{scenario.outcome}</strong></span></div>
        </aside>
      </div>
      <div className={styles.sandboxFooter}><span>This is a product walkthrough—not a production load test.</span><ButtonLink href="/start" variant="secondary">Model your system <ArrowRight size={16} /></ButtonLink></div>
    </div>
  </section>;
}
