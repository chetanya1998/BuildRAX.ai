import type { Diagram } from "@/lib/domain/schema";
import { presentationTargets, type PresentationObject, type PresentationTarget } from "@/lib/architecture-ir/presentation-objects";

export type Bounds = { x: number; y: number; width: number; height: number };
export function targetBounds(diagram: Diagram, target: PresentationTarget): Bounds | undefined {
  if (target.kind === "flow") {
    const flow = diagram.connectors.find((item) => item.id === target.id);
    if (!flow) return;
    const from = diagram.nodes.find((item) => item.id === flow.source);
    const to = diagram.nodes.find((item) => item.id === flow.target);
    if (!from || !to) return;
    return unionBounds([from, to].map((item) => ({ ...item.position, ...item.dimensions })));
  }
  const item = (target.kind === "component" ? diagram.nodes : diagram.primitives).find((item) => item.id === target.id);
  return item ? { ...item.position, ...item.dimensions } : undefined;
}
export function unionBounds(items: Bounds[]): Bounds | undefined {
  if (!items.length) return;
  const x = Math.min(...items.map((item) => item.x));
  const y = Math.min(...items.map((item) => item.y));
  return { x, y, width: Math.max(...items.map((item) => item.x + item.width)) - x, height: Math.max(...items.map((item) => item.y + item.height)) - y };
}
export function objectBounds(diagram: Diagram, object: PresentationObject): Bounds | undefined {
  if (object.kind === "note") return { ...object.position, ...object.dimensions };
  if (object.kind === "annotation") {
    const anchor = targetBounds(diagram, object.anchor);
    return anchor ? { x: anchor.x + object.offset.x, y: anchor.y + object.offset.y, width: 220, height: 80 } : undefined;
  }
  return unionBounds(presentationTargets(object).map((ref) => targetBounds(diagram, ref)).filter((item): item is Bounds => !!item));
}

/** Moves only explicit spatial members; flow endpoints are not implicit members. */
export function movePresentationGroup(diagram: Diagram, group: PresentationObject, dx: number, dy: number): Diagram {
  if (group.kind !== "group" || !Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error("Invalid group movement.");
  const components = new Set(group.members.filter((item) => item.kind === "component").map((item) => item.id));
  const primitives = new Set(group.members.filter((item) => item.kind === "primitive").map((item) => item.id));
  return { ...diagram,
    nodes: diagram.nodes.map((item) => components.has(item.id) ? { ...item, position: { x: item.position.x + dx, y: item.position.y + dy }, metadata: { ...item.metadata, manualPosition: true } } : item),
    primitives: diagram.primitives.map((item) => primitives.has(item.id) ? { ...item, position: { x: item.position.x + dx, y: item.position.y + dy } } : item),
  };
}
