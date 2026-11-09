import { expect, test } from "@playwright/test";

test("start inputs wait for hydration before accepting recoverable text", async ({ page }) => {
  let release!: () => void;
  const scriptsReady = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/_next/static/**/*.js", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.goto("/start", { waitUntil: "commit" });
    await expect(page.getByLabel("Architecture prompt")).toBeDisabled();
    await expect(page.getByLabel("Product type")).toBeDisabled();
    await expect(page.getByLabel("Cloud provider")).toBeDisabled();
  } finally {
    release();
  }
  await expect(page.getByLabel("Architecture prompt")).toBeEnabled();
  await page.getByLabel("Architecture prompt").fill("A reliable queued work service");
  await page.getByLabel("Product type").fill("Work processing");
  await expect(page.getByLabel("Architecture prompt")).toHaveValue("A reliable queued work service");
  await expect(page.getByLabel("Product type")).toHaveValue("Work processing");
  await expect(page.getByRole("button", { name: "Generate architecture" })).toBeEnabled();
});
