import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { generateMermaid } from "@/lib/backend/mermaid";
import { buildWorkflowGraph } from "@/lib/graph/persistence";
import { Workflow } from "@/lib/models/Workflow";

type SessionUser = { id?: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    name: workflow.name,
    description: workflow.description,
  });
  const mermaid = generateMermaid(graph);
  workflow.metadata = { ...(workflow.metadata || {}), mermaid };
  await workflow.save();
  return NextResponse.json({ mermaid });
}
