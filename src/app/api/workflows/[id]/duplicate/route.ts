import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";

type SessionUser = { id?: string };

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const userId = String((session.user as SessionUser).id || "");
  await dbConnect();
  const workflow = await Workflow.findOne({ _id: id, creatorId: userId, deletedAt: null }).lean();
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  const duplicate = await Workflow.create({
    name: `${workflow.name} Copy`,
    description: workflow.description,
    graph: workflow.graph,
    nodes: workflow.nodes,
    edges: workflow.edges,
    viewport: workflow.viewport,
    creatorId: userId,
    isPublic: false,
    lifecycle: "draft",
    graphVersion: workflow.graphVersion || "1.0",
    sourceBlueprintSlug: workflow.sourceBlueprintSlug || "",
    metadata: workflow.metadata || {},
  });
  return NextResponse.json({ workflowId: duplicate._id, workflow: duplicate });
}
