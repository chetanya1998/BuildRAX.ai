import { describe, expect, it } from "vitest";
import { MockArchitectureProvider, documentDiagram, reviewDiagram } from "./provider";
import { diagramSchema } from "@/lib/domain/schema";
import { compileArchitectureIR } from "@/lib/architecture-ir/compiler";
import { architectureIRSchema } from "@/lib/architecture-ir/schema";

describe("architecture AI contracts", () => {
  it("returns a schema-valid editable diagram", async () => {
    const ir = await new MockArchitectureProvider().generate({ prompt: "Build a multi-tenant SaaS product with background jobs" });
    expect(architectureIRSchema.safeParse(ir).success).toBe(true);
    const diagram = compileArchitectureIR(ir);
    expect(diagramSchema.safeParse(diagram).success).toBe(true);
    expect(diagram.nodes.length).toBeGreaterThanOrEqual(6);
  });

  it("binds review and documentation to the diagram version", async () => {
    const ir = await new MockArchitectureProvider().generate({ prompt: "Build an ecommerce backend with a database" });
    const diagram = compileArchitectureIR(ir);
    expect(reviewDiagram(diagram).every((finding) => finding.diagramVersion === diagram.version)).toBe(true);
    expect(documentDiagram(diagram)).toContain(`Diagram version ${diagram.version}`);
  });
});
