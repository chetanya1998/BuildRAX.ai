import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { diagramSchema } from "@/lib/domain/schema";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const saveRequest = z.object({ baseVersion: z.number().int().min(1), diagram: diagramSchema }).strict();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = saveRequest.parse(await readJson(request));
    if (body.diagram.id !== id) throw new HttpError(422, "Diagram ID does not match the route.");
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const checksum = createHash("sha256").update(JSON.stringify(body.diagram)).digest("hex");
    const { data, error } = await supabase.rpc("save_diagram_version", { target_diagram: id, base_version: body.baseVersion, new_payload: body.diagram, new_checksum: checksum });
    if (error?.code === "40001") return NextResponse.json({ error: "Version conflict" }, { status: 409 });
    if (error) throw new HttpError(error.code === "42501" ? 403 : 500, "Diagram save failed.");
    return NextResponse.json({ saved: data });
  } catch (error) { return apiError(error); }
}
