import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-10 md:p-8">
      <div>
        <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Settings</Badge>
        <h1 className="text-2xl font-semibold text-white">Workspace settings</h1>
        <p className="mt-1 text-sm text-slate-400">Non-AI MVP defaults and architecture workspace preferences.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Feature flags", "AI architect, AI review, AI code export, and AI doc generation are disabled for the MVP."],
          ["Security posture", "Workflow operations use server-side ownership checks and deterministic validation."],
          ["Exports", "Developer artifacts are generated from graph data without model calls."],
          ["Guest mode", "Users can explore locally, then sign in or continue as guest to persist work."],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
