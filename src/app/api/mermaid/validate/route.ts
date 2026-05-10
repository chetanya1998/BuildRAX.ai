import { NextRequest, NextResponse } from "next/server";
import { validateMermaid } from "@/lib/backend/mermaid";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(validateMermaid(String(body.code || body.mermaid || "")));
}
