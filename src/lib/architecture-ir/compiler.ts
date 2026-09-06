import { catalogByType } from "@/lib/domain/catalog";
import { createConnector, createDiagram, createNode } from "@/lib/domain/factory";
import { diagramSchema, generationRequestSchema, type Diagram, type GenerationRequest } from "@/lib/domain/schema";
import { getTemplate } from "@/lib/domain/templates";
import { ARCHITECTURE_COMPILER_VERSION, ARCHITECTURE_IR_VERSION, SEMANTIC_CATALOG_VERSION, architectureIRSchema, migrateArchitectureIR, type ArchitectureIR } from "./schema";
import { validateArchitectureIR, type IRValidationResult } from "./validator";

const archetypes: Array<{ id: string; archetype: ArchitectureIR["intent"]["archetype"]; patterns: RegExp[] }> = [
  { id: "multi-tenant-saas", archetype: "saas", patterns: [/\bsaas\b/i, /multi[- ]tenant/i] },
  { id: "ai-rag", archetype: "ai-rag", patterns: [/\brag\b/i, /retrieval/i, /\bai\b/i, /\bllm\b/i] },
  { id: "ecommerce", archetype: "commerce", patterns: [/e-?commerce/i, /checkout/i, /shopping/i] },
  { id: "event-driven", archetype: "event-driven", patterns: [/event[- ]driven/i, /event broker/i] },
  { id: "realtime", archetype: "realtime", patterns: [/real[- ]time/i, /websocket/i, /collaboration/i] },
  { id: "data-pipeline", archetype: "data-pipeline", patterns: [/data pipeline/i, /streaming ingestion/i, /analytics pipeline/i] },
  { id: "microservices", archetype: "microservices", patterns: [/microservice/i] },
  { id: "mobile-backend", archetype: "mobile", patterns: [/mobile/i, /ios/i, /android/i] },
];

export function selectArchitectureTemplate(request: GenerationRequest) {
  if (request.templateId && getTemplate(request.templateId)) return request.templateId;
  const searchable = `${request.prompt} ${request.productType ?? ""}`;
  return archetypes.find((candidate) => candidate.patterns.some((pattern) => pattern.test(searchable)))?.id ?? "multi-tenant-saas";
}

function splitStack(value = "") {
  return [...new Set(value.split(/[,;+]/).map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

function trafficProfile(scale = ""): ArchitectureIR["intent"]["trafficProfile"] {
  const normalized = scale.toLowerCase();
  if (/million|large|enterprise|global|100k/.test(normalized)) return "large";
  if (/10k|medium|growth/.test(normalized)) return "medium";
  if (/1000|small|startup/.test(normalized)) return "small";
  if (/prototype|mvp|pilot|100 users?/.test(normalized)) return "prototype";
  return "unknown";
}

function sensitivity(prompt: string): ArchitectureIR["constraints"]["dataSensitivity"] {
  if (/health|payment|financial|secret|credential|restricted/i.test(prompt)) return "restricted";
  if (/personal|customer|private|sensitive|pii/i.test(prompt)) return "confidential";
  return "unspecified";
}

export function buildArchitectureIR(input: GenerationRequest): ArchitectureIR {
  const request = generationRequestSchema.parse(input);
  const templateId = selectArchitectureTemplate(request);
  const template = getTemplate(templateId)!;
  const archetype = archetypes.find((item) => item.id === templateId)?.archetype ?? "general";
  const title = (request.productType || request.prompt.split(/[.!?\n]/)[0] || template.name).slice(0, 160);
  const sensitive = sensitivity(request.prompt);
  const allIds = template.diagram.nodes.map((node) => node.id);
  const assumptions: ArchitectureIR["assumptions"] = template.diagram.assumptions.map((item) => ({ id: item.id, type: item.type, text: item.text, confidence: item.confidence, affectedComponents: item.affectedObjects }));
  if (request.preferredStack) assumptions.push({ id: "preferred-stack", type: "stack", text: `Preferred stack: ${request.preferredStack}`, confidence: .9, affectedComponents: allIds });
  if (request.cloudProvider) assumptions.push({ id: "cloud-provider", type: "cloud", text: `Preferred cloud: ${request.cloudProvider}`, confidence: .9, affectedComponents: allIds });

  const ir: ArchitectureIR = {
    schemaVersion: ARCHITECTURE_IR_VERSION,
    intent: { title, summary: request.prompt, archetype, trafficProfile: trafficProfile(request.scale) },
    requirements: {
      functional: [request.prompt],
      nonFunctional: [
        request.scale ? `Design for ${request.scale}.` : "Validate traffic and storage capacity before production.",
        sensitive !== "unspecified" ? `Protect ${sensitive} data in transit and at rest.` : "Declare authentication and encryption at every trust boundary.",
      ],
    },
    constraints: {
      preferredStack: splitStack(request.preferredStack),
      cloudProvider: request.cloudProvider ?? "",
      multiTenant: /multi[- ]tenant/i.test(request.prompt) || templateId === "multi-tenant-saas",
      dataSensitivity: sensitive,
    },
    components: template.diagram.nodes.map((node) => ({
      id: node.id,
      semanticType: node.semanticType,
      category: node.category,
      name: node.name,
      description: node.description,
      responsibilities: node.responsibilities,
      technology: node.technology || undefined,
      provider: node.provider || undefined,
      environment: node.environment,
      layoutHint: node.position,
    })),
    flows: template.diagram.connectors.map((flow) => ({
      id: flow.id,
      source: flow.source,
      sourcePort: flow.sourcePort,
      target: flow.target,
      targetPort: flow.targetPort,
      type: flow.type,
      label: flow.label || flow.type,
      protocol: flow.protocol || undefined,
      direction: flow.direction,
      security: { authentication: flow.authentication, encryption: flow.encryption, dataClassification: sensitive === "unspecified" ? flow.dataClassification : sensitive },
      resilience: { retryPolicy: flow.retryPolicy, latencyTarget: flow.latency },
    })),
    assumptions,
    decisions: [{ id: "starting-pattern", title: `Use ${template.name} as the starting pattern`, rationale: "The request matched a trusted, version-controlled architecture archetype. All components remain editable.", status: "proposed" }],
    provenance: { strategy: "deterministic-template", templateId, compilerVersion: ARCHITECTURE_COMPILER_VERSION, catalogVersion: SEMANTIC_CATALOG_VERSION },
  };

  // The first-value contract requires at least six connected components. Some
  // compact templates intentionally have five, so the compiler adds an
  // observability boundary deterministically instead of making an LLM call.
  if (ir.components.length < 6) {
    const addObservability = !ir.components.some((item) => item.semanticType === "observability");
    const semanticType = addObservability ? "observability" : "secrets-manager";
    const id = `${templateId}-${semanticType}`;
    const catalogItem = catalogByType.get(semanticType)!;
    ir.components.push({ id, semanticType, category: catalogItem.category, name: catalogItem.name, description: catalogItem.description, responsibilities: [addObservability ? "Collect logs, metrics and traces" : "Protect service credentials and encryption keys"], environment: "agnostic", layoutHint: { x: 980, y: 360 } });
    const source = ir.components.find((item) => item.category === "compute") ?? ir.components.find((item) => item.category === "networking") ?? ir.components[0];
    ir.flows.push({ id: `${templateId}-${addObservability ? "telemetry" : "secrets"}`, source: source.id, sourcePort: "out", target: id, targetPort: "in", type: addObservability ? "event-stream" : "control-plane", label: addObservability ? "Telemetry" : "Secret retrieval", protocol: addObservability ? "OTLP" : "HTTPS", direction: "unidirectional", security: { authentication: "Service identity", encryption: "TLS 1.3", dataClassification: "internal" }, resilience: { retryPolicy: "Bounded exponential backoff", latencyTarget: addObservability ? "Best effort" : "Low latency" } });
  }
  return architectureIRSchema.parse(ir);
}

export class ArchitectureIRValidationError extends Error {
  constructor(public validation: IRValidationResult) { super("Architecture IR failed deterministic validation."); }
}

export function compileArchitectureIR(input: unknown, options: { id?: string; now?: string; theme?: Diagram["theme"] } = {}): Diagram {
  const ir = migrateArchitectureIR(input);
  const validation = validateArchitectureIR(ir);
  if (!validation.valid) throw new ArchitectureIRValidationError(validation);
  const nodes = ir.components.map((component, index) => {
    const position = component.layoutHint ?? { x: 40 + (index % 4) * 300, y: 40 + Math.floor(index / 4) * 190 };
    return {
      ...createNode(component.semanticType, component.id, component.name, position.x, position.y),
      description: component.description,
      technology: component.technology ?? "",
      provider: component.provider ?? "",
      environment: component.environment,
      responsibilities: component.responsibilities,
    };
  });
  const connectors = ir.flows.map((flow) => ({
    ...createConnector(flow.id, flow.source, flow.target, flow.type, flow.label),
    sourcePort: flow.sourcePort,
    targetPort: flow.targetPort,
    protocol: flow.protocol ?? "",
    direction: flow.direction,
    authentication: flow.security.authentication,
    encryption: flow.security.encryption,
    dataClassification: flow.security.dataClassification,
    retryPolicy: flow.resilience.retryPolicy,
    latency: flow.resilience.latencyTarget,
  }));
  const now = options.now ?? new Date().toISOString();
  const diagram = createDiagram(ir.intent.title, nodes, connectors);
  diagram.id = options.id ?? crypto.randomUUID();
  diagram.createdAt = now;
  diagram.updatedAt = now;
  diagram.theme = options.theme ?? "light";
  diagram.assumptions = ir.assumptions.map((item) => ({ id: item.id, type: item.type, text: item.text, confidence: item.confidence, affectedObjects: item.affectedComponents, edited: false }));
  return diagramSchema.parse(diagram);
}

export function compileArchitectureRequest(input: GenerationRequest, options: { id?: string; now?: string; theme?: Diagram["theme"] } = {}) {
  const ir = buildArchitectureIR(input);
  const validation = validateArchitectureIR(ir);
  if (!validation.valid) throw new ArchitectureIRValidationError(validation);
  return { ir, validation, diagram: compileArchitectureIR(ir, options) };
}
