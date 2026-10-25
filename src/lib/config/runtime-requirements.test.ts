import { describe, expect, it } from "vitest";
import { checkRuntimeConfig, describeConfigProblems } from "./runtime-requirements";

const secret = "x".repeat(32);
const complete = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  RATE_LIMIT_HMAC_SECRET: secret,
  GENERATION_RECEIPT_SECRET: secret,
  SHARE_TOKEN_PEPPER: secret,
};

describe("runtime configuration check", () => {
  it("accepts the minimum production set and reports the deterministic provider", () => {
    const report = checkRuntimeConfig(complete);
    expect(report.ok).toBe(true);
    expect(report.aiProvider).toBe("deterministic");
    expect(report.capabilities).toMatchObject({ guestAccess: true, accounts: true, shareLinks: true, liveAI: false, generationWorker: false });
  });

  it("reproduces the live outage: no secrets means no guest access", () => {
    const report = checkRuntimeConfig({});
    expect(report.ok).toBe(false);
    expect(report.capabilities.guestAccess).toBe(false);
    expect(report.problems.map((problem) => problem.name)).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "RATE_LIMIT_HMAC_SECRET",
      "GENERATION_RECEIPT_SECRET",
      "SHARE_TOKEN_PEPPER",
    ]);
  });

  it("rejects short secrets and names them without exposing values", () => {
    const report = checkRuntimeConfig({ ...complete, RATE_LIMIT_HMAC_SECRET: "short-value" });
    expect(report.problems).toEqual([{ name: "RATE_LIMIT_HMAC_SECRET", reason: "too-short", capabilities: ["guestAccess"] }]);
    const description = describeConfigProblems(report.problems);
    expect(description).toContain("RATE_LIMIT_HMAC_SECRET must be at least 32 characters");
    expect(description).not.toContain("short-value");
  });

  it("requires worker secrets only once a worker is enabled", () => {
    expect(checkRuntimeConfig({ ...complete, GENERATION_WORKER_ENABLED: "false" }).ok).toBe(true);
    const enabled = checkRuntimeConfig({ ...complete, GENERATION_WORKER_ENABLED: "true", ARCHIVE_MAINTENANCE_ENABLED: "true" });
    expect(enabled.problems.map((problem) => problem.name)).toEqual(["GENERATION_WORKER_SECRET", "ARCHIVE_WORKER_SECRET", "RESEND_API_KEY", "ARCHIVE_NOTICE_FROM_EMAIL"]);
    expect(enabled.capabilities.generationWorker).toBe(false);
  });
});
