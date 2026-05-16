"use client";

import { X } from "lucide-react";
import { BeginnerNodeExplanation } from "@/lib/guidance/explanations";

export function NodeEducationPopover({
  explanation,
  onClose,
}: {
  explanation: BeginnerNodeExplanation | null;
  onClose: () => void;
}) {
  if (!explanation) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[65] w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover/96 p-4 text-popover-foreground shadow-[0_18px_48px_rgba(15,23,42,0.22)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary">Node guide</p>
          <h3 className="mt-1 text-sm font-semibold">{explanation.title}</h3>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onClose}
          aria-label="Close node guide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">
        <p>{explanation.whatItIs}</p>
        <div className="rounded-lg border border-border bg-card/75 p-3">
          <p className="font-semibold text-foreground">Why it matters</p>
          <p className="mt-1 text-muted-foreground">{explanation.whyItMatters}</p>
        </div>
        <div className="grid gap-2">
          <div><span className="text-muted-foreground/80">Receives:</span> <span className="text-foreground">{explanation.receives}</span></div>
          <div><span className="text-muted-foreground/80">Sends forward:</span> <span className="text-foreground">{explanation.sendsForward}</span></div>
          <div><span className="text-muted-foreground/80">Can go wrong:</span> <span className="text-foreground">{explanation.whatCanGoWrong}</span></div>
          <div><span className="text-muted-foreground/80">Expected response:</span> <span className="text-foreground">{explanation.exampleResponse}</span></div>
        </div>
      </div>
    </div>
  );
}
