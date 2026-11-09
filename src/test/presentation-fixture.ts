import { createConnector, createDiagram, createNode } from "@/lib/domain/factory";

export function presentationFixture() {
  const diagram = createDiagram("Presentation acceptance", [
    createNode("backend-service", "a", "Service A", 100, 100),
    createNode("backend-service", "b", "Service B", 400, 100),
    createNode("backend-service", "c", "Outside group", 100, 400),
  ], [createConnector("ab", "a", "b", "http-rest", "Request")]);
  diagram.primitives = [{ id: "shape", kind: "rectangle", text: "Boundary", position: { x: 100, y: 250 }, dimensions: { width: 100, height: 80 }, style: {} }];
  const base = { schemaVersion: "1.0.0" as const, revision: 1, zIndex: 1 };
  diagram.presentationObjects = [
    { ...base, id: "note", kind: "note", text: "Keep this decision", position: { x: 750, y: 100 }, dimensions: { width: 200, height: 140 }, color: "#ffe8a3" },
    { ...base, id: "annotation", kind: "annotation", text: "Confirm ownership", anchor: { kind: "component", id: "a" }, offset: { x: 0, y: -80 } },
    { ...base, id: "highlight", kind: "highlight", targets: [{ kind: "flow", id: "ab" }], color: "#112233", opacity: .2 },
    { ...base, id: "group", kind: "group", name: "Service boundary", members: [{ kind: "component", id: "a" }, { kind: "component", id: "b" }, { kind: "primitive", id: "shape" }] },
    { ...base, id: "focus", kind: "focus", name: "Entry point", targets: [{ kind: "component", id: "b" }], viewport: { x: 10, y: 20, zoom: .8 } },
  ];
  return diagram;
}
