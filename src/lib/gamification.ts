/**
 * Gamification Logic for BuildRAX.ai
 * Defines XP thresholds and leveling calculations.
 */

export const XP_PER_LEVEL = 500;

export interface ProgressSummary {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercentage: number;
  nextBadgeTarget: string;
}

/**
 * Calculates user level based on total XP.
 * Simple linear progression for now.
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Returns a summary of user progress.
 */
export function getProgressSummary(xp: number): ProgressSummary {
  const level = calculateLevel(xp);
  const currentLevelXp = xp % XP_PER_LEVEL;
  const progressPercentage = (currentLevelXp / XP_PER_LEVEL) * 100;
  
  // Logic for next badge target (placeholder mapping)
  let nextBadgeTarget = "Workflow Creator";
  if (level >= 5) nextBadgeTarget = "Logic Master";
  if (level >= 10) nextBadgeTarget = "AI Architect";

  return {
    level,
    currentXp: currentLevelXp,
    xpToNextLevel: XP_PER_LEVEL - currentLevelXp,
    progressPercentage,
    nextBadgeTarget,
  };
}

/**
 * XP Rewards configuration
 */
export const XP_REWARDS = {
  EXECUTE_WORKFLOW: 50,
  COMPLETE_LESSON: 100,
  CREATE_WORKFLOW: 25,
  PUBLISH_TEMPLATE: 200,
};
