import { NextResponse } from "next/server";
import { reviewDiagram } from "@/lib/ai/provider";
import { diagramSchema } from "@/lib/domain/schema";
import { apiError, readJson } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "review", 12);
    const body = await readJson(request);
    const diagram = diagramSchema.parse(body.diagram);
    return NextResponse.json({ diagramVersion: diagram.version, advisory: true, findings: reviewDiagram(diagram) });
  } catch (error) { return apiError(error); }
}
