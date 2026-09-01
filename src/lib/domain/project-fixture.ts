import { templates } from "./templates";
import type { Diagram } from "./schema";

export function getProjectFixture(projectId: string): Diagram {
  const diagram = structuredClone(templates[0].diagram);
  diagram.id = projectId;
  diagram.title = projectId === "demo" ? "Customer operations platform" : diagram.title;
  return diagram;
}
