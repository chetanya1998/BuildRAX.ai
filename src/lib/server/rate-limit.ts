import { createHmac } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HttpError } from "./http";
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

type SharedRateLimitOptions = {
  limit?: number;
  workspaceLimit?: number;
  windowSeconds?: number;
  costUnits?: number;
  costLimit?: number;
  provider?: string;
  providerLimit?: number;
};

function boundedInteger(value: number, fallback: number, minimum: number, maximum: number) {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : fallback;
}

export async function assertSharedRateLimit(request: Request, scope: string, options: SharedRateLimitOptions = {}) {
  const identity = await resolveRequestIdentity(request);
  const limit = boundedInteger(options.limit ?? 5, 5, 1, 100_000);
  const windowSeconds = boundedInteger(options.windowSeconds ?? 600, 600, 1, 86_400);
  const costUnits = boundedInteger(options.costUnits ?? 0, 0, 0, 1_000_000);
  const configuredCostLimit = Number(process.env.AI_PROVIDER_COST_LIMIT ?? 100);
  const costLimit = boundedInteger(options.costLimit ?? configuredCostLimit, 100, costUnits, 1_000_000_000);
  const scopes = [{ scope: `route:${scope}:subject:${identity.subjectKey}`, requestLimit: limit, costLimit }];
  if (identity.workspaceId) {
    scopes.push({
      scope: `route:${scope}:workspace:${identity.workspaceId}`,
      requestLimit: boundedInteger(options.workspaceLimit ?? limit * 10, limit * 10, 1, 100_000),
      costLimit,
    });
  }
  if (options.provider) {
    scopes.push({
      scope: `provider:${options.provider}`,
      requestLimit: boundedInteger(options.providerLimit ?? Number(process.env.AI_PROVIDER_REQUEST_LIMIT ?? 100), 100, 1, 100_000),
      costLimit,
    });
  }

  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("consume_shared_rate_limits", {
      scope_requests: scopes,
      window_seconds: windowSeconds,
      requested_cost_units: costUnits,
    });
    const admission = data?.[0] as { allowed: boolean; remaining: number; retry_after_seconds: number } | undefined;
    if (!error && admission) {
      if (!admission.allowed) {
        throw new HttpError(429, "Rate limit reached. Try again later.", {
          "retry-after": String(admission.retry_after_seconds),
        });
      }
      return { identity, remaining: admission.remaining, retryAfterSeconds: admission.retry_after_seconds };
    }
    if (process.env.NODE_ENV === "production") {
      throw new HttpError(503, "Shared request protection is temporarily unavailable.", { "retry-after": "30" });
    }
  } else if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "Shared request protection is not configured.", { "retry-after": "30" });
  }

  // Local development and tests retain a bounded fallback. Production never
  // silently degrades from shared storage to process-local counters.
  const synthetic = new Request(request.url, {
    headers: { "x-forwarded-for": identity.subjectKey, "x-buildrax-anonymous-session": identity.subjectKey },
  });
  assertRateLimit(synthetic, scope, limit, windowSeconds * 1_000);
  return { identity, remaining: Math.max(0, limit - 1), retryAfterSeconds: windowSeconds };
}
