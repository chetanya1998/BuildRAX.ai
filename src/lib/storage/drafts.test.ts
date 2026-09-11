import "fake-indexeddb/auto";
import Dexie from "dexie";
import { beforeAll, describe, expect, it } from "vitest";
import { createDiagram } from "@/lib/domain/factory";
import { architectureIRFromDiagram, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { clearQueuedProjectSave, loadDraft, loadQueuedProjectSave, loadRecovery, queueProjectSave, recoveryArchitecture, recoveryKey, RecoveryConflictError, saveDraft, saveRecovery, type RecoveryRecord, type RecoveryScope } from "./drafts";

const guest: RecoveryScope = { kind: "guest" };
const account: RecoveryScope = { kind: "account", userId: "user-a", workspaceId: "workspace-a" };
const legacy = createDiagram("Legacy survives");

function fixture(scope: RecoveryScope = guest): RecoveryRecord {
  const diagram = createDiagram("Recovery test");
  return { schemaVersion: 1, key: recoveryKey(scope, diagram.id), scope, revision: 0, diagram,
    architecture: { ir: architectureIRFromDiagram(diagram), presentation: presentationFromDiagram(diagram), irVersion: 1 },
    document: "# Notes", updatedAt: diagram.updatedAt };
}

beforeAll(async () => {
  const old = new Dexie("buildrax-guest");
  old.version(3).stores({ drafts: "id, updatedAt, status", pendingProjectSaves: "diagramId, queuedAt" });
  await old.table("drafts").put({ id: legacy.id, diagram: legacy, status: "ready", createdAt: legacy.createdAt, updatedAt: legacy.updatedAt });
  await old.table("pendingProjectSaves").put({ diagramId: legacy.id, privateLegacyData: "retained" });
  old.close();
});

describe("browser recovery records", () => {
  it("does not create a new revision for an identical local checkpoint", async () => {
    for (const scope of [guest, account]) {
      const record = fixture(scope);
      expect(await saveRecovery(record, 0)).toBe(1);
      expect(await saveRecovery(record, 1)).toBe(1);
    }
  });

  it("keeps generation provenance for layout-only changes and marks semantic changes as manual", () => {
    const record = fixture();
    const base = { ...record.architecture.ir, provenance: { ...record.architecture.ir.provenance, strategy: "ai-proposal" as const } };
    const layout = { ...record.diagram, viewport: { x: 10, y: 20, zoom: 0.5 } };
    expect(recoveryArchitecture(layout, base, 1).ir.provenance.strategy).toBe("ai-proposal");
    expect(recoveryArchitecture({ ...layout, title: "New intent" }, base, 1).ir.provenance.strategy).toBe("manual-edit");
  });

  it("upgrades the existing database without deleting a draft or unowned retry", async () => {
    window.localStorage.setItem(`buildrax-document:${legacy.id}`, "# Old document");
    const record = (await loadRecovery(guest, legacy.id))!;
    expect(record.diagram.title).toBe("Legacy survives");
    expect(record.document).toBe("# Old document");
    expect(record.architecture.ir.schemaVersion).toBe("1.1.0");
    await saveRecovery(record, 0);
    expect((await loadDraft(legacy.id))?.document).toBe("# Old document");
    const inspect = new Dexie("buildrax-guest");
    await inspect.open();
    expect((await inspect.table("pendingProjectSaves").get(legacy.id)).privateLegacyData).toBe("retained");
    inspect.close();
    expect(await loadQueuedProjectSave(legacy.id, account)).toBeUndefined();
  });

  it("persists an intentional empty document instead of resurrecting legacy text", async () => {
    const record = fixture();
    window.localStorage.setItem(`buildrax-document:${record.diagram.id}`, "old text");
    await saveRecovery(record, 0);
    await saveRecovery({ ...record, document: "" }, 1);
    expect((await loadRecovery(guest, record.diagram.id))?.document).toBe("");
    expect(window.localStorage.getItem(`buildrax-document:${record.diagram.id}`)).toBe("old text");
  });

  it("preserves document images, primitive images, and the original signed generation while editing", async () => {
    const record = fixture();
    record.diagram.primitives.push({ id: "image-1", kind: "image", text: "", position: { x: 1, y: 2 }, dimensions: { width: 90, height: 80 }, style: { src: "data:image/png;base64,dGVzdA==" } });
    record.architecture.presentation = presentationFromDiagram(record.diagram);
    const receipt = { requestId: crypto.randomUUID(), irChecksum: "a".repeat(64), diagramChecksum: "b".repeat(64), issuedAt: new Date().toISOString(), signature: "fixture-only" };
    await saveDraft({ id: record.diagram.id, diagram: record.diagram, architecture: { ...record.architecture, generationReceipt: receipt }, prompt: "Original intent", status: "ready", createdAt: record.diagram.createdAt, updatedAt: record.updatedAt });
    const original = (await loadRecovery(guest, record.diagram.id))!;
    await saveRecovery({ ...original, diagram: { ...original.diagram, title: "Edited title" }, document: "![image](data:image/png;base64,dGVzdA==)", architecture: record.architecture }, 0);
    const recovered = (await loadRecovery(guest, record.diagram.id))!;
    expect(recovered.diagram.title).toBe("Edited title");
    expect(recovered.generationOrigin?.diagram.title).toBe("Recovery test");
    expect(recovered.generationOrigin?.architecture.generationReceipt).toEqual(receipt);
    expect(recovered.diagram.primitives[0].style.src).toBe("data:image/png;base64,dGVzdA==");
    expect(recovered.document).toContain("data:image/png");
    expect((await loadDraft(record.diagram.id))?.prompt).toBe("Original intent");
  });

  it("isolates recovery by account, workspace, diagram and guest scope", async () => {
    const record = fixture(account);
    window.localStorage.setItem(`buildrax-document:${record.diagram.id}`, "unscoped document");
    await saveRecovery(record, 0);
    expect((await loadRecovery(account, record.diagram.id))?.document).toBe("# Notes");
    expect(await loadRecovery({ ...account, userId: "user-b" }, record.diagram.id)).toBeUndefined();
    expect(await loadRecovery({ ...account, workspaceId: "workspace-b" }, record.diagram.id)).toBeUndefined();
    expect(await loadRecovery(account, "another-diagram")).toBeUndefined();
    expect(await loadRecovery(guest, record.diagram.id)).toBeUndefined();
  });

  it("accepts one of two simultaneous writes and rejects the stale tab", async () => {
    for (const scope of [guest, account]) {
      const record = fixture(scope);
      const results = await Promise.allSettled([saveRecovery(record, 0), saveRecovery({ ...record, document: "Second tab" }, 0)]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const rejection = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
      expect(rejection.reason).toBeInstanceOf(RecoveryConflictError);
      expect((await loadRecovery(scope, record.diagram.id))?.revision).toBe(1);
    }
  });

  it("does not mutate the confirmed record on validation failure", async () => {
    const record = fixture();
    await saveRecovery(record, 0);
    await expect(saveRecovery({ ...record, diagram: { ...record.diagram, version: -1 } }, 1)).rejects.toThrow();
    expect((await loadRecovery(guest, record.diagram.id))?.revision).toBe(1);
  });

  it("separates queued cloud requests across users and clears only that user's request", async () => {
    const record = fixture(account);
    const another: RecoveryScope = { kind: "account", userId: "user-b", workspaceId: "workspace-a" };
    const queued = { diagramId: record.diagram.id, diagram: record.diagram, idempotencyKey: crypto.randomUUID(), baseVersion: 1, baseIrVersion: 1, ir: record.architecture.ir, presentation: record.architecture.presentation };
    await queueProjectSave(queued, account);
    expect(await loadQueuedProjectSave(queued.diagramId, another)).toBeUndefined();
    await queueProjectSave({ ...queued, idempotencyKey: "second-user" }, another);
    await clearQueuedProjectSave(queued.diagramId, account);
    expect((await loadQueuedProjectSave(queued.diagramId, another))?.idempotencyKey).toBe("second-user");
  });
});
