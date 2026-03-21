import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch workflows for the logged in user
    const workflows = await Workflow.find({ creatorId: (session.user as any).id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    const newWorkflow = await Workflow.create({
      name: body.name || "Untitled Workflow",
      description: body.description || "",
      nodes: body.nodes || [],
      edges: body.edges || [],
      viewport: body.viewport || { x: 0, y: 0, zoom: 1 },
      creatorId: (session.user as any).id,
      isPublic: body.isPublic || false,
    });

    return NextResponse.json(newWorkflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
