import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Template } from "@/lib/models/Template";
import { Workflow } from "@/lib/models/Workflow";

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

    await dbConnect();
    
    const template = await Template.findById(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Deep copy template into a new Workflow owned by the current user
    const newWorkflow = await Workflow.create({
      name: `${template.name} (Cloned)`,
      description: template.description || `Cloned from ${template.name}`,
      nodes: template.nodes || [],
      edges: template.edges || [],
      viewport: { x: 0, y: 0, zoom: 1 },
      creatorId: (session.user as any).id,
      isPublic: false,
    });

    // Increment template clone count
    template.clones = (template.clones || 0) + 1;
    await template.save();

    return NextResponse.json({
      success: true,
      workflowId: newWorkflow._id,
    }, { status: 201 });

  } catch (error) {
    console.error("Template Cloning Error:", error);
    return NextResponse.json({ error: "Failed to clone template" }, { status: 500 });
  }
}
