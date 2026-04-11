import { NextRequest, NextResponse } from "next/server";
import { analyzeGraph } from "@/lib/runtime/analyzer";
import { buildWorkflowGraph } from "@/lib/graph/persistence";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.graph && (!body?.nodes || !body?.edges)) {
      return NextResponse.json({ error: "Missing graph or node/edge payload" }, { status: 400 });
    }

    const graph = buildWorkflowGraph({
      graph: body.graph,
      nodes: body.nodes,
      edges: body.edges,
      name: body.name,
      description: body.description,
    });

    const result = analyzeGraph(graph);

    return NextResponse.json({
      ...result,
      rating: Math.max(1, Math.round(result.score / 10)),
      edgeCases: result.flaws,
      suggestions: result.suggestedScenarios,
    });

  } catch (error) {
    console.error("AI Architect Audit Error:", error);
    return NextResponse.json({ error: "Failed to audit workflow" }, { status: 500 });
  }
}
