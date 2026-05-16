"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateIntro {
  title: string;
  solves: string;
  audience: string;
  keyNodes: string;
  happyPath: string;
  risks: string;
  customizeFirst: string;
  scenarios: readonly string[];
}

export function TemplateIntroModal({
  intro,
  isCreating,
  onClose,
  onUseTemplate,
}: {
  intro: TemplateIntro | null;
  isCreating?: boolean;
  onClose: () => void;
  onUseTemplate: () => void;
}) {
  if (!intro) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-[#0A0D14] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6EA4FF]">Template guide</p>
            <h2 className="mt-1 text-lg font-semibold">{intro.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">{intro.solves}</p>
          </div>
          <button className="rounded-md p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {[
            ["Who uses this", intro.audience],
            ["Key nodes", intro.keyNodes],
            ["Expected happy path", intro.happyPath],
            ["Common risks", intro.risks],
            ["Customize first", intro.customizeFirst],
            ["Scenarios to try", intro.scenarios.join(", ")],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{copy}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <Button variant="outline" className="rounded-lg border-white/10 bg-white/[0.03]" onClick={onClose}>
            Keep browsing
          </Button>
          <Button className="rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={onUseTemplate} disabled={isCreating}>
            {isCreating ? "Opening..." : "Open in builder"}
          </Button>
        </div>
      </div>
    </div>
  );
}
