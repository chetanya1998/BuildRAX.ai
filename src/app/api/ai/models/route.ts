import { NextResponse } from "next/server";
import { DEFAULT_GEMMA_MODEL } from "@/lib/ai-providers";

export async function GET() {
  return NextResponse.json({
    defaultModelId: DEFAULT_GEMMA_MODEL,
    recommended: [
      { provider: "openrouter", id: DEFAULT_GEMMA_MODEL, label: "Gemma 4 26B A4B" },
      { provider: "openrouter", id: "google/gemma-4-31b-it", label: "Gemma 4 31B" },
      { provider: "openrouter", id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B A4B Free" },
      { provider: "custom_openai", id: "gpt-4o", label: "GPT-4o" },
    ],
  });
}
