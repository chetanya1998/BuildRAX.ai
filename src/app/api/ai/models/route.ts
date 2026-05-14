import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_GEMMA_MODEL } from "@/lib/ai-providers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
