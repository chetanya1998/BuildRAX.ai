import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { LessonProgress } from "@/lib/models/LessonProgress";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId } = await req.json();
    if (!moduleId) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
    }

    await dbConnect();
    const userId = (session.user as any).id;

    const progress = await LessonProgress.findOne({ userId });
    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    // Add to completed if not already there
    if (!progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
      
      try {
        await inngest.send({
          name: "user.reward_xp",
          data: {
            userId,
            type: "COMPLETE_LESSON",
          },
        });
      } catch (inngestError) {
        console.error("Failed to send reward event for lesson complete:", inngestError);
      }
    }

    progress.lastActiveAt = new Date();
    await progress.save();

    return NextResponse.json({ 
        success: true, 
        completedModules: progress.completedModules,
    });
  } catch (error) {
    console.error("Error completing lesson:", error);
    return NextResponse.json({ error: "Failed to complete lesson" }, { status: 500 });
  }
}
