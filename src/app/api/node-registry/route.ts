import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FEATURE_FLAGS, NODE_DEFINITIONS, NODE_PACK_ORDER } from "@/lib/graph/catalog";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    nodes: NODE_DEFINITIONS,
    packs: NODE_PACK_ORDER,
    featureFlags: FEATURE_FLAGS,
  });
}
