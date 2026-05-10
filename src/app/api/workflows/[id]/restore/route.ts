import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";

type SessionUser = { id?: string };

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const userId = String((session.user as SessionUser).id || "");
  await dbConnect();
  const workflow = await Workflow.findOneAndUpdate(
    { _id: id, creatorId: userId },
    { $set: { lifecycle: "draft", deletedAt: null } },
    { returnDocument: "after" }
  );
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  return NextResponse.json({ workflow });
}
