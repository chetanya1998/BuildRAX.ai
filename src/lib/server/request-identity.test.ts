import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "./http";
import { issueGuestIdentity, verifyGuestIdentity } from "./request-identity";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("signed guest identity", () => {
  it("issues a verifiable, expiring guest token", () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "a-high-entropy-request-identity-secret");
    const issued = issueGuestIdentity(60_000);
    const verified = verifyGuestIdentity(issued.token);
    expect(verified.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(verified.expiresAt).toBe(issued.expiresAt);
  });

  it("rejects tampering without exposing the signing material", () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "a-high-entropy-request-identity-secret");
    const issued = issueGuestIdentity();
    expect(() => verifyGuestIdentity(`${issued.token.slice(0, -1)}x`)).toThrow(HttpError);
  });

  it("rejects an expired signed guest session", () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "a-high-entropy-request-identity-secret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T00:00:00Z"));
    const issued = issueGuestIdentity(1_000);
    vi.setSystemTime(new Date("2026-09-20T00:00:02Z"));
    expect(() => verifyGuestIdentity(issued.token)).toThrow("Guest session expired.");
  });
});
