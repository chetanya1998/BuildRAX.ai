import { z } from "zod";
import { createNode } from "@/lib/domain/factory";
import { changePlanSchema, diagramSchema, generationRequestSchema } from "@/lib/domain/schema";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { buildInputTraceability } from "@/lib/intelligence/input";
import { compileContextPack, contextBlocksFromTraceability } from "@/lib/intelligence/context";
import { AIOutputError } from "./errors";
import { generateArchitecture, type GenerationResult } from "./generation";
import { documentArchitectureIR, reviewArchitectureIR, type ArchitectureAIProvider } from "./provider";

export const AI_GATEWAY_VERSION = "1.0.0" as const;

export const aiTaskSchema = z.enum([
  "requirement-extraction",
  "architecture-synthesis",
  "change-planning",
  "architecture-review",
  "documentation",
  "explanation",
]);
export type AITask = z.infer<typeof aiTaskSchema>;

const usageSchema = z.object({
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  estimatedCostUsd: z.number().min(0).nullable(),
}).strict();

export const gatewayMetadataSchema = z.object({
  gatewayVersion: z.literal(AI_GATEWAY_VERSION),
  requestId: z.string().uuid(),
  task: aiTaskSchema,
  provider: z.string().min(1).max(80),
  model: z.string().min(1).max(160),
  durationMs: z.number().int().min(0),
  attempts: z.number().int().min(1).max(2),
  successfulCalls: z.number().int().min(0).max(2),
  repairCalls: z.number().int().min(0).max(1),
  usage: usageSchema,
}).strict();

export type GatewayMetadata = z.infer<typeof gatewayMetadataSchema>;

export class AIGatewayTimeoutError extends Error {
  readonly code = "gateway_timeout" as const;
  constructor(public readonly timeoutMs: number) {
    super(`AI task exceeded its ${timeoutMs} ms time limit.`);
    this.name = "AIGatewayTimeoutError";
  }
}

export class AIGatewayConfigurationError extends Error {
  readonly code = "gateway_configuration" as const;
  constructor(message: string) {
    super(message);
    this.name = "AIGatewayConfigurationError";
  }
}

export function validateAIGatewayConfiguration(environment = process.env.NODE_ENV) {
  if (environment !== "production") return;
  const missing = ["RATE_LIMIT_HMAC_SECRET", "GENERATION_RECEIPT_SECRET"].filter((key) => !process.env[key] || process.env[key]!.length < 32);
  if (missing.length > 0) throw new AIGatewayConfigurationError(`Missing secure production configuration: ${missing.join(", ")}.`);
}

type ExecutionOptions = {
  requestId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  provider?: ArchitectureAIProvider;
};

const zeroUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };

async function executeTask<Input, Output>(options: ExecutionOptions & {
  task: AITask;
  input: unknown;
  inputSchema: z.ZodType<Input>;
  outputSchema: z.ZodType<Output>;
  runner: (input: Input, context: { requestId: string; signal: AbortSignal }) => Promise<{ output: Output; provider?: string; model?: string; attempts?: number; successfulCalls?: number; repairCalls?: number; usage?: z.infer<typeof usageSchema> }>;
}) {
  validateAIGatewayConfiguration();
  const input = options.inputSchema.parse(options.input);
  const requestId = options.requestId ?? crypto.randomUUID();
  const timeoutMs = Math.max(1_000, Math.min(options.timeoutMs ?? 25_000, 60_000));
  const controller = new AbortController();
  const onAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(new AIGatewayTimeoutError(timeoutMs)), timeoutMs);
  const startedAt = Date.now();
  try {
    if (options.signal?.aborted) controller.abort(options.signal.reason);
    const result = await options.runner(input, { requestId, signal: controller.signal });
    if (controller.signal.aborted) throw controller.signal.reason instanceof Error ? controller.signal.reason : new DOMException("Cancelled", "AbortError");
    const parsedOutput = options.outputSchema.safeParse(result.output);
    if (!parsedOutput.success) throw new AIOutputError("The task returned invalid structured output.");
    const meta = gatewayMetadataSchema.parse({
      gatewayVersion: AI_GATEWAY_VERSION,
      requestId,
      task: options.task,
      provider: result.provider ?? "deterministic",
      model: result.model ?? "buildrax-rules-v1",
      durationMs: Date.now() - startedAt,
      attempts: result.attempts ?? 1,
      successfulCalls: result.successfulCalls ?? 0,
      repairCalls: result.repairCalls ?? 0,
      usage: result.usage ?? zeroUsage,
    });
    return { data: parsedOutput.data, meta };
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason instanceof AIGatewayTimeoutError) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

export async function runArchitectureSynthesis(input: unknown, options: ExecutionOptions = {}) {
  return executeTask({
    ...options,
    task: "architecture-synthesis",
    input,
    inputSchema: generationRequestSchema,
    outputSchema: z.custom<GenerationResult>((value) => Boolean(value && typeof value === "object" && "artifact" in value && "validation" in value)),
    runner: async (request, context) => {
      const traceability = buildInputTraceability(request);
      const contextPack = compileContextPack({ task: "architecture-synthesis", blocks: contextBlocksFromTraceability(traceability) });
      const output = await generateArchitecture(request, { provider: options.provider, requestId: context.requestId, contextPack, signal: context.signal });
      return { output, provider: output.provider, model: output.model, attempts: output.attempts, successfulCalls: output.successfulCalls, repairCalls: output.repairCalls, usage: output.usage };
    },
  });
}

const changePlanningInputSchema = z.object({ diagram: diagramSchema, command: z.string().trim().min(4).max(1_000) }).strict();

export async function runChangePlanning(input: unknown, options: ExecutionOptions = {}) {
  return executeTask({
    ...options,
    task: "change-planning",
    input,
    inputSchema: changePlanningInputSchema,
    outputSchema: changePlanSchema,
    runner: async ({ diagram, command }) => {
      const normalized = command.toLowerCase();
      const semanticType = normalized.includes("cache") ? "cache" : normalized.includes("identity") || normalized.includes("auth") ? "identity-provider" : normalized.includes("queue") ? "queue" : "observability";
      const existing = diagram.nodes.find((node) => node.semanticType === semanticType);
      const addedNodes = existing ? [] : [createNode(semanticType, crypto.randomUUID(), semanticType === "observability" ? "Observability" : semanticType === "identity-provider" ? "Identity provider" : semanticType === "cache" ? "Application cache" : "Work queue", 820, 420)];
      return { output: { schemaVersion: "1.0.0" as const, baseVersion: diagram.version, addedNodes, changedNodes: [], removedNodeIds: [], addedConnectors: [], removedConnectorIds: [], warnings: existing ? [`${existing.name} already covers this responsibility; no automatic mutation is proposed.`] : ["Confirm ownership, capacity and failure behavior before implementation."] } };
    },
  });
}

const reviewInputSchema = z.object({ ir: architectureIRSchema, diagramVersion: z.number().int().min(1) }).strict();
const reviewOutputSchema = z.array(z.any()).max(100);

export async function runArchitectureReview(input: unknown, options: ExecutionOptions = {}) {
  return executeTask({ ...options, task: "architecture-review", input, inputSchema: reviewInputSchema, outputSchema: reviewOutputSchema, runner: async ({ ir, diagramVersion }) => ({ output: reviewArchitectureIR(ir, diagramVersion) }) });
}

const documentationInputSchema = z.object({ ir: architectureIRSchema, irVersion: z.number().int().min(1), diagramVersion: z.number().int().min(1).optional() }).strict();

export async function runDocumentation(input: unknown, options: ExecutionOptions = {}) {
  return executeTask({ ...options, task: "documentation", input, inputSchema: documentationInputSchema, outputSchema: z.string().min(1).max(1_000_000), runner: async ({ ir, irVersion, diagramVersion }) => ({ output: documentArchitectureIR(ir, irVersion, diagramVersion) }) });
}

export async function runRequirementExtraction(input: unknown, options: ExecutionOptions = {}) {
  return executeTask({
    ...options,
    task: "requirement-extraction",
    input,
    inputSchema: generationRequestSchema,
    outputSchema: z.custom<ReturnType<typeof buildInputTraceability>>(),
    runner: async (request) => ({ output: buildInputTraceability(request) }),
  });
}

export async function runExplanation(input: unknown, options: ExecutionOptions = {}) {
  return executeTask({
    ...options,
    task: "explanation",
    input,
    inputSchema: architectureIRSchema,
    outputSchema: z.string().min(1).max(4_000),
    runner: async (ir) => ({ output: `${ir.intent.title}: ${ir.intent.summary} The design contains ${ir.components.length} components, ${ir.flows.length} typed flows, ${ir.assumptions.length} explicit assumptions, and ${ir.requirements.nonFunctional.length} non-functional requirements.` }),
  });
}
