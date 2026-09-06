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
  const generateButton = page.getByRole("button", { name: /generate architecture/i });
  await expect(generateButton).toBeEnabled();
  await generateButton.click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await expect(page.getByLabel("Canvas tools")).toBeVisible();
  await expect(page.getByText("Tenant service")).toBeVisible();
  await expect(page.locator(".react-flow__node-semantic")).toHaveCount(15);
  await expect(page.getByRole("link", { name: /Projects/i })).toBeVisible();
});

test("template library opens a populated canvas directly", async ({ page }) => {
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await expect(page.getByText("Tenant service")).toBeVisible();
});

test("the desktop editor selects without disrupting the canvas and edits a semantic label inline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Mobile intentionally does not expose the full drawing inspector.");
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await expect(page.getByText("Inspector", { exact: true })).toHaveCount(0);
  await page.getByText("Tenant service", { exact: true }).click();
  await expect(page.getByText("Inspector", { exact: true })).toHaveCount(0);
  await page.getByText("Tenant service", { exact: true }).dblclick();
  const name = page.getByLabel("Component name");
  await expect(name).toBeVisible();
  await name.fill("Tenant API");
  await name.press("Enter");
  await expect(page.getByText("Tenant API", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bring to front" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send to back" })).toBeVisible();
});

test("desktop canvas tools draw a drag-sized primitive", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Drawing remains desktop-only in the MVP.");
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await page.getByRole("button", { name: /Rectangle \(R\)/i }).click();
  const pane = page.locator(".react-flow__pane");
  const box = await pane.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const before = await page.locator(".react-flow__node-primitive").count();
  await page.mouse.move(box.x + 360, box.y + 360);
  await page.mouse.down();
  await page.mouse.move(box.x + 560, box.y + 470);
  await page.mouse.up();
  await expect(page.locator(".react-flow__node-primitive")).toHaveCount(before + 1);
});

test("desktop canvas exposes the streamlined shape toolkit and keeps freehand available", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Drawing remains desktop-only in the MVP.");
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });

  await expect(page.getByRole("button", { name: /Ellipse/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Circle \(O\)/i })).toBeVisible();
  await page.getByRole("button", { name: /Freehand \(P\)/i }).click();
  await expect(page.getByRole("button", { name: /Freehand \(P\)/i })).toBeVisible();
  await expect(page.locator(".react-flow__pane")).toHaveCSS("cursor", "crosshair");
});

test("documentation supports markdown writing, slash inserts, and a live canvas embed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The full document workspace is desktop-first.");
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });

  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByLabel("Documentation workspace")).toBeVisible();
  await page.getByRole("button", { name: "Write" }).click();
  const editor = page.getByLabel("Documentation editor");
  await expect(editor).toBeVisible();
  await editor.fill("# Working agreement\n\n/");
  await expect(page.getByRole("menu", { name: "Slash commands" })).toBeVisible();
  await page.getByRole("menuitem", { name: /\/table/i }).click();
  await expect(editor).toHaveValue(/\| Column \| Value \|/);
  await page.getByRole("button", { name: "Embed live canvas" }).click();
  await page.getByRole("button", { name: "Insert Mermaid diagram" }).click();
  await page.getByRole("button", { name: "Read" }).click();
  await expect(page.getByText("Live canvas", { exact: true })).toBeVisible();
  await expect(page.getByText(/stays in sync/i)).toBeVisible();
  const documentWorkspace = page.getByLabel("Documentation workspace");
  await expect(documentWorkspace.getByLabel("Rendered Mermaid diagram")).toBeVisible();
  await expect(documentWorkspace.locator('[class*="mermaidRendered"] svg')).toBeVisible();
});

test("documentation controls expose tooltips and perform their editing actions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The full document workspace is desktop-first.");
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await page.getByText("Tenant service", { exact: true }).click();
  await page.getByRole("button", { name: "Docs" }).click();
  const workspace = page.getByLabel("Documentation workspace");
  await expect(workspace).toBeVisible();
  await workspace.getByRole("button", { name: "Write document", exact: true }).click();
  const editor = workspace.getByLabel("Documentation editor");
  await editor.fill("# Control test\n\n");
  await editor.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(element.value.length, element.value.length));

  const actions = workspace.getByRole("toolbar", { name: "Markdown insert tools" }).locator("button");
  await expect(actions).toHaveCount(16);
  for (const action of await actions.all()) {
    await expect(action).toHaveAttribute("data-tooltip", /\S+/);
  }

  for (const name of ["Heading", "Bold", "Italic", "Quote", "Bulleted list", "Numbered list", "Task list", "Insert table", "Add table row", "Add table column", "Code block", "Divider", "Embed live canvas", "Insert Mermaid diagram", "Link selected canvas node"] as const) {
    await workspace.getByRole("button", { name }).click();
  }
  await workspace.locator('input[type="file"][accept*="image/png"]').setInputFiles({ name: "diagram-note.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgo=", "base64") });
  await expect(editor).toHaveValue(/## Heading/);
  await expect(editor).toHaveValue(/\*\*_bold text_\*\*/);
  await expect(editor).toHaveValue(/\| Column \| Value \| Column \|/);
  await expect(editor).toHaveValue(/```typescript/);
  await expect(editor).toHaveValue(/:::buildrax-canvas/);
  await expect(editor).toHaveValue(/```mermaid/);
  await expect(editor).toHaveValue(/:::buildrax-node/);
  await expect(editor).toHaveValue(/data:image\/png;base64/);

  await workspace.getByRole("button", { name: "Read document", exact: true }).click();
  await expect(workspace.getByText("Control test", { exact: true })).toBeVisible();
  await workspace.getByRole("button", { name: "Split document and canvas view", exact: true }).click();
  await expect(workspace).toBeVisible();
  await workspace.getByRole("button", { name: "Document view", exact: true }).click();
  await expect(workspace).toBeVisible();

  const download = page.waitForEvent("download");
  await workspace.getByRole("button", { name: "Export Markdown" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
  await workspace.getByRole("button", { name: "Copy documentation" }).click();
  await expect(page.getByRole("status")).toContainText(/Documentation copied|Copy is unavailable/);
});

test("desktop canvas places a component at a chosen point and edits its label inline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop owns component placement and inline canvas editing in the MVP.");
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });

  const nodes = page.locator(".react-flow__nodes > *");
  const before = await nodes.count();
  await page.getByLabel("Open semantic components").click();
  await page.getByRole("button", { name: "Place Web Browser on canvas" }).click();
  await expect(page.getByRole("status")).toContainText("Click the canvas to place Web Browser.");

  const pane = page.locator(".react-flow__pane");
  const paneBox = await pane.boundingBox();
  expect(paneBox).not.toBeNull();
  if (!paneBox) return;
  const emptyPoint = await page.evaluate(({ x, y, width, height }) => {
    for (let row = 1; row < 8; row += 1) {
      for (let column = 1; column < 10; column += 1) {
        const clientX = x + (column / 10) * width;
        const clientY = y + (row / 9) * height;
        const target = document.elementFromPoint(clientX, clientY);
        if (target?.closest(".react-flow__pane") && !target.closest(".react-flow__node, .react-flow__edge, button, aside")) return { x: clientX, y: clientY };
      }
    }
    return { x: x + width / 2, y: y + height / 2 };
  }, paneBox);
  await page.mouse.click(emptyPoint.x, emptyPoint.y);
  await expect(nodes).toHaveCount(before + 1);

  const added = page.locator(".react-flow__node-semantic").last();
  await added.dblclick();
  const name = page.getByLabel("Component name");
  await expect(name).toBeVisible();
  await name.fill("Public web client");
  await name.press("Enter");
  await expect(page.getByText("Public web client", { exact: true })).toBeVisible();
});

test("components command palette filters, handles empty results, and supports keyboard placement", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The compact mobile drawer is covered by visual review; keyboard placement is desktop-first.");
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });

  await page.getByLabel("Open semantic components").click();
  const palette = page.getByRole("complementary", { name: "Semantic components" });
  await expect(palette).toBeVisible();
  await expect(palette.getByText("30 available")).toBeVisible();
  await palette.getByRole("button", { name: /Filter Data components/i }).click();
  await expect(palette.getByText("Vector Database", { exact: true })).toBeVisible();
  await expect(palette.getByText("Web Browser", { exact: true })).toHaveCount(0);

  const search = palette.getByLabel("Search semantic components");
  await search.fill("no-such-component");
  await expect(palette.getByText("No components found")).toBeVisible();
  await palette.getByRole("button", { name: "Reset results" }).click();
  await search.fill("hosted llm");
  await expect(palette.getByLabel("Hosted LLM Figma SVG icon")).toBeVisible();
  await search.fill("web browser");
  await expect(palette.getByLabel("Web Browser open-source icon")).toBeVisible();
  await search.fill("vector");
  await search.press("Enter");
  await expect(page.getByRole("status")).toContainText("Click the canvas to place Vector Database.");
});

test("components palette preserves the component drag payload contract", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Direct drag-to-place is a desktop canvas interaction.");
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  const nodes = page.locator(".react-flow__nodes > *");
  const before = await nodes.count();
  await page.getByLabel("Open semantic components").click();
  const palette = page.getByRole("complementary", { name: "Semantic components" });
  await palette.locator('[data-component="browser"]').evaluate((row) => {
    const pane = document.querySelector(".react-flow__pane");
    if (!pane) throw new Error("Canvas pane is unavailable");
    const dataTransfer = new DataTransfer();
    row.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer }));
    pane.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer, clientX: 620, clientY: 360 }));
    pane.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer, clientX: 620, clientY: 360 }));
  });
  await expect(nodes).toHaveCount(before + 1);
});

test("components palette can detach and dock without exposing ellipse controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Detached palettes are a desktop affordance.");
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await page.getByLabel("Open semantic components").click();
  const palette = page.getByRole("complementary", { name: "Semantic components" });
  await palette.getByRole("button", { name: "Detach components" }).click();
  await expect(palette).toHaveCSS("position", "fixed");
  await expect(palette.getByLabel("Move components palette")).toBeVisible();
  await palette.getByRole("button", { name: "Dock components" }).click();
  await expect(palette).toHaveCSS("position", "absolute");
  await expect(page.getByRole("button", { name: /Ellipse/i })).toHaveCount(0);
});

test("mobile components palette keeps the search and category hierarchy readable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This assertion targets the mobile full-height palette.");
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template" }).first().click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await page.getByLabel("Open semantic components").click();
  const palette = page.getByRole("complementary", { name: "Semantic components" });
  await expect(palette).toBeVisible();
  await expect(palette.getByRole("button", { name: /Filter AI \/ ML components/i })).toBeVisible();
  await palette.getByLabel("Search semantic components").fill("agent");
  await expect(palette.getByText("AI Agent", { exact: true })).toBeVisible();
});

test("desktop component nodes resize and connector handles create an edge", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Mobile intentionally supports light editing only.");
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });

  const service = page.locator('[data-id="saas-service"]');
  await service.click();
  const beforeResize = await service.boundingBox();
  const resizeHandle = service.locator(".react-flow__resize-control.handle").last();
  await expect(resizeHandle).toBeVisible();
  const resizeBox = await resizeHandle.boundingBox();
  expect(beforeResize).not.toBeNull();
  expect(resizeBox).not.toBeNull();
  if (!beforeResize || !resizeBox) return;
  await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizeBox.x + 96, resizeBox.y + 44);
  await page.mouse.up();
  await expect.poll(async () => (await service.boundingBox())?.width ?? 0).toBeGreaterThan(beforeResize.width + 40);

  await page.getByRole("button", { name: /Arrow \(A\)/i }).click();
  const source = page.locator('.react-flow__handle.source[data-nodeid="saas-service"]');
  const target = page.locator('.react-flow__handle.target[data-nodeid="saas-queue"]');
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (!sourceBox || !targetBox) return;
  const edgesBefore = await page.locator(".react-flow__edge").count();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".react-flow__edge")).toHaveCount(edgesBefore + 1);
});

test("pointer selection moves nodes, supports multi-selection, and exposes persistent node styles", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop owns marquee selection and node styling.");
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });

  const pointer = page.getByRole("button", { name: "Pointer / select" });
  await pointer.click();
  const service = page.locator('[data-id="saas-service"]');
  const before = await service.boundingBox();
  expect(before).not.toBeNull();
  if (!before) return;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 70, before.y + before.height / 2 + 35, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await service.boundingBox())?.x ?? 0).toBeGreaterThan(before.x + 40);

  const gateway = page.locator('[data-id="saas-gateway"]');
  await service.click();
  await gateway.click({ modifiers: ["Shift"] });
  await expect(page.locator(".react-flow__node.selected")).toHaveCount(2);

  const selectedBefore = await Promise.all([service.boundingBox(), gateway.boundingBox()]);
  const dragFrom = selectedBefore[0];
  expect(dragFrom).not.toBeNull();
  if (!dragFrom) return;
  await page.mouse.move(dragFrom.x + dragFrom.width / 2, dragFrom.y + dragFrom.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragFrom.x + dragFrom.width / 2 + 55, dragFrom.y + dragFrom.height / 2 + 25, { steps: 8 });
  await page.mouse.up();
  const selectedAfter = await Promise.all([service.boundingBox(), gateway.boundingBox()]);
  expect((selectedAfter[0]?.x ?? 0) - (selectedBefore[0]?.x ?? 0)).toBeGreaterThan(30);
  expect((selectedAfter[1]?.x ?? 0) - (selectedBefore[1]?.x ?? 0)).toBeGreaterThan(30);

  await service.click();
  await page.getByRole("button", { name: "Edit node style" }).click();
  await page.getByLabel("Node style preset").selectOption("tinted");
  await page.getByLabel("Node corner radius").selectOption("24");
  await expect(service.locator('[data-variant="tinted"]')).toBeVisible();
  await expect(service.locator('[data-variant="tinted"]')).toHaveCSS("border-radius", "24px");

  await expect(page.getByText(/Snap to grid/i)).toHaveCount(0);
});

test("pointer drag creates an area selection across canvas nodes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop owns marquee selection.");
  await page.goto("/start?template=multi-tenant-saas");
  await page.getByRole("button", { name: /generate architecture/i }).click();
  await expect(page).toHaveURL(/\/draft\//, { timeout: 15_000 });
  await page.getByRole("button", { name: "Pointer / select" }).click();

  const pane = page.locator(".react-flow__pane");
  const paneBox = await pane.boundingBox();
  expect(paneBox).not.toBeNull();
  if (!paneBox) return;
  await page.mouse.move(paneBox.x + 90, paneBox.y + 90);
  await page.mouse.down();
  await page.mouse.move(paneBox.x + paneBox.width - 90, paneBox.y + paneBox.height - 170, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => page.locator(".react-flow__node.selected").count()).toBeGreaterThan(1);
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
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Sandbox" })).toBeVisible();
  } else {
    const primaryNavigation = page.getByRole("navigation", { name: "Primary" });
    await expect(primaryNavigation).toBeVisible();
    await expect(primaryNavigation.getByRole("link", { name: "Sandbox" })).toBeVisible();
  }
});
