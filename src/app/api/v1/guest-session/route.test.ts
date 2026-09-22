import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("guest session route", () => {
  it("sets an expiring HttpOnly signed identity cookie", async () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "a-high-entropy-request-identity-secret");
    const response = await POST(new Request("http://localhost/api/v1/guest-session", { method: "POST" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.expiresAt).toBeGreaterThan(Date.now());
    expect(response.headers.get("set-cookie")).toContain("buildrax-guest-identity=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
