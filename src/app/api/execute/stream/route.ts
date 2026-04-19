import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Execution } from "@/lib/models/Execution";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const executionId = req.nextUrl.searchParams.get("executionId");
  if (!executionId) {
    return NextResponse.json({ error: "Missing executionId mapping" }, { status: 400 });
  }

  await dbConnect();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      const sendEvent = (data: any) => {
        if (!isClosed) {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        }
      };

      req.signal.addEventListener("abort", () => {
        isClosed = true;
        controller.close();
      });

      // Simple polling for SSE updates. 
      // Replace with MongoDB Change Streams or Pusher in production.
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          // Lean to optimize read performance
          const execution = await Execution.findById(executionId).lean();
          if (!execution) {
            sendEvent({ error: "Execution not found" });
            isClosed = true;
            clearInterval(interval);
            controller.close();
            return;
          }

          sendEvent({
            status: execution.status,
            results: execution.results,
          });

          if (execution.status === "completed" || execution.status === "failed" || execution.status === "blocked") {
            isClosed = true;
            clearInterval(interval);
            controller.close();
          }
        } catch (e: any) {
          console.error("SSE Poll Error:", e);
        }
      }, 1000); // Pool every second
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
