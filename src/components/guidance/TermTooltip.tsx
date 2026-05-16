"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const TERM_DEFINITIONS: Record<string, string> = {
  API: "A doorway that lets one software system ask another system to do something or return data.",
  webhook: "An automatic message sent from one system to another when something happens.",
  queue: "A waiting line for background work so slow jobs do not block the user.",
  worker: "A background process that takes jobs from a queue and completes them.",
  cache: "A short-term storage layer used to return common data faster.",
  "rate limit": "A safety rule that limits how often someone can call an endpoint.",
  RBAC: "Role-based access control. It checks what a user is allowed to do.",
  DLQ: "Dead letter queue. It stores failed jobs so they can be inspected or retried later.",
  idempotency: "A safety technique that prevents duplicate requests from causing duplicate effects.",
  "audit log": "A durable record of important actions, often used for security and compliance.",
  Mermaid: "A text format for creating diagrams that can be stored in documentation.",
  export: "A generated artifact such as JSON, a diagram, or a developer handoff document.",
};

export function TermTooltip({ term, className }: { term: string; className?: string }) {
  const definition = TERM_DEFINITIONS[term] || "BuildRAX explains this term using workflow context.";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border/80 bg-card px-2 py-0.5 text-[11px] font-medium text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
            className
          )}
        >
          {term}
          <HelpCircle className="h-3 w-3" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[18rem] rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-xl">
          {definition}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
