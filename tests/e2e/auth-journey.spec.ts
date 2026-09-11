import { expect, test } from "@playwright/test";

test("landing sign-in uses the dedicated auth surface", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Continue to BuildRAX" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("an unsafe callback destination is replaced by the dashboard", async ({ page }) => {
  await page.goto("/auth/callback?next=https%3A%2F%2Fattacker.example");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard&error=(failed|not-configured)$/);
  await expect(page.getByRole("heading", { name: "Continue to BuildRAX" })).toBeVisible();
});
