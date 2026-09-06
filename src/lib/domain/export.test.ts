import { describe, expect, it } from "vitest";
import { createConnector, createDiagram, createNode } from "./factory";
import { buildArchitectureIR } from "@/lib/architecture-ir/compiler";
import { architectureIRToMermaid, safeFilename, toMermaid } from "./export";

describe("exports", () => {
  it("creates safe bounded filenames", () => {
    expect(safeFilename("../../Customer <Platform>", "json")).toBe("customer-platform.json");
  });

  it("exports a directed Mermaid flow", () => {
    const a = createNode("browser", "browser", "Browser", 0, 0);
    const b = createNode("backend-service", "api", "API", 200, 0);
    const output = toMermaid(createDiagram("Flow", [a, b], [createConnector("e", "browser", "api", "http-rest", "HTTPS")]));
    expect(output).toContain("flowchart LR");
    expect(output).toContain('browser -->|"HTTPS"| api');
  });

  it("exports semantic Mermaid directly from Architecture IR", () => {
    const ir = buildArchitectureIR({ prompt: "Build a secure multi-tenant SaaS with asynchronous jobs." });
    const output = architectureIRToMermaid(ir);
    expect(output).toContain("flowchart LR");
    expect(output).toContain(ir.components[0].name);
    expect(output).toContain(mermaidSafe(ir.flows[0].source));
  });
});

function mermaidSafe(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}
