import ELK from "elkjs/lib/elk.bundled.js";
import type { Diagram } from "./schema";

const elk = new ELK();

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
  const positions = new Map(graph.children?.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]) ?? []);
  return { ...diagram, nodes: diagram.nodes.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })) };
}
