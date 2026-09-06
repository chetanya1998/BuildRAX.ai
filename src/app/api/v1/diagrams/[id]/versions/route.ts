import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, HttpError } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  before: z.coerce.number().int().min(1).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const url = new URL(request.url);
    const query = querySchema.parse({ limit: url.searchParams.get("limit") ?? undefined, before: url.searchParams.get("before") ?? undefined });
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const { data, error } = await supabase.rpc("list_architecture_versions", {
      target_diagram: id,
      page_size: query.limit,
      before_version: query.before ?? null,
    });
    if (error?.code === "42501") throw new HttpError(403, "Diagram not found or access denied.");
    if (error) throw new HttpError(500, "Architecture history could not be loaded.");
    const versions = data ?? [];
    return NextResponse.json({
      versions,
      nextBefore: versions.length === query.limit ? versions.at(-1)?.version : null,
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
