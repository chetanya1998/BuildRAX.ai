"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { loadDraft } from "@/lib/storage/drafts";
import type { Diagram } from "@/lib/domain/schema";
import { ArchitectureEditor } from "./architecture-editor";
import styles from "./loader.module.css";

export function DraftLoader({ draftId }: { draftId: string }) {
  const [diagram, setDiagram] = useState<Diagram | null | undefined>(undefined);
  useEffect(() => { loadDraft(draftId).then((record) => setDiagram(record?.diagram ?? null)); }, [draftId]);
  if (diagram === undefined) return <div className={styles.state}><span className={styles.spinner} /><strong>Recovering your local architecture…</strong><p>The diagram remains in this browser until you choose to save it.</p></div>;
  if (diagram === null) return <div className={styles.state}><strong>This local draft is not available.</strong><p>It may belong to another browser or have been cleared.</p><ButtonLink href="/start">Create a new architecture</ButtonLink></div>;
  return <ArchitectureEditor initialDiagram={diagram} />;
}
