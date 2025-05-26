/**
 * Achievement Service
 *
 * Handles tracking, awarding, and retrieving user achievements
 */
import { supabase } from "@/integrations/supabase/client";
import {
  Achievement,
  AchievementResponse,
  AchievementStatus,
  AchievementTrigger,
  AchievementTriggerData,
  AchievementWithProgress,
} from "@/types/achievement";

/**
 * Type definition for user_achievements table row from Supabase
 */
interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_id: string;
  current_count: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Re-export AchievementTrigger for convenience
export { AchievementTrigger } from "@/types/achievement";
import { achievements, getAchievementsByTrigger } from "@/data/achievements";

import { supabaseCache, CACHE_CONFIG } from "@/lib/supabaseCache";

/**
 * Trigger an achievement for a user
 *
 * This is a convenience function that wraps processAchievementTrigger
 */
export function triggerAchievement(
  trigger: AchievementTrigger,
  metadata?: Record<string, unknown>,
): void {
  // Get the current user ID from localStorage
  const userString = localStorage.getItem("supabase.auth.token");
  if (!userString) return;

  try {
    const userData = JSON.parse(userString);
    const userId = userData?.currentSession?.user?.id;

    if (userId) {
      // Process the achievement trigger
      processAchievementTrigger({
        trigger,
        userId,
        metadata,
      }).catch((error) => {
        console.error("Error processing achievement trigger:", error);
      });
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }
}

/**
 * Get all achievements with user progress
 *
 * Uses caching to reduce database calls
 */
export async function getUserAchievements(
  userId: string,
): Promise<AchievementResponse> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Use the cache key pattern from our configuration
    const cacheKey = CACHE_CONFIG.ACHIEVEMENTS.PATTERNS.ALL(userId);

    // Enable debug logging in development
    const enableDebugLogging = process.env.NODE_ENV === "development";
    if (enableDebugLogging) {
      console.log(`[Achievements] Fetching achievements for user ${userId}`);
      console.log(`[Achievements] Cache key: ${cacheKey}`);
    }

    // Use the enhanced caching system
    return await supabaseCache.query(
      "ACHIEVEMENTS",
      cacheKey,
      async () => {
        if (enableDebugLogging) {
          console.log(`[Achievements] Cache MISS - Fetching from database`);
        }
        // Get user achievements from Supabase
        const { data: userAchievements, error } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching user achievements:", error);
          return { success: false, error: error.message };
        }

        // Map achievements with user progress
        const achievementsWithProgress: AchievementWithProgress[] =
          achievements.map((achievement) => {
            const userAchievement = userAchievements?.find(
              (ua) => ua.achievement_id === achievement.id,
            );

            const currentCount = userAchievement?.current_count ?? 0;
            const completedAt = userAchievement?.completed_at ?? null;
            const percentComplete = Math.min(
              100,
              Math.round((currentCount / achievement.requiredCount) * 100),
            );

            let status = AchievementStatus.LOCKED;
            if (completedAt) {
              status = AchievementStatus.COMPLETED;
            } else if (currentCount > 0) {
              status = AchievementStatus.IN_PROGRESS;
            }

            return {
              ...achievement,
              currentCount,
              completedAt,
              status,
              percentComplete,
            };
          });

        return {
          success: true,
          achievements: achievementsWithProgress,
        };
      },
      CACHE_CONFIG.ACHIEVEMENTS.TTL,
    );
  } catch (error) {
    console.error("Error in getUserAchievements:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Invalidate the achievements cache for a user
 *
 * Call this function when achievements are updated
 */
export function invalidateAchievementsCache(userId: string): void {
  if (!userId) return;

  // Invalidate all achievement caches for this user
  supabaseCache.invalidateForUser("ACHIEVEMENTS", userId);
}

/**
 * Process an achievement trigger and update user progress
 */
export async function processAchievementTrigger(
  triggerData: AchievementTriggerData,
): Promise<AchievementResponse> {
  try {
    const { trigger, userId } = triggerData;

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Get achievements that match this trigger
    const matchingAchievements = getAchievementsByTrigger(trigger);

    if (matchingAchievements.length === 0) {
      return { success: true, newAchievements: [] };
    }

    // Get current user achievements
    const { data: userAchievements, error } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user achievements:", error);
      return { success: false, error: error.message };
    }

    // Process achievements and get newly completed ones
    const newlyCompletedAchievements = await processMatchingAchievements(
      matchingAchievements,
      userId,
      userAchievements || [],
    );

    // Invalidate the achievements cache for this user
    invalidateAchievementsCache(userId);

    return {
      success: true,
      newAchievements: newlyCompletedAchievements,
    };
  } catch (error) {
    console.error("Error in processAchievementTrigger:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process matching achievements for a user
 */
async function processMatchingAchievements(
  achievements: Achievement[],
  userId: string,
  userAchievements: UserAchievementRow[],
): Promise<Achievement[]> {
  const newlyCompletedAchievements: Achievement[] = [];

  for (const achievement of achievements) {
    const result = await processIndividualAchievement(
      achievement,
      userId,
      userAchievements,
    );
    if (result) {
      newlyCompletedAchievements.push(result);
    }
  }

  return newlyCompletedAchievements;
}

/**
 * Process an individual achievement for a user
 */
async function processIndividualAchievement(
  achievement: Achievement,
  userId: string,
  userAchievements: UserAchievementRow[],
): Promise<Achievement | null> {
  // Skip if already completed
  const existingAchievement = userAchievements.find(
    (ua) => ua.achievement_id === achievement.id && ua.completed_at !== null,
  );

  if (existingAchievement) {
    return null;
  }

  // Get or create user achievement
  const userAchievement = userAchievements.find(
    (ua) => ua.achievement_id === achievement.id,
  );

  if (!userAchievement) {
    return await createNewUserAchievement(achievement, userId);
  } else {
    return await updateExistingUserAchievement(achievement, userAchievement);
  }
}

/**
 * Create a new user achievement
 */
async function createNewUserAchievement(
  achievement: Achievement,
  userId: string,
): Promise<Achievement | null> {
  const { data: newUserAchievement, error: insertError } = await supabase
    .from("user_achievements")
    .insert({
      user_id: userId,
      achievement_id: achievement.id,
      current_count: 1,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating user achievement:", insertError);
    return null;
  }

  // Check if achievement is completed on first try
  if (newUserAchievement.current_count >= achievement.requiredCount) {
    await markAchievementCompleted(newUserAchievement.id);
    return achievement;
  }

  return null;
}

/**
 * Update an existing user achievement
 */
async function updateExistingUserAchievement(
  achievement: Achievement,
  userAchievement: UserAchievementRow,
): Promise<Achievement | null> {
  const newCount = userAchievement.current_count + 1;
  const isCompleted = newCount >= achievement.requiredCount;

  const { error: updateError } = await supabase
    .from("user_achievements")
    .update({
      current_count: newCount,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userAchievement.id);

  if (updateError) {
    console.error("Error updating user achievement:", updateError);
    return null;
  }

  return isCompleted ? achievement : null;
}

/**
 * Mark an achievement as completed
 */
async function markAchievementCompleted(
  userAchievementId: string,
): Promise<void> {
  await supabase
    .from("user_achievements")
    .update({
      completed_at: new Date().toISOString(),
    })
    .eq("id", userAchievementId);
}

// Simplified achievement system - removed complex processing functions
