import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { ExportType, generateExport } from "@/lib/backend/exports";
import { buildWorkflowGraph } from "@/lib/graph/persistence";
import { ExportArtifact } from "@/lib/models/ExportArtifact";
import { Workflow } from "@/lib/models/Workflow";

type SessionUser = { id?: string };

const exportTypes: ExportType[] = ["workflow_json", "mermaid", "developer_handoff", "api_contract", "security_checklist", "simulation_report"];

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
    const type = exportTypes.includes(body.type) ? body.type : "developer_handoff";

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
    const content = generateExport(graph, type);
    const artifact = await ExportArtifact.create({ workflowId: id, userId, type, contentSnapshot: content });
    workflow.lifecycle = "exported";
    workflow.metadata = { ...(workflow.metadata || {}), latestExportId: artifact._id, latestExportType: type };
    await workflow.save();
    return NextResponse.json({ exportId: artifact._id, type, content });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const userId = String((session.user as SessionUser).id || "");
  await dbConnect();
  const exports = await ExportArtifact.find({ workflowId: id, userId }).sort({ createdAt: -1 }).limit(30).lean();
  return NextResponse.json({ exports });
}
