import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deleteUserProvider,
  listUserProviders,
  toPublicProvider,
  updateUserProvider,
} from "@/lib/ai-providers";

type SessionUser = { id?: string };

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to update AI providers." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const userId = String((session.user as SessionUser).id || "");

    await updateUserProvider(userId, id, body);
    const providers = await listUserProviders(userId);
    const provider = providers.find((entry) => entry.id === id);
    if (!provider) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 });
    }

    return NextResponse.json({ provider: toPublicProvider(provider) });
  } catch (error) {
    console.error("AI provider update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update provider";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to delete AI providers." }, { status: 401 });
    }

    const { id } = await params;
    const userId = String((session.user as SessionUser).id || "");
    await deleteUserProvider(userId, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("AI provider delete error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete provider";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
