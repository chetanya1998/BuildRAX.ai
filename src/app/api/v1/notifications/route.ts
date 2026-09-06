import { NextResponse } from "next/server";
import { apiError, HttpError } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const querySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(25) });

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new HttpError(401, "Authentication required.");
    const url = new URL(request.url);
    const { limit } = querySchema.parse({ limit: url.searchParams.get("limit") ?? undefined });
    const { data, error } = await supabase.from("user_notifications")
      .select("id, kind, diagram_id, diagram_version, message, read_at, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
    if (error) throw new HttpError(500, "Notifications could not be loaded.");
    return NextResponse.json({ notifications: data ?? [] }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
