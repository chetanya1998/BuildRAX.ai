import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Version } from "@/lib/models/Version";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nodes, edges, name } = await req.json();
    await dbConnect();

    // Create a new version with random benchmarks for now
    const newVersion = await Version.create({
      workflowId,
      name: name || `Version ${new Date().toLocaleTimeString()}`,
      nodes,
      edges,
      benchmarks: {
        latency: Math.floor(Math.random() * 1000) + 200,
        tokens: Math.floor(Math.random() * 500) + 100,
        cost: Number((Math.random() * 0.05).toFixed(4)),
        successRate: Math.floor(Math.random() * 10) + 90,
      }
    });

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error("Error saving version:", error);
    return NextResponse.json({ error: "Failed to save version" }, { status: 500 });
  }
}
