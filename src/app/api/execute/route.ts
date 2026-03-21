import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Execution, ExecutionStatus } from "@/lib/models/Execution";
import { Workflow } from "@/lib/models/Workflow";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeWorkflow } from "@/lib/execution-engine";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = await req.json();
    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    await dbConnect();

    const workflow = await Workflow.findOne({
      _id: workflowId,
      // @ts-ignore
      userId: session.user.id,
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const execution = await Execution.create({
      workflowId: workflow._id,
      status: ExecutionStatus.PENDING,
    });

    // In a real scenario with Inngest/Trigger.dev, you'd trigger the event here:
    // await inngest.send({ name: 'workflow.execute', data: { executionId: execution._id } });
    
    // For now, we simulate async background execution without waiting for it to finish.
    executeWorkflow(execution._id.toString()).catch(console.error);

    return NextResponse.json({ executionId: execution._id, status: execution.status }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET all executions for a specific workflow
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("workflowId");
    
    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID query parameter is required" }, { status: 400 });
    }

    await dbConnect();

    // Ensure the workflow belongs to the user
    const workflow = await Workflow.findOne({
      _id: workflowId,
      // @ts-ignore
      userId: session.user.id,
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const executions = await Execution.find({ workflowId }).sort({ createdAt: -1 });

    return NextResponse.json(executions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
