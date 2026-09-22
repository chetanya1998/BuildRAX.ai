import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({ admin: vi.fn(), rpc: vi.fn(), resolveRequestIdentity: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: dependencies.admin }));
vi.mock("./request-identity", () => ({ resolveRequestIdentity: dependencies.resolveRequestIdentity }));

import { assertSharedRateLimit } from "./rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.admin.mockReturnValue({ rpc: dependencies.rpc });
  dependencies.resolveRequestIdentity.mockResolvedValue({
    kind: "user",
    subjectKey: "a".repeat(64),
    userId: "11111111-1111-4111-8111-111111111111",
    workspaceId: "22222222-2222-4222-8222-222222222222",
  });
  dependencies.rpc.mockResolvedValue({ data: [{ allowed: true, remaining: 4, retry_after_seconds: 60 }], error: null });
});

afterEach(() => vi.unstubAllEnvs());

describe("shared rate limits", () => {
  it("meters subject, workspace, and provider scopes in one atomic call", async () => {
    await assertSharedRateLimit(new Request("http://localhost/api/test"), "generation", {
      limit: 5, workspaceLimit: 50, windowSeconds: 60, costUnits: 2, costLimit: 100, provider: "openai", providerLimit: 80,
    });

    expect(dependencies.rpc).toHaveBeenCalledOnce();
    expect(dependencies.rpc).toHaveBeenCalledWith("consume_shared_rate_limits", {
      scope_requests: [
        { scope: `route:generation:subject:${"a".repeat(64)}`, requestLimit: 5, costLimit: 100 },
        { scope: "route:generation:workspace:22222222-2222-4222-8222-222222222222", requestLimit: 50, costLimit: 100 },
        { scope: "provider:openai", requestLimit: 80, costLimit: 100 },
      ],
      window_seconds: 60,
      requested_cost_units: 2,
    });
  });

  it("returns Retry-After when any shared scope is exhausted", async () => {
    dependencies.rpc.mockResolvedValue({ data: [{ allowed: false, remaining: 0, retry_after_seconds: 17 }], error: null });
    await expect(assertSharedRateLimit(new Request("http://localhost/api/test"), "generation"))
      .rejects.toMatchObject({ status: 429, headers: { "retry-after": "17" } });
  });

  it("fails closed in production when shared storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    dependencies.rpc.mockResolvedValue({ data: null, error: { code: "database-unavailable" } });
    await expect(assertSharedRateLimit(new Request("http://localhost/api/test"), "generation"))
      .rejects.toMatchObject({ status: 503, headers: { "retry-after": "30" } });
  });
});
