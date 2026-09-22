import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HttpError } from "./http";

export const GUEST_IDENTITY_COOKIE = "buildrax-guest-identity";
const DEFAULT_GUEST_TTL_MS = 24 * 60 * 60_000;
const MAX_GUEST_TTL_MS = 7 * 24 * 60 * 60_000;
const guestPayloadSchema = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  expiresAt: z.number().int().positive(),
}).strict();

export type RequestIdentity = {
  kind: "user" | "guest";
  subjectKey: string;
  userId: string | null;
  workspaceId: string | null;
};

function identitySecret() {
  const configured = process.env.RATE_LIMIT_HMAC_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "Request identity signing is not configured.", { "retry-after": "30" });
  }
  return "buildrax-local-request-identity-secret";
}

function sign(value: string) {
  return createHmac("sha256", identitySecret()).update(value).digest("base64url");
}

export function issueGuestIdentity(ttlMs = DEFAULT_GUEST_TTL_MS) {
  const boundedTtl = Math.max(60_000, Math.min(ttlMs, MAX_GUEST_TTL_MS));
  const expiresAt = Date.now() + boundedTtl;
  const encoded = Buffer.from(JSON.stringify({ version: 1, id: randomUUID(), expiresAt })).toString("base64url");
  return { token: `${encoded}.${sign(encoded)}`, expiresAt };
}

export function verifyGuestIdentity(token: string) {
  const [encoded, provided, extra] = token.split(".");
  if (!encoded || !provided || extra || token.length > 1_000) throw new HttpError(401, "Guest session is invalid.");
  const expected = sign(encoded);
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  if (providedBytes.length !== expectedBytes.length || !timingSafeEqual(providedBytes, expectedBytes)) {
    throw new HttpError(401, "Guest session is invalid.");
  }
  let payload: z.infer<typeof guestPayloadSchema>;
  try {
    payload = guestPayloadSchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
  } catch {
    throw new HttpError(401, "Guest session is invalid.");
  }
  if (payload.expiresAt <= Date.now()) throw new HttpError(401, "Guest session expired.");
  return payload;
}

function cookieValue(request: Request, name: string) {
  const encodedName = `${name}=`;
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const candidate = part.trim();
    if (candidate.startsWith(encodedName)) {
      try { return decodeURIComponent(candidate.slice(encodedName.length)); }
      catch { return null; }
    }
  }
  return null;
}

function userSubjectKey(userId: string) {
  // Keep B07 subject keys stable so in-flight authenticated jobs remain readable.
  return createHash("sha256").update(`user:${userId}`).digest("hex");
}

function guestSubjectKey(guestId: string) {
  return createHmac("sha256", identitySecret()).update(`guest:${guestId}`).digest("hex");
}

export async function resolveRequestIdentity(request: Request): Promise<RequestIdentity> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new HttpError(503, "Request identity could not be verified.", { "retry-after": "30" });
    if (user) {
      const { data: membership, error } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .in("role", ["owner", "editor"])
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw new HttpError(503, "Workspace membership could not be resolved.", { "retry-after": "30" });
      return { kind: "user", subjectKey: userSubjectKey(user.id), userId: user.id, workspaceId: membership?.workspace_id ?? null };
    }
  }

  const token = request.headers.get("x-buildrax-guest-token") ?? cookieValue(request, GUEST_IDENTITY_COOKIE);
  if (token) {
    const guest = verifyGuestIdentity(token);
    return { kind: "guest", subjectKey: guestSubjectKey(guest.id), userId: null, workspaceId: null };
  }

  const legacyGuest = request.headers.get("x-buildrax-anonymous-session");
  if (process.env.NODE_ENV !== "production" && legacyGuest) {
    return { kind: "guest", subjectKey: guestSubjectKey(legacyGuest.slice(0, 200)), userId: null, workspaceId: null };
  }
  throw new HttpError(401, "A signed guest session or authenticated account is required.");
}
