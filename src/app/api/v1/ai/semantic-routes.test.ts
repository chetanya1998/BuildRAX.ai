import { describe, expect, it } from "vitest";
import { compileArchitectureRequest } from "@/lib/architecture-ir/compiler";
import { presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { POST as documentArchitecture } from "./documentation/route";
import { POST as reviewArchitecture } from "./reviews/route";
import { POST as exportArchitecture } from "../exports/route";

function fixture() {
  const result = compileArchitectureRequest(
    { prompt: "Build a secure multi-tenant SaaS with background work." },
    { id: "11111111-1111-4111-8111-111111111111", now: "2026-09-06T00:00:00.000Z" },
  );
  return { ...result, presentation: presentationFromDiagram(result.diagram) };
}

function request(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-buildrax-anonymous-session": crypto.randomUUID() },
    body: JSON.stringify(body),
  });
}

describe("semantic artifact APIs", () => {
  it("generates version-bound documentation from IR", async () => {
    const { diagram, ir, presentation } = fixture();
    const response = await documentArchitecture(request("/api/v1/ai/documentation", { diagram: { ...diagram, title: "Visual-only title" }, ir, presentation, irVersion: 7, persist: false }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.irVersion).toBe(7);
    expect(body.markdown).toContain(`# ${ir.intent.title}`);
    expect(body.markdown).toContain("Architecture IR version 7");
    expect(body.markdown).not.toContain("# Visual-only title");
  });

  it("returns advisory findings pinned to the requested IR version", async () => {
    const { diagram, ir, presentation } = fixture();
    const response = await reviewArchitecture(request("/api/v1/ai/reviews", { diagram, ir, presentation, irVersion: 4, persist: false }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ irVersion: 4, diagramVersion: 1, advisory: true, reviewRunId: null });
    expect(Array.isArray(body.findings)).toBe(true);
  });

  it("exports semantic JSON from IR and rejects mismatched presentation", async () => {
    const { diagram, ir, presentation } = fixture();
    const exported = await exportArchitecture(request("/api/v1/exports", { diagram, ir, irVersion: 3, format: "json" }));
    const exportBody = await exported.json();
    expect(JSON.parse(exportBody.content)).toMatchObject({ schemaVersion: "1.1.0", provenance: ir.provenance });

    const invalidPresentation = { ...presentation, components: presentation.components.slice(1) };
    const rejected = await documentArchitecture(request("/api/v1/ai/documentation", { diagram, ir, presentation: invalidPresentation, persist: false }));
    expect(rejected.status).toBe(422);
  });
});
