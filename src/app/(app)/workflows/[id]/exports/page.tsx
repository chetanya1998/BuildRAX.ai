"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Copy, Download, FileCode2, GitBranch, Loader2, ShieldCheck, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportType } from "@/lib/backend/exports";

const exportTypes: Array<{ id: ExportType; title: string; copy: string }> = [
  { id: "workflow_json", title: "Workflow JSON", copy: "Full graph, metadata, validation context, and versioned shape." },
  { id: "mermaid", title: "Mermaid", copy: "Flowchart source for docs, handoff, and technical diagrams." },
  { id: "developer_handoff", title: "Developer Handoff", copy: "Architecture overview, nodes, APIs, data, risks, and questions." },
  { id: "api_contract", title: "API Contract", copy: "Endpoint method/path, request, response, errors, auth, and rate limits." },
  { id: "security_checklist", title: "Security Checklist", copy: "Current controls and security issues to resolve." },
  { id: "simulation_report", title: "Simulation Report", copy: "Scenario trace, bottlenecks, fallback gaps, and suggested fixes." },
];

export default function ExportsPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const [selected, setSelected] = useState<ExportType>("developer_handoff");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (type = selected) => {
    setSelected(type);
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Export failed");
      setContent(payload.content);
      toast.success("Export generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 text-slate-400" asChild><Link href="/workflows"><ArrowLeft className="mr-2 h-4 w-4" /> Workflows</Link></Button>
          <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Export Center</Badge>
          <h1 className="text-2xl font-semibold text-white">Developer-ready artifacts</h1>
          <p className="mt-1 text-sm text-slate-400">Generate practical outputs from the deterministic backend workflow.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" asChild><Link href={`/builder?id=${workflowId}`}><Workflow className="mr-2 h-4 w-4" /> Builder</Link></Button>
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" onClick={() => navigator.clipboard.writeText(content).then(() => toast.success("Copied"))}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
          <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={() => generate()} disabled={isGenerating}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Generate</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {exportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => generate(type.id)}
              className={`w-full rounded-lg border p-4 text-left transition ${selected === type.id ? "border-[#2F7BFF]/45 bg-[#2F7BFF]/12" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
            >
              <div className="mb-3 flex items-center gap-2">
                {type.id === "mermaid" ? <GitBranch className="h-4 w-4 text-[#9EC0FF]" /> : type.id === "security_checklist" ? <ShieldCheck className="h-4 w-4 text-[#9EC0FF]" /> : <FileCode2 className="h-4 w-4 text-[#9EC0FF]" />}
                <h2 className="text-sm font-semibold text-white">{type.title}</h2>
              </div>
              <p className="text-xs leading-5 text-slate-500">{type.copy}</p>
            </button>
          ))}
        </aside>
        <section className="rounded-lg border border-white/10 bg-[#101726]/55">
          <div className="border-b border-white/10 p-3">
            <h2 className="text-sm font-semibold text-white">Artifact Preview</h2>
          </div>
          <pre className="min-h-[620px] overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-slate-300">
            {content || "Choose an export type to generate an artifact."}
          </pre>
        </section>
      </div>
    </div>
  );
}
