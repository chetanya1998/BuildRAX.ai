import { inngest } from "./client";
import dbConnect from "@/lib/mongodb";
import { Execution } from "@/lib/models/Execution";
import { buildWorkflowGraph } from "@/lib/graph/persistence";
import { runGraph } from "@/lib/runtime/engine";

type WorkflowExecuteEvent = {
  executionId: string;
  workflowId?: string;
  nodes?: unknown[];
  edges?: unknown[];
  graph?: Record<string, unknown>;
  userId?: string;
  modelProviderId?: string;
  modelId?: string;
};

export const executeWorkflowBackground = inngest.createFunction(
  { id: "execute-workflow", triggers: [{ event: "workflow.execute" }] },
  async ({ event, step }) => {
    const { executionId, workflowId, nodes, edges, graph, userId, modelProviderId, modelId } =
      event.data as WorkflowExecuteEvent;

    await step.run("connect-db", () => dbConnect());

    const executionRec = await step.run("fetch-execution", async () => {
      return await Execution.findById(executionId);
    });

    if (!executionRec) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const workflowGraph = buildWorkflowGraph({
      graph,
      nodes,
      edges,
      name: "Queued Workflow",
      description: "",
    });

    const result = await step.run("run-production-runtime", async () => {
      return runGraph({
        graph: workflowGraph,
        mode: "live",
        userId: userId || String(executionRec.userId),
        modelProviderId,
        modelId,
      });
    });

    await step.run("complete-execution", async () => {
      await Execution.findByIdAndUpdate(executionId, {
        status: result.summary.status,
        results: result.nodeResults,
        completedAt: new Date(),
      });
    });

    if (result.summary.status === "completed") {
      await step.sendEvent("user.reward_xp", {
        name: "user.reward_xp",
        data: {
          userId: executionRec.userId,
          type: "EXECUTE_WORKFLOW",
        },
      });
    }

    return {
      success: result.summary.status === "completed",
      workflowId,
      results: result.nodeResults,
      summary: result.summary,
    };
  }
);
