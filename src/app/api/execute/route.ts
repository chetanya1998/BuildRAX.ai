import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Execution } from "@/lib/models/Execution";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId, nodes, edges } = await req.json();

    if (!nodes || !edges) {
      return NextResponse.json({ error: "Missing nodes or edges" }, { status: 400 });
    }

    await dbConnect();
    
    // Log the execution request
    const executionRec = await Execution.create({
      workflowId: workflowId || null,
      userId: (session.user as any).id,
      status: "running"
    });

    // Dispatch the task to the Inngest queue instead of running it here
    await inngest.send({
      name: "workflow.execute",
      data: {
        executionId: executionRec._id.toString(),
        workflowId,
        nodes,
        edges,
      },
    });

    return NextResponse.json({ 
      success: true, 
      executionId: executionRec._id,
      status: "queued"
    });

  } catch (error: any) {
    console.error("Execution API Error:", error);
    return NextResponse.json({ error: "Failed to process workflow execution" }, { status: 500 });
  }
}
