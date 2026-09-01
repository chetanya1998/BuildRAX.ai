import { NextResponse } from "next/server";
import { documentDiagram } from "@/lib/ai/provider";
import { diagramSchema } from "@/lib/domain/schema";
import { safeFilename, toMermaid } from "@/lib/domain/export";
import { apiError, readJson } from "@/lib/server/http";
import { z } from "zod";

const exportRequest = z.object({ diagram: diagramSchema, format: z.enum(["json", "mermaid", "markdown"]) }).strict();

export async function POST(request: Request) {
  try {
    const { diagram, format } = exportRequest.parse(await readJson(request));
    const content = format === "json" ? JSON.stringify(diagram, null, 2) : format === "mermaid" ? toMermaid(diagram) : documentDiagram(diagram);
    const extension = format === "markdown" ? "md" : format === "mermaid" ? "mmd" : "json";
    return NextResponse.json({ filename: safeFilename(diagram.title, extension), content });
  } catch (error) { return apiError(error); }
}
