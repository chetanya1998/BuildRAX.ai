import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { calculateLevel, XP_REWARDS } from "@/lib/gamification";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const xpToGain = XP_REWARDS[action as keyof typeof XP_REWARDS];
    if (xpToGain === undefined) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await dbConnect();
    const userId = (session.user as any).id;
    
    // Atomically increment XP
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const oldLevel = user.level || calculateLevel(user.xp || 0);
    user.xp = (user.xp || 0) + xpToGain;
    const newLevel = calculateLevel(user.xp);
    
    let leveledUp = false;
    if (newLevel > oldLevel) {
      user.level = newLevel;
      leveledUp = true;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      xpGained: xpToGain,
      newTotalXp: user.xp,
      newLevel: user.level,
      leveledUp,
    });
  } catch (error) {
    console.error("Error gaining XP:", error);
    return NextResponse.json({ error: "Failed to process XP gain" }, { status: 500 });
  }
}
