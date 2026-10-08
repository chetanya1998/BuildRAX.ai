import { afterEach, describe, expect, it, vi } from "vitest";
import { buildArchitectureIR } from "@/lib/architecture-ir/compiler";
import { aiTaskSchema, gatewayMetadataSchema } from "./metadata";
import { AIGatewayCancelledError, runArchitectureSynthesis, runExplanation } from "./gateway";
import { AIRouterBudgetError, AIProviderUnavailableError, ProviderHealth, resolveTaskRoute } from "./router";
import type { ArchitectureAIProvider } from "./provider";
import { getAIExecution } from "./errors";

const request = { prompt: "Build a multi-tenant SaaS application with background jobs." };
const unavailable = () => Object.assign(new Error("Service unavailable"), { status: 503 });
function fixture() {
  const output = () => ({ output: buildArchitectureIR(request), usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30, estimatedCostUsd: .01 } });
  const provider: ArchitectureAIProvider = { id: "fixture", model: "fixture-v1", generate: vi.fn(async () => output()), repair: vi.fn(async () => output()) };
  return { provider, output, health: new ProviderHealth() };
}
afterEach(() => vi.unstubAllEnvs());

describe("A01 task-aware routing", () => {
  it("retains attempted calls when a repair fails without changing the error", async () => {
    const options = fixture();
    const invalid = options.output();
    invalid.output.components[0].semanticType = "invalid";
    const failure = Object.assign(new Error("Unauthorized"), { status: 401 });
    vi.mocked(options.provider.generate).mockResolvedValueOnce(invalid);
    vi.mocked(options.provider.repair).mockRejectedValueOnce(failure);
    const error = await runArchitectureSynthesis(request, options).catch((error) => error);
    expect(error).toBe(failure);
    expect(getAIExecution(error)).toEqual({ provider: "fixture", model: "fixture-v1", attempts: 2, promptVersion: "architecture-v1" });
  });
  it("retains in-flight accounting when the gateway times out", async () => {
    vi.useFakeTimers();
    try {
      const options = fixture();
      vi.mocked(options.provider.generate).mockImplementation(() => new Promise(() => {}));
      const pending = runArchitectureSynthesis(request, { ...options, timeoutMs: 1000 }).catch((error) => error);
      await vi.advanceTimersByTimeAsync(1000);
      const error = await pending;
      expect(error.code).toBe("gateway_timeout");
      expect(getAIExecution(error)).toMatchObject({ attempts: 1, model: "fixture-v1" });
    } finally { vi.useRealTimers(); }
  });
  it("retains accounting through cancellation and does not invent a pre-call attempt", async () => {
    const options = fixture();
    const controller = new AbortController();
    vi.mocked(options.provider.generate).mockImplementation(async () => { controller.abort(); throw unavailable(); });
    const error = await runArchitectureSynthesis(request, { ...options, signal: controller.signal }).catch((error) => error);
    expect(error).toBeInstanceOf(AIGatewayCancelledError);
    expect(getAIExecution(error)).toMatchObject({ attempts: 1, model: "fixture-v1" });
    const beforeCall = await runArchitectureSynthesis(request, { ...fixture(), signal: AbortSignal.abort() }).catch((error) => error);
    expect(getAIExecution(beforeCall)).toBeUndefined();
  });
  it("assigns every supported task to a declared route", () => {
    for (const task of aiTaskSchema.options) {
      expect(resolveTaskRoute(task, { providerAvailable: true }).provider).toBe(task === "architecture-synthesis" ? "openai" : "deterministic");
    }
    expect(() => resolveTaskRoute("unknown" as never)).toThrow();
  });
  it("keeps explicit modes and trusted templates authoritative", () => {
    expect(resolveTaskRoute("architecture-synthesis", { mode: "provider", providerAvailable: false }).provider).toBe("openai");
    expect(resolveTaskRoute("architecture-synthesis", { mode: "deterministic", providerAvailable: true }).provider).toBe("deterministic");
    expect(resolveTaskRoute("architecture-synthesis", { templateId: "multi-tenant-saas", providerAvailable: true }).reason).toBe("trusted-template");
  });
  it("fails explicit provider mode when no provider is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    await expect(runArchitectureSynthesis(request, { mode: "provider", fallback: "deterministic" })).rejects.toThrow("OPENAI_API_KEY");
  });
  it("reports deterministic synthesis with zero provider calls", async () => {
    const { provider } = fixture();
    const result = await runArchitectureSynthesis(request, { mode: "deterministic", provider });
    expect(provider.generate).not.toHaveBeenCalled();
    expect(result.meta).toMatchObject({ provider: "deterministic", successfulCalls: 0, routing: { providerCalls: 0, fallback: false } });
    expect(result.meta.usage.totalTokens).toBe(0);
  });
  it("does not call providers for deterministic explanation tasks", async () => {
    const { provider } = fixture();
    const result = await runExplanation(buildArchitectureIR(request), { provider });
    expect(provider.generate).not.toHaveBeenCalled();
    expect(result.meta.routing?.reason).toBe("deterministic-task");
  });
  it("retries one transient failure and correlates actual attempts and usage", async () => {
    const options = fixture();
    vi.mocked(options.provider.generate).mockRejectedValueOnce(unavailable());
    const requestId = "11111111-1111-4111-8111-111111111111";
    const result = await runArchitectureSynthesis(request, { ...options, requestId });
    expect(options.provider.generate).toHaveBeenCalledTimes(2);
    expect(result.meta).toMatchObject({ requestId, attempts: 2, successfulCalls: 1, failedCalls: 1, repairCalls: 0, usage: { totalTokens: 30, estimatedCostUsd: null }, routing: { providerCalls: 2, usageComplete: false } });
    for (const [, context] of vi.mocked(options.provider.generate).mock.calls) expect(context.requestId).toBe(requestId);
  });
  it("shares the two-call ceiling across retries and semantic repairs", async () => {
    const options = fixture();
    const invalid = options.output();
    invalid.output.components[0].semanticType = "invalid";
    vi.mocked(options.provider.generate).mockRejectedValueOnce(unavailable()).mockResolvedValueOnce(invalid);
    await expect(runArchitectureSynthesis(request, options)).rejects.toBeInstanceOf(AIRouterBudgetError);
    expect(options.provider.generate).toHaveBeenCalledTimes(2);
    expect(options.provider.repair).not.toHaveBeenCalled();
  });
  it("checks a zero budget before any provider invocation", async () => {
    const options = fixture();
    await expect(runArchitectureSynthesis(request, { ...options, maxProviderCalls: 0 })).rejects.toBeInstanceOf(AIRouterBudgetError);
    expect(options.provider.generate).not.toHaveBeenCalled();
  });
  it("rejects invalid call budgets and does not spend them", async () => {
    for (const maxProviderCalls of [-1, 3, NaN, 1.5]) {
      const options = fixture();
      await expect(runArchitectureSynthesis(request, { ...options, maxProviderCalls })).rejects.toMatchObject({ name: "ZodError" });
      expect(options.provider.generate).not.toHaveBeenCalled();
    }
  });
  it("does not silently fall back after a provider outage", async () => {
    const options = fixture();
    vi.mocked(options.provider.generate).mockRejectedValue(unavailable());
    await expect(runArchitectureSynthesis(request, options)).rejects.toThrow("Service unavailable");
    expect(options.provider.generate).toHaveBeenCalledTimes(2);
  });
  it("records explicitly enabled deterministic fallback without claiming free provider calls", async () => {
    const options = fixture();
    vi.mocked(options.provider.generate).mockRejectedValue(unavailable());
    const result = await runArchitectureSynthesis(request, { ...options, fallback: "deterministic" });
    expect(result.data.validation.valid).toBe(true);
    expect(result.meta).toMatchObject({ provider: "deterministic", attempts: 2, successfulCalls: 0, failedCalls: 2, usage: { estimatedCostUsd: null }, routing: { fallback: true, reason: "provider-unavailable", usageComplete: false } });
  });
  it("never falls back for explicit provider mode, auth errors, or invalid output", async () => {
    const explicit = fixture();
    vi.mocked(explicit.provider.generate).mockRejectedValue(unavailable());
    await expect(runArchitectureSynthesis(request, { ...explicit, mode: "provider", fallback: "deterministic" })).rejects.toThrow();
    const auth = fixture();
    vi.mocked(auth.provider.generate).mockRejectedValue(Object.assign(new Error("Unauthorized"), { status: 401 }));
    await expect(runArchitectureSynthesis(request, { ...auth, fallback: "deterministic" })).rejects.toThrow("Unauthorized");
    expect(auth.provider.generate).toHaveBeenCalledTimes(1);
    const invalid = fixture();
    const result = invalid.output();
    result.output.components[0].semanticType = "invalid";
    vi.mocked(invalid.provider.generate).mockResolvedValue(result);
    vi.mocked(invalid.provider.repair).mockResolvedValue(result);
    await expect(runArchitectureSynthesis(request, { ...invalid, fallback: "deterministic" })).rejects.toMatchObject({ code: "semantic_validation_failed" });
    expect(invalid.provider.repair).toHaveBeenCalledTimes(1);
  });
  it("does not retry a rate-limit response immediately", async () => {
    const options = fixture();
    vi.mocked(options.provider.generate).mockRejectedValue(Object.assign(new Error("Rate limited"), { status: 429 }));
    await expect(runArchitectureSynthesis(request, options)).rejects.toThrow("Rate limited");
    expect(options.provider.generate).toHaveBeenCalledTimes(1);
  });
  it("checks cancellation before retry or fallback", async () => {
    const options = fixture();
    const controller = new AbortController();
    vi.mocked(options.provider.generate).mockImplementation(async () => { controller.abort(); throw unavailable(); });
    await expect(runArchitectureSynthesis(request, { ...options, signal: controller.signal, fallback: "deterministic" })).rejects.toBeInstanceOf(AIGatewayCancelledError);
    expect(options.provider.generate).toHaveBeenCalledTimes(1);
    expect(options.provider.repair).not.toHaveBeenCalled();
  });
  it("opens a bounded provider circuit and permits recovery after cooldown", async () => {
    let now = 0;
    const options = { ...fixture(), health: new ProviderHealth(() => now) };
    options.health.failure("fixture:fixture-v1");
    options.health.failure("fixture:fixture-v1");
    options.health.failure("fixture:fixture-v1");
    await expect(runArchitectureSynthesis(request, options)).rejects.toBeInstanceOf(AIProviderUnavailableError);
    expect(options.provider.generate).not.toHaveBeenCalled();
    const fallback = await runArchitectureSynthesis(request, { ...options, fallback: "deterministic" });
    expect(fallback.meta.routing).toMatchObject({ reason: "provider-circuit-open", providerCalls: 0, fallback: true });
    now = 30_001;
    await expect(runArchitectureSynthesis(request, options)).resolves.toMatchObject({ meta: { provider: "fixture" } });
    expect(options.provider.generate).toHaveBeenCalledTimes(1);
  });
  it("keeps old metadata valid but rejects inconsistent routing accounting", async () => {
    const result = await runArchitectureSynthesis(request, fixture());
    const legacy = { ...result.meta };
    delete legacy.routing;
    delete legacy.failedCalls;
    expect(gatewayMetadataSchema.safeParse(legacy).success).toBe(true);
    expect(gatewayMetadataSchema.safeParse({ ...result.meta, routing: { ...result.meta.routing, providerCalls: 2 } }).success).toBe(false);
  });
});
