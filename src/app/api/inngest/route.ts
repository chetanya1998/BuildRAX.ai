import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { executeWorkflowBackground } from "@/inngest/functions";
import { processUserReward, handleDailyStreak } from "@/inngest/gamification";

// Expose our background functions to Inngest via the native Next.js router
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeWorkflowBackground,
    processUserReward,
    handleDailyStreak,
  ],
});
