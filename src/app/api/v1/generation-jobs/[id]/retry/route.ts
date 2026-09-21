import { NextResponse } from "next/server";
import { z } from "zod";
import { retryGenerationJob } from "@/lib/generation-jobs/store";
import { apiError, HttpError } from "@/lib/server/http";
import { resolveGenerationJobIdentity } from "@/lib/generation-jobs/identity";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const identity = await resolveGenerationJobIdentity();
    if (!await retryGenerationJob(id, identity.subjectKey)) throw new HttpError(409, "Generation is not eligible for retry.");
    return NextResponse.json({ job: { id, status: "queued", stage: "accepted" } }, { status: 202, headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
