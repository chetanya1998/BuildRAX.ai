import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserCreditBalance } from "@/lib/credits";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getUserCreditBalance((session.user as any).id);
    return NextResponse.json(balance);
  } catch (error) {
    console.error("Credit balance error:", error);
    return NextResponse.json({ error: "Failed to load credits" }, { status: 500 });
  }
}
