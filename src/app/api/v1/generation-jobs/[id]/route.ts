import { NextResponse } from "next/server";
import { z } from "zod";
import { publicGenerationJob } from "@/lib/generation-jobs/schema";
import { readGenerationJob } from "@/lib/generation-jobs/store";
import { apiError } from "@/lib/server/http";
import { resolveGenerationJobIdentity } from "@/lib/generation-jobs/identity";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const identity = await resolveGenerationJobIdentity();
    const job = await readGenerationJob(id, identity.subjectKey);
    return NextResponse.json({ job: publicGenerationJob(job) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
