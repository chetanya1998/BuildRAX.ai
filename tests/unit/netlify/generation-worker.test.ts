import { afterEach, expect, it, vi } from "vitest";
import handler from "../../../netlify/functions/generation-worker";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("keeps scheduled generation disabled until deployment verification enables it", async () => {
  vi.stubEnv("GENERATION_WORKER_ENABLED", "false");
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  const response = await handler();

  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("invokes only the authenticated bounded worker endpoint after activation", async () => {
  vi.stubEnv("GENERATION_WORKER_ENABLED", "true");
  vi.stubEnv("URL", "https://staging.example.com");
  vi.stubEnv("GENERATION_WORKER_SECRET", "a-high-entropy-generation-worker-secret");
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"completed":1}', { status: 200, headers: { "content-type": "application/json" } }));

  const response = await handler();

  expect(response.status).toBe(200);
  expect(fetchSpy).toHaveBeenCalledOnce();
  expect(fetchSpy.mock.calls[0][0].toString()).toBe("https://staging.example.com/api/internal/generation-worker");
  expect((fetchSpy.mock.calls[0][1]?.headers as Record<string, string>).authorization).toBe("Bearer a-high-entropy-generation-worker-secret");
});
