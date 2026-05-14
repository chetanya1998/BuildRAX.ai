import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Workflow } from "@/lib/models/Workflow";
import { Template } from "@/lib/models/Template";
import { LessonProgress } from "@/lib/models/LessonProgress";
import { getProgressSummary } from "@/lib/gamification";

type SessionUser = { id?: string };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Featured templates are always public, so fetch them for both guest and auth users
    const featuredTemplates = await Template.find({ isPublic: true })
      .sort({ clones: -1, createdAt: -1 })
      .limit(3)
      .lean();

    const userId = (session.user as SessionUser).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parallel fetching for high performance
    const [user, workflows, learnProgress] = await Promise.all([
      User.findById(userId).lean(),
      Workflow.find({ creatorId: userId }).sort({ updatedAt: -1 }).limit(4).lean(),
      LessonProgress.findOne({ userId }).lean(),
    ]);

    if (!user) {
      // Handle case where session exists but user not in DB (e.g. initial guest login)
      return NextResponse.json({ 
        user: { 
          name: session.user.name, 
          email: session.user.email, 
          image: session.user.image, 
          level: 1, 
          xp: 0,
          isGuest: true
        },
        recentWorkflows: [],
        featuredTemplates,
        learnProgress: { currentModuleId: "intro-nodes", completedModules: [] }
      });
    }

    const progress = getProgressSummary(user.xp || 0);

    return NextResponse.json({
      user: {
        ...progress,
        badges: user.badges || [],
        name: user.name,
        email: user.email,
        image: user.image,
        isGuest: false,
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
