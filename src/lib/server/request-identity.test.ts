import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabase = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: supabase.createSupabaseServerClient }));

import { GUEST_IDENTITY_COOKIE, issueGuestIdentity, resolveRequestIdentity, verifyGuestIdentity } from "./request-identity";

function authenticatedClient(userId: string, workspaceId: string | null = null) {
  const query = {
    select: vi.fn(), eq: vi.fn(), in: vi.fn(), order: vi.fn(), limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: workspaceId ? { workspace_id: workspaceId } : null, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) }, from: vi.fn().mockReturnValue(query) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "a-high-entropy-request-identity-secret");
  supabase.createSupabaseServerClient.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("signed request identity", () => {
  it("issues and resolves an expiring signed guest cookie", async () => {
    const issued = issueGuestIdentity(60_000);
    const verified = verifyGuestIdentity(issued.token);
    const identity = await resolveRequestIdentity(new Request("http://localhost", {
      headers: { cookie: `${GUEST_IDENTITY_COOKIE}=${encodeURIComponent(issued.token)}` },
    }));

    expect(verified.expiresAt).toBe(issued.expiresAt);
    expect(identity).toMatchObject({ kind: "guest", userId: null, workspaceId: null });
    expect(identity.subjectKey).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects tampering and expiry", () => {
    const issued = issueGuestIdentity(60_000);
    expect(() => verifyGuestIdentity(`${issued.token.slice(0, -1)}x`)).toThrow("Guest session is invalid.");

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-22T00:00:00Z"));
    const expiring = issueGuestIdentity(60_000);
    vi.setSystemTime(new Date("2026-09-22T00:01:01Z"));
    expect(() => verifyGuestIdentity(expiring.token)).toThrow("Guest session expired.");
  });

  it("prefers an authenticated account and preserves the B07 subject key", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const workspaceId = "22222222-2222-4222-8222-222222222222";
    supabase.createSupabaseServerClient.mockResolvedValue(authenticatedClient(userId, workspaceId));
    const guest = issueGuestIdentity();

    const identity = await resolveRequestIdentity(new Request("http://localhost", {
      headers: { "x-buildrax-guest-token": guest.token },
    }));

    expect(identity).toEqual({
      kind: "user",
      subjectKey: "ccc278c9b0d6c089b434f0d56eafcd46f5a119c1a80f35ebfb738a99f7feeb14",
      userId,
      workspaceId,
    });
  });

  it("fails closed without a signing secret in production", async () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    const request = new Request("http://localhost", { headers: { "x-buildrax-guest-token": "invalid.token" } });
    await expect(resolveRequestIdentity(request)).rejects.toMatchObject({ status: 503 });
  });
});
