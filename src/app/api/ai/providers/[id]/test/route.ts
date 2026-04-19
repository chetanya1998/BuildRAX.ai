import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { testAIProvider } from "@/lib/litellm";
import { updateUserProvider } from "@/lib/ai-providers";

type SessionUser = { id?: string };

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to test AI providers." }, { status: 401 });
  }

  const { id } = await params;
  const userId = String((session.user as SessionUser).id || "");

  try {
    const result = await testAIProvider({
      userId,
      providerId: id,
    });

    await updateUserProvider(userId, id, {
      lastTestStatus: "passed",
      lastTestMessage: result.text.slice(0, 180),
      testReady: true,
    });

    return NextResponse.json({
      ok: true,
      message: result.text,
      usage: result.usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider test failed";
    await updateUserProvider(userId, id, {
      lastTestStatus: "failed",
      lastTestMessage: message,
      testReady: false,
    }).catch(() => undefined);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
