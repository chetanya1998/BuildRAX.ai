"use client";

import Dexie, { type EntityTable } from "dexie";
import { architectureIRFromDiagram, architecturePresentationSchema, canonicalStringify, presentationFromDiagram, type ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema, migrateArchitectureIR, type ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { GenerationReceipt } from "@/lib/server/generation-receipt";
import { diagramSchema, type Diagram } from "@/lib/domain/schema";
import { traceabilityBundleSchema, type TraceabilityBundle } from "@/lib/intelligence/schema";

export type StoredArchitectureArtifact = {
  ir: ArchitectureIR;
  presentation: ArchitecturePresentation;
  irVersion: number;
  traceability?: TraceabilityBundle;
  checksums?: { ir: string; presentation: string; diagram: string; evidence?: string; requirements?: string };
  generationReceipt?: GenerationReceipt;
};

export type DraftRecord = {
  id: string;
  diagram: Diagram;
  architecture?: StoredArchitectureArtifact;
  prompt?: string;
  status: "ready" | "generating" | "partial" | "error";
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  recoverySchemaVersion?: 1;
  localRevision?: number;
  document?: string;
  generationOrigin?: GenerationOrigin;
};

// Keep the signed, original generation separate from the subsequently edited
// artifact. A receipt authenticates that original output, not arbitrary edits.
export type GenerationOrigin = {
  diagram: Diagram;
  architecture: StoredArchitectureArtifact;
};
export type RecoveryScope = { kind: "guest" } | { kind: "account"; userId: string; workspaceId: string };
export type RecoveryRecord = {
  schemaVersion: 1;
  key: string;
  scope: RecoveryScope;
  revision: number;
  diagram: Diagram;
  architecture: StoredArchitectureArtifact;
  document: string;
  generationOrigin?: GenerationOrigin;
  updatedAt: string;
};
export type RecoveryConflictArchive = {
  key: string;
  scope: Extract<RecoveryScope, { kind: "account" }>;
  diagramId: string;
  browser: RecoveryRecord;
  cloud: RecoveryRecord;
  createdAt: string;
  resolvedAt?: string;
  resolution?: "browser" | "cloud";
};

export function recoveryKey(scope: RecoveryScope, diagramId: string) {
  if (scope.kind === "account" && (!scope.userId || !scope.workspaceId)) throw new Error("Recovery requires an authenticated workspace identity.");
  return JSON.stringify(scope.kind === "guest" ? ["guest", diagramId] : ["account", scope.userId, scope.workspaceId, diagramId]);
}

export class RecoveryConflictError extends Error {
  constructor() { super("Another tab updated this browser copy. Download your current work before reopening the diagram."); }
}

export function recoveryArchitecture(diagram: Diagram, base: ArchitectureIR, irVersion: number, traceability?: TraceabilityBundle): StoredArchitectureArtifact {
  const projected = architectureIRFromDiagram(diagram, base);
  // Merely opening a generated architecture or moving a box must not relabel
  // its semantic origin as a manual edit.
  const semanticUnchanged = canonicalStringify({ ...projected, provenance: base.provenance }) === canonicalStringify(base);
  return { ir: semanticUnchanged ? base : projected, presentation: presentationFromDiagram(diagram), irVersion, traceability };
}

function sameRecoveryContent(left: Pick<RecoveryRecord, "diagram" | "architecture" | "document" | "generationOrigin">, right: typeof left) {
  return canonicalStringify(left) === canonicalStringify(right);
}

function validateArchitecture(artifact: StoredArchitectureArtifact): StoredArchitectureArtifact {
  return { ...artifact, ir: migrateArchitectureIR(artifact.ir), presentation: architecturePresentationSchema.parse(artifact.presentation), traceability: artifact.traceability ? traceabilityBundleSchema.parse(artifact.traceability) : undefined };
}

export type PendingProjectSave = {
  diagramId: string;
  idempotencyKey: string;
  baseVersion: number;
  baseIrVersion: number;
  ir: ArchitectureIR;
  traceability?: TraceabilityBundle;
  presentation: ArchitecturePresentation;
  diagram: Diagram;
  queuedAt: string;
  attempts: number;
  localRevision: number;
};

class BuildRaxDatabase extends Dexie {
  drafts!: EntityTable<DraftRecord, "id">;
  pendingProjectSaves!: EntityTable<PendingProjectSave, "diagramId">;
  recoveries!: EntityTable<RecoveryRecord, "key">;
  scopedProjectSaves!: EntityTable<PendingProjectSave & { key: string }, "key">;
  recoveryConflicts!: EntityTable<RecoveryConflictArchive, "key">;

  constructor() {
    super("buildrax-guest");
    this.version(1).stores({ drafts: "id, updatedAt, status" });
    this.version(2).stores({ drafts: "id, updatedAt, status", pendingProjectSaves: "diagramId, queuedAt" });
    this.version(3).stores({ drafts: "id, updatedAt, status", pendingProjectSaves: "diagramId, queuedAt" });
    // Additive upgrade: old drafts and pending requests are never cleared.
    this.version(4).stores({ drafts: "id, updatedAt, status", pendingProjectSaves: "diagramId, queuedAt", recoveries: "key, updatedAt", scopedProjectSaves: "key, queuedAt" });
    this.version(5).stores({ drafts: "id, updatedAt, status", pendingProjectSaves: "diagramId, queuedAt", recoveries: "key, updatedAt", scopedProjectSaves: "key, queuedAt", recoveryConflicts: "key, diagramId, createdAt, resolvedAt" });
  }
}

export async function preserveRecoveryConflict(browser: RecoveryRecord, cloud: RecoveryRecord) {
  if (browser.scope.kind !== "account" || cloud.scope.kind !== "account" || browser.key !== cloud.key) throw new Error("Conflict copies must belong to the same account diagram.");
  const key = `${browser.key}::${cloud.diagram.version}`;
  await db().recoveryConflicts.put({ key, scope: browser.scope, diagramId: browser.diagram.id, browser, cloud, createdAt: new Date().toISOString() });
  return key;
}

export async function resolveRecoveryConflict(key: string, resolution: "browser" | "cloud") {
  const conflict = await db().recoveryConflicts.get(key);
  if (!conflict) throw new Error("Recovery conflict backup is unavailable.");
  await db().recoveryConflicts.put({ ...conflict, resolution, resolvedAt: new Date().toISOString() });
}

export async function loadRecoveryConflict(key: string) { return db().recoveryConflicts.get(key); }

let database: BuildRaxDatabase | undefined;

function db() {
  database ??= new BuildRaxDatabase();
  return database;
}

export async function saveDraft(record: DraftRecord) {
  const validated = diagramSchema.parse(record.diagram);
  const architecture = record.architecture ? validateArchitecture(record.architecture) : undefined;
  const generationOrigin = record.generationOrigin ?? (architecture?.generationReceipt ? { diagram: validated, architecture } : undefined);
  await db().drafts.put({ ...record, diagram: validated, architecture, generationOrigin, updatedAt: new Date().toISOString() });
}

export async function loadDraft(id: string) {
  const record = await db().drafts.get(id);
  if (!record) return undefined;
  return {
    ...record,
    diagram: diagramSchema.parse(record.diagram),
    architecture: record.architecture ? validateArchitecture(record.architecture) : undefined,
    generationOrigin: record.generationOrigin ?? (record.architecture?.generationReceipt ? { diagram: record.diagram, architecture: record.architecture } : undefined),
  };
}

export async function listDrafts() {
  return db().drafts.orderBy("updatedAt").reverse().toArray();
}

export async function deleteDraft(id: string) {
  await db().drafts.delete(id);
}

export async function loadRecovery(scope: RecoveryScope, diagramId: string): Promise<RecoveryRecord | undefined> {
  const key = recoveryKey(scope, diagramId);
  if (scope.kind === "account") {
    const record = await db().recoveries.get(key);
    if (!record) return undefined;
    if (record.schemaVersion !== 1 || typeof record.document !== "string" || !Number.isInteger(record.revision) || record.revision < 0 || record.key !== recoveryKey(record.scope, record.diagram.id) || record.key !== key) throw new Error("The browser recovery record is not valid. It has not been changed.");
    return { ...record, diagram: diagramSchema.parse(record.diagram), architecture: validateArchitecture(record.architecture) };
  }
  const draft = await loadDraft(diagramId);
  if (!draft) return undefined;
  if ((draft.recoverySchemaVersion !== undefined && draft.recoverySchemaVersion !== 1) || (draft.document !== undefined && typeof draft.document !== "string")) throw new Error("Unsupported browser recovery record. It has not been changed.");
  if (draft.localRevision !== undefined && (!Number.isSafeInteger(draft.localRevision) || draft.localRevision < 0)) throw new Error("Invalid local revision. The draft has not been changed.");
  // Import old guest documents only once. Never read an unscoped legacy
  // document into an authenticated account. Retain the old key as a backup.
  const document = draft.document ?? window.localStorage.getItem(`buildrax-document:${diagramId}`) ?? "";
  const architecture = draft.architecture ?? {
    ir: architectureIRFromDiagram(draft.diagram, undefined, "legacy-migration"),
    presentation: presentationFromDiagram(draft.diagram), irVersion: 1,
  };
  return {
    schemaVersion: 1, key, scope, revision: draft.localRevision ?? 0,
    diagram: draft.diagram, architecture, document,
    generationOrigin: draft.generationOrigin ?? (draft.architecture?.generationReceipt ? { diagram: draft.diagram, architecture: draft.architecture } : undefined),
    updatedAt: draft.updatedAt,
  };
}

/** Atomic compare-and-write prevents slow writes and other tabs overwriting a
 * locally confirmed revision. Images remain in diagram/presentation/doc data. */
export async function saveRecovery(record: RecoveryRecord, expectedRevision: number): Promise<number> {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error("Invalid expected recovery revision.");
  if (record.key !== recoveryKey(record.scope, record.diagram.id) || record.schemaVersion !== 1 || typeof record.document !== "string") throw new Error("Invalid recovery snapshot.");
  const diagram = diagramSchema.parse(record.diagram);
  const architecture = validateArchitecture(record.architecture);
  let revision = expectedRevision + 1;
  const updatedAt = new Date().toISOString();
  const content = { diagram, architecture, document: record.document, generationOrigin: record.generationOrigin };
  if (record.scope.kind === "account") {
    await db().transaction("rw", db().recoveries, async () => {
      const existing = await db().recoveries.get(record.key);
      if ((existing?.revision ?? 0) !== expectedRevision) throw new RecoveryConflictError();
      if (existing && sameRecoveryContent({ diagram: existing.diagram, architecture: existing.architecture, document: existing.document, generationOrigin: existing.generationOrigin }, content)) { revision = expectedRevision; return; }
      await db().recoveries.put({ ...record, diagram, architecture, revision, updatedAt });
    });
  } else {
    await db().transaction("rw", db().drafts, async () => {
      const existing = await db().drafts.get(diagram.id);
      if ((existing?.localRevision ?? 0) !== expectedRevision) throw new RecoveryConflictError();
      if (existing?.recoverySchemaVersion === 1 && existing.architecture && sameRecoveryContent({ diagram: existing.diagram, architecture: existing.architecture, document: existing.document ?? "", generationOrigin: existing.generationOrigin }, content)) { revision = expectedRevision; return; }
      await db().drafts.put({
        ...existing, id: diagram.id, diagram, architecture, document: record.document,
        generationOrigin: record.generationOrigin ?? existing?.generationOrigin,
        recoverySchemaVersion: 1, localRevision: revision, status: "ready",
        createdAt: existing?.createdAt ?? diagram.createdAt, updatedAt,
      });
    });
  }
  return revision;
}

export async function queueProjectSave(record: Omit<PendingProjectSave, "queuedAt" | "attempts">, scope: RecoveryScope) {
  const diagram = diagramSchema.parse(record.diagram);
  const ir = architectureIRSchema.parse(record.ir);
  const traceability = record.traceability ? traceabilityBundleSchema.parse(record.traceability) : undefined;
  const presentation = architecturePresentationSchema.parse(record.presentation);
  const key = recoveryKey(scope, record.diagramId);
  await db().transaction("rw", db().scopedProjectSaves, async () => {
    const existing = await db().scopedProjectSaves.get(key);
    if (existing && existing.localRevision > record.localRevision) return;
    await db().scopedProjectSaves.put({
      ...record, key, diagram, ir, traceability, presentation, queuedAt: new Date().toISOString(),
      attempts: existing?.idempotencyKey === record.idempotencyKey ? existing.attempts + 1 : 1,
    });
  });
}

export async function loadQueuedProjectSave(diagramId: string, scope: RecoveryScope) {
  // Unscoped legacy requests are retained but never replayed under an account
  // whose identity cannot be proven from those old records.
  const record = await db().scopedProjectSaves.get(recoveryKey(scope, diagramId));
  if (!record) return undefined;
  const diagram = diagramSchema.parse(record.diagram);
  return {
    ...record,
    diagram,
    idempotencyKey: record.idempotencyKey || crypto.randomUUID(),
    baseIrVersion: Number.isInteger(record.baseIrVersion) ? record.baseIrVersion : 0,
    localRevision: Number.isSafeInteger(record.localRevision) ? record.localRevision : 0,
    ir: record.ir ? architectureIRSchema.parse(record.ir) : architectureIRFromDiagram(diagram, undefined, "legacy-migration"),
    traceability: record.traceability ? traceabilityBundleSchema.parse(record.traceability) : undefined,
    presentation: record.presentation ? architecturePresentationSchema.parse(record.presentation) : presentationFromDiagram(diagram),
  };
}

export async function clearQueuedProjectSave(diagramId: string, scope: RecoveryScope, idempotencyKey?: string) {
  const key = recoveryKey(scope, diagramId);
  await db().transaction("rw", db().scopedProjectSaves, async () => {
    const existing = await db().scopedProjectSaves.get(key);
    if (!existing || (idempotencyKey && existing.idempotencyKey !== idempotencyKey)) return;
    await db().scopedProjectSaves.delete(key);
  });
}
