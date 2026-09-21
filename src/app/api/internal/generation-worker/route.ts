import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { processGenerationJob } from "@/lib/generation-jobs/pipeline";
import { listQueuedGenerationJobs } from "@/lib/generation-jobs/store";
import { apiError, HttpError } from "@/lib/server/http";

export const maxDuration = 60;

function authorize(request: Request) {
  const expected = process.env.GENERATION_WORKER_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || expected.length < 32 || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    throw new HttpError(401, "Generation worker authentication failed.");
  }
}

export async function POST(request: Request) {
  const suppliedRequestId = z.string().uuid().safeParse(request.headers.get("x-request-id"));
  const requestId = suppliedRequestId.success ? suppliedRequestId.data : crypto.randomUUID();
  try {
    authorize(request);
    const queued = await listQueuedGenerationJobs(2);
    let completed = 0;
    let deferred = 0;
    let failed = 0;
    for (const job of queued) {
      try {
        const result = await processGenerationJob({ jobId: job.id, subjectKey: job.subject_key });
        if (result.status === "completed") completed += 1;
        else deferred += 1;
      } catch (error) {
        failed += 1;
        console.error("[generation-worker] job failed", { requestId, jobId: job.id, errorClass: error instanceof Error ? error.name : "unknown" });
      }
    }
    return NextResponse.json({ claimed: queued.length, completed, deferred, failed, requestId }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
