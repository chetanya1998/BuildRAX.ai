import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Template } from "@/lib/models/Template";
import { inngest } from "@/inngest/client";

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

    const isFirstTemplate = (await Template.countDocuments({ authorId: (session.user as any).id })) === 1;

    try {
      // Standard publish XP
      await inngest.send({
        name: "user.reward_xp",
        data: {
          userId: (session.user as any).id,
          type: "PUBLISH_TEMPLATE",
        },
      });

      // Extra reward if it's the first time
      if (isFirstTemplate) {
        await inngest.send({
          name: "user.reward_xp",
          data: {
            userId: (session.user as any).id,
            type: "FIRST_PUBLISH_REWARD",
          },
        });
      }
    } catch (inngestError) {
      console.error("Failed to send reward event for template:", inngestError);
    }

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
