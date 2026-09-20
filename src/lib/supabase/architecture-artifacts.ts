import "server-only";

import { gunzipSync } from "node:zlib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { architectureSnapshotSchema, canonicalSha256, type ArchitectureSnapshot } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { diagramSchema } from "@/lib/domain/schema";
import { HttpError } from "@/lib/server/http";
import { TRACEABILITY_BUNDLE_VERSION, traceabilityBundleSchema } from "@/lib/intelligence/schema";
import { createSupabaseAdminClient } from "./admin";

type VersionArtifactRow = {
  diagram_version: number;
  ir_version: number;
  ir_payload: unknown | null;
  presentation_payload: unknown | null;
  diagram_payload: unknown | null;
  ir_artifact_id: string;
  presentation_artifact_id: string;
  diagram_artifact_id: string;
  ir_state: string;
  presentation_state: string;
  diagram_state: string;
  ir_checksum: string;
  presentation_checksum: string;
  diagram_checksum: string;
};

type TraceabilityArtifactRow = {
  evidence_payload: unknown | null;
  requirement_payload: unknown | null;
  evidence_artifact_id: string;
  requirement_artifact_id: string;
  evidence_state: string;
  requirement_state: string;
  evidence_checksum: string;
  requirement_checksum: string;
};

async function hydrateArchivedArtifact(artifactId: string, expectedChecksum: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new HttpError(503, "Archive hydration is not configured.");
  const { data: artifact, error } = await admin
    .from("artifact_blobs")
    .select("storage_state, storage_path, checksum")
    .eq("id", artifactId)
    .maybeSingle();
  if (error || !artifact || artifact.storage_state !== "archived" || !artifact.storage_path) {
    throw new HttpError(503, "The archived artifact is temporarily unavailable.");
  }
  const { data: file, error: downloadError } = await admin.storage
    .from("architecture-version-archive")
    .download(artifact.storage_path);
  if (downloadError || !file) throw new HttpError(503, "The archived artifact could not be hydrated.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoded = artifact.storage_path.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : new TextDecoder().decode(bytes);
  let payload: unknown;
  try { payload = JSON.parse(decoded); }
  catch { throw new HttpError(500, "The archived artifact is corrupt."); }
  const checksum = await canonicalSha256(payload);
  if (checksum !== expectedChecksum || artifact.checksum !== expectedChecksum) {
    throw new HttpError(500, "The archived artifact failed integrity verification.");
  }
  return payload;
}

async function payloadFor(row: VersionArtifactRow, kind: "ir" | "presentation" | "diagram") {
  const payload = row[`${kind}_payload`];
  const state = row[`${kind}_state`];
  const checksum = row[`${kind}_checksum`];
  const artifactId = row[`${kind}_artifact_id`];
  if (state === "hot" && payload) {
    if (await canonicalSha256(payload) !== checksum) throw new HttpError(500, "Hot artifact failed integrity verification.");
    return payload;
  }
  if (state === "archived") return hydrateArchivedArtifact(artifactId, checksum);
  throw new HttpError(503, "The architecture artifact is being archived. Retry shortly.");
}

export async function readArchitectureVersion(
  supabase: SupabaseClient,
  diagramId: string,
  version: number,
): Promise<ArchitectureSnapshot> {
  const [{ data, error }, traceabilityResult] = await Promise.all([
    supabase.rpc("read_architecture_version", { target_diagram: diagramId, target_version: version }),
    supabase.rpc("read_architecture_traceability", { target_diagram: diagramId, target_version: version }),
  ]);
  if (error?.code === "42501") throw new HttpError(403, "Diagram not found or access denied.");
  const row = data?.[0] as VersionArtifactRow | undefined;
  if (error || !row) throw new HttpError(404, "Architecture version not found.");
  const [irPayload, presentationPayload, diagramPayload] = await Promise.all([
    payloadFor(row, "ir"), payloadFor(row, "presentation"), payloadFor(row, "diagram"),
  ]);
  const traceabilityRow = traceabilityResult.data?.[0] as TraceabilityArtifactRow | undefined;
  let traceability;
  if (!traceabilityResult.error && traceabilityRow) {
    const [evidence, requirements] = await Promise.all([
      traceabilityRow.evidence_state === "hot" && traceabilityRow.evidence_payload
        ? canonicalSha256(traceabilityRow.evidence_payload).then((checksum) => {
          if (checksum !== traceabilityRow.evidence_checksum) throw new HttpError(500, "Hot evidence artifact failed integrity verification.");
          return traceabilityRow.evidence_payload;
        })
        : hydrateArchivedArtifact(traceabilityRow.evidence_artifact_id, traceabilityRow.evidence_checksum),
      traceabilityRow.requirement_state === "hot" && traceabilityRow.requirement_payload
        ? canonicalSha256(traceabilityRow.requirement_payload).then((checksum) => {
          if (checksum !== traceabilityRow.requirement_checksum) throw new HttpError(500, "Hot requirement artifact failed integrity verification.");
          return traceabilityRow.requirement_payload;
        })
        : hydrateArchivedArtifact(traceabilityRow.requirement_artifact_id, traceabilityRow.requirement_checksum),
    ]);
    traceability = traceabilityBundleSchema.parse({ schemaVersion: TRACEABILITY_BUNDLE_VERSION, evidence, requirements });
  }
  const diagram = diagramSchema.parse(diagramPayload);
  return architectureSnapshotSchema.parse({
    schemaVersion: "1.1.0",
    diagramId,
    diagramVersion: row.diagram_version,
    irVersion: row.ir_version,
    ir: architectureIRSchema.parse(irPayload),
    traceability,
    presentation: presentationPayload,
    materializedDiagram: diagram,
    checksums: {
      ir: row.ir_checksum,
      presentation: row.presentation_checksum,
      diagram: row.diagram_checksum,
      evidence: traceabilityRow?.evidence_checksum,
      requirements: traceabilityRow?.requirement_checksum,
    },
  });
}
