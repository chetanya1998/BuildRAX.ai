import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Mission } from "@/lib/models/Mission";
import { UserMission } from "@/lib/models/UserMission";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;

    // Fetch all active missions
    const missions = await Mission.find({ isActive: true }).sort({ order: 1 }).lean();

    // Fetch user progress for these missions
    const userProgress = await UserMission.find({ userId }).lean();

    // Map progress to missions
    const missionsWithProgress = missions.map(mission => {
      const progress = userProgress.find(p => p.missionId.toString() === mission._id.toString());
      return {
        ...mission,
        status: progress?.status || (mission.levelRequired === 1 ? "AVAILABLE" : "LOCKED"),
        completedSteps: progress?.completedSteps || [],
      };
    });

    return NextResponse.json(missionsWithProgress);
  } catch (error) {
    console.error("Error fetching lesson status:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
