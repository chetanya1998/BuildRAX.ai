import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNodeDefinition } from "@/lib/graph/catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  const node = getNodeDefinition(type);
  if (!node) return NextResponse.json({ error: "Node type not found" }, { status: 404 });
  return NextResponse.json(node);
}
