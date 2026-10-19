import { expect, test } from "@playwright/test";
import { generateInspectAndOpen, installGenerationJobFixture } from "./generation-job-fixture";

test("presentation note transactions undo, redo, duplicate and recover without AI", async ({ page, isMobile }, testInfo) => {
  await installGenerationJobFixture(page);
  await page.goto("/start?template=multi-tenant-saas");
  await generateInspectAndOpen(page);
  const aiRequests: string[] = [];
  page.on("request", (request) => { if (/\/api\/v1\/(ai|generation-jobs)/.test(request.url())) aiRequests.push(request.url()); });
  await page.getByRole("button", { name: "Presentation objects", exact: true }).click();
  await page.getByLabel("Object text").fill("Retention decision");
  await page.getByRole("button", { name: "Create object" }).click();
  await expect(page.locator('[data-presentation-kind="note"]')).toHaveText("Retention decision");
  if (isMobile) await page.keyboard.press("Control+z");
  else await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator('[data-presentation-kind="note"]')).toHaveCount(0);
  if (isMobile) await page.keyboard.press("Control+Shift+z");
  else await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.locator('[data-presentation-kind="note"]')).toHaveCount(1);
  await page.getByLabel("Object text").fill("Approved retention decision");
  await page.getByRole("button", { name: "Save object", exact: true }).click();
  await page.getByRole("button", { name: "Duplicate visual object" }).click();
  await expect(page.locator('[data-presentation-kind="note"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Delete object" }).click();
  await expect(page.locator('[data-presentation-kind="note"]')).toHaveCount(1);
  await expect(page.getByLabel("Browser recovery status")).toContainText("Saved locally");
  await page.reload();
  await expect(page.locator('[data-presentation-kind="note"]')).toHaveText("Approved retention decision");
  await page.getByRole("button", { name: "Presentation objects", exact: true }).click();
  await page.getByRole("button", { name: "Use dark theme" }).click();
  const panelBounds = await page.getByRole("region", { name: "Presentation objects" }).boundingBox();
  expect(panelBounds!.x).toBeGreaterThanOrEqual(0);
  expect(panelBounds!.x + panelBounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: testInfo.outputPath("presentation-dark.png") });
  expect(aiRequests).toEqual([]);
});

test("all targeted objects render and saved focus exits without changing the document", async ({ page }) => {
  await installGenerationJobFixture(page);
  await page.goto("/start?template=multi-tenant-saas");
  await generateInspectAndOpen(page);
  await page.getByRole("button", { name: "Presentation objects", exact: true }).click();
  for (const kind of ["annotation", "highlight", "group", "focus"]) {
    await page.getByLabel("Saved object").selectOption("");
    await page.getByLabel("Object kind").selectOption(kind);
    if (kind !== "highlight") await page.getByLabel("Object text").fill(`${kind} context`);
    await page.getByRole("checkbox", { name: "component: Tenant service", exact: true }).check();
    await page.getByRole("button", { name: "Create object" }).click();
    if (kind !== "focus") await expect(page.locator(`[data-presentation-kind="${kind}"]`)).toHaveCount(1);
  }
  const viewport = page.locator(".react-flow__viewport");
  const before = await viewport.getAttribute("style");
  await page.getByRole("button", { name: "Open saved focus" }).click();
  await expect(page.getByTestId("presentation-focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("presentation-focus")).toHaveCount(0);
  await expect(viewport).toHaveAttribute("style", before!);
  await expect(page.getByLabel("Browser recovery status")).toContainText("Saved locally");
  await page.reload();
  for (const kind of ["annotation", "highlight", "group"]) await expect(page.locator(`[data-presentation-kind="${kind}"]`)).toHaveCount(1);
  await expect(page.getByTestId("presentation-focus")).toHaveCount(0);
});
