import { expect, test } from "@playwright/test";
import { generateInspectAndOpen, installGenerationJobFixture } from "./generation-job-fixture";

test("inspector typing is one undoable edit and cancellation is a no-op", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop inspector authoring.");
  await installGenerationJobFixture(page);
  await page.goto("/start?template=multi-tenant-saas");
  await generateInspectAndOpen(page);
  const node = page.locator('[data-id="saas-service"]');
  await node.click();
  await page.getByRole("button", { name: "Edit node style" }).click();
  const name = page.getByLabel("Name", { exact: true });
  await name.fill("");
  await name.pressSequentially("Renamed tenant service");
  await expect(node).toContainText("Tenant service");
  await name.press("Tab");
  await expect(node).toContainText("Renamed tenant service");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(node).toContainText("Tenant service");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(node).toContainText("Renamed tenant service");
  await name.fill("Discard me");
  await name.press("Escape");
  await expect(name).toHaveValue("Renamed tenant service");
  await name.press("Tab");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(node).toContainText("Tenant service");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(node).toContainText("Renamed tenant service");
  await expect(page.getByLabel("Browser recovery status")).toContainText("Saved locally");
  await page.reload();
  await expect(node).toContainText("Renamed tenant service");
});

test("connector inspector commits one transaction on Enter", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop inspector authoring.");
  await installGenerationJobFixture(page);
  await page.goto("/start?template=multi-tenant-saas");
  await generateInspectAndOpen(page);
  const edge = page.locator(".react-flow__edge-interaction").first();
  await expect(edge).toBeAttached();
  const point = await edge.evaluate((element) => {
    const path = element as SVGPathElement;
    const local = path.getPointAtLength(path.getTotalLength() / 2);
    const screen = new DOMPoint(local.x, local.y).matrixTransform(path.getScreenCTM()!);
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.dblclick(point.x, point.y);
  const protocol = page.getByLabel("Protocol", { exact: true });
  const original = await protocol.inputValue();
  await protocol.fill("");
  await protocol.pressSequentially("F03 protocol");
  await protocol.press("Enter");
  await expect(protocol).toHaveValue("F03 protocol");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(protocol).toHaveValue(original);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(protocol).toHaveValue("F03 protocol");
});
