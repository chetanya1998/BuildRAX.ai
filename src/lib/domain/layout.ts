import ELK from "elkjs/lib/elk.bundled.js";
import type { Diagram } from "./schema";

const elk = new ELK();

type Rect = { x: number; y: number; width: number; height: number };

function collides(a: Rect, b: Rect, padding = 40) {
  return a.x < b.x + b.width + padding && a.x + a.width + padding > b.x && a.y < b.y + b.height + padding && a.y + a.height + padding > b.y;
}

function collisionFreeOffset(layout: Rect[], obstacles: Rect[]) {
  if (!obstacles.length) return { x: 0, y: 0 };
  for (let ring = 0; ring < 20; ring += 1) {
    const step = ring * 80;
    const candidates = ring === 0 ? [{ x: 0, y: 0 }] : [
      { x: step, y: 0 }, { x: 0, y: step }, { x: -step, y: 0 }, { x: 0, y: -step },
      { x: step, y: step }, { x: -step, y: step }, { x: step, y: -step }, { x: -step, y: -step },
    ];
    const safe = candidates.find((offset) => !layout.some((node) => obstacles.some((obstacle) => collides({ ...node, x: node.x + offset.x, y: node.y + offset.y }, obstacle))));
    if (safe) return safe;
  }
  return { x: 0, y: 0 };
}

export async function autoLayout(diagram: Diagram) {
  const graph = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "70",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
    },
    children: diagram.nodes.map((node) => ({ id: node.id, width: node.dimensions.width, height: node.dimensions.height })),
    edges: diagram.connectors.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  });
  const layout = (graph.children ?? []).map((node) => ({ id: node.id, x: node.x ?? 0, y: node.y ?? 0, width: node.width ?? 0, height: node.height ?? 0 }));
  const offset = collisionFreeOffset(layout, diagram.primitives.map((item) => ({ x: item.position.x, y: item.position.y, width: item.dimensions.width, height: item.dimensions.height })));
  const positions = new Map(layout.map((node) => [node.id, { x: node.x + offset.x, y: node.y + offset.y }]));
  return { ...diagram, nodes: diagram.nodes.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })) };
}
