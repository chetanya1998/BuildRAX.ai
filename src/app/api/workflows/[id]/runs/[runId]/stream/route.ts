import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Workflow } from "@/lib/models/Workflow";
import { SimulationRun } from "@/lib/models/SimulationRun";
import { ExecutionRun } from "@/lib/models/ExecutionRun";
import { BenchmarkRun } from "@/lib/models/BenchmarkRun";

type SessionUser = { id?: string };

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String((session.user as SessionUser).id || "");
    const { id, runId } = await params;
    const type = new URL(req.url).searchParams.get("type") || "execution";

    await dbConnect();

    const workflow = await Workflow.findOne({
      _id: id,
      creatorId: userId,
      deletedAt: null,
    }).lean();

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const run =
      type === "simulation"
        ? await SimulationRun.findById(runId).lean()
        : type === "benchmark"
          ? await BenchmarkRun.findById(runId).lean()
          : await ExecutionRun.findById(runId).lean();

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(`event: snapshot\n`);
        controller.enqueue(`data: ${JSON.stringify(run)}\n\n`);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Run stream error:", error);
    return NextResponse.json({ error: "Failed to stream run" }, { status: 500 });
  }
}
