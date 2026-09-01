import { NextResponse } from "next/server";
import { generationRequestSchema } from "@/lib/domain/schema";
import { getAIProvider } from "@/lib/ai/provider";
import { apiError, readJson } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const maxDuration = 55;

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    assertRateLimit(request, "generation");
    const input = generationRequestSchema.parse(await readJson(request));
    const provider = await getAIProvider();
    const diagram = await provider.generate(input);
    return NextResponse.json({ diagram, meta: { durationMs: Date.now() - startedAt, provider: process.env.OPENAI_API_KEY ? "openai" : "mock" } }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
