import { describe, expect, it } from "vitest";
import { buildArchitectureIR, compileArchitectureIR, compileArchitectureRequest, functionalRequirementsFromDescription, selectArchitectureTemplate } from "./compiler";
import { validateArchitectureIR } from "./validator";

describe("Architecture IR pipeline", () => {
  it("understands a request, validates IR and compiles a diagram without an LLM", () => {
    const result = compileArchitectureRequest({
      prompt: "Build a multi-tenant SaaS for confidential customer records and background jobs.",
      preferredStack: "Next.js, Supabase, Redis",
      cloudProvider: "AWS",
      scale: "1000 users",
    }, { id: "diagram-1", now: "2026-09-06T00:00:00.000Z" });

    expect(result.validation.valid).toBe(true);
    expect(result.ir.provenance).toMatchObject({ strategy: "deterministic-template", templateId: "multi-tenant-saas", compilerVersion: "1.1.0" });
    expect(result.ir.constraints.preferredStack).toEqual(["Next.js", "Supabase", "Redis"]);
    expect(result.ir.constraints.dataSensitivity).toBe("confidential");
    expect(result.diagram.id).toBe("diagram-1");
    expect(result.diagram.nodes).toHaveLength(15);
    expect(result.diagram.connectors.length).toBeGreaterThanOrEqual(result.diagram.nodes.length - 1);
  });

  it("selects trusted archetypes deterministically", () => {
    expect(selectArchitectureTemplate({ prompt: "Create a websocket collaboration service." })).toBe("realtime");
    expect(selectArchitectureTemplate({ prompt: "Create a checkout and inventory backend." })).toBe("ecommerce");
    expect(selectArchitectureTemplate({ prompt: "Create a retrieval augmented LLM assistant." })).toBe("ai-rag");
  });

  it("rejects missing flow endpoints before compilation", () => {
    const ir = buildArchitectureIR({ prompt: "Build a secure multi-tenant SaaS platform." });
    ir.flows[0].target = "missing-component";
    const validation = validateArchitectureIR(ir);
    expect(validation.valid).toBe(false);
    expect(validation.errors.map((finding) => finding.code)).toContain("FLOW_ENDPOINT_MISSING");
    expect(() => compileArchitectureIR(ir)).toThrow("Architecture IR failed deterministic validation");
  });

  it("flags unsafe topology and sensitive flows deterministically", () => {
    const ir = buildArchitectureIR({ prompt: "Build a secure multi-tenant SaaS platform." });
    const client = ir.components.find((component) => component.category === "client")!;
    const database = ir.components.find((component) => component.category === "data")!;
    ir.flows.push({
      id: "unsafe-direct-flow",
      source: client.id,
      sourcePort: "out",
      target: database.id,
      targetPort: "in",
      type: "database-read-write",
      label: "Direct records",
      direction: "unidirectional",
      security: { authentication: "", encryption: "", dataClassification: "restricted" },
      resilience: { retryPolicy: "", latencyTarget: "" },
    });
    const codes = validateArchitectureIR(ir).warnings.map((finding) => finding.code);
    expect(codes).toContain("DIRECT_CLIENT_DATA_ACCESS");
    expect(codes).toContain("SENSITIVE_FLOW_UNENCRYPTED");
  });

  it("rejects markup-like prompt content at the input boundary", () => {
    expect(() => buildArchitectureIR({ prompt: "Build a platform <script>alert(1)</script>" })).toThrow();
  });

  it.each([239, 240, 241, 3000])("compiles a %i-character description into bounded requirements", (length) => {
    const description = "a".repeat(length);
    const ir = buildArchitectureIR({ prompt: description });
    expect(ir.requirements.functional.length).toBeGreaterThan(0);
    expect(ir.requirements.functional.every((item) => item.length <= 240)).toBe(true);
    expect(ir.requirements.functional.join("")).toBe(description);
    expect(ir.intent.summary.length).toBeLessThanOrEqual(1200);
  });

  it("splits prose at sentence and word boundaries", () => {
    const description = `Build an order service. ${"Process authenticated checkout requests and retain audit evidence ".repeat(6)}`.trim();
    const requirements = functionalRequirementsFromDescription(description);
    expect(requirements[0]).toBe("Build an order service.");
    expect(requirements.every((item) => item.length <= 240)).toBe(true);
  });

  it("keeps structured choices separate and lets explicit values override template inference", () => {
    const ir = buildArchitectureIR({
      prompt: "Build a multi-tenant service for sensitive customer information.",
      templateId: "multi-tenant-saas",
      preferredStack: "Next.js, PostgreSQL, Redis",
      cloudProvider: "Provider-neutral",
      scale: "small",
      tenancy: "single-tenant",
      dataSensitivity: "public",
    });
    expect(ir.constraints).toMatchObject({
      preferredStack: ["Next.js", "PostgreSQL", "Redis"],
      cloudProvider: "Provider-neutral",
      multiTenant: false,
      dataSensitivity: "public",
    });
    expect(ir.intent.trafficProfile).toBe("small");
    expect(ir.requirements.nonFunctional).toEqual([
      "Scale target: small.",
      "Tenancy model: single-tenant.",
      "Data sensitivity: public.",
    ]);
  });

  it("leaves missing structured values unknown instead of inventing requirements", () => {
    const ir = buildArchitectureIR({ prompt: "Build a service that accepts and processes work requests." });
    expect(ir.intent.trafficProfile).toBe("unknown");
    expect(ir.constraints).toMatchObject({ cloudProvider: "", multiTenant: false, dataSensitivity: "unspecified" });
    expect(ir.requirements.nonFunctional).toEqual([]);
    expect(ir.assumptions.map((item) => item.id)).toEqual(expect.arrayContaining(["scale-unknown", "tenancy-unknown", "sensitivity-unknown"]));
  });
});
