import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compilePromptToGraph } from "@/lib/runtime/compiler";
import { consumeCredits, CREDIT_POLICY } from "@/lib/credits";
import { TokenUsageRecord } from "@/lib/models/TokenUsageRecord";
import dbConnect from "@/lib/mongodb";

type SessionUser = { id?: string };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in with GitHub or Google to generate system architectures." },
        { status: 401 }
      );
    }

    const { prompt, modelProviderId, modelId } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const userId = String((session.user as SessionUser).id || "");

    await consumeCredits({
      userId,
      action: "prompt_compile",
      amount: CREDIT_POLICY.promptCompile,
      referenceType: "prompt_compile",
      metadata: { promptLength: String(prompt).length },
    });

    const result = await compilePromptToGraph(String(prompt), {
      userId,
      modelProviderId,
      modelId,
    });

    const usage = (result as {
      usage?: { totalTokens?: number; estimatedCost?: number };
    }).usage;

    await dbConnect();
    await TokenUsageRecord.create({
      userId,
      runType: "prompt_compile",
      tokenUsage:
        typeof usage?.totalTokens === "number"
          ? usage.totalTokens
          : Math.max(16, Math.ceil(String(prompt).length / 4)),
      cost:
        typeof usage?.estimatedCost === "number"
          ? usage.estimatedCost
          : 0,
      metadata: {
        promptPreview: String(prompt).slice(0, 160),
        suggestedScenarios: result.suggestedScenarios,
        modelProviderId,
        modelId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Prompt compile error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to compile prompt";
    const status = message === "Insufficient credits" ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
