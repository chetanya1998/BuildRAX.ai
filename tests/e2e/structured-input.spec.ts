import { expect, test } from "@playwright/test";

test("a 3,000-character description and structured context create a recoverable draft", async ({ page }) => {
  const description = `Build a provider-neutral service. ${"Accept authenticated work, retain audit evidence, and process requests reliably. ".repeat(40)}`.slice(0, 3000).padEnd(3000, "x");
  await page.goto("/start");
  await page.getByLabel("Architecture prompt").fill(description);
  await page.getByLabel("Product type").fill("Work processing service");
  await page.getByLabel("Preferred stack").fill("Next.js, PostgreSQL, Redis");
  await page.getByLabel("Cloud provider").selectOption("Provider-neutral");
  await page.getByLabel("Expected scale").selectOption("large");
  await page.getByLabel("Tenancy").selectOption("single-tenant");
  await page.getByLabel("Data sensitivity").selectOption("internal");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");

  const draftId = new URL(page.url()).pathname.split("/").at(-1)!;
  const stored = await page.evaluate(async (id) => new Promise<{
    prompt: string;
    requirements: string[];
    constraints: { preferredStack: string[]; cloudProvider: string; multiTenant: boolean; dataSensitivity: string };
    trafficProfile: string;
  }>((resolve, reject) => {
    const request = indexedDB.open("buildrax-guest");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const get = database.transaction("drafts").objectStore("drafts").get(id);
      get.onerror = () => reject(get.error);
      get.onsuccess = () => {
        resolve({
          prompt: get.result.prompt,
          requirements: get.result.architecture.ir.requirements.functional,
          constraints: get.result.architecture.ir.constraints,
          trafficProfile: get.result.architecture.ir.intent.trafficProfile,
        });
        database.close();
      };
    };
  }), draftId);

  expect(stored.prompt).toBe(description);
  expect(stored.requirements.every((item) => item.length <= 240)).toBe(true);
  expect(stored.constraints).toMatchObject({
    preferredStack: ["Next.js", "PostgreSQL", "Redis"],
    cloudProvider: "Provider-neutral",
    multiTenant: false,
    dataSensitivity: "internal",
  });
  expect(stored.trafficProfile).toBe("large");
});

test("a stage-specific generation error preserves every entered field", async ({ page }) => {
  await page.route("**/api/v1/ai/generations", (route) => route.fulfill({
    status: 422,
    contentType: "application/json",
    body: JSON.stringify({
      error: "Check the architecture inputs and try again.",
      stage: "input-validation",
      fieldErrors: { dataSensitivity: ["This sensitivity is not supported."] },
    }),
  }));
  await page.goto("/start");
  const description = "Build an internal order-processing service with auditable retries.";
  await page.getByLabel("Architecture prompt").fill(description);
  await page.getByLabel("Product type").fill("Order service");
  await page.getByLabel("Preferred stack").fill("TypeScript, PostgreSQL");
  await page.getByLabel("Cloud provider").selectOption("AWS");
  await page.getByLabel("Expected scale").selectOption("medium");
  await page.getByLabel("Tenancy").selectOption("multi-tenant");
  await page.getByLabel("Data sensitivity").selectOption("confidential");
  await page.getByRole("button", { name: /generate architecture/i }).click();

  await expect(page.getByRole("status")).toContainText("Data sensitivity: This sensitivity is not supported.");
  await expect(page.getByLabel("Architecture prompt")).toHaveValue(description);
  await expect(page.getByLabel("Product type")).toHaveValue("Order service");
  await expect(page.getByLabel("Preferred stack")).toHaveValue("TypeScript, PostgreSQL");
  await expect(page.getByLabel("Cloud provider")).toHaveValue("AWS");
  await expect(page.getByLabel("Expected scale")).toHaveValue("medium");
  await expect(page.getByLabel("Tenancy")).toHaveValue("multi-tenant");
  await expect(page.getByLabel("Data sensitivity")).toHaveValue("confidential");
});
