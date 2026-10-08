import "server-only";
import { z } from "zod";
import type { AIExecutionSummary } from "./errors";
import type { GenerationRequest } from "@/lib/domain/schema";
import { generateArchitecture, type GenerationContext } from "./generation";
import { aiTaskSchema, usageSchema, type AITask } from "./metadata";
import { getAIProvider, MockArchitectureProvider, type ArchitectureAIProvider, type AIUsage } from "./provider";

export const ROUTING_POLICY_VERSION = "1.0.0" as const;
export type RoutingMode = "auto" | "provider" | "deterministic";
export type RoutingOptions = {
  mode?: RoutingMode;
  /** Server-owned opt-in; never accepted from a prompt or browser payload. */
  fallback?: "none" | "deterministic";
  maxProviderCalls?: number;
  provider?: ArchitectureAIProvider;
  health?: ProviderHealth;
};

export class AIRouterBudgetError extends Error {
  readonly code = "router_budget_exhausted";
  constructor() { super("AI task exhausted its provider-call budget."); this.name = "AIRouterBudgetError"; }
}
export class AIProviderUnavailableError extends Error {
  readonly code = "provider_unavailable";
  constructor() { super("The selected AI provider is temporarily unavailable."); this.name = "AIProviderUnavailableError"; }
}
export class AIRouterConfigurationError extends Error {
  readonly code = "gateway_configuration";
  constructor() { super("Provider generation was requested but OPENAI_API_KEY is unavailable."); this.name = "AIRouterConfigurationError"; }
}

/** Shared by gateway and job admission: no separate feature-owned routing. */
export function resolveTaskRoute(task: AITask, options: { mode?: RoutingMode; templateId?: string; providerAvailable?: boolean } = {}) {
  aiTaskSchema.parse(task);
  z.enum(["auto", "provider", "deterministic"]).optional().parse(options.mode);
  if (task !== "architecture-synthesis") return { provider: "deterministic", reason: "deterministic-task" } as const;
  if (options.mode === "deterministic") return { provider: "deterministic", reason: "explicit-deterministic" } as const;
  if (options.mode === "provider") return { provider: "openai", reason: "explicit-provider" } as const;
  if (options.templateId) return { provider: "deterministic", reason: "trusted-template" } as const;
  if (options.providerAvailable ?? Boolean(process.env.OPENAI_API_KEY)) return { provider: "openai", reason: "configured-provider" } as const;
  return { provider: "deterministic", reason: "no-provider-configured" } as const;
}

/** Process-local outage hint only; O01 remains the authoritative shared limiter. */
export class ProviderHealth {
  private entries = new Map<string, { failures: number; until: number }>();
  constructor(private now = Date.now) {}
  available(key: string) {
    const entry = this.entries.get(key);
    if (!entry || !entry.until) return true;
    if (entry.until > this.now()) return false;
    this.entries.delete(key);
    return true;
  }
  success(key: string) { this.entries.delete(key); }
  failure(key: string) {
    if (!this.entries.has(key) && this.entries.size >= 32) this.entries.delete(this.entries.keys().next().value!);
    const failures = (this.entries.get(key)?.failures ?? 0) + 1;
    this.entries.set(key, { failures, until: failures >= 3 ? this.now() + 30_000 : 0 });
  }
}
const providerHealth = new ProviderHealth();

function transient(error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? error.status : undefined;
  return status === 429 || (typeof status === "number" && status >= 500 && status <= 599)
    || (error instanceof Error && ["APIConnectionError", "APIConnectionTimeoutError"].includes(error.name));
}

function retryDelay(signal?: AbortSignal) {
  signal?.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal?.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, 100);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function routeArchitectureSynthesis(request: GenerationRequest, context: GenerationContext, options: RoutingOptions = {}, reportExecution?: (summary: AIExecutionSummary) => void) {
  const mode = z.enum(["auto", "provider", "deterministic"]).parse(options.mode ?? "auto");
  const fallback = z.enum(["none", "deterministic"]).parse(options.fallback ?? "none");
  const limit = z.number().int().min(0).max(2).parse(options.maxProviderCalls ?? 2);
  const route = resolveTaskRoute("architecture-synthesis", { mode, templateId: options.provider ? undefined : request.templateId, providerAvailable: Boolean(options.provider || process.env.OPENAI_API_KEY) });
  const deterministic = new MockArchitectureProvider();
  const routing = { policyVersion: ROUTING_POLICY_VERSION, reason: route.reason as string, fallback: false, providerCalls: 0, usageComplete: true };
  let usage: AIUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };
  let failures = 0;
  let repairs = 0;
  let selected: ArchitectureAIProvider = deterministic;

  if (route.provider !== "deterministic") {
    if (!options.provider && !process.env.OPENAI_API_KEY) throw new AIRouterConfigurationError();
    selected = options.provider ?? await getAIProvider();
  }
  const primary = selected;
  const health = options.health ?? providerHealth;
  const healthKey = `${primary.id}:${primary.model}`;
  const mayFallback = mode === "auto" && fallback === "deterministic";

  async function invoke(method: "generate" | "repair", input: GenerationRequest, callContext: GenerationContext) {
    callContext.signal?.throwIfAborted();
    if (selected === deterministic) return deterministic.generate(input, callContext);
    if (routing.providerCalls >= limit) throw new AIRouterBudgetError();
    if (!health.available(healthKey)) {
      if (!mayFallback || method === "repair") throw new AIProviderUnavailableError();
      selected = deterministic;
      routing.fallback = true;
      routing.reason = "provider-circuit-open";
      return deterministic.generate(input, callContext);
    }
    routing.providerCalls++;
    // Publish before awaiting the provider, including timeout/cancellation races.
    reportExecution?.({ provider: primary.id, model: primary.model, promptVersion: context.promptVersion, attempts: routing.providerCalls });
    if (method === "repair") repairs++;
    try {
      const result = await primary[method](input, callContext);
      callContext.signal?.throwIfAborted();
      const metered = usageSchema.parse(result.usage);
      usage = {
        inputTokens: usage.inputTokens + metered.inputTokens,
        outputTokens: usage.outputTokens + metered.outputTokens,
        totalTokens: usage.totalTokens + metered.totalTokens,
        estimatedCostUsd: usage.estimatedCostUsd === null || metered.estimatedCostUsd === null ? null : usage.estimatedCostUsd + metered.estimatedCostUsd,
      };
      health.success(healthKey);
      return result;
    } catch (error) {
      callContext.signal?.throwIfAborted();
      routing.usageComplete = false;
      usage.estimatedCostUsd = null;
      // Invalid schema/semantic output is repaired by generation, never hidden
      // by a deterministic fallback or counted as a provider outage.
      if (!transient(error)) throw error;
      failures++;
      health.failure(healthKey);
      const status = "status" in (error as object) ? (error as { status: number }).status : undefined;
      if (method === "generate" && status !== 429 && routing.providerCalls < limit) {
        await retryDelay(callContext.signal);
        return invoke(method, input, callContext);
      }
      if (!mayFallback || method === "repair") throw error;
      selected = deterministic;
      routing.fallback = true;
      routing.reason = "provider-unavailable";
      return deterministic.generate(input, callContext);
    }
  }

  const provider: ArchitectureAIProvider = {
    get id() { return selected === deterministic ? "deterministic" : selected.id; },
    get model() { return selected.model; },
    generate: (input, callContext) => invoke("generate", input, callContext),
    repair: (input, callContext) => invoke("repair", input, callContext),
  };
  const result = await generateArchitecture(request, { provider, requestId: context.requestId, contextPack: context.contextPack, signal: context.signal });
  return {
    ...result,
    attempts: Math.max(1, routing.providerCalls) as 1 | 2,
    successfulCalls: routing.providerCalls - failures - repairs,
    repairCalls: repairs,
    failedCalls: failures,
    usage,
    routing,
  };
}
