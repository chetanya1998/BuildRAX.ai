import { expect, test } from "@playwright/test";
import { buildArchitectureIR, compileArchitectureIR } from "../../src/lib/architecture-ir/compiler";
import { presentationFromDiagram } from "../../src/lib/architecture-ir/snapshot";
import { buildInputTraceability } from "../../src/lib/intelligence/input";
import { evaluateArchitectureRules, matchArchitecturePatterns } from "../../src/lib/intelligence/patterns";

const jobId = "33333333-3333-4333-8333-333333333333";
const prompt = "Build a multi-tenant support platform with queued background jobs.";
const request = { prompt } as const;
const ir = buildArchitectureIR(request);
const diagram = compileArchitectureIR(ir);
const traceability = buildInputTraceability(request);
const result = {
  artifact: {
    ir,
    traceability,
    presentation: presentationFromDiagram(diagram),
    diagram,
    checksums: { ir: "a".repeat(64), presentation: "b".repeat(64), diagram: "c".repeat(64), evidence: "d".repeat(64), requirements: "e".repeat(64) },
    generationReceipt: { requestId: jobId, irChecksum: "a".repeat(64), diagramChecksum: "c".repeat(64), issuedAt: "2026-09-22T00:00:00.000Z", signature: "A".repeat(43) },
  },
  validation: { valid: true, errors: [], warnings: [] },
  proposals: {
    patterns: matchArchitecturePatterns(request).map((match) => ({ patternId: match.pattern.id, score: match.score, matchedTerms: match.matchedTerms, explicit: match.explicit, conflicts: match.conflicts })),
    rules: evaluateArchitectureRules({ request, traceability }),
  },
  summary: {
    facts: [prompt],
    assumptions: ir.assumptions.map((item) => item.text).slice(0, 8),
    unknowns: traceability.requirements.items.filter((item) => item.state === "unknown").map((item) => item.question!).slice(0, 8),
  },
  context: { omitted: [], budget: { inputTokens: 16_000, outputTokens: 6_000, instructionTokens: 0, schemaTokens: 0, contentTokens: 0, usedInputTokens: 0, remainingInputTokens: 16_000 } },
  meta: { gatewayVersion: "1.0.0", requestId: jobId, task: "architecture-synthesis", provider: "deterministic", model: "buildrax-compiler-v1", durationMs: 0, attempts: 1, successfulCalls: 0, repairCalls: 0, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 } },
};

function publicJob(status: "running" | "completed") {
  return {
    id: jobId,
    status,
    stage: status === "completed" ? "published" : "rules",
    progress: status === "completed" ? 100 : 50,
    attempts: 1,
    result: status === "completed" ? result : null,
    error: null,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:01.000Z",
    completedAt: status === "completed" ? "2026-09-22T00:00:01.000Z" : null,
  };
}

test("describe, generate, inspect, save, and reload a validated architecture", async ({ page }) => {
  let statusReads = 0;
  await page.route("**/api/v1/guest-session", async (route) => {
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 60_000 }) });
  });
  await page.route("**/api/v1/generation-jobs**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/generation-jobs" && route.request().method() === "POST") {
      await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ job: { id: jobId, status: "queued", stage: "accepted", progress: 0 } }) });
      return;
    }
    if (url.pathname.endsWith("/run")) {
      await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ job: publicJob("running") }) });
      return;
    }
    statusReads += 1;
    const job = publicJob(statusReads === 1 ? "running" : "completed");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ job }) });
  });

  await page.goto("/start");
  const generateButton = page.getByRole("button", { name: /generate architecture/i });
  await expect(generateButton).toBeEnabled();
  await page.getByLabel("Architecture prompt").fill(prompt);
  await expect(page.getByLabel("Architecture prompt")).toHaveValue(prompt);
  await generateButton.click();
  await expect(page.getByRole("heading", { name: /inspect what buildrax understood/i })).toBeVisible({ timeout: 15_000 });
  expect(statusReads).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole("listitem").filter({ hasText: prompt })).toBeVisible();

  await Promise.all([
    page.waitForURL(new RegExp(`/draft/${diagram.id}$`), { timeout: 20_000 }),
    page.getByRole("button", { name: /open validated architecture/i }).click(),
  ]);
  await expect(page.getByLabel("Diagram title")).toHaveValue(diagram.title);
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");

  await page.reload();
  await expect(page.getByLabel("Diagram title")).toHaveValue(diagram.title);
  const storedPrompt = await page.evaluate(async (id) => new Promise<string>((resolve, reject) => {
    const opened = indexedDB.open("buildrax-guest");
    opened.onerror = () => reject(opened.error);
    opened.onsuccess = () => {
      const db = opened.result;
      const read = db.transaction("drafts").objectStore("drafts").get(id);
      read.onerror = () => reject(read.error);
      read.onsuccess = () => { resolve(read.result.prompt); db.close(); };
    };
  }), diagram.id);
  expect(storedPrompt).toBe(prompt);
});
