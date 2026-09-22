import { NextResponse } from "next/server";
import { apiError, inputValidationError, readJson } from "@/lib/server/http";
import { resolveRequestIdentity } from "@/lib/server/request-identity";
import { createGenerationJobSchema } from "@/lib/generation-jobs/schema";
import { createGenerationJob } from "@/lib/generation-jobs/store";

export async function POST(request: Request) {
  try {
    const raw = await readJson(request);
    const parsed = createGenerationJobSchema.safeParse(raw);
    if (!parsed.success) return inputValidationError(parsed.error);
    const identity = await resolveRequestIdentity(request);
    const job = await createGenerationJob({ identity, idempotencyKey: parsed.data.idempotencyKey, request: parsed.data.request, mode: parsed.data.mode });
    return NextResponse.json({ job: { id: job.job_id, status: job.job_status, stage: "accepted", progress: job.job_progress } }, {
      status: job.job_status === "completed" ? 200 : 202,
      headers: { "cache-control": "no-store", location: `/api/v1/generation-jobs/${job.job_id}` },
    });
  } catch (error) { return apiError(error); }
}
