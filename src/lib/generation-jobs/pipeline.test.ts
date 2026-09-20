import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  readGenerationJob: vi.fn(),
  readGenerationStages: vi.fn(),
  leaseGenerationJob: vi.fn(),
  checkpointGenerationJob: vi.fn(),
  completeGenerationJob: vi.fn(),
  failGenerationJob: vi.fn(),
}));

vi.mock("./store", () => store);

import { processGenerationJob } from "./pipeline";

const jobId = "33333333-3333-4333-8333-333333333333";
const subjectKey = "a".repeat(64);
const payload = { request: { prompt: "Build a multi-tenant support system with queued background jobs." }, mode: "deterministic" };
const baseJob = {
  id: jobId,
  subject_key: subjectKey,
  user_id: null,
  workspace_id: null,
  request_payload: payload,
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
  created_at: "2026-09-20T00:00:00.000Z",
  updated_at: "2026-09-20T00:00:00.000Z",
  completed_at: null,
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("OPENAI_API_KEY", "");
  store.readGenerationJob.mockResolvedValue(baseJob);
  store.readGenerationStages.mockResolvedValue(new Map());
  store.leaseGenerationJob.mockResolvedValue({ job_id: jobId, request_payload: payload, generation_mode: "deterministic", resume_stage: "accepted", run_version: 1, attempts: 1 });
  store.checkpointGenerationJob.mockResolvedValue(undefined);
  store.completeGenerationJob.mockResolvedValue(undefined);
  store.failGenerationJob.mockResolvedValue(undefined);
});

describe("resumable generation pipeline", () => {
  it("runs every deterministic stage, records explainability, and makes zero model calls", async () => {
    await processGenerationJob({ jobId, subjectKey });

    expect(store.checkpointGenerationJob.mock.calls.map(([entry]) => entry.stage)).toEqual([
      "evidence", "requirements", "context", "rules", "synthesis", "validation", "layout",
    ]);
    const completed = store.completeGenerationJob.mock.calls[0][0].result;
    expect(completed.meta).toMatchObject({ provider: "deterministic", successfulCalls: 0, repairCalls: 0 });
    expect(completed.meta.usage.totalTokens).toBe(0);
    expect(completed.summary.facts.length).toBeGreaterThan(0);
    expect(completed.summary.unknowns.length).toBeGreaterThan(0);
    expect(store.failGenerationJob).not.toHaveBeenCalled();
  });

  it("resumes from immutable checkpoints without repeating completed stages", async () => {
    const checkpoints = new Map<string, unknown>();
    store.checkpointGenerationJob.mockImplementation(async ({ stage, payload: stagePayload }: { stage: string; payload: unknown }) => { checkpoints.set(stage, stagePayload); });
    await processGenerationJob({ jobId, subjectKey });
    checkpoints.delete("validation");
    checkpoints.delete("layout");
    store.readGenerationStages.mockResolvedValue(checkpoints);
    store.checkpointGenerationJob.mockClear();

    await processGenerationJob({ jobId, subjectKey });

    expect(store.checkpointGenerationJob.mock.calls.map(([entry]) => entry.stage)).toEqual(["validation", "layout"]);
  });

  it("records an explicit provider-configuration failure instead of leaving the job queued", async () => {
    const providerPayload = { request: payload.request, mode: "provider" };
    store.readGenerationJob.mockResolvedValue({ ...baseJob, mode: "provider", request_payload: providerPayload });
    store.leaseGenerationJob.mockResolvedValue({ job_id: jobId, request_payload: providerPayload, generation_mode: "provider", resume_stage: "accepted", run_version: 1, attempts: 1 });

    await expect(processGenerationJob({ jobId, subjectKey })).rejects.toThrow("OPENAI_API_KEY");

    expect(store.failGenerationJob).toHaveBeenCalledWith(expect.objectContaining({ jobId, runVersion: 1, errorClass: "configuration" }));
  });
});
