import { expect, test } from "@playwright/test";

test("landing keeps the prompt out of the hero and routes into onboarding", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Design software architecture with clarity." })).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await page.getByRole("link", { name: /let's get started building/i }).first().click();
  await expect(page).toHaveURL(/\/start$/);
  await expect(page.getByRole("textbox", { name: "Architecture prompt" })).toBeVisible();
});

test("a template can create a recoverable guest canvas", async ({ page }) => {
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await expect(page.getByLabel("Canvas tools")).toBeVisible();
  await expect(page.getByText("Tenant service")).toBeVisible();
});

test("template library opens a populated canvas directly", async ({ page }) => {
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await expect(page.getByText("Tenant service")).toBeVisible();
});

test("the editor only reveals its inspector for a selected item and can delete it", async ({ page }) => {
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await expect(page.getByText("Inspector", { exact: true })).toHaveCount(0);
  await page.getByText("Tenant service", { exact: true }).click();
  await expect(page.getByText("Inspector", { exact: true })).toBeVisible();
  await expect(page.locator(".react-flow__resize-control").first()).toBeVisible();
  await page.getByRole("button", { name: "Delete selected" }).click();
  await expect(page.getByText("Tenant service", { exact: true })).toHaveCount(0);
});

test("the landing sandbox explains security outcomes interactively", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Access denied" }).click();
  await expect(page.getByRole("button", { name: "Access denied" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Blocked before project data loads")).toBeVisible();
});

test("landing feedback stays applied and the hero canvas communicates flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Semantic architecture", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/No account required for your first diagram/i)).toHaveCount(0);

  const node = page.locator('[aria-label="Example BuildRAX architecture canvas"] [class*="demoNode"]').first();
  await expect(node).toBeVisible();
  expect(await node.evaluate((element) => getComputedStyle(element).animationName)).toContain("canvas-node-cycle");

  const colors = await page.locator("#sandbox").evaluate((element) => ({
    section: getComputedStyle(element).backgroundColor,
    page: getComputedStyle(document.body).backgroundColor,
  }));
  expect(colors.section).toBe(colors.page);

  const feature = page.locator("#product article").first();
  const featurePadding = await feature.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingTop));
  expect(featurePadding).toBeLessThanOrEqual(22);
  expect(featurePadding).toBeGreaterThanOrEqual(20);
});

test("landing navigation adapts without losing the core sections", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sandbox" })).toBeVisible();
  } else {
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sandbox" })).toBeVisible();
  }
});
