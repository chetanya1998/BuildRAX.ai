import { z } from "zod";
import { createNode } from "@/lib/domain/factory";
import { changePlanSchema, diagramSchema, generationRequestSchema, reviewFindingSchema } from "@/lib/domain/schema";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";
import { buildInputTraceability } from "@/lib/intelligence/input";
import { compileContextPack, contextBlocksFromTraceability } from "@/lib/intelligence/context";
import { traceabilityBundleSchema } from "@/lib/intelligence/schema";
import { architecturePresentationSchema, architectureSnapshotSchema } from "@/lib/architecture-ir/snapshot";
import { AIOutputError } from "./errors";
import { generateArchitecture, type GenerationResult } from "./generation";
import { AI_GATEWAY_VERSION, gatewayMetadataSchema, usageSchema, type AITask } from "./metadata";
import { documentArchitectureIR, reviewArchitectureIR, type ArchitectureAIProvider } from "./provider";

export { AI_GATEWAY_VERSION, aiTaskSchema, gatewayMetadataSchema } from "./metadata";
export type { AITask, GatewayMetadata } from "./metadata";

export class AIGatewayTimeoutError extends Error {
  readonly code = "gateway_timeout" as const;
  constructor(public readonly timeoutMs: number) {
    super(`AI task exceeded its ${timeoutMs} ms time limit.`);
    this.name = "AIGatewayTimeoutError";
  }
}

export class AIGatewayCancelledError extends Error {
  readonly code = "gateway_cancelled" as const;
  constructor(public readonly reason?: unknown) {
    super("AI task was cancelled.");
    this.name = "AIGatewayCancelledError";
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
  const requestId = z.string().uuid().parse(options.requestId ?? crypto.randomUUID());
  const timeoutMs = Math.max(1_000, Math.min(options.timeoutMs ?? 25_000, 60_000));
  const controller = new AbortController();
  const onAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(new AIGatewayTimeoutError(timeoutMs)), timeoutMs);
  const startedAt = Date.now();
  try {
    if (options.signal?.aborted) controller.abort(options.signal.reason);
    const cancellation = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(controller.signal.reason), { once: true });
    });
    if (controller.signal.aborted) throw controller.signal.reason;
    const result = await Promise.race([options.runner(input, { requestId, signal: controller.signal }), cancellation]);
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
    if (controller.signal.aborted) throw new AIGatewayCancelledError(controller.signal.reason);
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

const validationFindingSchema = z.object({
  code: z.string().min(1).max(80),
  severity: z.enum(["error", "warning"]),
  message: z.string().min(1).max(1_200),
  affectedIds: z.array(z.string().min(1).max(120)).max(300),
}).strict();

const generationResultSchema = z.object({
  artifact: architectureSnapshotSchema,
  ir: architectureIRSchema,
  traceability: traceabilityBundleSchema,
  validation: z.object({
    valid: z.boolean(),
    errors: z.array(validationFindingSchema).max(300),
    warnings: z.array(validationFindingSchema).max(300),
  }).strict(),
  presentation: architecturePresentationSchema,
  diagram: diagramSchema,
  attempts: z.number().int().min(1).max(2),
  provider: z.string().min(1).max(80),
  model: z.string().min(1).max(160),
  promptVersion: z.string().min(1).max(80),
  usage: usageSchema,
  successfulCalls: z.number().int().min(1).max(2),
  repairCalls: z.number().int().min(0).max(1),
}).strict();

export async function runArchitectureSynthesis(input: unknown, options: ExecutionOptions = {}) {
  return executeTask({
    ...options,
    task: "architecture-synthesis",
    input,
    inputSchema: generationRequestSchema,
    outputSchema: generationResultSchema as z.ZodType<GenerationResult>,
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
const reviewOutputSchema = z.array(reviewFindingSchema).max(100);

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
    outputSchema: traceabilityBundleSchema,
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
