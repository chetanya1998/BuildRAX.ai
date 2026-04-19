import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";
import { SimulationRun } from "@/lib/models/SimulationRun";
import { TokenUsageRecord } from "@/lib/models/TokenUsageRecord";
import { consumeCredits, CREDIT_POLICY } from "@/lib/credits";
import { deterministicScenarioFromPrompt, runGraph } from "@/lib/runtime/engine";
import { buildWorkflowGraph } from "@/lib/graph/persistence";

type SessionUser = { id?: string };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in with GitHub or Google to run scenario evaluations." },
        { status: 401 }
      );
    }

    const userId = String((session.user as SessionUser).id || "");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    await dbConnect();

    const workflow = await Workflow.findOne({
      _id: id,
      creatorId: userId,
      deletedAt: null,
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    await consumeCredits({
      userId,
      action: "simulate_workflow",
      amount: CREDIT_POLICY.simulate,
      referenceType: "workflow",
      referenceId: id,
    });

    const graph = buildWorkflowGraph({
      graph: body.graph || workflow.graph,
      nodes: body.nodes || workflow.nodes,
      edges: body.edges || workflow.edges,
      name: body.name || workflow.name,
      description: body.description || workflow.description,
    });

    const scenario = body.scenarioPrompt
      ? deterministicScenarioFromPrompt(String(body.scenarioPrompt))
      : body.scenario;

    const result = await runGraph({
      graph,
      mode: "test",
      scenario,
      userId,
      modelProviderId: body.modelProviderId,
      modelId: body.modelId,
    });

    const run = await SimulationRun.create({
      workflowId: workflow._id,
      userId,
      graph,
      scenario: scenario || {},
      analysis: result.analysis,
      nodeResults: result.nodeResults,
      summary: result.summary,
      status: result.summary.status,
    });

    await TokenUsageRecord.create({
      userId,
      workflowId: String(workflow._id),
      runType: "test",
      runId: String(run._id),
      tokenUsage: result.summary.tokenUsage,
      cost: result.summary.cost,
      metadata: {
        nodeCount: graph.nodes.length,
        warningCount: result.summary.warnings.length,
      },
    });

    workflow.lifecycle = "simulated";
    workflow.graph = graph;
    workflow.nodes = graph.nodes;
    workflow.edges = graph.edges;
    workflow.lastSavedAt = new Date();
    await workflow.save();

    return NextResponse.json({
      runId: run._id,
      workflowId: workflow._id,
      mode: result.mode,
      analysis: result.analysis,
      nodeResults: result.nodeResults,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Scenario evaluation error:", error);
    const message = error instanceof Error ? error.message : "Scenario evaluation failed";
    const status = message === "Insufficient credits" ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
