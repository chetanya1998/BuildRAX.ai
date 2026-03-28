/**
 * Gamification Logic for BuildRAX.ai
 * Defines XP thresholds and leveling calculations based on a logarithmic model.
 */

export const BASE_XP = 1000;
export const XP_MULTIPLIER = 1.5;

export interface ProgressSummary {
  level: number;
  totalXp: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercentage: number;
  nextBadgeTarget: string;
}

/**
 * Calculates the total XP required to reach a specific level.
 * Formula: TotalXP(N) = 2000 * (1.5^(N-1) - 1)
 * Derived from the sum of a geometric series: BASE_XP * (XP_MULTIPLIER^(N-1) - 1) / (XP_MULTIPLIER - 1)
 */
export function getTotalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(2000 * (Math.pow(1.5, level - 1) - 1));
}

/**
 * Calculates user level based on total XP.
 */
export function calculateLevel(totalXp: number): number {
  // Solve for N: totalXp = 2000 * (1.5^(N-1) - 1)
  // totalXp / 2000 + 1 = 1.5^(N-1)
  // log1.5(totalXp / 2000 + 1) = N - 1
  // N = log(totalXp / 2000 + 1) / log(1.5) + 1
  if (totalXp <= 0) return 1;
  const level = Math.floor(Math.log(totalXp / 2000 + 1) / Math.log(1.5)) + 1;
  return level;
}

/**
 * Returns a summary of user progress.
 */
export function getProgressSummary(totalXp: number): ProgressSummary {
  const level = calculateLevel(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(level);
  const xpForNextLevel = getTotalXpForLevel(level + 1);
  
  const xpInCurrentLevel = totalXp - xpForCurrentLevel;
  const xpRequiredForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (xpInCurrentLevel / xpRequiredForNextLevel) * 100;
  
  let nextBadgeTarget = "Workflow Creator";
  if (level >= 10) nextBadgeTarget = "AI Orchestrator";
  if (level >= 30) nextBadgeTarget = "AI Architect";

  return {
    level,
    totalXp,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    nextBadgeTarget,
  };
}

/**
 * XP Rewards configuration
 */
export const XP_REWARDS = {
  EXECUTE_WORKFLOW: 100,
  COMPLETE_LESSON: 500,
  CREATE_WORKFLOW: 250,
  PUBLISH_TEMPLATE: 1000,
  FIRST_PUBLISH_REWARD: 2500,
  DAILY_STREAK: 200, // Bonus for logging in
};
