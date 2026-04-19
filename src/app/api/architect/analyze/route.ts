import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_GEMMA_MODEL } from "@/lib/ai-providers";
import { buildWorkflowGraph } from "@/lib/graph/persistence";
import { analyzeGraph } from "@/lib/runtime/analyzer";
import { generateTextResult } from "@/lib/litellm";

type SessionUser = { id?: string };

function parseAuditJson(text: string) {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  const json = first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
  return JSON.parse(json);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required to run AI audits." }, { status: 401 });
    }

    const body = await req.json();

    if (!body?.graph && (!body?.nodes || !body?.edges)) {
      return NextResponse.json({ error: "Missing graph or node/edge payload" }, { status: 400 });
    }

    const userId = String((session.user as SessionUser).id || "");
    const graph = buildWorkflowGraph({
      graph: body.graph,
      nodes: body.nodes,
      edges: body.edges,
      name: body.name,
      description: body.description,
    });

    const staticAnalysis = analyzeGraph(graph);
    const modelResult = await generateTextResult(
      `Audit this BuildRAX workflow for production automation readiness.

Return ONLY JSON with this shape:
{
  "score": 0-100,
  "readiness": "ready_for_test|needs_setup|unsafe_for_live",
  "feedback": "short summary",
  "findings": [{"severity":"critical|high|medium|low","area":"security|credentials|runtime|prompt|cost|latency|data","message":"...","fix":"..."}],
  "missingSetup": [],
  "securityFindings": [],
  "promptFindings": [],
  "costRisk": "low|medium|high",
  "latencyRisk": "low|medium|high",
  "suggestedScenarios": [],
  "recommendedNextAction": "..."
}

Static analysis:
${JSON.stringify(staticAnalysis)}

Workflow graph:
${JSON.stringify(graph)}`,
      "You are a senior production AI workflow auditor. Be strict: missing credentials, fake endpoints, unsafe side effects, and unclear prompts must be called out.",
      {
        userId,
        providerId: body.modelProviderId,
        modelId: body.modelId || DEFAULT_GEMMA_MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 2500,
      }
    );

    const aiAudit = parseAuditJson(modelResult.text);

    return NextResponse.json({
      ...staticAnalysis,
      ...aiAudit,
      staticAnalysis,
      rating: Math.max(1, Math.round(Number(aiAudit.score || 0) / 20)),
      edgeCases: aiAudit.findings || staticAnalysis.flaws,
      suggestions: aiAudit.suggestedScenarios || staticAnalysis.suggestedScenarios,
      usage: modelResult.usage,
    });
  } catch (error) {
    console.error("AI Architect Audit Error:", error);
    const message = error instanceof Error ? error.message : "Failed to audit workflow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
