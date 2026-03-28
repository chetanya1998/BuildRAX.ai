import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Template } from "@/lib/models/Template";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { score } = await req.json();
    if (!score || score < 1 || score > 5) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    await dbConnect();
    const userId = (session.user as any).id;

    const template = await Template.findById(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user already rated
    const existingRatingIndex = template.ratings.findIndex(r => r.userId === userId);
    if (existingRatingIndex > -1) {
      template.ratings[existingRatingIndex].score = score;
    } else {
      template.ratings.push({ userId, score });
    }

    // Recalculate average
    const total = template.ratings.reduce((acc, r) => acc + r.score, 0);
    template.averageRating = total / template.ratings.length;

    await template.save();

    return NextResponse.json({ averageRating: template.averageRating, totalRatings: template.ratings.length });
  } catch (error) {
    console.error("Error rating template:", error);
    return NextResponse.json({ error: "Failed to rate template" }, { status: 500 });
  }
}
