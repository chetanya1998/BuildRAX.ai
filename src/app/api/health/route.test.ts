import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const secret = "x".repeat(32);

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/health", () => {
  it("returns 503 with capabilities but no variable names when configuration is missing", async () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "");
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.capabilities.guestAccess).toBe(false);
    expect(JSON.stringify(body)).not.toContain("RATE_LIMIT_HMAC_SECRET");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 200 when the production set is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_example");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", secret);
    vi.stubEnv("GENERATION_RECEIPT_SECRET", secret);
    vi.stubEnv("SHARE_TOKEN_PEPPER", secret);
    vi.stubEnv("GENERATION_WORKER_ENABLED", "false");
    vi.stubEnv("ARCHIVE_MAINTENANCE_ENABLED", "false");
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("ok");
  });
});
