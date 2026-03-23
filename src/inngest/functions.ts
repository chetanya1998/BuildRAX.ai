// @ts-nocheck
import { inngest } from "./client";
import dbConnect from "@/lib/mongodb";
import { Execution } from "@/lib/models/Execution";
import { ExecutionEngine } from "@/lib/execution-engine";

export const executeWorkflowBackground = inngest.createFunction(
  { id: "execute-workflow", event: "workflow.execute" },
  async ({ event, step }) => {
    const { executionId, nodes, edges } = event.data;

    await step.run("connect-db", () => dbConnect());

    let executionRec = await step.run("fetch-execution", async () => {
      return await Execution.findById(executionId);
    });

    if (!executionRec) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const engine = new ExecutionEngine(nodes, edges);
    let order: string[];
    
    try {
      order = await step.run("get-execution-order", async () => {
        return engine.getExecutionOrder();
      });
    } catch (e: any) {
      await step.run("fail-execution-loop", async () => {
        await Execution.findByIdAndUpdate(executionId, {
          status: "failed",
          completedAt: new Date(),
        });
      });
      throw e;
    }

    const nodeResults: any[] = [];
    const executionState: Record<string, any> = {};

    for (const nodeId of order) {
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) continue;

      const result = await step.run(`execute-node-${nodeId}`, async () => {
        const startTime = new Date();
        let output: any = null;
        let error: string | undefined = undefined;

        try {
          // Collect inputs from upstream nodes
          const incomingEdges = edges.filter((e: any) => e.target === nodeId);
          const inputs: any = {};
          incomingEdges.forEach((e: any) => {
            inputs[e.sourceHandle || "default"] = executionState[e.source];
          });

          // Evaluate based on node type
          const { evaluateNodeLogic } = await import("@/lib/node-evaluator");
          output = await evaluateNodeLogic(node, inputs);
        } catch (err: any) {
          error = err.message;
          output = null;
        }

        const endTime = new Date();
        return {
          nodeId,
          output,
          startedAt: startTime,
          completedAt: endTime,
          executionTimeMs: endTime.getTime() - startTime.getTime(),
          error
        };
      });

      executionState[nodeId] = result.output;
      nodeResults.push(result);

      if (result.error) break; // Halts pipeline on first error
    }

    const hasError = nodeResults.some((r) => r.error);

    await step.run("complete-execution", async () => {
      await Execution.findByIdAndUpdate(executionId, {
        status: hasError ? "failed" : "completed",
        results: nodeResults,
        completedAt: new Date(),
      });
    });

    if (!hasError) {
      await step.sendEvent("user.reward_xp", {
        name: "user.reward_xp",
        data: {
          userId: executionRec.userId,
          type: "EXECUTE_WORKFLOW",
        },
      });
    }

    return { success: !hasError, results: nodeResults };
  }
);
