// @vitest-environment node
import { it } from "vitest";
import { createConnector, createDiagram, createNode } from "@/lib/domain/factory";
import { architectureIRFromDiagram, createArchitectureSnapshot, presentationFromDiagram } from "./snapshot";
import { scenarioFromPath } from "./scenarios";
import { verifyLocalSnapshotPersistence } from "@/test/local-snapshot-db";

it.skipIf(process.env.DAY16_DATABASE_TESTS !== "1")("G03 survives real version saves, read-back, sharing and tenant authorization", async () => {
  const diagram = createDiagram("Scenario database test", [createNode("backend-service", "a", "A", 0, 0), createNode("backend-service", "b", "B", 300, 0)], [createConnector("ab", "a", "b", "http-rest", "Request")]);
  const ir = architectureIRFromDiagram(diagram);
  ir.scenarios = [scenarioFromPath(ir, { componentIds: ["a", "b"], flowIds: ["ab"] }, { id: "journey", name: "A to B", patternId: "microservices" })];
  const first = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, presentation: presentationFromDiagram(diagram) });
  const next = structuredClone(ir); next.scenarios![0].name = "Revised journey"; next.scenarios![0].revision = 2;
  const second = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 2, irVersion: 2, ir: next, presentation: first.presentation });
  await verifyLocalSnapshotPersistence(first, second);
});
