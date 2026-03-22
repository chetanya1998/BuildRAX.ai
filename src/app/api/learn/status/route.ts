import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { LessonProgress } from "@/lib/models/LessonProgress";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    let progress = await LessonProgress.findOne({ userId: (session.user as any).id }).lean();

    // If no progress exists yet, create an initial record
    if (!progress) {
      progress = await LessonProgress.create({
        userId: (session.user as any).id,
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching lesson status:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
