import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";
import { buildWorkflowGraph, normalizeLifecycle } from "@/lib/graph/persistence";

type SessionUser = { id?: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const workflow = await Workflow.findOne({
      _id: id,
      deletedAt: null,
      lifecycle: { $ne: "soft_deleted" },
    }).lean();

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Optional: protect private workflows
    if (!workflow.isPublic) {
      const session = await getServerSession(authOptions);
      const userId = String((session?.user as SessionUser | undefined)?.id || "");
      if (!session?.user || (workflow.creatorId as string).toString() !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({
      ...workflow,
      nodes: workflow.graph?.nodes || workflow.nodes || [],
      edges: workflow.graph?.edges || workflow.edges || [],
    });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json({ error: "Failed to fetch workflow" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String((session.user as SessionUser).id || "");
    const body = await req.json();
    await dbConnect();
    const graph = buildWorkflowGraph({
      graph: body.graph,
      nodes: body.nodes,
      edges: body.edges,
      name: body.name,
      description: body.description,
    });
    const updatePayload: Record<string, unknown> = {
      name: body.name || graph.metadata.name || "Untitled Workflow",
      description: body.description || graph.metadata.description || "",
      graph,
      nodes: graph.nodes,
      edges: graph.edges,
      lifecycle: normalizeLifecycle(body.lifecycle),
      sourceBlueprintSlug: body.sourceBlueprintSlug || "",
      metadata: graph.metadata || {},
      lastSavedAt: new Date(),
    };

    if (body.viewport) {
      updatePayload.viewport = body.viewport;
    }

    if (typeof body.isPublic === "boolean") {
      updatePayload.isPublic = body.isPublic;
    }

    const workflow = await Workflow.findOneAndUpdate(
      { _id: id, creatorId: userId },
      {
        $set: updatePayload,
      },
      { new: true }
    );

    if (!workflow) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String((session.user as SessionUser).id || "");
    await dbConnect();

    const deleted = await Workflow.findOneAndUpdate(
      {
        _id: id,
        creatorId: userId,
        deletedAt: null,
      },
      {
        $set: {
          lifecycle: "soft_deleted",
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedAt: deleted.deletedAt });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}
