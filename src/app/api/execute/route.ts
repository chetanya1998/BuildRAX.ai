import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ExecutionEngine } from "@/lib/execution-engine";
import dbConnect from "@/lib/mongodb";
import { Execution } from "@/lib/models/Execution";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId, nodes, edges } = await req.json();

    if (!nodes || !edges) {
      return NextResponse.json({ error: "Missing nodes or edges" }, { status: 400 });
    }

    await dbConnect();
    
    // Log the execution request
    const executionRec = await Execution.create({
      workflowId: workflowId || null,
      userId: (session.user as any).id,
      status: "running"
    });

    const engine = new ExecutionEngine(nodes, edges);
    let order: string[];
    
    try {
      order = engine.getExecutionOrder();
    } catch (e: any) {
      executionRec.status = "failed";
      executionRec.completedAt = new Date();
      await executionRec.save();
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const nodeResults: any[] = [];
    const executionState: Record<string, any> = {};

    for (const nodeId of order) {
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) continue;

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
            // simple string replacement template
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

      executionState[nodeId] = output;
      nodeResults.push({
        nodeId,
        output,
        executionTimeMs: Date.now() - startTime,
        error
      });

      if (error) break; // Halts pipeline on first error
    }

    executionRec.status = nodeResults.some(r => r.error) ? "failed" : "completed";
    executionRec.results = nodeResults;
    executionRec.completedAt = new Date();
    await executionRec.save();

    return NextResponse.json({ 
      success: true, 
      executionId: executionRec._id,
      executionOrder: order,
      results: nodeResults
    });

  } catch (error: any) {
    console.error("Execution API Error:", error);
    return NextResponse.json({ error: "Failed to process workflow execution" }, { status: 500 });
  }
}
