import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const workflow = await Workflow.findById(id).lean();

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Optional: protect private workflows
    if (!workflow.isPublic) {
      const session = await getServerSession(authOptions);
      if (!session?.user || (workflow.creatorId as string).toString() !== (session.user as any).id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json(workflow);
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

    const body = await req.json();
    await dbConnect();

    const workflow = await Workflow.findOneAndUpdate(
      { _id: id, creatorId: (session.user as any).id },
      { $set: body },
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

    await dbConnect();

    const deleted = await Workflow.findOneAndDelete({
      _id: id,
      creatorId: (session.user as any).id,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
  }
}
