import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelGenerationJob } from "@/lib/generation-jobs/store";
import { apiError, HttpError } from "@/lib/server/http";
import { resolveRequestIdentity } from "@/lib/server/request-identity";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const identity = await resolveRequestIdentity(request);
    if (!await cancelGenerationJob(id, identity.subjectKey)) throw new HttpError(409, "Generation can no longer be cancelled.");
    return NextResponse.json({ job: { id, status: "cancelled" } }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
