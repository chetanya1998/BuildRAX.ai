import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HttpError } from "./http";

const guestPayloadSchema = z.object({ id: z.string().uuid(), expiresAt: z.number().int().positive() }).strict();

export type RequestIdentity = {
  kind: "user" | "guest";
  subjectKey: string;
  userId: string | null;
  workspaceId: string | null;
};

function identitySecret() {
  const configured = process.env.RATE_LIMIT_HMAC_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") throw new HttpError(503, "Request identity signing is not configured.");
  return "buildrax-local-request-identity-secret";
}

function sign(value: string) {
  return createHmac("sha256", identitySecret()).update(value).digest("base64url");
}

export function issueGuestIdentity(ttlMs = 24 * 60 * 60_000) {
  const payload = Buffer.from(JSON.stringify({ id: crypto.randomUUID(), expiresAt: Date.now() + ttlMs })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt: JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).expiresAt as number };
}

export function verifyGuestIdentity(token: string) {
  const [encoded, provided, extra] = token.split(".");
  if (!encoded || !provided || extra) throw new HttpError(401, "Guest session is invalid.");
  const expected = sign(encoded);
  if (provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) throw new HttpError(401, "Guest session is invalid.");
  let payload: z.infer<typeof guestPayloadSchema>;
  try { payload = guestPayloadSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))); }
  catch { throw new HttpError(401, "Guest session is invalid."); }
  if (payload.expiresAt <= Date.now()) throw new HttpError(401, "Guest session expired.");
  return payload;
}

function subjectKey(kind: RequestIdentity["kind"], id: string) {
  return createHmac("sha256", identitySecret()).update(`${kind}:${id}`).digest("hex");
}

export async function resolveRequestIdentity(request: Request): Promise<RequestIdentity> {
  const token = request.headers.get("x-buildrax-guest-token");
  if (token) {
    const guest = verifyGuestIdentity(token);
    return { kind: "guest", subjectKey: subjectKey("guest", guest.id), userId: null, workspaceId: null };
  }

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: membership } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).in("role", ["owner", "editor"]).order("created_at").limit(1).maybeSingle();
      return { kind: "user", subjectKey: subjectKey("user", user.id), userId: user.id, workspaceId: membership?.workspace_id ?? null };
    }
  }

  const legacyGuest = request.headers.get("x-buildrax-anonymous-session");
  if (process.env.NODE_ENV !== "production" && legacyGuest) {
    return { kind: "guest", subjectKey: subjectKey("guest", legacyGuest.slice(0, 200)), userId: null, workspaceId: null };
  }
  throw new HttpError(401, "A signed guest session or authenticated account is required.");
}
