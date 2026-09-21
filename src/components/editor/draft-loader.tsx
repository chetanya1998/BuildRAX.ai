"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { deleteDraft, loadDraft, type DraftRecord } from "@/lib/storage/drafts";
import { ArchitectureEditor } from "./architecture-editor";
import { persistPrivateDocumentImages, persistPrivatePresentationImages } from "@/lib/storage/private-assets";
import { architectureIRFromDiagram, canonicalSha256, createArchitectureSnapshot, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import styles from "./loader.module.css";

export function DraftLoader({ draftId, migrate = false }: { draftId: string; migrate?: boolean }) {
  const [draft, setDraft] = useState<DraftRecord | null | undefined>(undefined);
  const [migrationMessage, setMigrationMessage] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    loadDraft(draftId).then((record) => { if (active) { setDraft(record ?? null); setLoadError(false); } }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [draftId, attempt]);
  useEffect(() => {
    if (!migrate || !draft) return;
    const currentDraft = draft;
    let cancelled = false;
    async function persistGuestDraft() {
      setMigrationMessage("Saving your local architecture to your workspace…");
      try {
        const currentArchitecture = currentDraft.architecture ?? {
          ir: architectureIRFromDiagram(currentDraft.diagram, undefined, "legacy-migration"),
          presentation: presentationFromDiagram(currentDraft.diagram), irVersion: 1,
        };
        const persistedPresentation = await persistPrivatePresentationImages({ guestDraftId: draftId }, currentArchitecture.presentation);
        const persistedDocument = await persistPrivateDocumentImages({ guestDraftId: draftId }, currentDraft.document ?? "");
        const response = await fetch("/api/v1/guest-migrations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: draftId,
            artifact: {
              ir: currentArchitecture.ir,
              presentation: persistedPresentation,
              traceability: currentArchitecture.traceability,
              diagram: currentDraft.diagram,
            },
            generationReceipt: currentArchitecture.generationReceipt,
            document: persistedDocument,
            generationOrigin: currentDraft.generationOrigin ? {
              diagram: currentDraft.generationOrigin.diagram,
              architecture: {
                ir: currentDraft.generationOrigin.architecture.ir,
                presentation: currentDraft.generationOrigin.architecture.presentation,
                traceability: currentDraft.generationOrigin.architecture.traceability,
                generationReceipt: currentDraft.generationOrigin.architecture.generationReceipt,
              },
            } : undefined,
          }),
        });
        const body = await response.json();
        if (!response.ok || !body.migration?.project_id) throw new Error(body.error ?? "Your draft could not be migrated.");
        {
          const expectedSnapshot = await createArchitectureSnapshot({ diagramId: currentDraft.diagram.id, diagramVersion: 1, irVersion: 1,
            ir: currentArchitecture.ir, traceability: currentArchitecture.traceability, presentation: persistedPresentation, createdAt: currentDraft.diagram.createdAt, updatedAt: currentDraft.diagram.updatedAt });
          const [expectedIr, expectedPresentation, expectedDiagram, expectedDocument] = await Promise.all([
            canonicalSha256(currentArchitecture.ir), canonicalSha256(persistedPresentation), canonicalSha256(expectedSnapshot.materializedDiagram), canonicalSha256(persistedDocument),
          ]);
          const actual = body.checksums;
          if (!actual || actual.ir !== expectedIr || actual.presentation !== expectedPresentation || actual.diagram !== expectedDiagram || body.verification?.documentChecksum !== expectedDocument) {
            throw new Error("The saved architecture could not be completely verified. Your browser copy was retained.");
          }
          if (currentArchitecture.traceability && (actual.evidence !== expectedSnapshot.checksums.evidence || actual.requirements !== expectedSnapshot.checksums.requirements)) {
            throw new Error("The saved evidence and requirements could not be verified. Your browser copy was retained.");
          }
          if (currentDraft.generationOrigin) {
            const originSnapshot = await createArchitectureSnapshot({ diagramId: currentDraft.generationOrigin.diagram.id, diagramVersion: 1, irVersion: 1,
              ir: currentDraft.generationOrigin.architecture.ir, presentation: currentDraft.generationOrigin.architecture.presentation,
              createdAt: currentDraft.generationOrigin.diagram.createdAt, updatedAt: currentDraft.generationOrigin.diagram.updatedAt });
            const expectedOrigin = await canonicalSha256({ ir: currentDraft.generationOrigin.architecture.ir,
              presentation: currentDraft.generationOrigin.architecture.presentation, diagram: originSnapshot.materializedDiagram });
            if (body.verification?.generationOriginChecksum !== expectedOrigin) throw new Error("The original AI generation lineage could not be verified. Your browser copy was retained.");
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
  if (loadError) return <div className={styles.state} role="alert"><strong>Browser storage could not be read.</strong><p>Your draft has not been deleted. Allow browser storage, then retry.</p><button onClick={() => setAttempt((value) => value + 1)}>Retry opening draft</button></div>;
  if (draft === undefined) return <div className={styles.state}><span className={styles.spinner} /><strong>Recovering your local architecture…</strong><p>The diagram remains in this browser until you choose to save it.</p></div>;
  if (migrate && migrationMessage) return <div className={styles.state}><span className={styles.spinner} /><strong>{migrationMessage}</strong><p>Your browser copy is retained until the workspace migration succeeds.</p>{migrationMessage.includes("safe") && <ButtonLink href={`/draft/${draftId}`}>Return to local draft</ButtonLink>}</div>;
  if (draft === null) return <div className={styles.state}><strong>This local draft is not available.</strong><p>It may belong to another browser or have been cleared.</p><ButtonLink href="/start">Create a new architecture</ButtonLink></div>;
  return <ArchitectureEditor initialDiagram={draft.diagram} initialIR={draft.architecture?.ir} initialTraceability={draft.architecture?.traceability} initialIrVersion={draft.architecture?.irVersion} />;
}
