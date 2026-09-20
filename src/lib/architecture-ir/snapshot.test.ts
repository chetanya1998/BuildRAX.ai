import { describe, expect, it } from "vitest";
import { buildArchitectureIR, compileArchitectureIR } from "./compiler";
import { ARCHITECTURE_IR_VERSION, migrateArchitectureIR } from "./schema";
import {
  architectureIRFromDiagram,
  assertArchitecturePayloadSizes,
  canonicalSha256,
  canonicalStringify,
  createArchitectureSnapshot,
  migrateArchitectureSnapshot,
  materializeArchitecture,
  presentationFromDiagram,
  validateArchitectureArtifact,
} from "./snapshot";
import { buildInputTraceability } from "@/lib/intelligence/input";

describe("Architecture snapshot contracts", () => {
  it("canonicalizes object keys before hashing", async () => {
    expect(canonicalStringify({ z: 1, a: { y: 2, b: 3 } })).toBe('{"a":{"b":3,"y":2},"z":1}');
    await expect(canonicalSha256({ a: 1, b: 2 })).resolves.toBe(await canonicalSha256({ b: 2, a: 1 }));
  });

  it("enforces the combined one megabyte snapshot boundary", () => {
    expect(() => assertArchitecturePayloadSizes({ ok: true }, { text: "x".repeat(500_000) }, { text: "y".repeat(500_000) })).toThrow("1 MB");
  });

  it("splits and materializes semantic and presentation state losslessly", async () => {
    const ir = buildArchitectureIR({ prompt: "Build a multi-tenant SaaS product with asynchronous jobs." });
    const diagram = compileArchitectureIR(ir, { id: "diagram-1", now: "2026-09-06T00:00:00.000Z" });
    diagram.nodes[0].position = { x: 321, y: 654 };
    diagram.nodes[0].metadata = {
      ...diagram.nodes[0].metadata,
      appearanceVariant: "tinted",
      accentColor: "#2563eb",
      fillColor: "#eff6ff",
      borderRadius: "24",
      shadow: "raised",
    };
    diagram.connectors[0].style = "dashed";
    const presentation = presentationFromDiagram(diagram);
    const snapshot = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, presentation, createdAt: diagram.createdAt, updatedAt: diagram.updatedAt });

    expect(snapshot.materializedDiagram.nodes[0].position).toEqual({ x: 321, y: 654 });
    expect(snapshot.materializedDiagram.nodes[0].metadata).toMatchObject({
      appearanceVariant: "tinted",
      accentColor: "#2563eb",
      fillColor: "#eff6ff",
      borderRadius: "24",
      shadow: "raised",
    });
    expect(snapshot.materializedDiagram.connectors[0].style).toBe("dashed");
    expect(snapshot.checksums.ir).toHaveLength(64);
  });

  it("round-trips traceability checksums and semantic references across versions", async () => {
    const request = { prompt: "Build a multi-tenant SaaS product with asynchronous jobs." };
    const ir = buildArchitectureIR(request);
    const diagram = compileArchitectureIR(ir, { id: "diagram-traceability" });
    const traceability = buildInputTraceability(request);
    traceability.requirements.items[0].architectureRefs = [{ kind: "component", id: ir.components[0].id }];
    const first = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, traceability, presentation: presentationFromDiagram(diagram) });
    const second = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 2, irVersion: 1, ir, traceability, presentation: presentationFromDiagram(diagram) });

    expect(first.checksums.evidence).toHaveLength(64);
    expect(first.checksums.requirements).toHaveLength(64);
    expect(second.traceability?.requirements.items[0].architectureRefs).toEqual([{ kind: "component", id: ir.components[0].id }]);
    expect(second.checksums.requirements).toBe(first.checksums.requirements);
  });

  it("upgrades legacy snapshots without inventing traceability", async () => {
    const ir = buildArchitectureIR({ prompt: "Build a secure API service with background jobs." });
    const diagram = compileArchitectureIR(ir, { id: "legacy-snapshot" });
    const current = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, presentation: presentationFromDiagram(diagram) });
    const legacy = { ...current, schemaVersion: "1.0.0" as const, traceability: undefined, checksums: {
      ir: current.checksums.ir, presentation: current.checksums.presentation, diagram: current.checksums.diagram,
    } };
    const migrated = migrateArchitectureSnapshot(JSON.parse(JSON.stringify(legacy)));
    expect(migrated.schemaVersion).toBe("1.1.0");
    expect(migrated.traceability).toBeUndefined();
  });

  it("rejects traceability references to missing architecture objects", async () => {
    const request = { prompt: "Build a secure API service with background jobs." };
    const ir = buildArchitectureIR(request);
    const diagram = compileArchitectureIR(ir);
    const traceability = buildInputTraceability(request);
    traceability.requirements.items[0].architectureRefs = [{ kind: "flow", id: "missing-flow" }];
    await expect(createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, traceability, presentation: presentationFromDiagram(diagram) })).rejects.toThrow(/unknown flow/i);
  });

  it("rejects presentation references that do not exist in IR", () => {
    const ir = buildArchitectureIR({ prompt: "Build a multi-tenant SaaS product with asynchronous jobs." });
    const diagram = compileArchitectureIR(ir);
    const presentation = presentationFromDiagram(diagram);
    presentation.components.push({
      componentId: "missing",
      position: { x: 0, y: 0 },
      dimensions: { width: 120, height: 72 },
      zIndex: 0,
      appearance: { variant: "card", borderRadius: "16", shadow: "soft" },
    });
    expect(validateArchitectureArtifact(ir, presentation).valid).toBe(false);
    expect(() => materializeArchitecture(ir, presentation, { id: diagram.id, version: 1 })).toThrow();
  });

  it("accepts a blank manual canvas but rejects missing presentation entries", () => {
    const blank = compileArchitectureIR({
      schemaVersion: "1.1.0",
      intent: { title: "Blank", summary: "A deliberately blank architecture canvas.", archetype: "general", trafficProfile: "unknown" },
      requirements: { functional: ["Allow the user to start from a blank canvas."], nonFunctional: [] },
      constraints: { preferredStack: [], cloudProvider: "", multiTenant: false, dataSensitivity: "unspecified" },
      components: [], flows: [], assumptions: [], decisions: [],
      provenance: { strategy: "manual-edit", compilerVersion: "1.1.0", catalogVersion: "1.0.0" },
    });
    expect(blank.nodes).toHaveLength(0);

    const ir = buildArchitectureIR({ prompt: "Build a multi-tenant SaaS product with asynchronous jobs." });
    const diagram = compileArchitectureIR(ir);
    const presentation = presentationFromDiagram(diagram);
    presentation.components.pop();
    expect(validateArchitectureArtifact(ir, presentation).valid).toBe(false);
  });

  it("upgrades IR 1.0 flows and provenance deterministically", () => {
    const current = buildArchitectureIR({ prompt: "Build a secure multi-tenant SaaS product." });
    const legacy = {
      ...current,
      schemaVersion: "1.0.0",
      flows: current.flows.map((flow) => Object.fromEntries(Object.entries(flow).filter(([key]) => key !== "sourcePort" && key !== "targetPort"))),
      provenance: { strategy: "deterministic-template", templateId: current.provenance.templateId },
    };
    const migrated = migrateArchitectureIR(legacy);
    expect(migrated.schemaVersion).toBe(ARCHITECTURE_IR_VERSION);
    expect(migrated.flows.every((flow) => flow.sourcePort === "out" && flow.targetPort === "in")).toBe(true);
  });

  it("derives a manual IR revision while preserving requirements and decisions", () => {
    const base = buildArchitectureIR({ prompt: "Build a secure multi-tenant SaaS product." });
    const diagram = compileArchitectureIR(base);
    diagram.nodes[0].name = "Customer portal";
    const updated = architectureIRFromDiagram(diagram, base);
    expect(updated.components[0].name).toBe("Customer portal");
    expect(updated.requirements).toEqual(base.requirements);
    expect(updated.provenance.strategy).toBe("manual-edit");
  });
});
