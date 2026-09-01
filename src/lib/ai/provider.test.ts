import { describe, expect, it } from "vitest";
import { MockArchitectureProvider, documentDiagram, reviewDiagram } from "./provider";
import { diagramSchema } from "@/lib/domain/schema";

describe("architecture AI contracts", () => {
  it("returns a schema-valid editable diagram", async () => {
    const diagram = await new MockArchitectureProvider().generate({ prompt: "Build a multi-tenant SaaS product with background jobs" });
    expect(diagramSchema.safeParse(diagram).success).toBe(true);
    expect(diagram.nodes.length).toBeGreaterThanOrEqual(6);
  });

  it("binds review and documentation to the diagram version", async () => {
    const diagram = await new MockArchitectureProvider().generate({ prompt: "Build an ecommerce backend with a database" });
    expect(reviewDiagram(diagram).every((finding) => finding.diagramVersion === diagram.version)).toBe(true);
    expect(documentDiagram(diagram)).toContain(`Diagram version ${diagram.version}`);
  });
});
