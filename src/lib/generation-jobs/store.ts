import "server-only";

import { canonicalSha256 } from "@/lib/architecture-ir/snapshot";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "@/lib/server/http";
import type { RequestIdentity } from "@/lib/server/request-identity";
import type { GenerationJobRecord, GenerationMode } from "./schema";

function adminClient() {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new HttpError(503, "Durable generation storage is not configured.", { "retry-after": "30" });
  return admin;
}

export async function createGenerationJob(options: {
  identity: RequestIdentity;
  idempotencyKey: string;
  request: unknown;
  mode: GenerationMode;
}) {
  const admin = adminClient();
  const payload = { request: options.request, mode: options.mode };
  const checksum = await canonicalSha256(payload);
  const { data, error } = await admin.rpc("create_generation_job", {
    target_subject: options.identity.subjectKey,
    target_user: options.identity.userId,
    target_workspace: options.identity.workspaceId,
    idempotency: options.idempotencyKey,
    request_checksum: checksum,
    request_payload: payload,
    generation_mode: options.mode,
    cost_units: options.mode === "deterministic" ? 0 : 1,
    request_limit: options.identity.kind === "user" ? 20 : 5,
    window_seconds: 600,
    queue_limit: Number(process.env.GENERATION_QUEUE_CAPACITY ?? 100),
  });
  if (error?.code === "P0001") {
    const retry = error.message.match(/:(\d+)$/)?.[1] ?? "60";
    throw new HttpError(429, error.message.includes("queue") ? "Generation capacity is full. Retry shortly." : "Generation rate limit reached.", { "retry-after": retry });
  }
  if (error?.code === "22023" && /Idempotency/.test(error.message)) throw new HttpError(409, "Idempotency key conflict.");
  if (error) throw new HttpError(500, "Generation job could not be created.");
  const row = data?.[0] as { job_id: string; job_status: string; job_progress: number; retry_after_seconds: number } | undefined;
  if (!row) throw new HttpError(500, "Generation job creation returned no job.");
  return row;
}

export async function readGenerationJob(jobId: string, subjectKey: string) {
  const { data, error } = await adminClient().from("generation_jobs").select("*").eq("id", jobId).eq("subject_key", subjectKey).maybeSingle();
  if (error || !data) throw new HttpError(404, "Generation job not found.");
  return data as GenerationJobRecord;
}

export async function readGenerationStages(jobId: string) {
  const { data, error } = await adminClient().from("generation_job_stages").select("stage,payload,checksum,completed_at").eq("job_id", jobId);
  if (error) throw new HttpError(500, "Generation checkpoints could not be read.");
  return new Map((data ?? []).map((row) => [row.stage as string, row.payload]));
}

export async function listQueuedGenerationJobs(limit = 3) {
  const boundedLimit = Math.max(1, Math.min(limit, 10));
  const { data, error } = await adminClient()
    .from("generation_jobs")
    .select("id,subject_key")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(boundedLimit);
  if (error) throw new HttpError(500, "Queued generation jobs could not be read.");
  return (data ?? []) as Array<{ id: string; subject_key: string }>;
}

export async function leaseGenerationJob(options: { jobId: string; subjectKey: string; workerId: string; provider: string }) {
  const { data, error } = await adminClient().rpc("lease_generation_job", {
    worker_id: options.workerId,
    target_job: options.jobId,
    target_subject: options.subjectKey,
    provider_name: options.provider,
    lease_seconds: 55,
    max_concurrency: Number(process.env.GENERATION_PROVIDER_CONCURRENCY ?? 4),
    max_cost_units: Number(process.env.GENERATION_PROVIDER_COST_CAPACITY ?? 100),
  });
  if (error) throw new HttpError(error.code === "22023" ? 422 : 500, "Generation job could not be leased.");
  return data?.[0] as { job_id: string; request_payload: unknown; generation_mode: GenerationMode; resume_stage: string; run_version: number; attempts: number } | undefined;
}

export async function checkpointGenerationJob(options: { workerId: string; jobId: string; runVersion: number; stage: string; progress: number; payload: unknown }) {
  const checksum = await canonicalSha256(options.payload);
  const { error } = await adminClient().rpc("checkpoint_generation_job", {
    worker_id: options.workerId,
    target_job: options.jobId,
    expected_run_version: options.runVersion,
    completed_stage: options.stage,
    completed_progress: options.progress,
    stage_payload: options.payload,
    stage_checksum: checksum,
  });
  if (error) throw new HttpError(error.code === "40001" ? 409 : 500, error.code === "40001" ? "Generation was cancelled or superseded." : "Generation checkpoint could not be saved.");
}

export async function completeGenerationJob(options: { workerId: string; jobId: string; runVersion: number; result: unknown }) {
  const checksum = await canonicalSha256(options.result);
  const { error } = await adminClient().rpc("complete_generation_job", { worker_id: options.workerId, target_job: options.jobId, expected_run_version: options.runVersion, result_payload: options.result, result_checksum: checksum });
  if (error) throw new HttpError(error.code === "40001" ? 409 : 500, error.code === "40001" ? "Generation was cancelled or superseded." : "Generation result could not be published.");
}

export async function failGenerationJob(options: { workerId: string; jobId: string; runVersion: number; errorClass: string; message: string }) {
  await adminClient().rpc("fail_generation_job", { worker_id: options.workerId, target_job: options.jobId, expected_run_version: options.runVersion, failure_class: options.errorClass, failure_message: options.message });
}

export async function cancelGenerationJob(jobId: string, subjectKey: string) {
  const { data, error } = await adminClient().rpc("cancel_generation_job", { target_job: jobId, target_subject: subjectKey });
  if (error) throw new HttpError(500, "Generation cancellation could not be recorded.");
  return Boolean(data);
}

export async function retryGenerationJob(jobId: string, subjectKey: string) {
  const { data, error } = await adminClient().rpc("retry_generation_job", { target_job: jobId, target_subject: subjectKey });
  if (error) throw new HttpError(500, "Generation retry could not be scheduled.");
  return Boolean(data);
}
