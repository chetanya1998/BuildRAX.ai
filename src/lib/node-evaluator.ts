import { runGraph } from "@/lib/runtime/engine";

export type Node = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

export async function evaluateNodeLogic(
  node: Node,
  inputs?: Record<string, unknown>
): Promise<unknown> {
  void inputs;
  const result = await runGraph({
    graph: {
      version: "1.0",
      metadata: {
        name: "Legacy single-node execution",
        mode: "live",
      },
      nodes: [
        {
          id: node.id,
          type: node.type,
          position: { x: 0, y: 0 },
          data: node.data || {},
        },
      ],
      edges: [],
    },
    mode: "live",
  });

  const nodeResult = result.nodeResults[0];
  if (!nodeResult) return null;
  if (nodeResult.status === "blocked") {
    throw new Error(nodeResult.blockedReason || "Node execution is blocked.");
  }
  if (nodeResult.status === "failed") {
    throw new Error(nodeResult.error || "Node execution failed.");
  }

  return nodeResult.outputs.default ?? nodeResult.outputs;
}
