import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";
import { BenchmarkRun } from "@/lib/models/BenchmarkRun";
import { TokenUsageRecord } from "@/lib/models/TokenUsageRecord";
import { consumeCredits, CREDIT_POLICY } from "@/lib/credits";
import { buildWorkflowGraph } from "@/lib/graph/persistence";
import { BenchmarkVariant, WorkflowGraph } from "@/lib/graph/types";
import { runGraph } from "@/lib/runtime/engine";
import { DEFAULT_GEMMA_MODEL } from "@/lib/ai-providers";
import { generateTextResult } from "@/lib/litellm";

type SessionUser = { id?: string };

function computeAssertionPassRate(nodeResults: Array<{ nodeType: string; status: string }>) {
  const assertions = nodeResults.filter((result) => result.nodeType === "assertionNode");
  if (assertions.length === 0) return 1;
  const passed = assertions.filter((result) => result.status === "completed").length;
  return passed / assertions.length;
}

function deriveModel(graph: WorkflowGraph) {
  return (
    graph.nodes.find((node) => node.type === "llmNode")?.data?.modelId ||
    graph.nodes.find((node) => node.type === "llmNode")?.data?.model ||
    "unknown"
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in with GitHub or Google to run benchmarks." },
        { status: 401 }
      );
    }

    const userId = String((session.user as SessionUser).id || "");
    const { id } = await params;
    const body = await req.json();

    await dbConnect();

    const workflow = await Workflow.findOne({
      _id: id,
      creatorId: userId,
      deletedAt: null,
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const baseGraph = buildWorkflowGraph({
      graph: body.baseGraph || workflow.graph,
      nodes: body.nodes || workflow.nodes,
      edges: body.edges || workflow.edges,
      name: workflow.name,
      description: workflow.description,
    });

    const variants: BenchmarkVariant[] = Array.isArray(body.variants)
      ? body.variants
      : [];

    if (variants.length === 0) {
      return NextResponse.json({ error: "At least one benchmark variant is required" }, { status: 400 });
    }

    await consumeCredits({
      userId,
      action: "benchmark_workflow",
      amount: Math.max(1, variants.length) * CREDIT_POLICY.benchmarkVariant,
      referenceType: "workflow",
      referenceId: id,
      metadata: { variantCount: variants.length },
    });

    const executedVariants = await Promise.all(
      variants.map(async (variant) => {
        const graph = buildWorkflowGraph({
          graph: variant.graph,
          name: variant.label,
          description: workflow.description,
        });

        const result = await runGraph({
          graph,
          mode: "test",
          scenario: body.scenario,
          userId,
          modelProviderId: body.modelProviderId,
          modelId: body.modelId,
        });

        return {
          variantId: variant.variantId,
          label: variant.label,
          model: deriveModel(graph),
          graph,
          result,
        };
      })
    );

    const maxLatency = Math.max(...executedVariants.map((entry) => entry.result.summary.latencyMs), 1);
    const maxTokens = Math.max(...executedVariants.map((entry) => entry.result.summary.tokenUsage), 1);
    const maxCost = Math.max(...executedVariants.map((entry) => entry.result.summary.cost), 1);

    const scores = await Promise.all(executedVariants.map(async (entry) => {
      const assertionPassRate = computeAssertionPassRate(entry.result.nodeResults);
      const errorRate = entry.result.summary.status === "failed" ? 1 : 0;
      const blockedRate = entry.result.summary.status === "blocked" ? 1 : 0;
      const latencyScore = 1 - entry.result.summary.latencyMs / maxLatency;
      const tokenScore = 1 - entry.result.summary.tokenUsage / maxTokens;
      const costScore = 1 - entry.result.summary.cost / maxCost;
      let qualityScore: number | undefined;
      let qualityNotes = "";

      if (body.scoringConfig?.qualityMode === "llm_judge") {
        const judge = await generateTextResult(
          `Score this workflow variant from 0 to 1 for production usefulness. Return JSON: {"score":0-1,"notes":"..."}.\nVariant: ${entry.label}\nModel: ${entry.model}\nRun summary: ${JSON.stringify(entry.result.summary)}\nNode results: ${JSON.stringify(entry.result.nodeResults).slice(0, 8000)}`,
          "You are a strict workflow evaluation judge. Penalize blocked setup, missing credentials, unsafe side effects, and failed assertions.",
          {
            userId,
            providerId: body.modelProviderId,
            modelId: body.modelId || DEFAULT_GEMMA_MODEL,
            temperature: 0,
            response_format: { type: "json_object" },
            max_tokens: 600,
          }
        );
        const parsed = JSON.parse(judge.text);
        qualityScore = Number(parsed.score || 0);
        qualityNotes = String(parsed.notes || "");
      }

      const totalScore = Number(
        (
          assertionPassRate * 0.4 +
          Math.max(0, latencyScore) * 0.2 +
          Math.max(0, tokenScore) * 0.1 +
          Math.max(0, costScore) * 0.1 +
          (qualityScore ?? 0.5) * 0.2 -
          errorRate * 0.3 -
          blockedRate * 0.4
        ).toFixed(4)
      );

      return {
        variantId: entry.variantId,
        latencyMs: entry.result.summary.latencyMs,
        errorRate,
        assertionPassRate,
        tokenUsage: entry.result.summary.tokenUsage,
        cost: entry.result.summary.cost,
        qualityScore,
        qualityNotes,
        totalScore,
        summary: entry.result.summary,
        analysis: entry.result.analysis,
        model: entry.model,
      };
    }));

    const rankedScores = [...scores].sort((a, b) => b.totalScore - a.totalScore);
    const winner = rankedScores[0];
    const runnerUp = rankedScores[1];
    const confidence = Number(
      Math.max(0.1, winner.totalScore - (runnerUp?.totalScore || 0)).toFixed(4)
    );

    const benchmarkRun = await BenchmarkRun.create({
      workflowId: workflow._id,
      userId,
      dataset: body.dataset || "",
      scoringConfig: body.scoringConfig || {},
      variants: executedVariants.map((entry) => ({
        variantId: entry.variantId,
        label: entry.label,
        model: entry.model,
        graph: entry.graph,
      })),
      scores,
      winnerVariantId: winner.variantId,
      confidence,
      summary: {
        baseGraph,
        scenario: body.scenario || {},
        winnerLabel: executedVariants.find((entry) => entry.variantId === winner.variantId)?.label,
      },
    });

    await TokenUsageRecord.create({
      userId,
      workflowId: String(workflow._id),
      runType: "benchmark",
      runId: String(benchmarkRun._id),
      tokenUsage: scores.reduce((sum, score) => sum + score.tokenUsage, 0),
      cost: Number(scores.reduce((sum, score) => sum + score.cost, 0).toFixed(4)),
      metadata: {
        variantCount: variants.length,
        winnerVariantId: winner.variantId,
      },
    });

    workflow.lifecycle = "benchmarked";
    await workflow.save();

    return NextResponse.json({
      runId: benchmarkRun._id,
      winnerVariantId: winner.variantId,
      confidence,
      scores,
      variants: executedVariants.map((entry) => ({
        variantId: entry.variantId,
        label: entry.label,
        model: entry.model,
      })),
    });
  } catch (error) {
    console.error("Benchmark error:", error);
    const message = error instanceof Error ? error.message : "Benchmark failed";
    const status = message === "Insufficient credits" ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
