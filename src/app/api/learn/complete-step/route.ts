import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { UserMission } from "@/lib/models/UserMission";
import { Mission } from "@/lib/models/Mission";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { missionId, stepIndex } = await req.json();
    if (!missionId || stepIndex === undefined) {
      return NextResponse.json({ error: "Mission ID and Step Index are required" }, { status: 400 });
    }

    await dbConnect();
    const userId = (session.user as any).id;

    // Find or create UserMission
    let userMission = await UserMission.findOne({ userId, missionId });
    if (!userMission) {
      userMission = await UserMission.create({
        userId,
        missionId,
        status: "IN_PROGRESS",
      });
    }

    // Add step to completedSteps if not already there
    if (!userMission.completedSteps.includes(stepIndex)) {
      userMission.completedSteps.push(stepIndex);
      
      // Check if all steps are completed
      const mission = await Mission.findById(missionId);
      if (mission && userMission.completedSteps.length >= mission.steps.length) {
        userMission.status = "COMPLETED";
        userMission.completedAt = new Date();
      } else {
        userMission.status = "IN_PROGRESS";
      }

      await userMission.save();

      // Trigger XP reward event
      await inngest.send({
        name: "user.reward_xp",
        data: {
          userId,
          type: "COMPLETE_LESSON",
          metadata: { missionId, stepIndex },
        },
      });
    }

    return NextResponse.json({ success: true, status: userMission.status });
  } catch (error) {
    console.error("Error completing mission step:", error);
    return NextResponse.json({ error: "Failed to complete step" }, { status: 500 });
  }
}
