import { expect, type Page } from "@playwright/test";
import type { Diagram } from "../../src/lib/domain/schema";

/** Exercise the real legacy-to-current recovery path with a deterministic document. */
export async function openDiagramFixture(page: Page, diagram: Diagram) {
  await page.goto("/start");
  await page.evaluate(async (diagram) => {
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
        const tx = db.transaction("drafts", "readwrite");
        tx.objectStore("drafts").put({ id: diagram.id, diagram, status: "ready", createdAt: diagram.createdAt, updatedAt: diagram.updatedAt });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
    });
  }, diagram);
  await page.goto(`/draft/${diagram.id}`);
  await expect(page.getByLabel("Browser recovery status")).toHaveText("Saved locally");
}
