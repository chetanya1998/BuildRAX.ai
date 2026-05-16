import { ExpectedVsExactReport as Report } from "@/lib/guidance/explanations";

function listOrNone(items: string[]) {
  return items.length > 0 ? items : ["None"];
}

export function ExpectedVsExactReport({ report }: { report: Report }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">Expected vs Exact Flow</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Expected</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{report.expectedSummary}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Exact</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{report.exactSummary}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {[
          ["Matched steps", listOrNone(report.matchedSteps)],
          ["Missing expected steps", listOrNone(report.missingExpectedSteps)],
          ["Unexpected warnings", listOrNone(report.unexpectedWarnings)],
          ["Blocked or failed nodes", listOrNone(report.blockedOrFailedNodes)],
        ].map(([title, items]) => (
          <div key={String(title)} className="rounded-md border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{String(title)}</p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-300">
              {(items as string[]).map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-emerald-300/20 bg-emerald-300/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300">User-facing response</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{report.finalUserResponse}</p>
        </div>
        <div className="rounded-md border border-[#2F7BFF]/20 bg-[#2F7BFF]/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#9EC0FF]">Developer-facing response</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{report.finalDeveloperResponse}</p>
        </div>
      </div>
    </div>
  );
}
