import { z } from "zod";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import { catalogByType } from "@/lib/domain/catalog";
import { generationRequestSchema, type GenerationRequest } from "@/lib/domain/schema";
import { templates } from "@/lib/domain/templates";
import type { TraceabilityBundle } from "./schema";

export const PATTERN_DEFINITION_VERSION = "1.0.0" as const;
export const RULE_DEFINITION_VERSION = "1.0.0" as const;
export const RULE_EVALUATION_VERSION = "1.0.0" as const;

const semanticTypes = new Set(catalogByType.keys());
const boundedText = (max: number) => z.string().trim().min(1).max(max);

export const patternDefinitionSchema = z.object({
  schemaVersion: z.literal(PATTERN_DEFINITION_VERSION),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: boundedText(120),
  description: boundedText(500),
  family: z.enum(["product", "ai", "commerce", "platform", "realtime", "data", "mobile", "delivery", "integration"]),
  templateId: z.string().max(80).optional(),
  requiredComponents: z.array(z.string().min(1).max(80)).min(1).max(40),
  optionalComponents: z.array(z.string().min(1).max(80)).max(40).default([]),
  knownRisks: z.array(boundedText(300)).min(1).max(20),
  questions: z.array(boundedText(300)).min(1).max(20),
  matchTerms: z.array(boundedText(80)).min(1).max(40),
  priority: z.number().int().min(0).max(100).default(50),
}).strict().superRefine((definition, ctx) => {
  for (const [field, values] of [["requiredComponents", definition.requiredComponents], ["optionalComponents", definition.optionalComponents]] as const) {
    values.forEach((semanticType, index) => {
      if (!semanticTypes.has(semanticType)) ctx.addIssue({ code: "custom", path: [field, index], message: `Unknown semantic component type ${semanticType}.` });
    });
    if (new Set(values).size !== values.length) ctx.addIssue({ code: "custom", path: [field], message: `${field} must be unique.` });
  }
  const overlap = definition.requiredComponents.filter((item) => definition.optionalComponents.includes(item));
  if (overlap.length > 0) ctx.addIssue({ code: "custom", path: ["optionalComponents"], message: `Required and optional components overlap: ${overlap.join(", ")}.` });
});

export type PatternDefinition = z.infer<typeof patternDefinitionSchema>;

const templateMetadata: Record<string, Pick<PatternDefinition, "family" | "knownRisks" | "questions" | "matchTerms" | "priority">> = {
  "multi-tenant-saas": { family: "product", knownRisks: ["Tenant isolation must be enforced at every data boundary."], questions: ["What tenancy isolation and regional residency constraints apply?"], matchTerms: ["saas", "multi-tenant", "workspace"], priority: 70 },
  "ai-rag": { family: "ai", knownRisks: ["Retrieved context can be stale, irrelevant, or expose unauthorized sources."], questions: ["How are source permissions and answer citations verified?"], matchTerms: ["rag", "retrieval", "llm", "ai assistant"], priority: 70 },
  ecommerce: { family: "commerce", knownRisks: ["Inventory and payment state can diverge across partial failures."], questions: ["What consistency guarantees apply to checkout and inventory?"], matchTerms: ["ecommerce", "e-commerce", "checkout", "shopping", "inventory"], priority: 70 },
  "event-driven": { family: "platform", knownRisks: ["Duplicate and out-of-order events require idempotent consumers."], questions: ["What delivery, ordering, and replay guarantees are required?"], matchTerms: ["event-driven", "event broker", "domain events", "pub/sub"], priority: 65 },
  realtime: { family: "realtime", knownRisks: ["Connection fan-out and reconnect storms can overwhelm stateful services."], questions: ["What latency, presence, and reconnect guarantees are required?"], matchTerms: ["realtime", "real-time", "websocket", "collaboration"], priority: 65 },
  "data-pipeline": { family: "data", knownRisks: ["Schema evolution and replay can corrupt downstream analytical state."], questions: ["What freshness, replay, and data-quality guarantees are required?"], matchTerms: ["data pipeline", "streaming ingestion", "analytics pipeline", "etl"], priority: 65 },
  microservices: { family: "platform", knownRisks: ["Service boundaries can increase operational and consistency complexity."], questions: ["Which domains require independent deployment and ownership?"], matchTerms: ["microservice", "service mesh", "distributed services"], priority: 60 },
  "mobile-backend": { family: "mobile", knownRisks: ["Intermittent connectivity requires backward-compatible APIs and retry safety."], questions: ["What offline, push notification, and API-version requirements apply?"], matchTerms: ["mobile", "ios", "android", "push notification"], priority: 60 },
};

const migratedTemplatePatterns = templates.map((entry) => {
  const metadata = templateMetadata[entry.id];
  if (!metadata) throw new Error(`Missing pattern metadata for template ${entry.id}.`);
  return {
    schemaVersion: PATTERN_DEFINITION_VERSION,
    id: entry.id,
    name: entry.name,
    description: entry.description,
    templateId: entry.id,
    requiredComponents: [...new Set(entry.diagram.nodes.map((node) => node.semanticType))],
    optionalComponents: [],
    ...metadata,
  };
});

const additionalPatterns = [
  {
    schemaVersion: PATTERN_DEFINITION_VERSION,
    id: "static-web-delivery",
    name: "Static web delivery",
    description: "Edge-cached static site or client bundle with managed origin storage.",
    family: "delivery",
    requiredComponents: ["dns", "cdn", "object-storage"],
    optionalComponents: ["frontend-app", "repository", "observability"],
    knownRisks: ["Stale cache policy can delay security and content updates."],
    questions: ["Which paths are immutable and how quickly must cache invalidation propagate?"],
    matchTerms: ["static site", "static website", "jamstack", "static delivery"],
    priority: 55,
  },
  {
    schemaVersion: PATTERN_DEFINITION_VERSION,
    id: "file-processing",
    name: "File processing",
    description: "Durable uploads with asynchronous scanning or transformation workers.",
    family: "data",
    requiredComponents: ["object-storage", "queue", "serverless-function"],
    optionalComponents: ["api-gateway", "relational-database", "observability"],
    knownRisks: ["Untrusted files require size limits, malware scanning, and isolated processing."],
    questions: ["What file types, size limits, retention, and scanning policy apply?"],
    matchTerms: ["file upload", "document upload", "media processing", "file processing"],
    priority: 55,
  },
  {
    schemaVersion: PATTERN_DEFINITION_VERSION,
    id: "public-api",
    name: "Public API",
    description: "Externally consumed API with identity, policy enforcement, and observability boundaries.",
    family: "integration",
    requiredComponents: ["external-client", "api-gateway", "backend-service"],
    optionalComponents: ["identity-provider", "cache", "observability"],
    knownRisks: ["Unbounded clients can amplify abuse, compatibility, and availability risks."],
    questions: ["What authentication, rate-limit, and version-support commitments apply?"],
    matchTerms: ["public api", "developer api", "partner api", "external api"],
    priority: 55,
  },
  {
    schemaVersion: PATTERN_DEFINITION_VERSION,
    id: "external-integration",
    name: "Critical external integration",
    description: "Resilient integration with an external provider outside the system trust boundary.",
    family: "integration",
    requiredComponents: ["backend-service", "external-client", "observability"],
    optionalComponents: ["queue", "secrets-manager", "cache"],
    knownRisks: ["Provider latency, quotas, outages, and contract changes are outside direct control."],
    questions: ["What timeout, retry, fallback, and data-sharing policy applies to the provider?"],
    matchTerms: ["third-party integration", "external provider", "external dependency", "partner integration"],
    priority: 50,
  },
] satisfies z.input<typeof patternDefinitionSchema>[];

function buildPatternRegistry() {
  const definitions = [...migratedTemplatePatterns, ...additionalPatterns].map((item) => patternDefinitionSchema.parse(item));
  if (new Set(definitions.map((item) => item.id)).size !== definitions.length) throw new Error("Pattern IDs must be unique.");
  for (const definition of definitions) {
    if (definition.templateId && !templates.some((entry) => entry.id === definition.templateId)) throw new Error(`Pattern ${definition.id} references missing template ${definition.templateId}.`);
  }
  return Object.freeze(definitions);
}

export const patternRegistry = buildPatternRegistry();

export type PatternMatch = {
  pattern: PatternDefinition;
  score: number;
  matchedTerms: string[];
  explicit: boolean;
  conflicts: string[];
};

function containsTerm(searchable: string, term: string) {
  return searchable.includes(term.toLocaleLowerCase());
}

export function matchArchitecturePatterns(input: GenerationRequest): PatternMatch[] {
  const request = generationRequestSchema.parse(input);
  const searchable = `${request.prompt} ${request.productType ?? ""}`.toLocaleLowerCase();
  const inferred = patternRegistry.flatMap((pattern) => {
    const matchedTerms = pattern.matchTerms.filter((term) => containsTerm(searchable, term));
    if (matchedTerms.length === 0) return [];
    return [{ pattern, matchedTerms, score: pattern.priority + matchedTerms.length * 10, explicit: false, conflicts: [] }];
  });
  if (!request.templateId) return inferred.sort((left, right) => right.score - left.score || left.pattern.id.localeCompare(right.pattern.id));

  const explicit = patternRegistry.find((pattern) => pattern.templateId === request.templateId || pattern.id === request.templateId);
  if (!explicit) return inferred.sort((left, right) => right.score - left.score || left.pattern.id.localeCompare(right.pattern.id));
  const conflictingIds = inferred.filter((match) => match.pattern.id !== explicit.id).map((match) => match.pattern.id);
  const explicitMatch: PatternMatch = {
    pattern: explicit,
    matchedTerms: explicit.matchTerms.filter((term) => containsTerm(searchable, term)),
    score: Number.MAX_SAFE_INTEGER,
    explicit: true,
    conflicts: conflictingIds.map((id) => `Explicit pattern ${explicit.id} takes precedence over inferred pattern ${id}.`),
  };
  return [explicitMatch, ...inferred.filter((match) => match.pattern.id !== explicit.id)];
}

export function selectTemplatePattern(input: GenerationRequest) {
  return matchArchitecturePatterns(input).find((match) => match.pattern.templateId)?.pattern.templateId ?? "multi-tenant-saas";
}

export const ruleDefinitionSchema = z.object({
  schemaVersion: z.literal(RULE_DEFINITION_VERSION),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: boundedText(120),
  description: boundedText(500),
  matchTerms: z.array(boundedText(80)).min(1).max(40),
  proposedComponents: z.array(z.string().min(1).max(80)).max(20),
  proposedRequirements: z.array(boundedText(500)).max(20),
}).strict().superRefine((definition, ctx) => {
  definition.proposedComponents.forEach((semanticType, index) => {
    if (!semanticTypes.has(semanticType)) ctx.addIssue({ code: "custom", path: ["proposedComponents", index], message: `Unknown semantic component type ${semanticType}.` });
  });
});

export type RuleDefinition = z.infer<typeof ruleDefinitionSchema>;

const ruleInputs = [
  { id: "file-storage", name: "Durable file storage", description: "Suggest durable object storage when users upload or retain files.", matchTerms: ["file upload", "upload files", "document upload", "media upload", "store files"], proposedComponents: ["object-storage"], proposedRequirements: ["Define accepted file types, size limits, retention, access control, and malware-scanning policy."] },
  { id: "background-jobs", name: "Background job execution", description: "Suggest buffered asynchronous processing for work that should not block a request.", matchTerms: ["background job", "background task", "async job", "scheduled job", "batch job"], proposedComponents: ["queue", "serverless-function"], proposedRequirements: ["Define idempotency, retry limits, dead-letter handling, and job observability."] },
  { id: "repeated-read-cache", name: "Repeated-read cache", description: "Suggest caching for explicitly repeated or read-heavy access.", matchTerms: ["repeated reads", "read-heavy", "frequently read", "hot data", "low latency reads"], proposedComponents: ["cache"], proposedRequirements: ["Define cache ownership, invalidation, freshness, and failure behavior."] },
  { id: "public-api-boundary", name: "Public API boundary", description: "Suggest a governed entry boundary for APIs exposed to external consumers.", matchTerms: ["public api", "developer api", "partner api", "external api"], proposedComponents: ["api-gateway", "identity-provider", "observability"], proposedRequirements: ["Define authentication, authorization, quotas, rate limits, versioning, and deprecation policy."] },
  { id: "critical-external-dependency", name: "Critical external dependency", description: "Suggest resilience and telemetry around critical third-party calls.", matchTerms: ["critical external", "third-party dependency", "external provider", "payment provider", "external dependency"], proposedComponents: ["secrets-manager", "observability"], proposedRequirements: ["Define provider timeouts, bounded retries, circuit breaking, fallback, quotas, and data-sharing constraints."] },
  { id: "async-queue", name: "Asynchronous queue", description: "Suggest a queue when buffered or decoupled processing is explicit.", matchTerms: ["message queue", "work queue", "queued", "asynchronous processing", "decouple producer"], proposedComponents: ["queue"], proposedRequirements: ["Define delivery semantics, ordering, visibility timeout, poison-message, and backlog policies."] },
  { id: "sensitive-data-controls", name: "Sensitive data controls", description: "Suggest identity and secret boundaries for confidential or restricted data.", matchTerms: ["sensitive data", "personal data", "pii", "payment data", "health data", "credentials", "restricted data"], proposedComponents: ["identity-provider", "secrets-manager", "observability"], proposedRequirements: ["Define data classification, least-privilege access, encryption, audit, retention, and deletion requirements."] },
  { id: "static-delivery", name: "Static delivery", description: "Suggest DNS and CDN delivery for immutable web assets.", matchTerms: ["static site", "static website", "static assets", "static delivery", "jamstack"], proposedComponents: ["dns", "cdn", "object-storage"], proposedRequirements: ["Define cache-control, invalidation, origin access, TLS, and immutable asset naming."] },
] satisfies Array<Omit<z.input<typeof ruleDefinitionSchema>, "schemaVersion">>;

export const ruleRegistry = Object.freeze(ruleInputs.map((item) => ruleDefinitionSchema.parse({ schemaVersion: RULE_DEFINITION_VERSION, ...item })));

export const ruleProposalSchema = z.object({
  schemaVersion: z.literal(RULE_EVALUATION_VERSION),
  ruleId: z.string().min(1).max(120),
  status: z.enum(["matched", "not-matched", "conflicting"]),
  matchedTerms: z.array(z.string().min(1).max(80)).max(40),
  rationale: boundedText(500),
  proposedComponents: z.array(z.string().min(1).max(80)).max(20),
  proposedRequirements: z.array(boundedText(500)).max(20),
  conflict: boundedText(500).optional(),
}).strict();

export type RuleProposal = z.infer<typeof ruleProposalSchema>;

function searchableRuleContext(request: GenerationRequest, traceability?: TraceabilityBundle) {
  return [
    request.prompt,
    request.productType,
    request.preferredStack,
    request.cloudProvider,
    request.scale,
    request.tenancy,
    request.dataSensitivity,
    ...traceability?.requirements.items.map((item) => item.statement) ?? [],
    ...traceability?.evidence.items.map((item) => item.claim) ?? [],
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}

function explicitRuleConflict(rule: RuleDefinition, request: GenerationRequest, searchable: string) {
  if (rule.id === "sensitive-data-controls" && request.dataSensitivity && ["public", "internal"].includes(request.dataSensitivity)) {
    return `Explicit data sensitivity '${request.dataSensitivity}' takes precedence over sensitive-data language and requires clarification.`;
  }
  if (rule.id === "public-api-boundary" && /\binternal[- ]only\b|\bprivate api\b/.test(searchable)) {
    return "The request describes both public API access and an internal-only or private API boundary.";
  }
  if (rule.id === "static-delivery" && /\bserver[- ]rendered\b|\bdynamic rendering\b/.test(searchable)) {
    return "The request describes both static delivery and dynamic server rendering.";
  }
  if (rule.id === "async-queue" && /\bno (?:message |work )?queue\b|\bwithout (?:a )?queue\b/.test(searchable)) {
    return "The request both matches queue behavior and explicitly excludes a queue.";
  }
}

export function evaluateArchitectureRules(options: {
  request: GenerationRequest;
  traceability?: TraceabilityBundle;
  architecture?: Readonly<ArchitectureIR>;
}): RuleProposal[] {
  const request = generationRequestSchema.parse(options.request);
  const searchable = searchableRuleContext(request, options.traceability);
  const existing = new Set(options.architecture?.components.map((component) => component.semanticType) ?? []);
  return ruleRegistry.map((rule) => {
    const matchedTerms = rule.matchTerms.filter((term) => containsTerm(searchable, term));
    if (matchedTerms.length === 0) {
      return ruleProposalSchema.parse({ schemaVersion: RULE_EVALUATION_VERSION, ruleId: rule.id, status: "not-matched", matchedTerms: [], rationale: "No scoped evidence matched this rule.", proposedComponents: [], proposedRequirements: [] });
    }
    const conflict = explicitRuleConflict(rule, request, searchable);
    if (conflict) {
      return ruleProposalSchema.parse({ schemaVersion: RULE_EVALUATION_VERSION, ruleId: rule.id, status: "conflicting", matchedTerms, rationale: "A matched suggestion conflicts with an explicit constraint and was not applied.", conflict, proposedComponents: [], proposedRequirements: rule.proposedRequirements });
    }
    return ruleProposalSchema.parse({
      schemaVersion: RULE_EVALUATION_VERSION,
      ruleId: rule.id,
      status: "matched",
      matchedTerms,
      rationale: `Matched ${matchedTerms.join(", ")}; proposals require explicit acceptance.`,
      proposedComponents: rule.proposedComponents.filter((semanticType) => !existing.has(semanticType)),
      proposedRequirements: rule.proposedRequirements,
    });
  });
}
