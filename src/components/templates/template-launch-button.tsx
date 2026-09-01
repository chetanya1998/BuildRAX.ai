"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DiagramTemplate } from "@/lib/domain/templates";
import { saveDraft } from "@/lib/storage/drafts";

export function TemplateLaunchButton({ template }: { template: DiagramTemplate }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  async function openTemplate() {
    if (opening) return;
    setOpening(true);
    const diagram = structuredClone(template.diagram);
    const now = new Date().toISOString();
    diagram.id = crypto.randomUUID();
    diagram.createdAt = now;
    diagram.updatedAt = now;
    diagram.version = 1;
    await saveDraft({ id: diagram.id, diagram, prompt: template.description, status: "ready", createdAt: now, updatedAt: now });
    sessionStorage.setItem("buildrax-active-draft", diagram.id);
    router.push(`/draft/${diagram.id}`);
  }

  return <Button variant="secondary" onClick={openTemplate} disabled={opening}>{opening ? "Opening canvas…" : <>Use template <ArrowRight size={15} /></>}</Button>;
}
