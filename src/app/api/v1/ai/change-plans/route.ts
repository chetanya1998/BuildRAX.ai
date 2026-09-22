import { NextResponse } from "next/server";
import { diagramSchema } from "@/lib/domain/schema";
import { runChangePlanning } from "@/lib/ai/gateway";
import { apiError, readJson } from "@/lib/server/http";
import { assertSharedRateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const requestSchema = z.object({ diagram: diagramSchema, command: z.string().trim().min(4).max(1000) }).strict();

export async function POST(request: Request) {
  try {
    const provider = process.env.OPENAI_API_KEY ? "openai" : "deterministic";
    await assertSharedRateLimit(request, "change-plan", { limit: 12, windowSeconds: 600, costUnits: provider === "openai" ? 1 : 0, provider: provider === "openai" ? provider : undefined });
    const input = requestSchema.parse(await readJson(request));
    const result = await runChangePlanning(input, { signal: request.signal });
    return NextResponse.json({ plan: result.data, meta: result.meta });
  } catch (error) { return apiError(error); }
}
