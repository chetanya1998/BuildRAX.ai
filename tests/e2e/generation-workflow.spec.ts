import { expect, test } from "@playwright/test";
import { installGenerationJobFixture } from "./generation-job-fixture";

const prompt = "Build a multi-tenant support platform with queued background jobs.";

test("describe, generate, inspect, save, and reload a validated architecture", async ({ page }) => {
  const tracker = await installGenerationJobFixture(page);

  await page.goto("/start");
  await page.getByLabel("Architecture prompt").fill(prompt);
  await expect(page.getByLabel("Architecture prompt")).toHaveValue(prompt);
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page.getByRole("heading", { name: /inspect what buildrax understood/i })).toBeVisible({ timeout: 15_000 });
  expect(tracker.statusReads).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole("listitem").filter({ hasText: prompt })).toBeVisible();

  const diagram = tracker.result!.artifact.diagram;
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
