import { describe, expect, it } from "vitest";
import { createDiagram, createNode } from "./factory";
import { autoLayout } from "./layout";
import { architectureIRFromDiagram, architecturePresentationSchema, canonicalSha256, materializeArchitecture, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";

describe("manual layout preservation", () => {
  it("preserves fixed nodes and places other nodes deterministically without overlap", async () => {
    const fixed = createNode("backend-service", "fixed", "Fixed", 12, 12);
    fixed.metadata.manualPosition = true;
    const input = createDiagram("Layout", [fixed, createNode("backend-service", "new", "New", 12, 12)]);
    const before = structuredClone(input);
    const result = await autoLayout(input);
    expect(input).toEqual(before);
    expect(result.nodes[0]).toEqual(fixed);
    const position = result.nodes[1].position;
    expect(position.x >= 272 || position.y >= 164 || position.x + 260 <= 12 || position.y + 152 <= 12).toBe(true);
    expect(await autoLayout(input)).toEqual(result);
  });

  it("escapes obstacles larger than the bounded collision search", async () => {
    const input = createDiagram("Large obstacle", [createNode("backend-service", "new", "New", 0, 0)]);
    input.primitives.push({ id: "frame", kind: "frame", position: { x: -10000, y: -10000 }, dimensions: { width: 20000, height: 20000 }, text: "", style: {} });
    const result = await autoLayout(input);
    expect(result.nodes[0].position.x).toBeGreaterThanOrEqual(10040);
  });

  it("arranges 15 nodes without changing their semantic checksum", async () => {
    const input = createDiagram("Dense layout", Array.from({ length: 15 }, (_, i) => createNode("backend-service", `node-${i}`, `Service ${i}`, 0, 0)));
    const ir = architectureIRFromDiagram(input);
    const result = await autoLayout(input);
    expect(await canonicalSha256(architectureIRFromDiagram(result, ir))).toEqual(await canonicalSha256(ir));
    for (let i = 0; i < result.nodes.length; i++) for (let j = i + 1; j < result.nodes.length; j++) {
      const a = result.nodes[i]; const b = result.nodes[j];
      expect(a.position.x + a.dimensions.width <= b.position.x || b.position.x + b.dimensions.width <= a.position.x || a.position.y + a.dimensions.height <= b.position.y || b.position.y + b.dimensions.height <= a.position.y).toBe(true);
    }
  });

  it("does no work for empty or entirely manual diagrams", async () => {
    const input = createDiagram("Empty");
    expect(await autoLayout(input)).toBe(input);
    input.nodes.push(createNode("backend-service", "fixed", "Fixed", 0, 0));
    input.nodes[0].metadata.manualPosition = true;
    expect(await autoLayout(input)).toBe(input);
  });

  it("round trips manual positions through presentation without changing semantic identity", async () => {
    const input = createDiagram("Manual layout", [createNode("backend-service", "fixed", "Fixed", 100, 200)]);
    const ir = architectureIRFromDiagram(input);
    const legacy = presentationFromDiagram(input);
    expect(architecturePresentationSchema.parse(legacy)).toEqual(legacy);
    expect(legacy.components[0]).not.toHaveProperty("manualPosition");
    input.nodes[0].metadata.manualPosition = true;
    const presentation = presentationFromDiagram(input);
    expect(presentation.components[0].manualPosition).toBe(true);
    const restored = materializeArchitecture(ir, presentation, { id: input.id, version: 1 });
    expect(restored.nodes[0].metadata.manualPosition).toBe(true);
    expect(restored.nodes[0].position).toEqual(input.nodes[0].position);
    expect(await canonicalSha256(architectureIRFromDiagram(input, ir))).toEqual(await canonicalSha256(architectureIRFromDiagram(createDiagram("Manual layout", [createNode("backend-service", "fixed", "Fixed", 100, 200)]), ir)));
  });
});
