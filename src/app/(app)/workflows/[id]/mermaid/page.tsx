"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, GitBranch, Loader2, RefreshCw, Workflow, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WorkflowPayload {
  _id: string;
  name: string;
  description?: string;
  metadata?: { mermaid?: string };
}

export default function MermaidPage() {
  const params = useParams<{ id: string }>();
  const workflowId = params.id;
  const [workflow, setWorkflow] = useState<WorkflowPayload | null>(null);
  const [code, setCode] = useState("");
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/workflows/${workflowId}`)
      .then((response) => response.json())
      .then((payload) => {
        setWorkflow(payload);
        setCode(payload.metadata?.mermaid || "");
      })
      .catch(() => toast.error("Failed to load workflow"));
  }, [workflowId]);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/mermaid/generate`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Generation failed");
      setCode(payload.mermaid);
      toast.success("Mermaid generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const validate = async () => {
    const response = await fetch("/api/mermaid/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const payload = await response.json();
    setValidation(payload);
    toast[payload.valid ? "success" : "error"](payload.valid ? "Mermaid is valid" : "Mermaid needs attention");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 text-slate-400" asChild><Link href="/workflows"><ArrowLeft className="mr-2 h-4 w-4" /> Workflows</Link></Button>
          <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Mermaid Sandbox</Badge>
          <h1 className="text-2xl font-semibold text-white">{workflow?.name || "Mermaid Diagram"}</h1>
          <p className="mt-1 text-sm text-slate-400">Generate, edit, validate, copy, and export backend diagrams.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" asChild><Link href={`/builder?id=${workflowId}`}><Workflow className="mr-2 h-4 w-4" /> Builder</Link></Button>
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" onClick={() => navigator.clipboard.writeText(code).then(() => toast.success("Copied"))}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" onClick={validate}><CheckCircle2 className="mr-2 h-4 w-4" /> Validate</Button>
          <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={generate} disabled={isGenerating}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Generate</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-[#101726]/55">
          <div className="border-b border-white/10 p-3">
            <h2 className="text-sm font-semibold text-white">Mermaid Code</h2>
          </div>
          <Textarea className="min-h-[560px] rounded-none border-0 bg-black/20 font-mono text-xs text-slate-200 focus-visible:ring-0" value={code} onChange={(event) => setCode(event.target.value)} />
        </section>
        <section className="rounded-lg border border-white/10 bg-[#101726]/55">
          <div className="flex items-center justify-between border-b border-white/10 p-3">
            <h2 className="text-sm font-semibold text-white">Preview</h2>
            {validation ? (
              validation.valid ? <Badge className="border-emerald-400/25 bg-emerald-500/10 text-emerald-100"><CheckCircle2 className="mr-1 h-3 w-3" /> Valid</Badge> : <Badge className="border-rose-400/25 bg-rose-500/10 text-rose-100"><XCircle className="mr-1 h-3 w-3" /> Invalid</Badge>
            ) : null}
          </div>
          <div className="min-h-[560px] overflow-auto p-4">
            <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-black/25 p-4 font-mono text-xs leading-6 text-slate-300">{code || "Generate a Mermaid diagram from the workflow."}</pre>
            {validation?.errors?.length ? (
              <div className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-rose-100">
                {validation.errors.join(" ")}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
