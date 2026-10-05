import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildArchitectureIR } from "@/lib/architecture-ir/compiler";
import * as providers from "@/lib/ai/provider";
import { HttpError } from "@/lib/server/http";
import { recordGenerationRun } from "@/lib/server/ai-runs";

const admission = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server/rate-limit", () => ({ assertSharedRateLimit: admission }));
vi.mock("@/lib/server/ai-runs", () => ({ recordGenerationRun: vi.fn() }));
vi.mock("@/lib/server/generation-receipt", () => ({ createGenerationReceipt: vi.fn(() => ({ signature: "fixture" })) }));
import { POST } from "./route";

const input = { prompt: "Build a multi-tenant SaaS with background processing." };
function request(body: unknown) {
  return new Request("http://localhost/api/v1/ai/generations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.clearAllMocks(); admission.mockResolvedValue(undefined); vi.stubEnv("OPENAI_API_KEY", "fixture-no-network"); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("generation endpoint routing", () => {
  it("records both attempted calls when a transient retry also fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const generate = vi.fn().mockRejectedValue(Object.assign(new Error("Service unavailable"), { status: 503 }));
    vi.spyOn(providers, "getAIProvider").mockResolvedValue({ id: "openai", model: "retry-failure-fixture", generate, repair: generate });
    const response = await POST(request(input));
    expect(response.status).toBe(502);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(recordGenerationRun).toHaveBeenCalledWith(expect.objectContaining({ status: "failed", attempts: 2, model: "retry-failure-fixture" }));
  });
  it("uses provider-scoped admission and exposes actual routing metadata", async () => {
    const generate = vi.fn(async () => ({ output: buildArchitectureIR(input), usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30, estimatedCostUsd: null } }));
    vi.spyOn(providers, "getAIProvider").mockResolvedValue({ id: "openai", model: "fixture", generate, repair: generate });
    const response = await POST(request(input));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(admission).toHaveBeenCalledWith(expect.anything(), "generation", expect.objectContaining({ provider: "openai", costUnits: 1 }));
    expect(body.meta).toMatchObject({ provider: "openai", routing: { reason: "configured-provider", providerCalls: 1, fallback: false }, usage: { totalTokens: 30 } });
    expect(generate).toHaveBeenCalledTimes(1);
  });
  it("never loads a provider for a trusted template even when a key is configured", async () => {
    const factory = vi.spyOn(providers, "getAIProvider");
    const response = await POST(request({ ...input, templateId: "multi-tenant-saas" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(factory).not.toHaveBeenCalled();
    expect(admission).toHaveBeenCalledWith(expect.anything(), "generation", expect.objectContaining({ provider: undefined, costUnits: 0 }));
    expect(body.meta).toMatchObject({ provider: "deterministic", successfulCalls: 0, routing: { reason: "trusted-template", providerCalls: 0 } });
  });
  it("stops at shared admission rejection without loading a provider", async () => {
    const factory = vi.spyOn(providers, "getAIProvider");
    admission.mockRejectedValue(new HttpError(429, "Budget exhausted"));
    const response = await POST(request(input));
    expect(response.status).toBe(429);
    expect(factory).not.toHaveBeenCalled();
  });
});
