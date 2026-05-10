import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-10 md:p-8">
      <div>
        <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Admin Shell</Badge>
        <h1 className="text-2xl font-semibold text-white">Internal template and policy management</h1>
        <p className="mt-1 text-sm text-slate-400">Placeholder shell for super-admin template curation, feature flags, and review rule management.</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
        Admin APIs should require separate super-admin authorization before this shell receives mutating controls.
      </div>
    </div>
  );
}
