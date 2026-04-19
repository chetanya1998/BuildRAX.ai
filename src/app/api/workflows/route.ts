import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";
import { inngest } from "@/inngest/client";
import { buildWorkflowGraph, DEFAULT_VIEWPORT } from "@/lib/graph/persistence";

type SessionUser = { id?: string };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required to list workflows." }, { status: 401 });
    }

    const userId = String((session.user as SessionUser).id || "");
    await dbConnect();

    // Fetch workflows for the logged in user
    const workflows = await Workflow.find({
      creatorId: userId,
      deletedAt: null,
      lifecycle: { $ne: "soft_deleted" },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      workflows: workflows.map((workflow: Record<string, unknown>) => ({
        ...workflow,
        nodes:
          ((workflow.graph as { nodes?: unknown[] } | undefined)?.nodes as unknown[]) ||
          (workflow.nodes as unknown[]) ||
          [],
        edges:
          ((workflow.graph as { edges?: unknown[] } | undefined)?.edges as unknown[]) ||
          (workflow.edges as unknown[]) ||
          [],
      })),
    });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required to save workflows." }, { status: 401 });
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

    const newWorkflow = await Workflow.create({
      name: graph.metadata.name || body.name || "Untitled Workflow",
      description: graph.metadata.description || body.description || "",
      graph,
      nodes: graph.nodes,
      edges: graph.edges,
      viewport: body.viewport || DEFAULT_VIEWPORT,
      creatorId: userId,
      isPublic: body.isPublic || false,
      lifecycle: body.lifecycle || "draft",
      graphVersion: graph.version,
      sourceBlueprintSlug: body.sourceBlueprintSlug || "",
      metadata: graph.metadata || {},
      lastSavedAt: new Date(),
    });

    try {
      await inngest.send({
        name: "user.reward_xp",
        data: {
          userId,
          type: "CREATE_WORKFLOW",
        },
      });
    } catch (inngestError) {
      console.error("Failed to send reward event:", inngestError);
    }

    return NextResponse.json(newWorkflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
