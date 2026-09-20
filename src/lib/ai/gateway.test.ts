import { afterEach, describe, expect, it, vi } from "vitest";
import { buildArchitectureIR } from "@/lib/architecture-ir/compiler";
import type { ArchitectureAIProvider } from "./provider";
import { AIGatewayConfigurationError, AIGatewayTimeoutError, runArchitectureSynthesis, runExplanation, runRequirementExtraction, validateAIGatewayConfiguration } from "./gateway";

const request = { prompt: "Build a multi-tenant SaaS platform with background jobs." };

function provider(options: { delayMs?: number; invalid?: boolean } = {}): ArchitectureAIProvider {
  return {
    id: "fixture-provider",
    model: "fixture-model",
    async generate(input, context) {
      if (options.delayMs) await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, options.delayMs);
        context.signal?.addEventListener("abort", () => { clearTimeout(timer); reject(context.signal?.reason); }, { once: true });
      });
      const output = buildArchitectureIR(input);
      if (options.invalid) output.components[0].semanticType = "invalid";
      return { output, usage: { inputTokens: 11, outputTokens: 19, totalTokens: 30, estimatedCostUsd: null } };
    },
    async repair(input) {
      return { output: buildArchitectureIR(input), usage: { inputTokens: 7, outputTokens: 13, totalTokens: 20, estimatedCostUsd: null } };
    },
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("controlled AI gateway", () => {
  it("returns validated structured output with request, usage, and repair metadata", async () => {
    const result = await runArchitectureSynthesis(request, { provider: provider({ invalid: true }), requestId: "11111111-1111-4111-8111-111111111111" });
    expect(result.data.validation.valid).toBe(true);
    expect(result.meta).toMatchObject({ task: "architecture-synthesis", requestId: "11111111-1111-4111-8111-111111111111", provider: "fixture-provider", attempts: 2, repairCalls: 1 });
    expect(result.meta.usage.totalTokens).toBe(50);
  });

  it("cancels provider work at the configured timeout", async () => {
    await expect(runArchitectureSynthesis(request, { provider: provider({ delayMs: 2_000 }), timeoutMs: 1_000 })).rejects.toBeInstanceOf(AIGatewayTimeoutError);
  });

  it("keeps deterministic tasks provider-free", async () => {
    const requirements = await runRequirementExtraction(request);
    const explanation = await runExplanation(buildArchitectureIR(request));
    expect(requirements.meta.successfulCalls).toBe(0);
    expect(requirements.meta.usage.totalTokens).toBe(0);
    expect(explanation.data).toContain("components");
  });

  it("fails closed when production signing configuration is missing", () => {
    vi.stubEnv("RATE_LIMIT_HMAC_SECRET", "");
    vi.stubEnv("GENERATION_RECEIPT_SECRET", "");
    expect(() => validateAIGatewayConfiguration("production")).toThrow(AIGatewayConfigurationError);
  });
});
