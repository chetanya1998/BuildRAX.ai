import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Template } from "@/lib/models/Template";
import { Workflow } from "@/lib/models/Workflow";
import { AGENT_TEMPLATES } from "@/lib/data/templates";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    let tmplData = AGENT_TEMPLATES.find((t) => t.id === id) as any;
    let isStatic = !!tmplData;

    if (!tmplData) {
      tmplData = await Template.findById(id);
      if (!tmplData) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
    }

    // Deep copy template into a new Workflow owned by the current user
    const newWorkflow = await Workflow.create({
      name: `${tmplData.title || tmplData.name} (Cloned)`,
      description: tmplData.description || `Cloned from ${tmplData.title || tmplData.name}`,
      nodes: tmplData.nodes || [],
      edges: tmplData.edges || [],
      viewport: { x: 0, y: 0, zoom: 1 },
      creatorId: (session.user as any).id,
      isPublic: false,
    });

    // Increment template clone count if it's a dynamic template in DB
    if (!isStatic) {
      tmplData.clones = (tmplData.clones || 0) + 1;
      await tmplData.save();
    }

    return NextResponse.json({
      success: true,
      workflowId: newWorkflow._id,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Template Cloning Error:", error);
    return NextResponse.json({ error: error.message || "Failed to clone template" }, { status: 500 });
  }
}
