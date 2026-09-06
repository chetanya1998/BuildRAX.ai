import { compileArchitectureRequest } from "@/lib/architecture-ir/compiler";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";
import { type Diagram, type GenerationRequest, type ReviewFinding } from "@/lib/domain/schema";
import type { GenerationContext } from "./generation";

export interface ArchitectureAIProvider {
  id: string;
  model: string;
  generate(request: GenerationRequest, context: GenerationContext): Promise<ArchitectureIR>;
  repair(request: GenerationRequest, context: GenerationContext): Promise<ArchitectureIR>;
}

export class MockArchitectureProvider implements ArchitectureAIProvider {
  readonly id = "mock";
  readonly model = "deterministic-ir-v1";

  async generate(input: GenerationRequest, context?: GenerationContext) {
    void context;
    return compileArchitectureRequest(input).ir;
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

/** Review semantic architecture independently from canvas layout or styling. */
export function reviewArchitectureIR(ir: ArchitectureIR, diagramVersion: number): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const hasIdp = ir.components.some((component) => component.semanticType === "identity-provider");
  const publicEntry = ir.components.find((component) => ["api-gateway", "load-balancer"].includes(component.semanticType));
  const database = ir.components.find((component) => component.category === "data");
  if (!hasIdp && publicEntry) {
    findings.push({ id: crypto.randomUUID(), diagramVersion, lens: "security", severity: "high", rationale: "The public entry path has no explicit identity boundary.", recommendation: "Add an identity provider and document token validation at the API boundary.", affectedObjects: [publicEntry.id], status: "open" });
  }
  if (database && !ir.flows.some((flow) => flow.target === database.id && flow.security.encryption)) {
    findings.push({ id: crypto.randomUUID(), diagramVersion, lens: "security", severity: "medium", rationale: "A datastore connection does not declare transport encryption.", recommendation: "Require encrypted database transport and record key ownership.", affectedObjects: [database.id], status: "open" });
  }
  if (!ir.components.some((component) => component.semanticType === "observability")) {
    findings.push({ id: crypto.randomUUID(), diagramVersion, lens: "reliability", severity: "medium", rationale: "No explicit observability component is present.", recommendation: "Add centralized logs, metrics, traces and alert ownership.", affectedObjects: ir.components.slice(0, 3).map((component) => component.id), status: "open" });
  }
  if (!ir.components.some((component) => component.semanticType === "cache") && ir.components.length > 5) {
    findings.push({ id: crypto.randomUUID(), diagramVersion, lens: "performance", severity: "low", rationale: "Repeated reads may reach primary services or storage directly.", recommendation: "Validate read patterns and add caching only where measurements justify it.", affectedObjects: database ? [database.id] : [], status: "open" });
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

/**
 * Version-bound documentation is generated from semantic IR so moving or
 * restyling canvas objects does not invalidate the document.
 */
export function documentArchitectureIR(ir: ArchitectureIR, irVersion: number, diagramVersion?: number) {
  const components = ir.components.map((component) => `- **${component.name}** — ${component.description}`).join("\n") || "- No semantic components recorded.";
  const flows = ir.flows.map((flow) => {
    const source = ir.components.find((component) => component.id === flow.source)?.name ?? flow.source;
    const target = ir.components.find((component) => component.id === flow.target)?.name ?? flow.target;
    const protocol = flow.protocol ? ` (${flow.protocol})` : "";
    return `- ${source} → ${target}: ${flow.label}${protocol}`;
  }).join("\n") || "- No semantic flows recorded.";
  const assumptions = ir.assumptions.map((item) => `- ${item.text}`).join("\n") || "- No assumptions recorded.";
  const requirements = ir.requirements.functional.map((item) => `- ${item}`).join("\n");
  const decisions = ir.decisions.map((item) => `- **${item.title}** (${item.status}) — ${item.rationale}`).join("\n") || "- No architecture decisions recorded.";
  const visualContext = diagramVersion ? ` · originating diagram version ${diagramVersion}` : "";
  return `# ${ir.intent.title}\n\n_Architecture IR version ${irVersion}${visualContext}_\n\n## System overview\n\n${ir.intent.summary}\n\n## Functional requirements\n\n${requirements}\n\n## Architecture assumptions\n\n${assumptions}\n\n## Component responsibilities\n\n${components}\n\n## Request and data flows\n\n${flows}\n\n## Architecture decisions\n\n${decisions}\n\n## Security model\n\nData sensitivity: **${ir.constraints.dataSensitivity}**. Authentication, authorization, encryption, secret ownership and data classification must be validated during implementation.\n\n## Scalability and reliability\n\nTraffic profile: **${ir.intent.trafficProfile}**. Capacity limits, retry budgets, failure isolation and recovery objectives should be tested against production-like traffic.\n\n## Risks and open questions\n\n- Validate traffic, storage and latency assumptions.\n- Confirm tenant isolation and data-retention policies.\n- Assign operational ownership for every critical component.\n\n## Implementation sequence\n\n1. Establish identity, data boundaries and observability.\n2. Implement the synchronous request path.\n3. Add asynchronous workflows and retries.\n4. Validate security, load, failure and recovery behavior.\n`;
}
