import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Template } from "@/lib/models/Template";

export async function GET(req: NextRequest) {
  try {
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
