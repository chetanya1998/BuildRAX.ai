import { expect, type Page } from "@playwright/test";
import { buildArchitectureIR, compileArchitectureIR } from "../../src/lib/architecture-ir/compiler";
import { presentationFromDiagram } from "../../src/lib/architecture-ir/snapshot";
import type { GenerationRequest } from "../../src/lib/domain/schema";
import { buildInputTraceability } from "../../src/lib/intelligence/input";
import { evaluateArchitectureRules, matchArchitecturePatterns } from "../../src/lib/intelligence/patterns";

export const generationFixtureJobId = "33333333-3333-4333-8333-333333333333";

function buildResult(request: GenerationRequest) {
  const ir = buildArchitectureIR(request);
  const diagram = compileArchitectureIR(ir);
  const traceability = buildInputTraceability(request);
  return {
    artifact: {
      ir,
      traceability,
      presentation: presentationFromDiagram(diagram),
      diagram,
      checksums: { ir: "a".repeat(64), presentation: "b".repeat(64), diagram: "c".repeat(64), evidence: "d".repeat(64), requirements: "e".repeat(64) },
      generationReceipt: { requestId: generationFixtureJobId, irChecksum: "a".repeat(64), diagramChecksum: "c".repeat(64), issuedAt: "2026-09-22T00:00:00.000Z", signature: "A".repeat(43) },
    },
    validation: { valid: true, errors: [], warnings: [] },
    proposals: {
      patterns: matchArchitecturePatterns(request).map((match) => ({ patternId: match.pattern.id, score: match.score, matchedTerms: match.matchedTerms, explicit: match.explicit, conflicts: match.conflicts })),
      rules: evaluateArchitectureRules({ request, traceability }),
    },
    summary: {
      facts: traceability.requirements.items.filter((item) => item.state === "stated").map((item) => item.statement).slice(0, 8),
      assumptions: ir.assumptions.map((item) => item.text).slice(0, 8),
      unknowns: traceability.requirements.items.filter((item) => item.state === "unknown").map((item) => item.question!).slice(0, 8),
    },
    context: { omitted: [], budget: { inputTokens: 16_000, outputTokens: 6_000, instructionTokens: 0, schemaTokens: 0, contentTokens: 0, usedInputTokens: 0, remainingInputTokens: 16_000 } },
    meta: { gatewayVersion: "1.0.0", requestId: generationFixtureJobId, task: "architecture-synthesis", provider: "deterministic", model: "buildrax-compiler-v1", durationMs: 0, attempts: 1, successfulCalls: 0, repairCalls: 0, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 } },
  };
}

export async function installGenerationJobFixture(page: Page, options?: { creationError?: { status: number; body: unknown; retryAfter?: string } }) {
  const tracker = { statusReads: 0, result: null as ReturnType<typeof buildResult> | null };
  await page.route("**/api/v1/guest-session", async (route) => {
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 60_000 }) });
  });
  await page.route("**/api/v1/generation-jobs**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/generation-jobs" && route.request().method() === "POST") {
      if (options?.creationError) {
        await route.fulfill({
          status: options.creationError.status,
          contentType: "application/json",
          headers: options.creationError.retryAfter ? { "retry-after": options.creationError.retryAfter } : undefined,
          body: JSON.stringify(options.creationError.body),
        });
        return;
      }
      const payload = route.request().postDataJSON() as { request: GenerationRequest };
      tracker.result = buildResult(payload.request);
      await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ job: { id: generationFixtureJobId, status: "queued", stage: "accepted", progress: 0 } }) });
      return;
    }
    if (url.pathname.endsWith("/run")) {
      await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ job: { id: generationFixtureJobId, status: "running" } }) });
      return;
    }
    tracker.statusReads += 1;
    const completed = tracker.statusReads > 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ job: {
      id: generationFixtureJobId,
      status: completed ? "completed" : "running",
      stage: completed ? "published" : "rules",
      progress: completed ? 100 : 50,
      attempts: 1,
      result: completed ? tracker.result : null,
      error: null,
      createdAt: "2026-09-22T00:00:00.000Z",
      updatedAt: "2026-09-22T00:00:01.000Z",
      completedAt: completed ? "2026-09-22T00:00:01.000Z" : null,
    } }) });
  });
  return tracker;
}

export async function generateInspectAndOpen(page: Page) {
  const generate = page.getByRole("button", { name: /generate architecture/i });
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.getByRole("heading", { name: /inspect what buildrax understood/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /open validated architecture/i }).click();
}
