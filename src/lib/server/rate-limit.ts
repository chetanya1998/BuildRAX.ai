import { createHmac } from "node:crypto";
import { HttpError } from "./http";

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
