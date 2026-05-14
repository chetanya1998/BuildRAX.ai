import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Template } from "@/lib/models/Template";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Fetch top 3 featured starters (most cloned or newest)
    const templates = await Template.find({ isPublic: true })
      .sort({ cloneCount: -1, createdAt: -1 })
      .limit(3)
      .lean();

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching featured templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
