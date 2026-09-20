import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const worker = vi.hoisted(() => ({ listQueuedGenerationJobs: vi.fn(), processGenerationJob: vi.fn() }));
vi.mock("@/lib/generation-jobs/store", () => ({ listQueuedGenerationJobs: worker.listQueuedGenerationJobs }));
vi.mock("@/lib/generation-jobs/pipeline", () => ({ processGenerationJob: worker.processGenerationJob }));

import { POST } from "./route";

const secret = "a-high-entropy-generation-worker-secret";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GENERATION_WORKER_SECRET", secret);
});

afterEach(() => vi.unstubAllEnvs());

describe("internal generation worker", () => {
  it("rejects unauthenticated worker calls before reading the queue", async () => {
    const response = await POST(new Request("http://localhost/api/internal/generation-worker", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(worker.listQueuedGenerationJobs).not.toHaveBeenCalled();
  });

  it("processes a bounded queue batch and reports deferred capacity", async () => {
    worker.listQueuedGenerationJobs.mockResolvedValue([
      { id: "11111111-1111-4111-8111-111111111111", subject_key: "a".repeat(64) },
      { id: "22222222-2222-4222-8222-222222222222", subject_key: "b".repeat(64) },
    ]);
    worker.processGenerationJob
      .mockResolvedValueOnce({ status: "completed" })
      .mockResolvedValueOnce({ status: "queued" });

    const response = await POST(new Request("http://localhost/api/internal/generation-worker", {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    }));

    expect(response.status).toBe(200);
    expect(worker.listQueuedGenerationJobs).toHaveBeenCalledWith(2);
    expect(await response.json()).toMatchObject({ claimed: 2, completed: 1, deferred: 1, failed: 0 });
  });
});
