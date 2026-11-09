import { expect, test } from "@playwright/test";
import { createConnector, createDiagram, createNode } from "../../src/lib/domain/factory";
import { architectureIRFromDiagram } from "../../src/lib/architecture-ir/snapshot";
import { scenarioFromPath } from "../../src/lib/architecture-ir/scenarios";
import { openDiagramFixture } from "./diagram-fixture";

function fixture() {
  const diagram = createDiagram("Playback acceptance", ["a", "b", "c"].map((id, i) => createNode("backend-service", id, id, i * 300, 100)), [createConnector("ab", "a", "b", "http-rest", "Request"), createConnector("bc", "b", "c", "http-rest", "Forward")]);
  const scenario = scenarioFromPath(architectureIRFromDiagram(diagram), { componentIds: ["a", "b", "c"], flowIds: ["ab", "bc"] }, { id: "journey", name: "A to C", patternId: "microservices" });
  diagram.scenarios = [scenario, { ...structuredClone(scenario), id: "second", name: "Second journey" }];
  return diagram;
}

test("backgrounding, switching and closing cancel scheduled playback and restore the view", async ({ page }) => {
  await openDiagramFixture(page, fixture());
  await page.getByRole("button", { name: "Open scenarios", exact: true }).click();
  const viewport = page.locator(".react-flow__viewport");
  const before = await viewport.getAttribute("style");
  await page.clock.install();
  await page.getByRole("button", { name: "Play scenario", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByTestId("scenario-status")).toHaveText("paused · Step 1 of 2");
  await page.clock.runFor(5000);
  await expect(page.getByTestId("scenario-status")).toHaveText("paused · Step 1 of 2");
  await page.evaluate(() => { Reflect.deleteProperty(document, "visibilityState"); document.dispatchEvent(new Event("visibilitychange")); });
  await page.getByLabel("Scenario", { exact: true }).selectOption("second");
  await expect(page.getByTestId("scenario-status")).toHaveText("idle");
  await expect(viewport).toHaveAttribute("style", before!);
  await page.getByRole("button", { name: "Play scenario", exact: true }).click();
  await page.getByRole("button", { name: "Close scenarios", exact: true }).click();
  await page.clock.runFor(5000);
  await expect(page.locator("[data-scenario-pulse]")).toHaveCount(0);
  await expect(viewport).toHaveAttribute("style", before!);
  await expect(page.getByLabel("Diagram title")).not.toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Open scenarios", exact: true }).click();
  await expect(page.getByTestId("scenario-status")).toHaveText("idle");
});

for (const reason of ["missing-flow", "changed-flow"] as const) test(`saved ${reason} scenarios remain visible but cannot play after reload`, async ({ page }) => {
  const diagram = fixture();
  if (reason === "missing-flow") diagram.connectors = diagram.connectors.slice(1);
  else diagram.connectors[0].protocol = "gRPC";
  await openDiagramFixture(page, diagram);
  await page.reload();
  await page.getByRole("button", { name: "Open scenarios", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Scenario cannot play" })).toContainText(reason);
  await expect(page.getByLabel("Scenario", { exact: true }).locator("option")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Play scenario", exact: true })).toBeDisabled();
  await expect(page.locator("[data-scenario-pulse]")).toHaveCount(0);
});
