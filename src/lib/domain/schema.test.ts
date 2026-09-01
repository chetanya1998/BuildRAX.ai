import { describe, expect, it } from "vitest";
import { createConnector, createDiagram, createNode } from "./factory";
import { diagramSchema } from "./schema";

describe("diagram schema", () => {
  it("round-trips a valid semantic diagram without loss", () => {
    const browser = createNode("browser", "browser", "Browser", 0, 0);
    const api = createNode("backend-service", "api", "API", 300, 0);
    const diagram = createDiagram("Valid architecture", [browser, api], [createConnector("edge", "browser", "api", "http-rest", "HTTPS")]);
    expect(diagramSchema.parse(JSON.parse(JSON.stringify(diagram)))).toEqual(diagram);
  });

  it("rejects connectors that reference missing nodes", () => {
    const browser = createNode("browser", "browser", "Browser", 0, 0);
    const diagram = createDiagram("Invalid architecture", [browser], [createConnector("edge", "browser", "missing", "http-rest")]);
    expect(() => diagramSchema.parse(diagram)).toThrow(/missing node/i);
  });

  it("rejects HTML-like content in user-editable text", () => {
    const node = createNode("browser", "browser", "<img src=x>", 0, 0);
    expect(() => diagramSchema.parse(createDiagram("Unsafe", [node]))).toThrow(/HTML-like/i);
  });
});
