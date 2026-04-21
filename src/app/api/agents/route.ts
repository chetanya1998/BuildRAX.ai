import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { Agent } from "@/lib/models/Agent";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const agents = await Agent.find({ creatorId: session.user.id }).sort({ updatedAt: -1 });

    return NextResponse.json(agents);
  } catch (error: any) {
    console.error("GET /api/agents Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    
    await connectDB();
    const newAgent = await Agent.create({
      ...data,
      creatorId: session.user.id,
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/agents Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
