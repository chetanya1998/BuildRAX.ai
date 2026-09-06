import { NextResponse } from "next/server";
import { architectureIRFromDiagram } from "@/lib/architecture-ir/snapshot";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { documentArchitectureIR } from "@/lib/ai/provider";
import { diagramSchema } from "@/lib/domain/schema";
import { architectureIRToMermaid, safeFilename } from "@/lib/domain/export";
import { apiError, readJson } from "@/lib/server/http";
import { z } from "zod";

const exportRequest = z.object({ diagram: diagramSchema, ir: architectureIRSchema.optional(), irVersion: z.number().int().min(1).optional(), format: z.enum(["json", "mermaid", "markdown"]) }).strict();

export async function POST(request: Request) {
  try {
    const { diagram, format, ...artifact } = exportRequest.parse(await readJson(request));
    const ir = artifact.ir ?? architectureIRFromDiagram(diagram);
    const irVersion = artifact.irVersion ?? 1;
    const content = format === "json" ? JSON.stringify(ir, null, 2) : format === "mermaid" ? architectureIRToMermaid(ir) : documentArchitectureIR(ir, irVersion, diagram.version);
    const extension = format === "markdown" ? "md" : format === "mermaid" ? "mmd" : "json";
    return NextResponse.json({ filename: safeFilename(ir.intent.title, extension), content, irVersion });
  } catch (error) { return apiError(error); }
}
