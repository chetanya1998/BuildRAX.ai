import { describe, expect, it } from "vitest";
import { buildArchitectureIR } from "@/lib/architecture-ir/compiler";
import { templates } from "@/lib/domain/templates";
import { evaluateArchitectureRules, matchArchitecturePatterns, patternRegistry, ruleProposalSchema, ruleRegistry, selectTemplatePattern } from "./patterns";

describe("versioned architecture pattern registry", () => {
  it("migrates every existing template and provides twelve reusable pattern families", () => {
    expect(patternRegistry).toHaveLength(12);
    expect(ruleRegistry).toHaveLength(8);
    expect(patternRegistry.every((pattern) => pattern.schemaVersion === "1.0.0")).toBe(true);
    expect(templates.every((template) => patternRegistry.some((pattern) => pattern.templateId === template.id))).toBe(true);
  });

  it.each([
    ["A websocket collaboration workspace", "realtime"],
    ["A retrieval augmented LLM assistant", "ai-rag"],
    ["A checkout and inventory service", "ecommerce"],
    ["A static website hosted at the edge", "static-web-delivery"],
  ])("matches %s to %s", (prompt, patternId) => {
    expect(matchArchitecturePatterns({ prompt })[0]?.pattern.id).toBe(patternId);
  });

  it("keeps explicit template selection ahead of conflicting inferred patterns", () => {
    const matches = matchArchitecturePatterns({ prompt: "Build a websocket collaboration app", templateId: "ecommerce" });
    expect(matches[0]).toMatchObject({ explicit: true, pattern: { id: "ecommerce" } });
    expect(matches[0].conflicts[0]).toContain("realtime");
    expect(selectTemplatePattern({ prompt: "Build a websocket collaboration app", templateId: "ecommerce" })).toBe("ecommerce");
  });

  it("matches whole terms and plurals without inferring from substrings or negated phrases", () => {
    expect(matchArchitecturePatterns({ prompt: "Store durable records in object storage." }).map((match) => match.pattern.id)).not.toContain("ai-rag");
    expect(matchArchitecturePatterns({ prompt: "Build a web service, not a mobile app." }).map((match) => match.pattern.id)).not.toContain("mobile-backend");
    expect(selectTemplatePattern({ prompt: "Build an AI service for staff." })).toBe("ai-rag");
    expect(selectTemplatePattern({ prompt: "Build independently deployed microservices." })).toBe("microservices");
  });

  it("freezes registry definitions and their collections", () => {
    expect(Object.isFrozen(patternRegistry)).toBe(true);
    expect(Object.isFrozen(patternRegistry[0])).toBe(true);
    expect(Object.isFrozen(patternRegistry[0].matchTerms)).toBe(true);
    expect(Object.isFrozen(ruleRegistry[0].proposedComponents)).toBe(true);
  });

  it("keeps the existing template compiler behavior", () => {
    const ir = buildArchitectureIR({ prompt: "Build an event-driven platform" });
    expect(ir.provenance.templateId).toBe("event-driven");
    expect(ir.components.length).toBeGreaterThanOrEqual(6);
  });
});

describe("proposal-only architecture rules", () => {
  it("returns matches and explicit no-matches without applying proposals", () => {
    const results = evaluateArchitectureRules({ request: { prompt: "Accept file uploads and process each in a background job." } });
    expect(results.find((result) => result.ruleId === "file-storage")).toMatchObject({ status: "matched", proposedComponents: ["object-storage"] });
    expect(results.find((result) => result.ruleId === "background-jobs")?.status).toBe("matched");
    expect(results.find((result) => result.ruleId === "public-api-boundary")).toMatchObject({ status: "not-matched", proposedComponents: [] });
  });

  it("reports conflicting evidence and lets explicit constraints win", () => {
    const sensitive = evaluateArchitectureRules({ request: { prompt: "Store sensitive data", dataSensitivity: "public" } });
    expect(sensitive.find((result) => result.ruleId === "sensitive-data-controls")).toMatchObject({ status: "conflicting", proposedComponents: [] });

    const api = evaluateArchitectureRules({ request: { prompt: "Expose a public API that is internal-only." } });
    expect(api.find((result) => result.ruleId === "public-api-boundary")?.status).toBe("conflicting");
  });

  it("treats explicitly negated rule terms as conflicts instead of proposals", () => {
    const results = evaluateArchitectureRules({ request: { prompt: "Do not use background jobs; process each request synchronously." } });
    expect(results.find((result) => result.ruleId === "background-jobs")).toMatchObject({
      status: "conflicting",
      matchedTerms: ["background job"],
      proposedComponents: [],
    });

    const positive = evaluateArchitectureRules({ request: { prompt: "Do not use cron, use background jobs for media processing." } });
    expect(positive.find((result) => result.ruleId === "background-jobs")?.status).toBe("matched");

    const notOnly = evaluateArchitectureRules({ request: { prompt: "The service not only accepts uploads but also runs background jobs." } });
    expect(notOnly.find((result) => result.ruleId === "background-jobs")?.status).toBe("matched");
  });

  it("rejects proposal payloads whose status contradicts their contents", () => {
    expect(() => ruleProposalSchema.parse({
      schemaVersion: "1.0.0",
      ruleId: "file-storage",
      status: "not-matched",
      matchedTerms: [],
      rationale: "No match.",
      proposedComponents: ["object-storage"],
      proposedRequirements: [],
    })).toThrow("Not-matched rules cannot contain matches, proposals, or conflicts.");
    expect(() => ruleProposalSchema.parse({
      schemaVersion: "1.0.0",
      ruleId: "file-storage",
      status: "conflicting",
      matchedTerms: ["file upload"],
      rationale: "Conflict.",
      proposedComponents: [],
      proposedRequirements: [],
    })).toThrow("Conflicting rules require matched terms and a conflict, and cannot propose components.");
    expect(() => ruleProposalSchema.parse({
      schemaVersion: "1.0.0",
      ruleId: "unknown-rule",
      status: "not-matched",
      matchedTerms: [],
      rationale: "No match.",
      proposedComponents: [],
      proposedRequirements: [],
    })).toThrow("Unknown architecture rule unknown-rule.");
  });

  it("does not mutate Architecture IR while suppressing already-present component proposals", () => {
    const ir = buildArchitectureIR({ prompt: "Build a secure SaaS platform" });
    const before = structuredClone(ir);
    const results = evaluateArchitectureRules({ request: { prompt: "Use background jobs and a work queue." }, architecture: ir });
    expect(ir).toEqual(before);
    expect(results.find((result) => result.ruleId === "background-jobs")?.proposedComponents).not.toContain("queue");
  });
});
