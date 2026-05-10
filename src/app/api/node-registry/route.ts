import { NextResponse } from "next/server";
import { FEATURE_FLAGS, NODE_DEFINITIONS, NODE_PACK_ORDER } from "@/lib/graph/catalog";

export async function GET() {
  return NextResponse.json({
    nodes: NODE_DEFINITIONS,
    packs: NODE_PACK_ORDER,
    featureFlags: FEATURE_FLAGS,
  });
}
