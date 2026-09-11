import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDiagram } from "@/lib/domain/factory";
import { architectureIRFromDiagram, canonicalSha256, createArchitectureSnapshot, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { deleteDraft, loadDraft, type DraftRecord } from "@/lib/storage/drafts";
import { DraftLoader } from "./draft-loader";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/storage/drafts", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/storage/drafts")>(), loadDraft: vi.fn(), deleteDraft: vi.fn() }));
vi.mock("@/lib/storage/private-assets", () => ({
  persistPrivatePresentationImages: vi.fn(async (_target, value) => value),
  persistPrivateDocumentImages: vi.fn(async (_target, value) => value),
}));

function fixture(): Exclude<Awaited<ReturnType<typeof loadDraft>>, undefined> {
  const diagram = createDiagram("Migration test");
  return { id: diagram.id, diagram, architecture: { ir: architectureIRFromDiagram(diagram), presentation: presentationFromDiagram(diagram), irVersion: 1 },
    document: "# User notes", generationOrigin: undefined, status: "ready", createdAt: diagram.createdAt, updatedAt: diagram.updatedAt };
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function successfulBody(record: DraftRecord) {
  const architecture = record.architecture!;
  const snapshot = await createArchitectureSnapshot({ diagramId: record.diagram.id, diagramVersion: 1, irVersion: 1, ir: architecture.ir,
    presentation: architecture.presentation, createdAt: record.diagram.createdAt, updatedAt: record.diagram.updatedAt });
  return { migration: { project_id: "project-one" }, checksums: snapshot.checksums,
    verification: { documentChecksum: await canonicalSha256(record.document ?? ""), generationOriginChecksum: null } };
}

describe("complete guest migration", () => {
  it("removes the browser draft only after complete read-back verification", async () => {
    const record = fixture();
    vi.mocked(loadDraft).mockResolvedValue(record);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(await successfulBody(record)), { status: 200, headers: { "content-type": "application/json" } })));
    render(<DraftLoader draftId={record.id} migrate />);
    await waitFor(() => expect(deleteDraft).toHaveBeenCalledWith(record.id));
    expect(replace).toHaveBeenCalledWith("/projects/project-one/canvas");
  });

  it("retains the browser draft when any verification result differs", async () => {
    const record = fixture();
    vi.mocked(loadDraft).mockResolvedValue(record);
    const body = await successfulBody(record);
    body.verification.documentChecksum = "0".repeat(64);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } })));
    render(<DraftLoader draftId={record.id} migrate />);
    expect(await screen.findByText(/browser copy was retained/i)).toBeVisible();
    expect(deleteDraft).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
