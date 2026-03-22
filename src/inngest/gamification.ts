// @ts-nocheck
import { inngest } from "./client";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { XP_REWARDS, calculateLevel } from "@/lib/gamification";

/**
 * Inngest function to handle user rewards (XP, Streaks, etc.)
 */
export const processUserReward = inngest.createFunction(
  { id: "process-user-reward", event: "user.reward_xp" },
  async ({ event, step }) => {
    const { userId, type } = event.data;

    await step.run("connect-db", () => dbConnect());

    const result = await step.run("update-xp", async () => {
      const xpAmount = XP_REWARDS[type as keyof typeof XP_REWARDS] || 0;
      if (xpAmount <= 0) {
        return { success: false, reason: "Invalid reward type", levelUp: false, newLevel: 0 };
      }

      const user = await User.findById(userId);
      if (!user) throw new Error(`User ${userId} not found`);

      const oldLevel = user.level || 1;
      user.xp = (user.xp || 0) + xpAmount;
      user.level = calculateLevel(user.xp);

      await user.save();

      const levelUp = user.level > oldLevel;

      return {
        success: true,
        xpAdded: xpAmount,
        newXp: user.xp,
        newLevel: user.level,
        levelUp,
      };
    });

    if (result.levelUp) {
      await step.sendEvent("user.leveled_up", {
        name: "user.leveled_up",
        data: {
          userId,
          level: result.newLevel,
        },
      });
    }

    return result;
  }
);

/**
 * Inngest function to handle daily streaks
 */
export const handleDailyStreak = inngest.createFunction(
  { id: "handle-daily-streak", event: "user.login" },
  async ({ event, step }) => {
    const { userId } = event.data;

    await step.run("connect-db", () => dbConnect());

    const result = await step.run("update-streak", async () => {
      const user = await User.findById(userId);
      if (!user) throw new Error(`User ${userId} not found`);

      const now = new Date();
      const lastActive = user.lastActive ? new Date(user.lastActive) : null;
      
      if (!lastActive) {
        user.streak = 1;
      } else {
        const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
          // Already logged in today, do nothing or just update lastActive
          return { success: true, streak: user.streak, reward: false };
        } else if (diffInHours < 48) {
          // Continuous daily visit
          user.streak = (user.streak || 0) + 1;
        } else {
          // Streak broken
          user.streak = 1;
        }
      }

      user.lastActive = now;
      await user.save();

      return { success: true, streak: user.streak, reward: true };
    });

    if (result.reward) {
      await step.sendEvent("user.reward_xp", {
        name: "user.reward_xp",
        data: {
          userId,
          type: "DAILY_STREAK",
        },
      });
    }

    return result;
  }
);
