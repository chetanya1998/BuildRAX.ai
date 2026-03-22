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
        const startTime = Date.now();
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
          switch (node.type) {
            case "inputNode":
              output = node.data?.value || "";
              break;
              
            case "promptNode":
              let promptText = node.data?.template || "";
              for (const [key, val] of Object.entries(inputs)) {
                promptText = promptText.replace(`{{${key}}}`, String(val));
              }
              output = promptText;
              break;
              
            case "llmNode":
              const systemPrompt = node.data?.systemPrompt || "";
              const userPrompt = inputs["prompt"] || inputs["default"] || "";
              const { generateText } = await import("@/lib/litellm");
              
              output = await generateText(userPrompt, systemPrompt, {
                model: node.data?.model,
                temperature: node.data?.temperature
              });
              break;
              
            case "outputNode":
              output = inputs["default"] || Object.values(inputs)[0] || "";
              break;
              
            default:
              output = `Unsupported node type: ${node.type}`;
          }
        } catch (err: any) {
          error = err.message;
          output = null;
        }

        return {
          nodeId,
          output,
          executionTimeMs: Date.now() - startTime,
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
