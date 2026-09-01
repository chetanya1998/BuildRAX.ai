"use client";

import Dexie, { type EntityTable } from "dexie";
import { diagramSchema, type Diagram } from "@/lib/domain/schema";

export type DraftRecord = {
  id: string;
  diagram: Diagram;
  prompt?: string;
  status: "ready" | "generating" | "partial" | "error";
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

class BuildRaxDatabase extends Dexie {
  drafts!: EntityTable<DraftRecord, "id">;

  constructor() {
    super("buildrax-guest");
    this.version(1).stores({ drafts: "id, updatedAt, status" });
  }
}

let database: BuildRaxDatabase | undefined;

function db() {
  database ??= new BuildRaxDatabase();
  return database;
}

export async function saveDraft(record: DraftRecord) {
  const validated = diagramSchema.parse(record.diagram);
  await db().drafts.put({ ...record, diagram: validated, updatedAt: new Date().toISOString() });
}

export async function loadDraft(id: string) {
  const record = await db().drafts.get(id);
  if (!record) return undefined;
  return { ...record, diagram: diagramSchema.parse(record.diagram) };
}

export async function listDrafts() {
  return db().drafts.orderBy("updatedAt").reverse().toArray();
}

export async function deleteDraft(id: string) {
  await db().drafts.delete(id);
}
