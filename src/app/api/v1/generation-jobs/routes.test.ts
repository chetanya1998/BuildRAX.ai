import { beforeEach, describe, expect, it, vi } from "vitest";

const jobs = vi.hoisted(() => ({
  resolveGenerationJobIdentity: vi.fn(),
  createGenerationJob: vi.fn(),
  readGenerationJob: vi.fn(),
  cancelGenerationJob: vi.fn(),
  retryGenerationJob: vi.fn(),
  processGenerationJob: vi.fn(),
}));
vi.mock("@/lib/generation-jobs/identity", () => ({ resolveGenerationJobIdentity: jobs.resolveGenerationJobIdentity }));
vi.mock("@/lib/generation-jobs/store", () => ({
  createGenerationJob: jobs.createGenerationJob,
  readGenerationJob: jobs.readGenerationJob,
  cancelGenerationJob: jobs.cancelGenerationJob,
  retryGenerationJob: jobs.retryGenerationJob,
}));
vi.mock("@/lib/generation-jobs/pipeline", () => ({ processGenerationJob: jobs.processGenerationJob }));

import { POST as createJob } from "./route";
import { GET as readJob } from "./[id]/route";
import { POST as cancelJob } from "./[id]/cancel/route";
import { POST as retryJob } from "./[id]/retry/route";

const jobId = "33333333-3333-4333-8333-333333333333";
const identity = { subjectKey: "a".repeat(64), userId: "11111111-1111-4111-8111-111111111111", workspaceId: null };
const params = { params: Promise.resolve({ id: jobId }) };
const record = {
  id: jobId,
  subject_key: identity.subjectKey,
  user_id: identity.userId,
  workspace_id: null,
  request_payload: { request: { prompt: "Build a durable architecture generation workflow." }, mode: "deterministic" },
  mode: "deterministic",
  status: "queued",
  current_stage: "accepted",
  progress: 0,
  run_version: 1,
  attempts: 0,
  cancel_requested: false,
  result_payload: null,
  error_class: null,
  error_message: null,
  created_at: "2026-09-21T00:00:00.000Z",
  updated_at: "2026-09-21T00:00:00.000Z",
  completed_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  jobs.resolveGenerationJobIdentity.mockResolvedValue(identity);
  jobs.readGenerationJob.mockResolvedValue(record);
});

describe("generation job routes", () => {
  it("validates creation before resolving identity", async () => {
    const response = await createJob(new Request("http://localhost/api/v1/generation-jobs", {
      method: "POST",
      body: JSON.stringify({ request: { prompt: "short" } }),
    }));
    expect(response.status).toBe(422);
    expect(jobs.resolveGenerationJobIdentity).not.toHaveBeenCalled();
  });

  it("creates an authenticated idempotent job", async () => {
    jobs.createGenerationJob.mockResolvedValue({ job_id: jobId, job_status: "queued", job_progress: 0 });
    const response = await createJob(new Request("http://localhost/api/v1/generation-jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        request: { prompt: "Build a durable architecture generation workflow." },
        mode: "deterministic",
      }),
    }));
    expect(response.status).toBe(202);
    expect(response.headers.get("location")).toBe(`/api/v1/generation-jobs/${jobId}`);
    expect(jobs.createGenerationJob).toHaveBeenCalledWith(expect.objectContaining({ identity, mode: "deterministic" }));
  });

  it("scopes status reads to the authenticated subject", async () => {
    const response = await readJob(new Request(`http://localhost/api/v1/generation-jobs/${jobId}`), params);
    expect(response.status).toBe(200);
    expect(jobs.readGenerationJob).toHaveBeenCalledWith(jobId, identity.subjectKey);
    expect((await response.json()).job).toMatchObject({ id: jobId, status: "queued", result: null });
  });

  it("does not expose internal failure details in the public job response", async () => {
    jobs.readGenerationJob.mockResolvedValue({
      ...record,
      status: "failed",
      error_class: "provider_failure",
      error_message: "internal upstream response with sensitive diagnostics",
    });
    const response = await readJob(new Request(`http://localhost/api/v1/generation-jobs/${jobId}`), params);
    const body = await response.json();
    expect(body.job.error).toEqual({ code: "provider_failure", message: "Generation failed. Retry from the last completed stage." });
    expect(JSON.stringify(body)).not.toContain("sensitive diagnostics");
  });

  it("returns a conflict when completed work cannot be cancelled or retried", async () => {
    jobs.cancelGenerationJob.mockResolvedValue(false);
    jobs.retryGenerationJob.mockResolvedValue(false);
    const cancelResponse = await cancelJob(new Request(`http://localhost/api/v1/generation-jobs/${jobId}/cancel`, { method: "POST" }), params);
    const retryResponse = await retryJob(new Request(`http://localhost/api/v1/generation-jobs/${jobId}/retry`, { method: "POST" }), params);
    expect(cancelResponse.status).toBe(409);
    expect(retryResponse.status).toBe(409);
  });
});
