import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateRequest = z.object({ read: z.boolean() }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await params).id);
    const input = updateRequest.parse(await readJson(request));
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new HttpError(401, "Authentication required.");
    const { data, error } = await supabase.from("user_notifications")
      .update({ read_at: input.read ? new Date().toISOString() : null })
      .eq("id", id).eq("user_id", user.id)
      .select("id, read_at").maybeSingle();
    if (error || !data) throw new HttpError(error?.code === "42501" ? 403 : 404, "Notification not found.");
    return NextResponse.json({ notification: data });
  } catch (error) { return apiError(error); }
}
