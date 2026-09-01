"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { deleteDraft, loadDraft } from "@/lib/storage/drafts";
import type { Diagram } from "@/lib/domain/schema";
import { ArchitectureEditor } from "./architecture-editor";
import styles from "./loader.module.css";

export function DraftLoader({ draftId, migrate = false }: { draftId: string; migrate?: boolean }) {
  const [diagram, setDiagram] = useState<Diagram | null | undefined>(undefined);
  const [migrationMessage, setMigrationMessage] = useState("");
  const router = useRouter();
  useEffect(() => { loadDraft(draftId).then((record) => setDiagram(record?.diagram ?? null)); }, [draftId]);
  useEffect(() => {
    if (!migrate || !diagram) return;
    let cancelled = false;
    async function persistGuestDraft() {
      setMigrationMessage("Saving your local architecture to your workspace…");
      try {
        const response = await fetch("/api/v1/guest-migrations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey: draftId, diagram }),
        });
        const body = await response.json();
        if (!response.ok || !body.migration?.project_id) throw new Error(body.error ?? "Your draft could not be migrated.");
        await deleteDraft(draftId);
        if (!cancelled) router.replace(`/projects/${body.migration.project_id}/canvas`);
      } catch (error) {
        if (!cancelled) setMigrationMessage(error instanceof Error ? error.message : "Your draft is still safe in this browser. Please try again.");
      }
    }
    void persistGuestDraft();
    return () => { cancelled = true; };
  }, [diagram, draftId, migrate, router]);
  if (diagram === undefined) return <div className={styles.state}><span className={styles.spinner} /><strong>Recovering your local architecture…</strong><p>The diagram remains in this browser until you choose to save it.</p></div>;
  if (migrate && migrationMessage) return <div className={styles.state}><span className={styles.spinner} /><strong>{migrationMessage}</strong><p>Your browser copy is retained until the workspace migration succeeds.</p>{migrationMessage.includes("safe") && <ButtonLink href={`/draft/${draftId}`}>Return to local draft</ButtonLink>}</div>;
  if (diagram === null) return <div className={styles.state}><strong>This local draft is not available.</strong><p>It may belong to another browser or have been cleared.</p><ButtonLink href="/start">Create a new architecture</ButtonLink></div>;
  return <ArchitectureEditor initialDiagram={diagram} />;
}
