import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => vi.unstubAllEnvs());

describe("resumable generation pipeline", () => {
  it("runs every deterministic stage and records zero model usage", async () => {
    await processGenerationJob({ jobId, subjectKey });

    expect(store.leaseGenerationJob).toHaveBeenCalledWith(expect.objectContaining({ provider: "deterministic" }));
    expect(store.checkpointGenerationJob.mock.calls.map(([entry]) => entry.stage)).toEqual([
      "evidence", "requirements", "context", "rules", "synthesis", "validation", "layout",
    ]);
    const completed = store.completeGenerationJob.mock.calls[0][0].result;
    expect(completed.meta).toMatchObject({ provider: "deterministic", successfulCalls: 0, repairCalls: 0 });
    expect(completed.meta.usage.totalTokens).toBe(0);
    expect(completed.artifact.traceability.requirements.items.length).toBeGreaterThan(0);
    expect(completed.proposals.patterns).toEqual(expect.arrayContaining([expect.objectContaining({ patternId: "multi-tenant-saas" })]));
    expect(completed.proposals.rules).toHaveLength(8);
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

    expect(store.leaseGenerationJob).toHaveBeenCalledWith(expect.objectContaining({ provider: "openai" }));
    expect(store.failGenerationJob).toHaveBeenCalledWith(expect.objectContaining({ jobId, runVersion: 1, errorClass: "configuration" }));
  });

  it("does not duplicate work when another worker owns the lease", async () => {
    store.leaseGenerationJob.mockResolvedValue(undefined);

    const result = await processGenerationJob({ jobId, subjectKey });

    expect(result).toBe(baseJob);
    expect(store.readGenerationJob).toHaveBeenCalledTimes(2);
    expect(store.checkpointGenerationJob).not.toHaveBeenCalled();
    expect(store.completeGenerationJob).not.toHaveBeenCalled();
  });

  it("returns terminal jobs without attempting another lease", async () => {
    const completed = { ...baseJob, status: "completed" as const, progress: 100 };
    store.readGenerationJob.mockResolvedValue(completed);

    await expect(processGenerationJob({ jobId, subjectKey })).resolves.toBe(completed);
    expect(store.leaseGenerationJob).not.toHaveBeenCalled();
  });

  it("fails safely when a retained checkpoint is corrupt", async () => {
    store.readGenerationStages.mockResolvedValue(new Map([["evidence", { schemaVersion: "invalid" }]]));

    await expect(processGenerationJob({ jobId, subjectKey })).rejects.toMatchObject({ name: "ZodError" });
    expect(store.failGenerationJob).toHaveBeenCalledWith(expect.objectContaining({ jobId, runVersion: 1 }));
    expect(store.completeGenerationJob).not.toHaveBeenCalled();
  });

  it("rejects a forged retained rules checkpoint before synthesis", async () => {
    store.readGenerationStages.mockResolvedValue(new Map([["rules", {
      patterns: [{ patternId: "invented-pattern", score: -1, matchedTerms: [], explicit: false, conflicts: [] }],
      rules: [],
    }]]));

    await expect(processGenerationJob({ jobId, subjectKey })).rejects.toMatchObject({ name: "ZodError" });
    expect(store.failGenerationJob).toHaveBeenCalledWith(expect.objectContaining({ jobId, runVersion: 1 }));
    expect(store.completeGenerationJob).not.toHaveBeenCalled();
  });
});
