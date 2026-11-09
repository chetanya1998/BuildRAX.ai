import { expect, test } from "@playwright/test";
import { presentationFixture } from "../../src/test/presentation-fixture";
import { architectureIRFromDiagram } from "../../src/lib/architecture-ir/snapshot";
import { openDiagramFixture, readDiagramFixture } from "./diagram-fixture";

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: group move is one reversible visual transaction and survives reload`, async ({ page }) => {
    const diagram = presentationFixture(); diagram.theme = theme;
    await openDiagramFixture(page, diagram);
    const initial = await readDiagramFixture(page, diagram.id);
    await page.getByRole("button", { name: "Presentation objects", exact: true }).click();
    await page.getByLabel("Saved object").selectOption("group");
    await page.getByRole("button", { name: "Move group right", exact: true }).click();
    const positions = async () => {
      const current = await readDiagramFixture(page, diagram.id);
      return [...current.nodes.map((node) => node.position.x), current.primitives[0].position.x];
    };
    await expect.poll(positions).toEqual([120, 420, 100, 120]);
    const moved = await readDiagramFixture(page, diagram.id);
    expect(architectureIRFromDiagram(moved)).toEqual(architectureIRFromDiagram(initial));
    expect(moved.nodes.slice(0, 2).every((node) => node.metadata.manualPosition)).toBe(true);
    await page.keyboard.press("Control+z");
    await expect.poll(positions).toEqual([100, 400, 100, 100]);
    await page.keyboard.press("Control+Shift+z");
    await expect.poll(positions).toEqual([120, 420, 100, 120]);
    await page.reload();
    await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");
    await expect.poll(positions).toEqual([120, 420, 100, 120]);
    await expect(page.locator('[data-presentation-id="group"]')).toContainText("Service boundary");
  });

  test(`${theme}: deleted anchor retains annotation through reload and explicit repair`, async ({ page }) => {
    const diagram = presentationFixture(); diagram.theme = theme;
    await openDiagramFixture(page, diagram);
    await page.locator('.react-flow__node[data-id="a"]').click();
    await page.keyboard.press("Delete");
    await expect(page.locator('.react-flow__node[data-id="a"]')).toHaveCount(0);
    await expect.poll(async () => (await readDiagramFixture(page, diagram.id)).nodes.length).toBe(2);
    await page.reload();
    await page.getByRole("button", { name: "Presentation objects", exact: true }).click();
    await page.getByLabel("Saved object").selectOption("annotation");
    await expect(page.getByText(/Some targets were removed/)).toBeVisible();
    await expect(page.getByLabel("Object text")).toHaveValue("Confirm ownership");
    await page.getByRole("checkbox", { name: "component: Service B", exact: true }).check();
    await page.getByRole("button", { name: "Save object", exact: true }).click();
    await expect(page.getByText(/Some targets were removed/)).toHaveCount(0);
    await expect(page.locator('[data-presentation-id="annotation"]')).toHaveText("Confirm ownership");
    const anchor = async () => (await readDiagramFixture(page, diagram.id)).presentationObjects?.find((object) => object.id === "annotation");
    await expect.poll(anchor).toMatchObject({ revision: 2, anchor: { kind: "component", id: "b" } });
    await page.keyboard.press("Control+z");
    await expect(page.getByText(/Some targets were removed/)).toBeVisible();
    await page.keyboard.press("Control+Shift+z");
    await expect.poll(anchor).toMatchObject({ revision: 2, anchor: { id: "b" } });
    await page.reload();
    await expect(page.locator('[data-presentation-id="annotation"]')).toHaveText("Confirm ownership");
  });
}
