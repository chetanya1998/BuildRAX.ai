import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { diagramSchema } from "@/lib/domain/schema";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const migrationRequest = z.object({ idempotencyKey: z.string().uuid(), diagram: diagramSchema }).strict();

export async function POST(request: Request) {
  try {
    const body = migrationRequest.parse(await readJson(request));
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new HttpError(401, "Authentication required.");
    const checksum = createHash("sha256").update(JSON.stringify(body.diagram)).digest("hex");
    const { data, error } = await supabase.rpc("migrate_guest_draft", { idempotency: body.idempotencyKey, draft_title: body.diagram.title, draft_payload: body.diagram, draft_checksum: checksum });
    if (error) throw new HttpError(error.code === "42501" ? 403 : 500, "Guest draft migration failed.");
    return NextResponse.json({ migration: data?.[0] });
  } catch (error) { return apiError(error); }
}
