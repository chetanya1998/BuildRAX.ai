import React, { StrictMode } from "react";
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDiagram } from "@/lib/domain/factory";
import { architectureIRFromDiagram, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { clearQueuedProjectSave, loadRecovery, preserveRecoveryConflict, recoveryKey, resolveRecoveryConflict, saveRecovery, type RecoveryRecord, type RecoveryScope } from "@/lib/storage/drafts";
import { EditorRecoveryGate, useEditorRecovery } from "./editor-recovery";

vi.mock("@/lib/storage/drafts", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/storage/drafts")>(),
  loadRecovery: vi.fn(), saveRecovery: vi.fn(), preserveRecoveryConflict: vi.fn(), resolveRecoveryConflict: vi.fn(), clearQueuedProjectSave: vi.fn(),
}));

const account: RecoveryScope = { kind: "account", userId: "account-one", workspaceId: "workspace-one" };
function fixture(): RecoveryRecord {
  const diagram = createDiagram("Cloud baseline");
  return { schemaVersion: 1, key: recoveryKey(account, diagram.id), scope: account, revision: 4, diagram,
    architecture: { ir: architectureIRFromDiagram(diagram), presentation: presentationFromDiagram(diagram), irVersion: 1 },
    document: "# Restored document", updatedAt: diagram.updatedAt };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(saveRecovery).mockImplementation(async (_, revision) => revision + 1);
  vi.mocked(preserveRecoveryConflict).mockResolvedValue("conflict-key");
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("editor recovery integration", () => {
  it("hydrates the matching account record before allowing editor writes", async () => {
    const record = fixture();
    vi.mocked(loadRecovery).mockResolvedValue(record);
    const editor = vi.fn((value: RecoveryRecord) => <p>{value.document}</p>);
    render(<EditorRecoveryGate diagram={record.diagram} scope={account}>{editor}</EditorRecoveryGate>);
    expect(editor).not.toHaveBeenCalled();
    expect(await screen.findByText("# Restored document")).toBeVisible();
    expect(loadRecovery).toHaveBeenCalledWith(account, record.diagram.id);
    expect(saveRecovery).not.toHaveBeenCalled();
  });

  it("does not automatically write over different cloud and local bases", async () => {
    const record = fixture();
    vi.mocked(loadRecovery).mockResolvedValue(record);
    const editor = vi.fn(() => <p>Editable</p>);
    render(<EditorRecoveryGate diagram={{ ...record.diagram, version: 8 }} scope={account}>{editor}</EditorRecoveryGate>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Both copies are backed up");
    expect(editor).not.toHaveBeenCalled();
    expect(saveRecovery).not.toHaveBeenCalled();
  });

  it("backs up both copies before accepting the cloud version", async () => {
    const record = fixture();
    vi.mocked(loadRecovery).mockResolvedValue(record);
    render(<EditorRecoveryGate diagram={{ ...record.diagram, version: 8, title: "Cloud" }} ir={record.architecture.ir} irVersion={3} document="# Cloud doc" scope={account}>{() => <p>Editable</p>}</EditorRecoveryGate>);
    await screen.findByRole("alert");
    act(() => screen.getByRole("button", { name: "Use cloud version" }).click());
    await waitFor(() => expect(preserveRecoveryConflict).toHaveBeenCalled());
    expect(saveRecovery).toHaveBeenCalledWith(expect.objectContaining({ diagram: expect.objectContaining({ title: "Cloud" }), document: "# Cloud doc" }), record.revision);
    expect(clearQueuedProjectSave).toHaveBeenCalledWith(record.diagram.id, account);
    expect(resolveRecoveryConflict).toHaveBeenCalledWith("conflict-key", "cloud");
  });

  it("saves the browser copy on top of the authoritative cloud head", async () => {
    const record = fixture();
    const cloudDiagram = { ...record.diagram, version: 8, title: "Cloud" };
    const savedDiagram = { ...record.diagram, version: 9, title: "Browser recovery" };
    vi.mocked(loadRecovery).mockResolvedValue(record);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ snapshot: { materializedDiagram: savedDiagram,
      ir: record.architecture.ir, presentation: record.architecture.presentation, irVersion: 4, checksums: { ir: "a", presentation: "b", diagram: "c" } } }), { status: 200, headers: { "content-type": "application/json" } })));
    render(<EditorRecoveryGate diagram={cloudDiagram} ir={record.architecture.ir} irVersion={3} scope={account}>{() => <p>Editable</p>}</EditorRecoveryGate>);
    await screen.findByRole("alert");
    act(() => screen.getByRole("button", { name: /keep browser copy/i }).click());
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const request = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(request).toMatchObject({ baseVersion: 8, baseIrVersion: 3 });
    expect(resolveRecoveryConflict).toHaveBeenCalledWith("conflict-key", "browser");
    expect(saveRecovery).toHaveBeenCalledWith(expect.objectContaining({ diagram: expect.objectContaining({ version: 9 }), document: record.document }), record.revision);
  });

  it("reports failed reads without replacing existing storage", async () => {
    const record = fixture();
    vi.mocked(loadRecovery).mockRejectedValue(new Error("blocked"));
    render(<EditorRecoveryGate diagram={record.diagram} scope={account}>{() => <p>Editable</p>}</EditorRecoveryGate>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Existing records have not been removed");
    expect(saveRecovery).not.toHaveBeenCalled();
  });

  it("remains correct under Strict Mode and saves empty documents with checksums", async () => {
    const record = fixture();
    const { result, rerender } = renderHook(({ document }) => useEditorRecovery({ initial: record, diagram: record.diagram, document,
      getIR: () => record.architecture.ir, getIrVersion: () => 1, enabled: true }), {
      initialProps: { document: record.document }, wrapper: StrictMode,
    });
    rerender({ document: "" });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("saved"));
    const [saved] = vi.mocked(saveRecovery).mock.calls.at(-1)!;
    expect(saved.document).toBe("");
    expect(saved.architecture.checksums?.ir).toMatch(/^[a-f0-9]{64}$/);
    expect(result.current.error).toBe("");
  });

  it("never writes local recovery for a read-only editor", async () => {
    const record = fixture();
    const { result, unmount } = renderHook(() => useEditorRecovery({ initial: record, diagram: record.diagram, document: "",
      getIR: () => record.architecture.ir, getIrVersion: () => 1, enabled: false }));
    act(() => result.current.retry());
    unmount();
    expect(saveRecovery).not.toHaveBeenCalled();
  });
});
