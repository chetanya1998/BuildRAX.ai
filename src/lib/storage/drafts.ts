"use client";

import Dexie, { type EntityTable } from "dexie";
import { architectureIRFromDiagram, architecturePresentationSchema, presentationFromDiagram, type ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema, type ArchitectureIR } from "@/lib/architecture-ir/schema";
import type { GenerationReceipt } from "@/lib/server/generation-receipt";
import { diagramSchema, type Diagram } from "@/lib/domain/schema";

export type StoredArchitectureArtifact = {
  ir: ArchitectureIR;
  presentation: ArchitecturePresentation;
  irVersion: number;
  checksums?: { ir: string; presentation: string; diagram: string };
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
};

export type PendingProjectSave = {
  diagramId: string;
  idempotencyKey: string;
  baseVersion: number;
  baseIrVersion: number;
  ir: ArchitectureIR;
  presentation: ArchitecturePresentation;
  diagram: Diagram;
  queuedAt: string;
  attempts: number;
};

class BuildRaxDatabase extends Dexie {
  drafts!: EntityTable<DraftRecord, "id">;
  pendingProjectSaves!: EntityTable<PendingProjectSave, "diagramId">;

  constructor() {
    super("buildrax-guest");
    this.version(1).stores({ drafts: "id, updatedAt, status" });
    this.version(2).stores({ drafts: "id, updatedAt, status", pendingProjectSaves: "diagramId, queuedAt" });
    this.version(3).stores({ drafts: "id, updatedAt, status", pendingProjectSaves: "diagramId, queuedAt" });
  }
}

let database: BuildRaxDatabase | undefined;

function db() {
  database ??= new BuildRaxDatabase();
  return database;
}

export async function saveDraft(record: DraftRecord) {
  const validated = diagramSchema.parse(record.diagram);
  const architecture = record.architecture ? {
    ...record.architecture,
    ir: architectureIRSchema.parse(record.architecture.ir),
    presentation: architecturePresentationSchema.parse(record.architecture.presentation),
  } : undefined;
  await db().drafts.put({ ...record, diagram: validated, architecture, updatedAt: new Date().toISOString() });
}

export async function loadDraft(id: string) {
  const record = await db().drafts.get(id);
  if (!record) return undefined;
  return {
    ...record,
    diagram: diagramSchema.parse(record.diagram),
    architecture: record.architecture ? {
      ...record.architecture,
      ir: architectureIRSchema.parse(record.architecture.ir),
      presentation: architecturePresentationSchema.parse(record.architecture.presentation),
    } : undefined,
  };
}

export async function listDrafts() {
  return db().drafts.orderBy("updatedAt").reverse().toArray();
}

export async function deleteDraft(id: string) {
  await db().drafts.delete(id);
}

export async function queueProjectSave(record: Omit<PendingProjectSave, "queuedAt" | "attempts">) {
  const diagram = diagramSchema.parse(record.diagram);
  const ir = architectureIRSchema.parse(record.ir);
  const presentation = architecturePresentationSchema.parse(record.presentation);
  const existing = await db().pendingProjectSaves.get(record.diagramId);
  await db().pendingProjectSaves.put({
    ...record,
    diagram,
    ir,
    presentation,
    queuedAt: new Date().toISOString(),
    attempts: (existing?.attempts ?? 0) + 1,
  });
}

export async function loadQueuedProjectSave(diagramId: string) {
  const record = await db().pendingProjectSaves.get(diagramId);
  if (!record) return undefined;
  const diagram = diagramSchema.parse(record.diagram);
  return {
    ...record,
    diagram,
    idempotencyKey: record.idempotencyKey || crypto.randomUUID(),
    baseIrVersion: Number.isInteger(record.baseIrVersion) ? record.baseIrVersion : 0,
    ir: record.ir ? architectureIRSchema.parse(record.ir) : architectureIRFromDiagram(diagram, undefined, "legacy-migration"),
    presentation: record.presentation ? architecturePresentationSchema.parse(record.presentation) : presentationFromDiagram(diagram),
  };
}

export async function clearQueuedProjectSave(diagramId: string) {
  await db().pendingProjectSaves.delete(diagramId);
}
