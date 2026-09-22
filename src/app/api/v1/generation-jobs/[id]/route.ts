import { NextResponse } from "next/server";
import { z } from "zod";
import { publicGenerationJob } from "@/lib/generation-jobs/schema";
import { readGenerationJob } from "@/lib/generation-jobs/store";
import { apiError } from "@/lib/server/http";
import { resolveRequestIdentity } from "@/lib/server/request-identity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const identity = await resolveRequestIdentity(request);
    const job = await readGenerationJob(id, identity.subjectKey);
    return NextResponse.json({ job: publicGenerationJob(job) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
