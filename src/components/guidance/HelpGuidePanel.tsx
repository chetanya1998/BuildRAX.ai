"use client";

import { BookOpen, HelpCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TermTooltip } from "@/components/guidance/TermTooltip";

export function HelpGuidePanel({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openGuide = () => {
    onOpen?.();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;

      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      if (!dialog) return;
      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={compact ? "h-8 rounded-lg border-white/10 bg-white/[0.03] text-xs" : "rounded-lg border-white/10 bg-white/[0.03]"}
        onClick={openGuide}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <HelpCircle className="mr-2 h-3.5 w-3.5" />
        Help Guide
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/70 p-3 pt-4 backdrop-blur-sm sm:p-5 sm:pt-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0A0D14] text-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-[#0A0D14] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#6EA4FF]" />
                <div>
                  <h2 id={titleId} className="text-base font-semibold">BuildRAX Help Guide</h2>
                  <p id={descriptionId} className="mt-1 text-xs text-slate-500">A practical guide for planning backend workflows.</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="rounded-md border border-white/10 p-2 text-slate-400 outline-none hover:bg-white/[0.05] hover:text-white focus-visible:border-[#6EA4FF] focus-visible:ring-2 focus-visible:ring-[#2F7BFF]/40"
                onClick={() => setOpen(false)}
                aria-label="Close help guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 text-sm leading-6 text-slate-300 sm:p-5">
              <section>
                <h3 className="text-sm font-semibold text-white">How to use BuildRAX</h3>
                <p className="mt-2">Start with a template or blank canvas, add backend nodes, connect the steps, review the design, simulate behavior, then export the handoff artifacts.</p>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-white">What the canvas means</h3>
                <p className="mt-2">Each box is a backend responsibility. Each line shows how data or control moves from one responsibility to the next.</p>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-white">Terms you will see</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["API", "webhook", "queue", "worker", "cache", "rate limit", "RBAC", "DLQ", "idempotency", "audit log", "Mermaid", "export"].map((term) => (
                    <TermTooltip key={term} term={term} />
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-white">What review and simulation do</h3>
                <p className="mt-2">Review checks whether the design is missing important backend pieces. Simulation walks through the current graph and explains what happens, what can fail, and what response the user should expect.</p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
