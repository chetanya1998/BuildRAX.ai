import { describe, expect, it } from "vitest";
import { buildInputTraceability } from "./input";
import {
  EVIDENCE_IR_VERSION,
  evidenceIRSchema,
  traceabilityBundleSchema,
} from "./schema";

const sourceSetId = "eset_fixture01";
const sourceId = "src_fixture01";

describe("Evidence IR and Requirement IR", () => {
  it("builds stable, traceable records from explicit input and missing values", () => {
    const input = {
      prompt: "Accept orders. Retain an audit trail for every state change.",
      preferredStack: "TypeScript, PostgreSQL",
      tenancy: "single-tenant" as const,
    };
    const first = buildInputTraceability(input);
    const second = buildInputTraceability(input);

    expect(first).toEqual(second);
    expect(first.evidence.items.every((item) => item.verification === "user-provided")).toBe(true);
    expect(first.requirements.items.filter((item) => item.origin === "user-provided").every((item) => item.evidenceRefs.length === 1)).toBe(true);
    expect(first.requirements.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ statement: "Cloud provider is unknown.", state: "unknown", confidence: 0 }),
      expect.objectContaining({ statement: "Expected scale is unknown.", state: "unknown", confidence: 0 }),
      expect.objectContaining({ statement: "Data sensitivity is unknown.", state: "unknown", confidence: 0 }),
    ]));
  });

  it("extracts a maximum-length description into bounded, referenced requirements", () => {
    const prompt = `Build a service. ${"Accept authenticated requests and retain audit evidence. ".repeat(80)}`.slice(0, 3000).padEnd(3000, "x");
    const bundle = buildInputTraceability({ prompt });
    const descriptionRequirements = bundle.requirements.items.filter((item) => item.origin === "user-provided");
    const evidenceIds = new Set(bundle.evidence.items.map((item) => item.id));

    expect(descriptionRequirements.length).toBeGreaterThan(1);
    expect(descriptionRequirements.length).toBeLessThanOrEqual(30);
    expect(descriptionRequirements.every((item) => item.statement.length <= 240)).toBe(true);
    expect(descriptionRequirements.every((item) => item.evidenceRefs.every((reference) => evidenceIds.has(reference)))).toBe(true);
  });

  it("rejects AI-labelled verified facts", () => {
    const result = evidenceIRSchema.safeParse({
      schemaVersion: EVIDENCE_IR_VERSION,
      sourceSetId,
      sources: [{ id: sourceId, type: "ai", label: "AI proposal" }],
      items: [{
        id: "ev_ai_claim01",
        claim: "The service is deployed on AWS.",
        category: "component",
        origin: "ai-suggestion",
        verification: "verified-within-scope",
        confidence: 1,
        locations: [],
      }],
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.message).join(" ")).toMatch(/AI suggestions cannot claim/i);
  });

  it("accepts code verification only with detector scope and a repository location", () => {
    const valid = {
      schemaVersion: EVIDENCE_IR_VERSION,
      sourceSetId,
      sources: [{ id: sourceId, type: "repository", label: "Repository fixture", version: "abc123" }],
      items: [{
        id: "ev_code_claim01",
        claim: "A Next.js route handles POST requests.",
        category: "component",
        origin: "code-detector",
        verification: "verified-within-scope",
        confidence: 1,
        locations: [{ type: "repository", sourceId, commit: "abc123", path: "src/app/api/orders/route.ts", startLine: 4, endLine: 12 }],
        detector: { id: "next-route-detector", version: "1.0.0", scope: "Detect exported route handlers in statically parsed Next.js route files." },
      }],
    } as const;
    expect(evidenceIRSchema.parse(valid)).toMatchObject(valid);

    const withoutScope = structuredClone(valid);
    delete (withoutScope.items[0] as { detector?: unknown }).detector;
    expect(evidenceIRSchema.safeParse(withoutScope).success).toBe(false);

    const withoutRepositoryLocation = { ...valid, items: [{ ...valid.items[0], locations: [] }] };
    expect(evidenceIRSchema.safeParse(withoutRepositoryLocation).success).toBe(false);
  });

  it("rejects evidence locations that reference an unknown source", () => {
    const bundle = buildInputTraceability({ prompt: "Build a reliable order processing service." });
    bundle.evidence.items[0].locations[0].sourceId = "src_missing01";
    expect(traceabilityBundleSchema.safeParse(bundle).success).toBe(false);
  });

  it("rejects confidence values outside the inclusive zero-to-one range", () => {
    const bundle = buildInputTraceability({ prompt: "Build a reliable order processing service." });
    bundle.evidence.items[0].confidence = 1.01;
    bundle.requirements.items[0].confidence = -0.01;
    expect(traceabilityBundleSchema.safeParse(bundle).success).toBe(false);
  });

  it("rejects broken evidence references", () => {
    const bundle = buildInputTraceability({ prompt: "Build a reliable order processing service." });
    bundle.requirements.items[0].evidenceRefs = ["ev_missing01"];
    const result = traceabilityBundleSchema.safeParse(bundle);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toContain("Requirement references unknown evidence ev_missing01.");
  });

  it("represents conflicts explicitly and rejects broken conflict references", () => {
    const bundle = buildInputTraceability({ prompt: "Use PostgreSQL. Use DynamoDB as the only database." });
    const requirement = bundle.requirements.items[0];
    requirement.state = "conflicting";
    bundle.requirements.conflicts = [{
      id: "conflict_database01",
      summary: "The requested primary database is contradictory.",
      requirementRefs: [requirement.id],
      evidenceRefs: bundle.evidence.items.slice(0, 2).map((item) => item.id),
      status: "unresolved",
    }];
    expect(traceabilityBundleSchema.parse(bundle).requirements.conflicts).toHaveLength(1);

    bundle.requirements.conflicts[0].requirementRefs = ["req_missing01"];
    expect(traceabilityBundleSchema.safeParse(bundle).success).toBe(false);
  });
});
