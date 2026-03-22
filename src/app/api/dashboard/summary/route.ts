import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Workflow } from "@/lib/models/Workflow";
import { Template } from "@/lib/models/Template";
import { LessonProgress } from "@/lib/models/LessonProgress";
import { getProgressSummary } from "@/lib/gamification";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    // Parallel fetching for high performance
    const [user, workflows, featuredTemplates, learnProgress] = await Promise.all([
      User.findById(userId).lean(),
      Workflow.find({ creatorId: userId }).sort({ updatedAt: -1 }).limit(4).lean(),
      Template.find({ isPublic: true }).sort({ clones: -1, createdAt: -1 }).limit(3).lean(),
      LessonProgress.findOne({ userId }).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const progress = getProgressSummary(user.xp || 0);

    return NextResponse.json({
      user: {
        ...progress,
        badges: user.badges || [],
        name: user.name,
        email: user.email,
        image: user.image,
      },
      recentWorkflows: workflows,
      featuredTemplates: featuredTemplates,
      learnProgress: learnProgress || { currentModuleId: "intro-nodes", completedModules: [] },
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard summary" }, { status: 500 });
  }
}
