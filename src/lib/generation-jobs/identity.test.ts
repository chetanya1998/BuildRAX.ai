import { beforeEach, describe, expect, it, vi } from "vitest";

const supabase = vi.hoisted(() => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: supabase.createSupabaseServerClient }));

import { resolveGenerationJobIdentity } from "./identity";

function client(user: { id: string } | null, membership: { workspace_id: string } | null = null) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: membership, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(query),
  };
}

beforeEach(() => vi.clearAllMocks());

describe("generation job identity", () => {
  it("requires configured authentication", async () => {
    supabase.createSupabaseServerClient.mockResolvedValue(null);
    await expect(resolveGenerationJobIdentity()).rejects.toMatchObject({ status: 503 });
  });

  it("rejects anonymous job access", async () => {
    supabase.createSupabaseServerClient.mockResolvedValue(client(null));
    await expect(resolveGenerationJobIdentity()).rejects.toMatchObject({ status: 401 });
  });

  it("binds an authenticated user to a stable privacy-safe subject", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const workspaceId = "22222222-2222-4222-8222-222222222222";
    supabase.createSupabaseServerClient.mockResolvedValue(client({ id: userId }, { workspace_id: workspaceId }));

    const identity = await resolveGenerationJobIdentity();

    expect(identity).toMatchObject({ userId, workspaceId });
    expect(identity.subjectKey).toMatch(/^[a-f0-9]{64}$/);
    await expect(resolveGenerationJobIdentity()).resolves.toEqual(identity);
  });
});
