import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { compilePromptToGraph } from "@/lib/runtime/compiler";

type SessionUser = { id?: string };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to generate workflows." }, { status: 401 });
    }

    const { prompt, modelProviderId, modelId } = await req.json();
    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const result = await compilePromptToGraph(String(prompt), {
      userId: String((session.user as SessionUser).id || ""),
      modelProviderId,
      modelId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Architect Generation Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate architecture";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
