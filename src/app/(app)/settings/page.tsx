"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HelpGuidePanel } from "@/components/guidance/HelpGuidePanel";
import { TermTooltip } from "@/components/guidance/TermTooltip";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "buildrax:workspace-settings:v1";

type SettingsState = {
  workspaceName: string;
  defaultBuilderMode: string;
  defaultTemplateCategory: string;
  defaultExportFormat: string;
  beginnerGuidance: boolean;
  technicalLabels: boolean;
  tooltips: boolean;
  nodeEducation: boolean;
  simulationExplanations: boolean;
  onboardingGuide: boolean;
  defaultScenario: string;
  expectedVsExact: boolean;
  failureExplanations: boolean;
  terminalLogs: boolean;
  includeMermaid: boolean;
  includeSimulationReport: boolean;
  includeNonTechnicalSummary: boolean;
};

const defaultSettings: SettingsState = {
  workspaceName: "BuildRAX Workspace",
  defaultBuilderMode: "Guided builder",
  defaultTemplateCategory: "All categories",
  defaultExportFormat: "Developer handoff",
  beginnerGuidance: true,
  technicalLabels: true,
  tooltips: true,
  nodeEducation: true,
  simulationExplanations: true,
  onboardingGuide: true,
  defaultScenario: "Happy path",
  expectedVsExact: true,
  failureExplanations: true,
  terminalLogs: true,
  includeMermaid: true,
  includeSimulationReport: true,
  includeNonTechnicalSummary: true,
};

const tabs = ["Workspace", "Guidance", "Simulation", "Exports", "AI Roadmap", "Account"] as const;
type SettingsTab = (typeof tabs)[number];

function ToggleRow({
  title,
  copy,
  checked,
  onCheckedChange,
}: {
  title: string;
  copy: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="mt-1 data-checked:bg-[#2F7BFF]" />
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-slate-200 outline-none focus:border-[#2F7BFF]/55"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("Workspace");
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [savedAt, setSavedAt] = useState("Loaded local defaults");

  useEffect(() => {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    try {
      setSettings({ ...defaultSettings, ...(JSON.parse(raw) as Partial<SettingsState>) });
      setSavedAt("Loaded saved workspace preferences");
    } catch {
      localStorage.removeItem(SETTINGS_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSavedAt(`Saved ${new Date().toLocaleTimeString()}`);
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const activeSummary = useMemo(() => {
    if (activeTab === "Guidance") return "Guidance is enabled by default so every technical term includes a clear explanation.";
    if (activeTab === "Simulation") return "Simulation defaults control the scenario, terminal logs, and expected versus exact flow comparison.";
    if (activeTab === "Exports") return "Exports are deterministic artifacts generated from the current workflow graph.";
    if (activeTab === "AI Roadmap") return "AI features are visible as a roadmap only; deterministic MVP behavior stays active.";
    if (activeTab === "Account") return "Guest and signed-in sessions can use the deterministic builder without provider keys.";
    return "Workspace defaults shape how new backend blueprints open and export.";
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Settings</Badge>
          <h1 className="text-2xl font-semibold text-white">Workspace settings</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">{activeSummary}</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpGuidePanel compact />
          <Badge className="rounded-md border-white/10 bg-white/[0.04] text-slate-300">{savedAt}</Badge>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                activeTab === tab ? "bg-[#2F7BFF]/15 text-[#B8D2FF]" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              {tab}
              {tab === "AI Roadmap" ? <span className="text-[10px] text-slate-500">soon</span> : null}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-white/10 bg-[#101726]/55 p-5">
          {activeTab === "Workspace" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Workspace name</Label>
                <Input value={settings.workspaceName} onChange={(event) => updateSetting("workspaceName", event.target.value)} className="border-white/10 bg-black/20" />
              </div>
              <SelectRow label="Default builder mode" value={settings.defaultBuilderMode} options={["Guided builder", "Advanced canvas", "Template-first"]} onChange={(value) => updateSetting("defaultBuilderMode", value)} />
              <SelectRow label="Default template category" value={settings.defaultTemplateCategory} options={["All categories", "SaaS", "Fintech", "Marketplace", "AI/RAG", "Operations"]} onChange={(value) => updateSetting("defaultTemplateCategory", value)} />
              <SelectRow label="Default export format" value={settings.defaultExportFormat} options={["Developer handoff", "Workflow JSON", "Simulation report", "Mermaid diagram"]} onChange={(value) => updateSetting("defaultExportFormat", value)} />
              <div className="rounded-lg border border-[#2F7BFF]/20 bg-[#2F7BFF]/10 p-4">
                <p className="text-sm font-semibold text-white">Guided defaults</p>
                <p className="mt-2 text-xs leading-5 text-[#B8D2FF]">New workflows will open with guidance, a step compiler, and review/simulation explanations enabled.</p>
              </div>
            </div>
          ) : null}

          {activeTab === "Guidance" ? (
            <div className="grid gap-3">
              <ToggleRow title="Beginner mode" copy="Show explanations that translate backend architecture into product behavior." checked={settings.beginnerGuidance} onCheckedChange={(value) => updateSetting("beginnerGuidance", value)} />
              <ToggleRow title="Technical labels with explanations" copy="Keep precise terms like API, queue, and RBAC visible, but explain them in simpler wording when needed." checked={settings.technicalLabels} onCheckedChange={(value) => updateSetting("technicalLabels", value)} />
              <ToggleRow title="Tooltips on terms" copy="Hovering supported terms shows concise definitions for non-technical users." checked={settings.tooltips} onCheckedChange={(value) => updateSetting("tooltips", value)} />
              <ToggleRow title="Node education popovers" copy="Let users open a node guide when they want details about inputs, outputs, and failure behavior." checked={settings.nodeEducation} onCheckedChange={(value) => updateSetting("nodeEducation", value)} />
              <ToggleRow title="Simulation explanations" copy="Explain what each simulation is testing, why it matters, and what the user should fix first." checked={settings.simulationExplanations} onCheckedChange={(value) => updateSetting("simulationExplanations", value)} />
              <ToggleRow title="Onboarding guide" copy="Keep the Help Guide visible in the app shell and builder." checked={settings.onboardingGuide} onCheckedChange={(value) => updateSetting("onboardingGuide", value)} />
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
                Example terms: <TermTooltip term="API" />, <TermTooltip term="queue" />, <TermTooltip term="RBAC" />, <TermTooltip term="Mermaid" />.
              </div>
            </div>
          ) : null}

          {activeTab === "Simulation" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SelectRow label="Default scenario" value={settings.defaultScenario} options={["Happy path", "Failure path", "Timeout", "Load estimate", "Security misuse"]} onChange={(value) => updateSetting("defaultScenario", value)} />
              <ToggleRow title="Expected vs exact response" copy="Compare the planned flow against the deterministic simulation trace." checked={settings.expectedVsExact} onCheckedChange={(value) => updateSetting("expectedVsExact", value)} />
              <ToggleRow title="Failure explanations" copy="Explain failed or blocked nodes in clear user-facing language." checked={settings.failureExplanations} onCheckedChange={(value) => updateSetting("failureExplanations", value)} />
              <ToggleRow title="Terminal logs" copy="Show step-by-step compiler output while review, simulation, Mermaid, and export actions run." checked={settings.terminalLogs} onCheckedChange={(value) => updateSetting("terminalLogs", value)} />
            </div>
          ) : null}

          {activeTab === "Exports" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleRow title="Include Mermaid" copy="Attach diagram source to developer handoff exports." checked={settings.includeMermaid} onCheckedChange={(value) => updateSetting("includeMermaid", value)} />
              <ToggleRow title="Include simulation report" copy="Attach trace, bottleneck, fallback, and expected-vs-exact results when available." checked={settings.includeSimulationReport} onCheckedChange={(value) => updateSetting("includeSimulationReport", value)} />
              <ToggleRow title="Include non-technical summary" copy="Lead exports with a simple explanation of what the backend flow does." checked={settings.includeNonTechnicalSummary} onCheckedChange={(value) => updateSetting("includeNonTechnicalSummary", value)} />
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Export behavior</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">Exports use current graph nodes, edges, review findings, simulation trace, and Mermaid source. No billing, credits, or LLM calls are required for the MVP.</p>
              </div>
            </div>
          ) : null}

          {activeTab === "AI Roadmap" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["AI review rewrite", "Future AI can rewrite deterministic findings into beginner-friendly language."],
                ["AI architecture coach", "Future AI can suggest missing services, dependencies, and safer alternatives."],
                ["AI code scaffold", "Future AI can turn reviewed workflow graphs into starter backend code."],
                ["AI docs generator", "Future AI can expand exports into long-form implementation docs."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 opacity-80">
                  <Badge className="rounded-md border-amber-300/20 bg-amber-300/10 text-amber-200">Coming soon</Badge>
                  <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{copy}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "Account" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{session?.user ? session.user.name || "Signed-in user" : "Guest mode"}</p>
                <p className="mt-1 text-xs text-slate-400">{session?.user?.email || "Local draft mode with browser storage and server-side guest access where enabled."}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Data persistence note</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">Saved workflows are stored by the app backend. Unsaved drafts and these preferences are stored locally in this browser until cleared.</p>
              </div>
              <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
