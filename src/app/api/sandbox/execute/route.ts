import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { runGraph } from "@/lib/runtime/engine";
import { checkGuestRateLimit, incrementGuestRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { graph, nodes, edges, modelProviderId, modelId, apiKey } = body;

    const userId = session.user.id;
    const isGuest = Boolean(session.user.email?.endsWith("@buildrax.sandbox"));
    const identifier = String(userId);

    if (isGuest) {
      const rateLimit = await checkGuestRateLimit(identifier);
      // If guest limit reached AND no custom API key provided, block
      if (rateLimit.isBlocked && !apiKey) {
        return NextResponse.json({
          error: "Daily guest limit reached. Please sign in or provide your own AI API key to continue.",
          remaining: 0,
          limit: rateLimit.limit
        }, { status: 429 });
      }
    }

    const result = await runGraph({
      graph: graph || { nodes, edges },
      mode: "live",
      userId,
      modelProviderId,
      modelId,
      apiKey: apiKey || undefined,
    });

    // Increment guest limit only if platform credits were used (no custom apiKey)
    if (isGuest && !apiKey && result.summary.status === "completed") {
      await incrementGuestRateLimit(identifier);
    }

    const postRunLimit = isGuest ? await checkGuestRateLimit(identifier) : null;

    return NextResponse.json({
      ...result,
      guestInfo: postRunLimit ? {
        remaining: postRunLimit.remaining,
        limit: postRunLimit.limit
      } : null
    });

  } catch (error: unknown) {
    console.error("Sandbox Execution Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to execute sandbox run" }, { status: 500 });
  }
}
