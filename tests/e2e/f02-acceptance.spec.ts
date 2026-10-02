import { expect, test } from "@playwright/test";
import { generateInspectAndOpen, installGenerationJobFixture } from "./generation-job-fixture";

for (const width of [1440, 1024]) for (const theme of ["light", "dark"]) {
  test(`F02 visible layout at ${width}px in ${theme}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop/tablet Chromium acceptance.");
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((value) => localStorage.setItem("buildrax-theme", value), theme);
    await installGenerationJobFixture(page);
    await page.goto("/start?template=multi-tenant-saas");
    await generateInspectAndOpen(page);
    await expect(page.locator(".react-flow__node-semantic")).toHaveCount(15);
    const namedLayout = page.getByRole("button", { name: "Auto layout", exact: true });
    expect.soft(await namedLayout.count(), "auto layout needs an accessible name at this width").toBe(1);
    await namedLayout.click();
    await expect(page.getByText("Layout updated. Manually positioned components were preserved.", { exact: true })).toBeVisible();
    await page.waitForTimeout(700); // Allow the 500ms fit animation to complete.
    const measure = () => page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(".react-flow__node-semantic"));
      const canvas = document.querySelector(".react-flow")!.getBoundingClientRect();
      const controls = Array.from(document.querySelectorAll<HTMLElement>("aside, [class*='bottomBar'], [class*='aiLauncher'], [class*='aiBar'], [class*='toolHint']"))
        .filter((el) => getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0);
      return nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { id: node.dataset.id, clipped: r.left < canvas.left - 1 || r.right > canvas.right + 1 || r.top < canvas.top - 1 || r.bottom > canvas.bottom + 1,
          occluded: controls.filter((control) => { const c = control.getBoundingClientRect(); return r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top; }).map((control) => control.className) };
      });
    });
    const before = await measure();
    await page.screenshot({ path: testInfo.outputPath("layout.png"), fullPage: true });
    await testInfo.attach("closed-panel-geometry", { body: JSON.stringify(before, null, 2), contentType: "application/json" });
    expect.soft(before.filter((node) => node.clipped || node.occluded.length), "nodes must clear fixed controls").toEqual([]);
    const positions = await page.locator(".react-flow__node-semantic").evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).style.transform));
    expect.soft(await page.getByRole("button", { name: "Export", exact: true }).count(), "export needs an accessible name at this width").toBe(1);
    await page.getByRole("button", { name: "Export", exact: true }).click();
    await expect(page.getByRole("button", { name: "Close", exact: true })).toBeVisible();
    await page.waitForTimeout(700);
    const after = await measure();
    await page.screenshot({ path: testInfo.outputPath("panel-open.png"), fullPage: true });
    await testInfo.attach("open-panel-geometry", { body: JSON.stringify(after, null, 2), contentType: "application/json" });
    expect.soft(after.filter((node) => node.clipped || node.occluded.length), "opening a panel must preserve a usable diagram view").toEqual([]);
    expect(await page.locator(".react-flow__node-semantic").evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).style.transform))).toEqual(positions);
    await page.setViewportSize({ width: width === 1440 ? 1024 : 1440, height: 900 });
    await page.waitForTimeout(700);
    expect((await measure()).filter((node) => node.clipped || node.occluded.length)).toEqual([]);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.waitForTimeout(700);
    expect((await measure()).filter((node) => node.clipped || node.occluded.length)).toEqual([]);
    expect(await page.locator(".react-flow__node-semantic").evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).style.transform))).toEqual(positions);
  });
}
