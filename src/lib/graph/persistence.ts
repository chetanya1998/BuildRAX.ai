import { WorkflowGraph, WorkflowLifecycle } from "./types";

export const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export function buildWorkflowGraph(input: {
  graph?: Partial<WorkflowGraph> | null;
  nodes?: unknown[];
  edges?: unknown[];
  name?: string;
  description?: string;
}): WorkflowGraph {
  if (input.graph?.nodes && input.graph?.edges) {
    return {
      version: "1.0",
      nodes: input.graph.nodes as WorkflowGraph["nodes"],
      edges: input.graph.edges as WorkflowGraph["edges"],
      metadata: {
        name:
          input.graph.metadata?.name ||
          input.name ||
          "Untitled Workflow",
        description:
          input.graph.metadata?.description ||
          input.description ||
          "",
        mode: input.graph.metadata?.mode || "design",
        tags: input.graph.metadata?.tags || [],
        assumptions: input.graph.metadata?.assumptions || [],
        riskWarnings: input.graph.metadata?.riskWarnings || [],
        suggestedScenarios: input.graph.metadata?.suggestedScenarios || [],
      },
    };
  }

  return {
    version: "1.0",
    nodes: (input.nodes || []) as WorkflowGraph["nodes"],
    edges: (input.edges || []) as WorkflowGraph["edges"],
    metadata: {
      name: input.name || "Untitled Workflow",
      description: input.description || "",
      mode: "design",
      tags: [],
      assumptions: [],
      riskWarnings: [],
      suggestedScenarios: [],
    },
  };
}

export function normalizeLifecycle(value?: string): WorkflowLifecycle {
  if (
    value === "draft" ||
    value === "simulated" ||
    value === "benchmarked" ||
    value === "published" ||
    value === "archived" ||
    value === "soft_deleted"
  ) {
    return value;
  }

  return "draft";
}
