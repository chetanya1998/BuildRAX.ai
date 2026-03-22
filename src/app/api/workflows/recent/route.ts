import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch top 4 most recently updated workflows for the user
    const workflows = await Workflow.find({ creatorId: (session.user as any).id })
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean();

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching recent workflows:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}
