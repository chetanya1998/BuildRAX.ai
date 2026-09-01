import { describe, expect, it } from "vitest";
import { createConnector, createDiagram, createNode } from "./factory";
import { safeFilename, toMermaid } from "./export";

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
});
