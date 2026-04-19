import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";
import { Execution } from "@/lib/models/Execution";
import { inngest } from "@/inngest/client";

type SessionUser = { id?: string };

export async function POST(
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
    
    // Validate workflow ownership
    const workflow = await Workflow.findOne({
      _id: id,
      creatorId: userId,
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Create execution record
    const executionRec = await Execution.create({
      workflowId: workflow._id,
      userId,
      status: "running"
    });

    // Dispatch to Inngest for background execution
    await inngest.send({
      name: "workflow.execute",
      data: {
        executionId: executionRec._id.toString(),
        workflowId: workflow._id.toString(),
        userId,
        graph: workflow.graph,
        nodes: workflow.nodes,
        edges: workflow.edges,
      },
    });

    return NextResponse.json({
      success: true,
      executionId: executionRec._id,
      status: "queued"
    });

  } catch (error) {
    console.error("Quick Run Error:", error);
    return NextResponse.json({ error: "Failed to trigger quick run" }, { status: 500 });
  }
}
