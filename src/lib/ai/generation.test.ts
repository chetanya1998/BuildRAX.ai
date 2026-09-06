import { describe, expect, it } from "vitest";
import { createDiagram, createNode } from "@/lib/domain/factory";
import type { Diagram, GenerationRequest } from "@/lib/domain/schema";
import { AISemanticValidationError } from "./errors";
import { generateArchitecture, validateGeneratedDiagram, type GenerationContext } from "./generation";
import type { ArchitectureAIProvider } from "./provider";
import { buildArchitectureIR } from "@/lib/architecture-ir/compiler";
import type { ArchitectureIR } from "@/lib/architecture-ir/schema";

const request: GenerationRequest = { prompt: "Build a multi-tenant SaaS with a web client and asynchronous work." };

function validDiagram(): Diagram {
  const nodes = [
    createNode("browser", "browser", "Browser", 0, 0),
    createNode("api-gateway", "gateway", "Gateway", 220, 0),
    createNode("backend-service", "service", "Service", 440, 0),
    createNode("relational-database", "database", "Database", 660, 0),
    createNode("queue", "queue", "Queue", 440, 180),
    createNode("observability", "observability", "Observability", 660, 180),
  ];
  const diagram = createDiagram("Validated architecture", nodes);
  diagram.connectors = [
    { id: "c1", source: "browser", sourcePort: "out", target: "gateway", targetPort: "in", type: "http-rest", protocol: "HTTPS", direction: "unidirectional", authentication: "", encryption: "TLS", retryPolicy: "", latency: "", dataClassification: "internal", label: "", style: "solid", routing: "orthogonal" },
    { id: "c2", source: "gateway", sourcePort: "out", target: "service", targetPort: "in", type: "http-rest", protocol: "HTTPS", direction: "unidirectional", authentication: "", encryption: "TLS", retryPolicy: "", latency: "", dataClassification: "internal", label: "", style: "solid", routing: "orthogonal" },
    { id: "c3", source: "service", sourcePort: "out", target: "database", targetPort: "in", type: "database-read-write", protocol: "SQL", direction: "unidirectional", authentication: "", encryption: "TLS", retryPolicy: "", latency: "", dataClassification: "confidential", label: "", style: "solid", routing: "orthogonal" },
    { id: "c4", source: "service", sourcePort: "out", target: "queue", targetPort: "in", type: "async-message", protocol: "AMQP", direction: "unidirectional", authentication: "", encryption: "TLS", retryPolicy: "", latency: "", dataClassification: "internal", label: "", style: "solid", routing: "orthogonal" },
    { id: "c5", source: "queue", sourcePort: "out", target: "observability", targetPort: "in", type: "async-message", protocol: "OTLP", direction: "unidirectional", authentication: "", encryption: "TLS", retryPolicy: "", latency: "", dataClassification: "internal", label: "", style: "solid", routing: "orthogonal" },
  ];
  return diagram;
}

function provider(generate: (input: GenerationRequest, context: GenerationContext) => Promise<ArchitectureIR>, repair = generate): ArchitectureAIProvider {
  return { id: "test", model: "test-model", generate, repair };
}

describe("AI generation orchestration", () => {
  it("normalizes server-owned diagram values after semantic validation", () => {
    const candidate = validDiagram();
    candidate.id = "model-controlled-id";
    const diagram = validateGeneratedDiagram(candidate);
    expect(diagram.id).not.toBe(candidate.id);
    expect(diagram.version).toBe(1);
    expect(diagram.primitives).toEqual([]);
  });

  it("rejects a catalog mismatch before a diagram reaches the client", () => {
    const candidate = validDiagram();
    candidate.nodes[0].category = "data";
    expect(() => validateGeneratedDiagram(candidate)).toThrow(AISemanticValidationError);
  });

  it("repairs one semantically-invalid attempt and stops after the successful repair", async () => {
    const invalid = buildArchitectureIR(request);
    invalid.components[0].semanticType = "not-in-the-catalog";
    let repairs = 0;
    const result = await generateArchitecture(request, {
      provider: provider(async () => invalid, async () => {
        repairs += 1;
        return buildArchitectureIR(request);
      }),
      requestId: "00000000-0000-4000-8000-000000000001",
    });
    expect(result.attempts).toBe(2);
    expect(repairs).toBe(1);
    expect(result.diagram.nodes).toHaveLength(15);
  });

  it("does not loop after an invalid repair", async () => {
    const invalid = buildArchitectureIR(request);
    invalid.components[0].semanticType = "not-in-the-catalog";
    let repairs = 0;
    await expect(generateArchitecture(request, {
      provider: provider(async () => invalid, async () => {
        repairs += 1;
        return invalid;
      }),
    })).rejects.toBeInstanceOf(AISemanticValidationError);
    expect(repairs).toBe(1);
  });
});
