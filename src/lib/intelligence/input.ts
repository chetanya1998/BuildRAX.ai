import { generationRequestSchema, type GenerationRequest } from "@/lib/domain/schema";
import {
  EVIDENCE_IR_VERSION,
  REQUIREMENT_IR_VERSION,
  TRACEABILITY_BUNDLE_VERSION,
  traceabilityBundleSchema,
  type EvidenceItem,
  type RequirementItem,
  type TraceabilityBundle,
} from "./schema";

function splitRequirement(value: string, maxLength = 240) {
  const chunks: string[] = [];
  let remaining = value.trim();
  while (remaining.length > maxLength) {
    const candidate = remaining.slice(0, maxLength + 1);
    const wordBoundary = candidate.lastIndexOf(" ");
    const splitAt = wordBoundary >= Math.floor(maxLength * .55) ? wordBoundary : maxLength;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

/** Convert a raw description into IR-safe requirements without inventing facts. */
export function functionalRequirementsFromDescription(description: string) {
  const normalized = description.replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").trim();
  const statements = normalized
    .split(/(?:\n+|(?<=[.!?])\s+)/)
    .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  const requirements = (statements.length ? statements : [normalized]).flatMap((item) => splitRequirement(item));

  // The Architecture IR contract allows at most 30 functional requirements.
  // Repack highly fragmented prose instead of dropping any user text.
  return requirements.length <= 30 ? requirements : splitRequirement(normalized);
}

function stableHash(value: string) {
  function fnv32(text: string, seed: number) {
    let hash = seed >>> 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193) >>> 0;
    }
    return hash.toString(36).padStart(7, "0");
  }
  return `${fnv32(value, 0x811c9dc5)}${fnv32(value.split("").reverse().join(""), 0x9e3779b9)}`;
}

export function stableRecordId(prefix: "eset" | "src" | "ev" | "req" | "rset" | "conflict", ...parts: Array<string | number>) {
  return `${prefix}_${stableHash(parts.join("\u001f"))}`;
}

const structuredFields: Array<{
  field: keyof Pick<GenerationRequest, "productType" | "preferredStack" | "cloudProvider" | "scale" | "tenancy" | "dataSensitivity">;
  label: string;
  kind: RequirementItem["kind"];
  category: EvidenceItem["category"];
  question: string;
}> = [
  { field: "productType", label: "Product type", kind: "functional", category: "requirement", question: "What type of product or service is being designed?" },
  { field: "preferredStack", label: "Preferred stack", kind: "constraint", category: "technology", question: "Is there a required or preferred technology stack?" },
  { field: "cloudProvider", label: "Cloud provider", kind: "constraint", category: "constraint", question: "Is a cloud provider required, preferred, or intentionally provider-neutral?" },
  { field: "scale", label: "Expected scale", kind: "non-functional", category: "constraint", question: "What traffic and storage scale should the architecture support?" },
  { field: "tenancy", label: "Tenancy", kind: "constraint", category: "constraint", question: "Should the system be single-tenant or multi-tenant?" },
  { field: "dataSensitivity", label: "Data sensitivity", kind: "constraint", category: "constraint", question: "What is the highest data-sensitivity level the system must handle?" },
];

/** Build traceable input artifacts without attaching them to persistence yet. */
export function buildInputTraceability(input: GenerationRequest): TraceabilityBundle {
  const request = generationRequestSchema.parse(input);
  const fingerprint = JSON.stringify(request);
  const sourceSetId = stableRecordId("eset", fingerprint);
  const inputSourceId = stableRecordId("src", sourceSetId, "architecture-request");
  const evidence: EvidenceItem[] = [];
  const requirements: RequirementItem[] = [];
  let promptCursor = 0;

  functionalRequirementsFromDescription(request.prompt).forEach((statement, index) => {
    const evidenceId = stableRecordId("ev", sourceSetId, "prompt", index, statement);
    const exactStart = request.prompt.indexOf(statement, promptCursor);
    const start = exactStart >= 0 ? exactStart : 0;
    const end = exactStart >= 0 ? exactStart + statement.length : request.prompt.length;
    if (exactStart >= 0) promptCursor = end;
    evidence.push({
      id: evidenceId,
      claim: statement,
      category: "requirement",
      origin: "user-input",
      verification: "user-provided",
      confidence: 1,
      locations: [{ type: "input", sourceId: inputSourceId, field: "prompt", start, end }],
    });
    requirements.push({
      id: stableRecordId("req", sourceSetId, "prompt", index, statement),
      kind: "functional",
      statement,
      state: "stated",
      origin: "user-provided",
      confidence: 1,
      evidenceRefs: [evidenceId],
    });
  });

  structuredFields.forEach(({ field, label, kind, category, question }) => {
    const value = request[field];
    if (value) {
      const statement = `${label}: ${value}.`;
      const evidenceId = stableRecordId("ev", sourceSetId, field, value);
      evidence.push({
        id: evidenceId,
        claim: statement,
        category,
        origin: "user-input",
        verification: "user-provided",
        confidence: 1,
        locations: [{ type: "input", sourceId: inputSourceId, field }],
      });
      requirements.push({
        id: stableRecordId("req", sourceSetId, field, value),
        kind,
        statement,
        state: "stated",
        origin: "user-provided",
        confidence: 1,
        evidenceRefs: [evidenceId],
      });
      return;
    }
    requirements.push({
      id: stableRecordId("req", sourceSetId, field, "unknown"),
      kind,
      statement: `${label} is unknown.`,
      state: "unknown",
      origin: "unknown",
      confidence: 0,
      evidenceRefs: [],
      question,
    });
  });

  return traceabilityBundleSchema.parse({
    schemaVersion: TRACEABILITY_BUNDLE_VERSION,
    evidence: {
      schemaVersion: EVIDENCE_IR_VERSION,
      sourceSetId,
      sources: [{ id: inputSourceId, type: "input", label: "Architecture request" }],
      items: evidence,
    },
    requirements: {
      schemaVersion: REQUIREMENT_IR_VERSION,
      requirementSetId: stableRecordId("rset", sourceSetId),
      items: requirements,
      conflicts: [],
    },
  });
}
