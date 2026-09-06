import { catalogByType, nodeCatalog } from "@/lib/domain/catalog";
import { validateConnectorReferences } from "@/lib/domain/compatibility";
import { diagramSchema, generationRequestSchema, type Diagram, type GenerationRequest } from "@/lib/domain/schema";
import { compileArchitectureIR } from "@/lib/architecture-ir/compiler";
import { architectureIRSchema, type ArchitectureIR } from "@/lib/architecture-ir/schema";
import { createArchitectureSnapshot, presentationFromDiagram, type ArchitecturePresentation, type ArchitectureSnapshot } from "@/lib/architecture-ir/snapshot";
import { validateArchitectureIR, type IRValidationResult } from "@/lib/architecture-ir/validator";
import { AIOutputError, AISemanticValidationError } from "./errors";
import { getAIProvider, type ArchitectureAIProvider } from "./provider";

export const ARCHITECTURE_PROMPT_VERSION = "architecture-v1";

export const AI_COMPONENT_CATALOG = nodeCatalog.map(({ semanticType, category }) => ({ semanticType, category }));

export type GenerationContext = {
  requestId: string;
  promptVersion: typeof ARCHITECTURE_PROMPT_VERSION;
  repairReason?: string;
};

export type GenerationResult = {
  ir: ArchitectureIR;
  presentation: ArchitecturePresentation;
  artifact: ArchitectureSnapshot;
  diagram: Diagram;
  validation: IRValidationResult;
  attempts: 1 | 2;
  provider: string;
  model: string;
  promptVersion: typeof ARCHITECTURE_PROMPT_VERSION;
};

export function validateGeneratedIR(candidate: unknown): { ir: ArchitectureIR; validation: IRValidationResult } {
  const parsed = architectureIRSchema.safeParse(candidate);
  if (!parsed.success) throw new AIOutputError();
  const ir = parsed.data;
  const validation = validateArchitectureIR(ir);
  const reasons = validation.errors.map((finding) => finding.message);
  if (ir.components.length < 6 || ir.components.length > 15) reasons.push("A first draft must contain between 6 and 15 components.");
  if (ir.flows.length < Math.max(1, ir.components.length - 1)) reasons.push("Components must form a connected, reviewable architecture.");
  const connected = new Set(ir.flows.flatMap((flow) => [flow.source, flow.target]));
  if (ir.components.some((component) => !connected.has(component.id))) reasons.push("Every generated component must participate in a typed connection.");
  if (reasons.length) throw new AISemanticValidationError([...new Set(reasons)]);
  return { ir, validation };
}

/**
 * This is the complete, allow-listed context supplied to an AI provider. It
 * deliberately excludes account, browser, analytics and local-draft data.
 */
export function buildGenerationContext(request: GenerationRequest, requestId: string): GenerationContext {
  generationRequestSchema.parse(request);
  return { requestId, promptVersion: ARCHITECTURE_PROMPT_VERSION };
}

export function normalizeGeneratedDiagram(candidate: unknown): Diagram {
  const parsedResult = diagramSchema.safeParse(candidate);
  if (!parsedResult.success) throw new AIOutputError();
  const parsed = parsedResult.data;
  const now = new Date().toISOString();
  return diagramSchema.parse({
    ...parsed,
    id: crypto.randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    theme: "light",
    primitives: [],
  });
}

export function validateGeneratedDiagram(candidate: unknown): Diagram {
  const diagram = normalizeGeneratedDiagram(candidate);
  const reasons: string[] = [];

  if (diagram.nodes.length < 6 || diagram.nodes.length > 15) {
    reasons.push("A first draft must contain between 6 and 15 components.");
  }
  if (diagram.connectors.length < Math.max(1, diagram.nodes.length - 1)) {
    reasons.push("Components must form a connected, reviewable architecture.");
  }

  const connectorIds = new Set<string>();
  const connectedNodeIds = new Set<string>();
  for (const node of diagram.nodes) {
    const catalogEntry = catalogByType.get(node.semanticType);
    if (!catalogEntry) reasons.push(`Unknown component type: ${node.semanticType}.`);
    else if (catalogEntry.category !== node.category) reasons.push(`${node.name} has an invalid semantic category.`);
  }
  for (const connector of diagram.connectors) {
    if (connectorIds.has(connector.id)) reasons.push("Connector IDs must be unique.");
    connectorIds.add(connector.id);
    const compatibility = validateConnectorReferences(connector, diagram.nodes);
    if (!compatibility.valid) reasons.push(compatibility.reason);
    connectedNodeIds.add(connector.source);
    connectedNodeIds.add(connector.target);
  }
  if (diagram.nodes.some((node) => !connectedNodeIds.has(node.id))) {
    reasons.push("Every generated component must participate in a typed connection.");
  }
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  if (diagram.assumptions.some((assumption) => assumption.affectedObjects.some((id) => !nodeIds.has(id)))) {
    reasons.push("Assumptions may only reference generated components.");
  }
  if (reasons.length) throw new AISemanticValidationError([...new Set(reasons)]);
  return diagram;
}

export async function generateArchitecture(
  input: GenerationRequest,
  options: { provider?: ArchitectureAIProvider; requestId?: string } = {},
): Promise<GenerationResult> {
  const request = generationRequestSchema.parse(input);
  const provider = options.provider ?? await getAIProvider();
  const context = buildGenerationContext(request, options.requestId ?? crypto.randomUUID());

  try {
    const candidate = await provider.generate(request, context);
    const { ir, validation } = validateGeneratedIR(candidate);
    const diagram = validateGeneratedDiagram(compileArchitectureIR(ir));
    const presentation = presentationFromDiagram(diagram);
    const artifact = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, presentation, createdAt: diagram.createdAt, updatedAt: diagram.updatedAt });
    return {
      ir,
      presentation,
      artifact,
      diagram: artifact.materializedDiagram,
      validation,
      attempts: 1,
      provider: provider.id,
      model: provider.model,
      promptVersion: context.promptVersion,
    };
  } catch (error) {
    if (!(error instanceof AIOutputError || error instanceof AISemanticValidationError)) throw error;
    const reason = error instanceof AISemanticValidationError ? error.reasons.join(" ") : "Return a complete schema-valid architecture.";
    const repaired = await provider.repair(request, { ...context, repairReason: reason });
    const { ir, validation } = validateGeneratedIR(repaired);
    const diagram = validateGeneratedDiagram(compileArchitectureIR(ir));
    const presentation = presentationFromDiagram(diagram);
    const artifact = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, presentation, createdAt: diagram.createdAt, updatedAt: diagram.updatedAt });
    return {
      ir,
      presentation,
      artifact,
      diagram: artifact.materializedDiagram,
      validation,
      attempts: 2,
      provider: provider.id,
      model: provider.model,
      promptVersion: context.promptVersion,
    };
  }
}
