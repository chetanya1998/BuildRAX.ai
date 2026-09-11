import { test, expect, type Page } from "@playwright/test";
import { createDiagram } from "../../src/lib/domain/factory";
import { architectureIRFromDiagram, presentationFromDiagram } from "../../src/lib/architecture-ir/snapshot";

async function seedLegacy(page: Page) {
  const diagram = createDiagram("Recovery fixture");
  diagram.primitives.push({ id: "image-fixture", kind: "image", text: "", position: { x: 20, y: 20 }, dimensions: { width: 50, height: 50 }, style: { src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=" } });
  const architecture = { ir: architectureIRFromDiagram(diagram), presentation: presentationFromDiagram(diagram), irVersion: 1,
    generationReceipt: { requestId: crypto.randomUUID(), irChecksum: "a".repeat(64), diagramChecksum: "b".repeat(64), issuedAt: diagram.createdAt, signature: "a".repeat(43) } };
  await page.goto("/start");
  await page.evaluate(async ({ diagram, architecture }) => {
    localStorage.setItem(`buildrax-document:${diagram.id}`, "# Legacy notes\n\n![image](data:image/png;base64,fixture)");
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("buildrax-guest", 30);
      request.onupgradeneeded = () => {
        const drafts = request.result.createObjectStore("drafts", { keyPath: "id" });
        drafts.createIndex("updatedAt", "updatedAt"); drafts.createIndex("status", "status");
        const queue = request.result.createObjectStore("pendingProjectSaves", { keyPath: "diagramId" });
        queue.createIndex("queuedAt", "queuedAt");
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("drafts", "readwrite");
        transaction.objectStore("drafts").put({ id: diagram.id, diagram, architecture, prompt: "Original generation intent", status: "ready", createdAt: diagram.createdAt, updatedAt: diagram.updatedAt });
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, { diagram, architecture });
  await page.goto(`/draft/${diagram.id}`);
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");
  return diagram.id;
}

test("legacy canvas, images, generation origin and document recover after edits and an empty document stays empty", async ({ page, context }) => {
  const id = await seedLegacy(page);
  await page.getByLabel("Diagram title").fill("Edited offline fixture");
  await page.getByRole("button", { name: "Docs", exact: true }).click();
  await page.getByRole("button", { name: "Write document", exact: true }).click();
  await expect(page.getByLabel("Documentation editor")).toHaveValue(/Legacy notes/);
  await context.setOffline(true);
  await page.getByLabel("Documentation editor").fill("# New notes\n\nThe latest offline document.");
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByLabel("Diagram title")).toHaveValue("Edited offline fixture");
  await page.getByRole("button", { name: "Docs", exact: true }).click();
  await page.getByRole("button", { name: "Write document", exact: true }).click();
  await expect(page.getByLabel("Documentation editor")).toHaveValue(/latest offline document/);
  const stored = await page.evaluate(async (id) => {
    return new Promise<{ image: string; originalTitle: string; revision: number }>((resolve) => {
      const request = indexedDB.open("buildrax-guest");
      request.onsuccess = () => {
        const db = request.result;
        const get = db.transaction("drafts").objectStore("drafts").get(id);
        get.onsuccess = () => { resolve({ image: get.result.diagram.primitives[0].style.src, originalTitle: get.result.generationOrigin.diagram.title, revision: get.result.localRevision }); db.close(); };
      };
    });
  }, id);
  expect(stored.image).toContain("data:image/png");
  expect(stored.originalTitle).toBe("Recovery fixture");
  expect(stored.revision).toBeGreaterThan(0);
  await page.getByLabel("Documentation editor").fill("");
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");
  await page.reload();
  await page.getByRole("button", { name: "Docs", exact: true }).click();
  await page.getByRole("button", { name: "Write document", exact: true }).click();
  await expect(page.getByLabel("Documentation editor")).toHaveValue("");
});

test("a full browser store shows a persistent error and exports the latest in-memory work", async ({ page }, testInfo) => {
  await seedLegacy(page);
  const originalPut = await page.evaluateHandle(() => IDBObjectStore.prototype.put);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "drafts") throw new DOMException("Test quota failure", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await page.getByLabel("Diagram title").fill("Not yet stored");
  await expect(page.getByRole("alert").filter({ hasText: "Local recovery needs attention" })).toContainText("storage is full");
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Browser recovery failed");
  await page.screenshot({ path: testInfo.outputPath("quota-warning.png") });
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download recovery copy" }).click();
  const stream = await (await downloaded).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const recovery = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(recovery.diagram.title).toBe("Not yet stored");
  expect(recovery.document).toContain("Legacy notes");
  expect(recovery.generationOrigin.diagram.title).toBe("Recovery fixture");
  await page.evaluate((original) => { IDBObjectStore.prototype.put = original; }, originalPut);
  await page.getByRole("button", { name: "Retry local save" }).click();
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");
  await page.reload();
  await expect(page.getByLabel("Diagram title")).toHaveValue("Not yet stored");
});

test("a second tab cannot overwrite a newer locally confirmed canvas", async ({ page, context }) => {
  const id = await seedLegacy(page);
  const second = await context.newPage();
  await second.goto(`/draft/${id}`);
  await expect(second.getByLabel("Browser recovery status")).toHaveText("Saved locally");
  await page.getByLabel("Diagram title").fill("First tab wins");
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");
  await second.getByLabel("Diagram title").fill("Second tab must not overwrite");
  await expect(second.getByRole("alert").filter({ hasText: "Another tab updated" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Diagram title")).toHaveValue("First tab wins");
});

test("unavailable IndexedDB is an actionable error, not a never-ending loading screen", async ({ page }) => {
  await page.addInitScript(() => { indexedDB.open = () => { throw new DOMException("Test blocked storage", "SecurityError"); }; });
  await page.goto("/draft/blocked-storage-fixture");
  await expect(page.getByRole("alert").filter({ hasText: "Browser storage could not be read" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry opening draft" })).toBeVisible();
});
