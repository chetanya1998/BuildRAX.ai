import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({ rpc: vi.fn(), resolveRequestIdentity: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({ rpc: dependencies.rpc }) }));
vi.mock("./request-identity", () => ({ resolveRequestIdentity: dependencies.resolveRequestIdentity }));

import { HttpError } from "./http";
import { assertSharedRateLimit } from "./rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.resolveRequestIdentity.mockResolvedValue({ kind: "user", subjectKey: "a".repeat(64), userId: "11111111-1111-4111-8111-111111111111", workspaceId: "22222222-2222-4222-8222-222222222222" });
  dependencies.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 4, retry_after_seconds: 60 }], error: null });
});

afterEach(() => vi.unstubAllEnvs());

describe("shared rate limits", () => {
  it("meters route subject, workspace, and provider scopes in shared storage", async () => {
    await assertSharedRateLimit(new Request("http://localhost/api/test"), "generation", { limit: 5, windowSeconds: 60, costUnits: 2, costLimit: 100, provider: "openai" });

    expect(dependencies.rpc.mock.calls.map(([, input]) => input.target_scope)).toEqual([
      `route:generation:subject:${"a".repeat(64)}`,
      "route:generation:workspace:22222222-2222-4222-8222-222222222222",
      "provider:openai",
    ]);
  });

  it("returns Retry-After when any shared scope is exhausted", async () => {
    dependencies.rpc.mockResolvedValue({ data: [{ allowed: false, remaining: 0, retry_after_seconds: 17 }], error: null });
    try {
      await assertSharedRateLimit(new Request("http://localhost/api/test"), "generation");
      throw new Error("expected rate limit rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(429);
      expect((error as HttpError).headers).toEqual({ "retry-after": "17" });
    }
  });

  it("fails closed in production when shared storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    dependencies.rpc.mockResolvedValue({ data: null, error: { code: "database-unavailable" } });
    await expect(assertSharedRateLimit(new Request("http://localhost/api/test"), "generation")).rejects.toMatchObject({ status: 503 });
  });
});
