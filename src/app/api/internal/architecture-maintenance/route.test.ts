import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseAdminClient } = vi.hoisted(() => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient }));

import { POST } from "./route";

const secret = "a-secure-archive-worker-secret-at-least-32-chars";

function request(value = secret) {
  return new Request("http://localhost/api/internal/architecture-maintenance", {
    method: "POST",
    headers: { authorization: `Bearer ${value}`, "x-request-id": "maintenance-test" },
  });
}

function adminWith(rpc: (name: string, input: unknown) => Promise<unknown>) {
  return { rpc, storage: { from: vi.fn() } };
}

describe("architecture maintenance worker", () => {
  beforeEach(() => {
    vi.stubEnv("ARCHIVE_WORKER_SECRET", secret);
    vi.stubEnv("RESEND_API_KEY", "resend-test-key");
    vi.stubEnv("ARCHIVE_NOTICE_FROM_EMAIL", "notices@example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    createSupabaseAdminClient.mockReset();
  });

  it("rejects an invalid worker secret before accessing privileged storage", async () => {
    const response = await POST(request("wrong-secret-with-enough-length-123456789"));
    expect(response.status).toBe(401);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("delivers generic owner notices idempotently and commits the leased job", async () => {
    const calls: string[] = [];
    const rpc = vi.fn(async (name: string) => {
      calls.push(name);
      if (name === "schedule_architecture_archives") return { data: [{ notifications_created: 1, jobs_created: 0 }], error: null };
      if (name === "lease_artifact_archive_jobs") return { data: [], error: null };
      if (name === "lease_notification_jobs") return { data: [{ job_id: "job-1", notification_id: "notice-1", recipient_email: "owner@example.com", notification_kind: "version-archive-warning" }], error: null };
      return { data: null, error: null };
    });
    createSupabaseAdminClient.mockReturnValue(adminWith(rpc));
    const provider = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "email-1" }), { status: 200 }));

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ archived: 0, delivered: 1, deliveryFailures: 0, requestId: "maintenance-test" });
    expect(calls).toContain("complete_notification_job");
    expect(provider).toHaveBeenCalledOnce();
    const [, options] = provider.mock.calls[0];
    expect((options?.headers as Record<string, string>)["idempotency-key"]).toBe("buildrax-archive-notice-1");
    expect(String(options?.body)).not.toContain("diagram");
  });

  it("fails closed when notification jobs cannot be leased", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "schedule_architecture_archives") return { data: [{ notifications_created: 0, jobs_created: 0 }], error: null };
      if (name === "lease_artifact_archive_jobs") return { data: [], error: null };
      return { data: null, error: { code: "XX000" } };
    });
    createSupabaseAdminClient.mockReturnValue(adminWith(rpc));
    const provider = vi.spyOn(globalThis, "fetch");

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(provider).not.toHaveBeenCalled();
  });
});
