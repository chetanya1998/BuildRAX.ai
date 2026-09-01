import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, HttpError, readJson } from "@/lib/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createRequest = z.object({ projectId: z.string().uuid(), expiresAt: z.string().datetime().optional() }).strict();

export async function POST(request: Request) {
  try {
    const body = createRequest.parse(await readJson(request));
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new HttpError(401, "Authentication required.");
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(`${token}:${process.env.SHARE_TOKEN_PEPPER || "local"}`).digest("hex");
    const { data, error } = await supabase.from("share_links").insert({ project_id: body.projectId, token_hash: tokenHash, expires_at: body.expiresAt, created_by: user.id }).select("id").single();
    if (error) throw new HttpError(403, "Share link creation was not authorized.");
    return NextResponse.json({ id: data.id, url: `/share/${token}` }, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const body = z.object({ id: z.string().uuid() }).strict().parse(await readJson(request));
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const { error } = await supabase.from("share_links").update({ revoked_at: new Date().toISOString() }).eq("id", body.id);
    if (error) throw new HttpError(403, "Share link revocation was not authorized.");
    return new NextResponse(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
