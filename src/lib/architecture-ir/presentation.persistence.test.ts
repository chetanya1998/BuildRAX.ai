// @vitest-environment node
import { expect, it } from "vitest";
import { presentationFixture } from "@/test/presentation-fixture";
import { verifyLocalSnapshotPersistence } from "@/test/local-snapshot-db";
import { movePresentationGroup } from "@/components/editor/presentation-geometry";
import { architectureIRFromDiagram, createArchitectureSnapshot, presentationFromDiagram } from "./snapshot";

it.skipIf(process.env.DAY16_DATABASE_TESTS !== "1")("all five P01 objects survive real saves, immutable reads, sharing and tenant isolation", async () => {
  const diagram = presentationFixture();
  const ir = architectureIRFromDiagram(diagram);
  const first = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 1, irVersion: 1, ir, presentation: presentationFromDiagram(diagram) });
  const moved = movePresentationGroup(diagram, diagram.presentationObjects![3], 20, 0);
  const second = await createArchitectureSnapshot({ diagramId: diagram.id, diagramVersion: 2, irVersion: 1, ir: architectureIRFromDiagram(moved, ir), presentation: presentationFromDiagram(moved) });
  expect(second.checksums.ir).toBe(first.checksums.ir);
  expect(second.checksums.presentation).not.toBe(first.checksums.presentation);
  expect(second.materializedDiagram.presentationObjects).toHaveLength(5);
  await verifyLocalSnapshotPersistence(first, second);
});
