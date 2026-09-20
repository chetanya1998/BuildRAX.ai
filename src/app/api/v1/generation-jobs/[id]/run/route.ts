import { NextResponse } from "next/server";
import { z } from "zod";
import { processGenerationJob } from "@/lib/generation-jobs/pipeline";
import { publicGenerationJob } from "@/lib/generation-jobs/schema";
import { apiError } from "@/lib/server/http";
import { resolveRequestIdentity } from "@/lib/server/request-identity";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const identity = await resolveRequestIdentity(request);
    const job = await processGenerationJob({ jobId: id, subjectKey: identity.subjectKey });
    return NextResponse.json({ job: publicGenerationJob(job) }, { status: job.status === "completed" ? 200 : 202, headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
