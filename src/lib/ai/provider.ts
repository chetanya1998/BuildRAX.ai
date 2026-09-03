import { templates, getTemplate } from "@/lib/domain/templates";
import { diagramSchema, generationRequestSchema, type Diagram, type GenerationRequest, type ReviewFinding } from "@/lib/domain/schema";
import type { GenerationContext } from "./generation";

export interface ArchitectureAIProvider {
  id: string;
  model: string;
  generate(request: GenerationRequest, context: GenerationContext): Promise<Diagram>;
  repair(request: GenerationRequest, context: GenerationContext): Promise<Diagram>;
}

function cloneTemplate(templateId?: string) {
  const selected = getTemplate(templateId) ?? templates[templateId ? 0 : 1];
  const diagram = structuredClone(selected.diagram);
  diagram.id = crypto.randomUUID();
  diagram.createdAt = new Date().toISOString();
  diagram.updatedAt = diagram.createdAt;
  return diagram;
}

export class MockArchitectureProvider implements ArchitectureAIProvider {
  readonly id = "mock";
  readonly model = "deterministic-fixture-v1";

  async generate(input: GenerationRequest, context?: GenerationContext) {
    void context;
    const request = generationRequestSchema.parse(input);
    const prompt = request.prompt.toLowerCase();
    const templateId = request.templateId
      ?? (prompt.includes("commerce") ? "ecommerce"
        : prompt.includes("real") ? "realtime"
        : prompt.includes("pipeline") || prompt.includes("data") ? "data-pipeline"
        : prompt.includes("event") ? "event-driven"
        : prompt.includes("mobile") ? "mobile-backend"
        : prompt.includes("microservice") ? "microservices"
        : prompt.includes("saas") ? "multi-tenant-saas"
        : "ai-rag");
    const diagram = cloneTemplate(templateId);
    diagram.title = request.productType || request.prompt.split(/[.!?]/)[0].slice(0, 72) || diagram.title;
    diagram.assumptions.push({
      id: crypto.randomUUID(),
      type: "stack",
      text: request.preferredStack ? `Preferred stack: ${request.preferredStack}` : "Technology choices remain provider-neutral until confirmed.",
      confidence: 0.68,
      affectedObjects: diagram.nodes.map((node) => node.id),
      edited: false,
    });
    return diagramSchema.parse(diagram);
  }

  async repair(input: GenerationRequest, context: GenerationContext) {
    return this.generate(input, context);
  }
}

export async function getAIProvider(): Promise<ArchitectureAIProvider> {
  if (!process.env.OPENAI_API_KEY) return new MockArchitectureProvider();
  const { OpenAIArchitectureProvider } = await import("./openai-provider");
  return new OpenAIArchitectureProvider();
}

export function reviewDiagram(diagram: Diagram): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const hasIdp = diagram.nodes.some((node) => node.semanticType === "identity-provider");
  const publicEntry = diagram.nodes.find((node) => ["api-gateway", "load-balancer"].includes(node.semanticType));
  const database = diagram.nodes.find((node) => node.category === "data");
  if (!hasIdp && publicEntry) {
    findings.push({ id: crypto.randomUUID(), diagramVersion: diagram.version, lens: "security", severity: "high", rationale: "The public entry path has no explicit identity boundary.", recommendation: "Add an identity provider and document token validation at the API boundary.", affectedObjects: [publicEntry.id], status: "open" });
  }
  if (database && !diagram.connectors.some((connector) => connector.target === database.id && connector.encryption)) {
    findings.push({ id: crypto.randomUUID(), diagramVersion: diagram.version, lens: "security", severity: "medium", rationale: "A datastore connection does not declare transport encryption.", recommendation: "Require encrypted database transport and record key ownership.", affectedObjects: [database.id], status: "open" });
  }
  if (!diagram.nodes.some((node) => node.semanticType === "observability")) {
    findings.push({ id: crypto.randomUUID(), diagramVersion: diagram.version, lens: "reliability", severity: "medium", rationale: "No explicit observability component is present.", recommendation: "Add centralized logs, metrics, traces and alert ownership.", affectedObjects: diagram.nodes.slice(0, 3).map((node) => node.id), status: "open" });
  }
  if (!diagram.nodes.some((node) => node.semanticType === "cache") && diagram.nodes.length > 5) {
    findings.push({ id: crypto.randomUUID(), diagramVersion: diagram.version, lens: "performance", severity: "low", rationale: "Repeated reads may reach primary services or storage directly.", recommendation: "Validate read patterns and add caching only where measurements justify it.", affectedObjects: database ? [database.id] : [], status: "open" });
  }
  return findings;
}

export function documentDiagram(diagram: Diagram) {
  const components = diagram.nodes.map((node) => `- **${node.name}** — ${node.description || node.semanticType}`).join("\n");
  const flows = diagram.connectors.map((edge) => {
    const source = diagram.nodes.find((node) => node.id === edge.source)?.name ?? edge.source;
    const target = diagram.nodes.find((node) => node.id === edge.target)?.name ?? edge.target;
    return `- ${source} → ${target}: ${edge.label || edge.type}`;
  }).join("\n");
  const assumptions = diagram.assumptions.map((item) => `- ${item.text}`).join("\n") || "- No assumptions recorded.";
  return `# ${diagram.title}\n\n_Diagram version ${diagram.version}_\n\n## System overview\n\nThis architecture contains ${diagram.nodes.length} semantic components and ${diagram.connectors.length} typed connections.\n\n## Architecture assumptions\n\n${assumptions}\n\n## Component responsibilities\n\n${components}\n\n## Request and data flows\n\n${flows}\n\n## Security model\n\nAuthentication, authorization, encryption, secret ownership and data classification must be validated during implementation.\n\n## Scalability and reliability\n\nCapacity limits, retry budgets, failure isolation and recovery objectives should be tested against production-like traffic.\n\n## Risks and open questions\n\n- Validate traffic, storage and latency assumptions.\n- Confirm tenant isolation and data-retention policies.\n- Assign operational ownership for every critical component.\n\n## Implementation sequence\n\n1. Establish identity, data boundaries and observability.\n2. Implement the synchronous request path.\n3. Add asynchronous workflows and retries.\n4. Validate security, load, failure and recovery behavior.\n`;
}
