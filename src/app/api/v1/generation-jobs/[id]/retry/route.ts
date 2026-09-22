import { NextResponse } from "next/server";
import { z } from "zod";
import { retryGenerationJob } from "@/lib/generation-jobs/store";
import { apiError, HttpError } from "@/lib/server/http";
import { resolveRequestIdentity } from "@/lib/server/request-identity";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const identity = await resolveRequestIdentity(request);
    if (!await retryGenerationJob(id, identity.subjectKey)) throw new HttpError(409, "Generation is not eligible for retry.");
    return NextResponse.json({ job: { id, status: "queued", stage: "accepted" } }, { status: 202, headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
