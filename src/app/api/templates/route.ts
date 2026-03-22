import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Template } from "@/lib/models/Template";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Fetch all public templates
    const templates = await Template.find({ isPublic: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
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

    const newTemplate = await Template.create({
      name: body.name || "Untitled Template",
      category: body.category || "Uncategorized",
      nodes: body.nodes || [],
      edges: body.edges || [],
      isPublic: body.isPublic !== undefined ? body.isPublic : false,
      authorId: (session.user as any).id,
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
