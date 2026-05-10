import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const name = id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-10 md:p-8">
      <div>
        <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">Template Detail</Badge>
        <h1 className="text-2xl font-semibold text-white">{name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Backend blueprint details are curated in the template library. Use the library page to instantiate this template into a workflow.
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
        This MVP detail route keeps template URLs stable while the new non-AI template catalog is being expanded.
      </div>
      <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" asChild>
        <Link href="/templates">Back to templates</Link>
      </Button>
    </div>
  );
}
