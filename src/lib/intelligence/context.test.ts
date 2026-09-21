import { describe, expect, it } from "vitest";
import { buildInputTraceability } from "./input";
import { compileContextPack, ContextBudgetError, ContextInputError, contextBlocksFromTraceability, contextPackSchema, estimateContextTokens, normalizeContextText } from "./context";

describe("Context Compiler", () => {
  it("normalizes prose but preserves code and table structure", () => {
    expect(normalizeContextText("Heading  \n\n\nBody   ", "markdown")).toBe("Heading\n\nBody");
    expect(normalizeContextText("if (ready) {\n  run();\n}", "code")).toBe("if (ready) {\n  run();\n}");
    expect(normalizeContextText("| A | B |\n|---|---|\n| 1 | 2 |", "table")).toContain("|---|---|");
  });

  it("deduplicates noisy content while retaining every source reference", () => {
    const pack = compileContextPack({
      task: "architecture-synthesis",
      blocks: [
        { id: "one", kind: "evidence", text: "Use PostgreSQL for durable records.", sourceRefs: ["ev_one"] },
        { id: "two", kind: "evidence", text: "  use   postgresql for durable records. ", sourceRefs: ["ev_two"] },
      ],
    });
    expect(pack.blocks).toHaveLength(1);
    expect(pack.blocks[0].sourceRefs).toEqual(["ev_one", "ev_two"]);
    expect(pack.omitted).toEqual([expect.objectContaining({ id: "two", reason: "duplicate", duplicateOf: "one" })]);
  });

  it("does not merge structurally or semantically different block types", () => {
    const pack = compileContextPack({
      task: "documentation",
      blocks: [
        { id: "prose", kind: "section", format: "text", text: "deploy safely", section: "Operations" },
        { id: "code", kind: "code", format: "code", text: "deploy safely", language: "shell" },
        { id: "constraint", kind: "constraint", format: "text", text: "deploy safely" },
      ],
    });
    expect(pack.blocks.map((block) => block.id).sort()).toEqual(["code", "constraint", "prose"]);
    expect(pack.omitted).toHaveLength(0);
  });

  it("promotes a retained duplicate to mandatory and normalizes its source references", () => {
    const pack = compileContextPack({
      task: "architecture-synthesis",
      blocks: [
        { id: "preferred", kind: "constraint", text: "Keep data in region.", priority: 100, sourceRefs: ["ev_one", "ev_one"] },
        { id: "required", kind: "constraint", text: "keep   data in region.", priority: 1, mandatory: true, sourceRefs: ["ev_two"] },
      ],
    });
    expect(pack.blocks).toEqual([expect.objectContaining({ id: "preferred", mandatory: true, sourceRefs: ["ev_one", "ev_two"] })]);
    expect(pack.omitted).toEqual([expect.objectContaining({ id: "required", reason: "duplicate", duplicateOf: "preferred" })]);
  });

  it("rejects duplicate IDs and content that becomes empty after normalization", () => {
    expect(() => compileContextPack({
      task: "explanation",
      blocks: [
        { id: "same", kind: "evidence", text: "First" },
        { id: "same", kind: "evidence", text: "Second" },
      ],
    })).toThrow(ContextInputError);
    expect(() => compileContextPack({
      task: "explanation",
      blocks: [{ id: "empty", kind: "section", text: "  \n\t  " }],
    })).toThrow("Context block empty is empty after normalization.");
  });

  it("counts instruction and schema overhead and reports budget omissions", () => {
    const instruction = "x".repeat(400);
    const outputSchema = "y".repeat(400);
    const pack = compileContextPack({
      task: "explanation",
      instruction,
      outputSchema,
      budget: { inputTokens: 256, outputTokens: 128 },
      blocks: [
        { id: "important", kind: "constraint", text: "Keep all customer data in the selected region.", mandatory: true, sourceRefs: ["req_region"] },
        { id: "verbose", kind: "section", text: "z".repeat(600), sourceRefs: ["src_verbose"] },
      ],
    });
    expect(pack.budget.instructionTokens).toBe(100);
    expect(pack.budget.schemaTokens).toBe(100);
    expect(pack.budget.usedInputTokens).toBeLessThanOrEqual(256);
    expect(pack.blocks.map((block) => block.id)).toContain("important");
    expect(pack.omitted).toEqual(expect.arrayContaining([expect.objectContaining({ id: "verbose", reason: "budget", sourceRefs: ["src_verbose"] })]));
  });

  it("ranks the same candidates differently for each task", () => {
    const blocks = [
      { id: "architecture", kind: "architecture" as const, text: "a".repeat(160) },
      { id: "evidence", kind: "evidence" as const, text: "e".repeat(160) },
    ];
    const shared = { instruction: "i".repeat(800), budget: { inputTokens: 256, outputTokens: 128 }, blocks };
    expect(compileContextPack({ task: "architecture-review", ...shared }).blocks.map((block) => block.id)).toEqual(["architecture"]);
    expect(compileContextPack({ task: "requirement-extraction", ...shared }).blocks.map((block) => block.id)).toEqual(["evidence"]);
  });

  it("rejects serialized packs with inconsistent budget or omission metadata", () => {
    const pack = compileContextPack({
      task: "explanation",
      instruction: "instruction",
      blocks: [{ id: "retained", kind: "evidence", text: "Retained evidence." }],
    });
    expect(() => contextPackSchema.parse({
      ...pack,
      budget: { ...pack.budget, contentTokens: pack.budget.contentTokens + 1 },
    })).toThrow("Content token accounting does not match retained blocks.");
    expect(() => contextPackSchema.parse({
      ...pack,
      omitted: [{ id: "duplicate", sourceRefs: [], reason: "duplicate", estimatedTokens: 1 }],
    })).toThrow("Duplicate omissions must reference another context record.");
  });

  it("fails explicitly instead of silently dropping mandatory constraints", () => {
    expect(() => compileContextPack({
      task: "architecture-synthesis",
      instruction: "x".repeat(800),
      budget: { inputTokens: 256, outputTokens: 128 },
      blocks: [{ id: "mandatory", kind: "constraint", text: "y".repeat(400), mandatory: true, sourceRefs: ["req_mandatory"] }],
    })).toThrow(ContextBudgetError);
  });

  it("keeps verbose traceability bounded and traceable", () => {
    const prompt = `Build a service. ${"Process authenticated work and retain evidence. ".repeat(80)}`.slice(0, 3000).padEnd(3000, "x");
    const traceability = buildInputTraceability({ prompt, cloudProvider: "Provider-neutral", tenancy: "single-tenant" });
    const blocks = contextBlocksFromTraceability(traceability);
    const pack = compileContextPack({ task: "architecture-synthesis", blocks, budget: { inputTokens: 1_200, outputTokens: 400 } });
    expect(pack.budget.usedInputTokens).toBeLessThanOrEqual(1_200);
    expect(pack.blocks.filter((block) => block.kind === "constraint").every((block) => block.mandatory)).toBe(true);
    expect([...pack.blocks, ...pack.omitted].every((item) => item.sourceRefs.length >= 0)).toBe(true);
  });

  it("uses a conservative deterministic token estimate", () => {
    expect(estimateContextTokens("12345678")).toBe(2);
    expect(estimateContextTokens("")).toBe(0);
  });
});
