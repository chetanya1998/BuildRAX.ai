"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { deleteDraft, loadDraft, type DraftRecord } from "@/lib/storage/drafts";
import { ArchitectureEditor } from "./architecture-editor";
import { persistPrivatePresentationImages } from "@/lib/storage/private-assets";
import styles from "./loader.module.css";

export function DraftLoader({ draftId, migrate = false }: { draftId: string; migrate?: boolean }) {
  const [draft, setDraft] = useState<DraftRecord | null | undefined>(undefined);
  const [migrationMessage, setMigrationMessage] = useState("");
  const router = useRouter();
  useEffect(() => { loadDraft(draftId).then((record) => setDraft(record ?? null)); }, [draftId]);
  useEffect(() => {
    if (!migrate || !draft) return;
    const currentDraft = draft;
    let cancelled = false;
    async function persistGuestDraft() {
      setMigrationMessage("Saving your local architecture to your workspace…");
      try {
        const persistedPresentation = currentDraft.architecture
          ? await persistPrivatePresentationImages({ guestDraftId: draftId }, currentDraft.architecture.presentation)
          : undefined;
        const response = await fetch("/api/v1/guest-migrations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(currentDraft.architecture ? {
            idempotencyKey: draftId,
            artifact: {
              ir: currentDraft.architecture.ir,
              presentation: persistedPresentation,
              diagram: currentDraft.diagram,
            },
            generationReceipt: currentDraft.architecture.generationReceipt,
          } : { idempotencyKey: draftId, diagram: currentDraft.diagram }),
        });
        const body = await response.json();
        if (!response.ok || !body.migration?.project_id) throw new Error(body.error ?? "Your draft could not be migrated.");
        if (currentDraft.architecture?.checksums) {
          const expected = currentDraft.architecture.checksums;
          const actual = body.checksums;
          if (!actual || actual.ir !== expected.ir || actual.presentation !== expected.presentation) {
            throw new Error("The saved architecture could not be checksum-verified. Your browser copy was retained.");
          }
        }
        await deleteDraft(draftId);
        if (!cancelled) router.replace(`/projects/${body.migration.project_id}/canvas`);
      } catch (error) {
        if (!cancelled) setMigrationMessage(error instanceof Error ? error.message : "Your draft is still safe in this browser. Please try again.");
      }
    }
    void persistGuestDraft();
    return () => { cancelled = true; };
  }, [draft, draftId, migrate, router]);
  if (draft === undefined) return <div className={styles.state}><span className={styles.spinner} /><strong>Recovering your local architecture…</strong><p>The diagram remains in this browser until you choose to save it.</p></div>;
  if (migrate && migrationMessage) return <div className={styles.state}><span className={styles.spinner} /><strong>{migrationMessage}</strong><p>Your browser copy is retained until the workspace migration succeeds.</p>{migrationMessage.includes("safe") && <ButtonLink href={`/draft/${draftId}`}>Return to local draft</ButtonLink>}</div>;
  if (draft === null) return <div className={styles.state}><strong>This local draft is not available.</strong><p>It may belong to another browser or have been cleared.</p><ButtonLink href="/start">Create a new architecture</ButtonLink></div>;
  return <ArchitectureEditor initialDiagram={draft.diagram} initialIR={draft.architecture?.ir} initialIrVersion={draft.architecture?.irVersion} />;
}
