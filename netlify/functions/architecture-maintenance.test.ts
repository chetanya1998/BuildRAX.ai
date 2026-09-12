import { afterEach, expect, it, vi } from "vitest";
import handler from "./architecture-maintenance";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("keeps scheduled maintenance disabled until release verification enables it", async () => {
  vi.stubEnv("ARCHIVE_MAINTENANCE_ENABLED", "false");
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  const response = await handler();

  expect(response.status).toBe(503);
  expect(await response.text()).toContain("disabled");
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("invokes only the authenticated internal endpoint after activation", async () => {
  vi.stubEnv("ARCHIVE_MAINTENANCE_ENABLED", "true");
  vi.stubEnv("URL", "https://staging.example.com");
  vi.stubEnv("ARCHIVE_WORKER_SECRET", "worker-secret");
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"ok":true}', { status: 200, headers: { "content-type": "application/json" } }));

  const response = await handler();

  expect(response.status).toBe(200);
  expect(fetchSpy).toHaveBeenCalledOnce();
  expect(fetchSpy.mock.calls[0][0].toString()).toBe("https://staging.example.com/api/internal/architecture-maintenance");
  expect((fetchSpy.mock.calls[0][1]?.headers as Record<string, string>).authorization).toBe("Bearer worker-secret");
});
