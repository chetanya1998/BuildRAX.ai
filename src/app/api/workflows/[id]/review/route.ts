import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { buildWorkflowGraph } from "@/lib/graph/persistence";
import { runWorkflowReview } from "@/lib/backend/review";
import { ReviewRun } from "@/lib/models/ReviewRun";
import { Workflow } from "@/lib/models/Workflow";

type SessionUser = { id?: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { id } = await params;
    const userId = String((session.user as SessionUser).id || "");
    const body = await req.json().catch(() => ({}));
    await dbConnect();

    const workflow = await Workflow.findOne({ _id: id, creatorId: userId, deletedAt: null });
    if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

    const graph = buildWorkflowGraph({
      graph: body.graph || workflow.graph,
      nodes: body.nodes || workflow.nodes,
      edges: body.edges || workflow.edges,
      name: body.name || workflow.name,
      description: body.description || workflow.description,
    });
    const result = runWorkflowReview(graph);

    const reviewRun = await ReviewRun.create({ workflowId: id, userId, graph, result, status: result.status });
    workflow.latestReviewId = reviewRun._id;
    workflow.lifecycle = result.status === "blocked" ? "has_critical_issues" : "reviewed";
    workflow.metadata = { ...(workflow.metadata || {}), latestReview: result };
    await workflow.save();

    return NextResponse.json({ reviewId: reviewRun._id, result });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json({ error: "Failed to run review" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const { id } = await params;
    const userId = String((session.user as SessionUser).id || "");
    await dbConnect();
    const reviews = await ReviewRun.find({ workflowId: id, userId }).sort({ createdAt: -1 }).limit(20).lean();
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Failed to list reviews" }, { status: 500 });
  }
}
