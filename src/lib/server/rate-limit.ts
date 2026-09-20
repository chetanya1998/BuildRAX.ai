import { createHmac } from "node:crypto";
import { HttpError } from "./http";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveRequestIdentity } from "./request-identity";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function assertRateLimit(request: Request, scope: string, limit = 5, windowMs = 10 * 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const guest = request.headers.get("x-buildrax-anonymous-session") || "anonymous";
  const secret = process.env.RATE_LIMIT_HMAC_SECRET || "local-development-only";
  const key = createHmac("sha256", secret).update(`${scope}:${forwarded}:${guest}`).digest("hex");
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) throw new HttpError(429, "Rate limit reached. Try again later or sign in to continue.");
  bucket.count += 1;
}

export async function assertSharedRateLimit(request: Request, scope: string, options: { limit?: number; windowSeconds?: number; costUnits?: number; costLimit?: number; provider?: string } = {}) {
  const identity = await resolveRequestIdentity(request);
  const limit = options.limit ?? 5;
  const windowSeconds = options.windowSeconds ?? 600;
  const costUnits = options.costUnits ?? 0;
  const costLimit = options.costLimit ?? 1_000_000;
  const admin = createSupabaseAdminClient();
  if (admin) {
    const sharedScopes = [`route:${scope}:subject:${identity.subjectKey}`];
    if (identity.workspaceId) sharedScopes.push(`route:${scope}:workspace:${identity.workspaceId}`);
    if (options.provider) sharedScopes.push(`provider:${options.provider}`);
    let remaining = limit;
    let retryAfterSeconds = windowSeconds;
    let sharedAvailable = true;
    for (const targetScope of sharedScopes) {
      const { data, error } = await admin.rpc("consume_shared_rate_limit", {
        target_scope: targetScope,
        request_limit: limit,
        window_seconds: windowSeconds,
        requested_cost_units: costUnits,
        cost_limit: costLimit,
      });
      if (error) {
        if (process.env.NODE_ENV === "production") throw new HttpError(503, "Shared request protection is temporarily unavailable.", { "retry-after": "30" });
        sharedAvailable = false;
        break;
      }
      const admission = data?.[0] as { allowed: boolean; remaining: number; retry_after_seconds: number } | undefined;
      if (!admission?.allowed) {
        const retryAfter = admission?.retry_after_seconds ?? windowSeconds;
        throw new HttpError(429, "Rate limit reached. Try again later.", { "retry-after": String(retryAfter) });
      }
      remaining = Math.min(remaining, admission.remaining);
      retryAfterSeconds = Math.max(retryAfterSeconds, admission.retry_after_seconds);
    }
    if (sharedAvailable) return { identity, remaining, retryAfterSeconds };
  }

  // Tests and unconfigured local development retain a bounded fallback. Hosted
  // production fails closed above instead of silently becoming process-local.
  const synthetic = new Request(request.url, { headers: { "x-forwarded-for": identity.subjectKey, "x-buildrax-anonymous-session": identity.subjectKey } });
  assertRateLimit(synthetic, scope, limit, windowSeconds * 1_000);
  return { identity, remaining: Math.max(0, limit - 1), retryAfterSeconds: windowSeconds };
}
