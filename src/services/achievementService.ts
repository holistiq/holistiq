/**
 * Achievement Service
 *
 * Handles tracking, awarding, and retrieving user achievements
 */
import { supabase } from '@/integrations/supabase/client';
import {
  Achievement,
  AchievementResponse,
  AchievementStatus,
  AchievementTrigger,
  AchievementTriggerData,
  AchievementWithProgress
} from '@/types/achievement';

// Re-export AchievementTrigger for convenience
export { AchievementTrigger } from '@/types/achievement';
import { achievements, getAchievementsByTrigger } from '@/data/achievements';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Trigger an achievement for a user
 *
 * This is a convenience function that wraps processAchievementTrigger
 */
export function triggerAchievement(
  trigger: AchievementTrigger,
  metadata?: Record<string, any>
): void {
  // Get the current user ID from localStorage
  const userString = localStorage.getItem('supabase.auth.token');
  if (!userString) return;

  try {
    const userData = JSON.parse(userString);
    const userId = userData?.currentSession?.user?.id;

    if (userId) {
      // Process the achievement trigger
      processAchievementTrigger({
        trigger,
        userId,
        metadata
      }).catch(error => {
        console.error('Error processing achievement trigger:', error);
      });
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
}

/**
 * Get all achievements with user progress
 */
export async function getUserAchievements(userId: string): Promise<AchievementResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get user achievements from Supabase
    const { data: userAchievements, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user achievements:', error);
      return { success: false, error: error.message };
    }

    // Map achievements with user progress
    const achievementsWithProgress: AchievementWithProgress[] = achievements.map(achievement => {
      const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);

      const currentCount = userAchievement?.current_count ?? 0;
      const completedAt = userAchievement?.completed_at ?? null;
      const percentComplete = Math.min(100, Math.round((currentCount / achievement.requiredCount) * 100));

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
        percentComplete
      };
    });

    return {
      success: true,
      achievements: achievementsWithProgress
    };
  } catch (error) {
    console.error('Error in getUserAchievements:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process an achievement trigger and update user progress
 */
export async function processAchievementTrigger(
  triggerData: AchievementTriggerData
): Promise<AchievementResponse> {
  try {
    const { trigger, userId, metadata } = triggerData;

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get achievements that match this trigger
    const matchingAchievements = getAchievementsByTrigger(trigger);

    if (matchingAchievements.length === 0) {
      return { success: true, achievements: [] };
    }

    // Get current user achievements
    const { data: userAchievements, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user achievements:', error);
      return { success: false, error: error.message };
    }

    // Track newly completed achievements
    const newlyCompletedAchievements: Achievement[] = [];

    // Process each matching achievement
    for (const achievement of matchingAchievements) {
      // Skip if already completed
      const existingAchievement = userAchievements?.find(ua =>
        ua.achievement_id === achievement.id && ua.completed_at !== null
      );

      if (existingAchievement) {
        continue;
      }

      // Check if achievement has special metadata requirements
      if (achievement.metadata) {
        // For supplement with complete dosage information
        if (achievement.metadata.completeDosage && metadata?.supplementData) {
          const supplementData = metadata.supplementData;
          if (!supplementData.dosage || !supplementData.dosageUnit || !supplementData.frequency) {
            continue; // Skip if dosage information is incomplete
          }
        }

        // For tests with supplements
        if (achievement.metadata.withSupplement && metadata?.testWithSupplement === false) {
          continue; // Skip if test was not taken while on a supplement
        }

        // For control group tests (with and without supplements)
        if (achievement.metadata.controlGroup && !metadata?.hasControlTests) {
          continue; // Skip if user doesn't have both types of tests
        }

        // For consistent time of day
        if (achievement.trigger === AchievementTrigger.CONSISTENT_TIME_OF_DAY && metadata?.testTime) {
          // Check if test was taken at a consistent time
          const { data: testTimes } = await supabase
            .from('user_achievements_metadata')
            .select('*')
            .eq('user_id', userId)
            .eq('achievement_id', achievement.id)
            .eq('metadata_key', 'test_time');

          if (testTimes && testTimes.length > 0) {
            const lastTestTime = parseInt(testTimes[0].metadata_value);
            const currentTestTime = metadata.testTime;

            // Check if test time is within 1 hour of previous test time
            if (Math.abs(currentTestTime - lastTestTime) > 60) {
              continue; // Skip if test time is not consistent
            }
          }

          // Store this test time
          await supabase
            .from('user_achievements_metadata')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              metadata_key: 'test_time',
              metadata_value: metadata.testTime.toString()
            });
        }

        // For unique supplement achievements
        if (achievement.metadata.uniqueOnly && metadata?.supplementId) {
          // Check if this supplement has been logged before
          const { data: existingSupplements } = await supabase
            .from('user_achievements_metadata')
            .select('*')
            .eq('user_id', userId)
            .eq('achievement_id', achievement.id)
            .eq('metadata_key', 'supplement_id')
            .eq('metadata_value', metadata.supplementId);

          if (existingSupplements && existingSupplements.length > 0) {
            continue; // Skip if this supplement has been logged before
          }

          // Store this supplement ID
          await supabase
            .from('user_achievements_metadata')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              metadata_key: 'supplement_id',
              metadata_value: metadata.supplementId
            });
        }

        // For consecutive day achievements
        if (achievement.metadata.consecutiveDays) {
          // This requires more complex logic that would check the last activity date
          // For now, we'll just increment the counter
        }
      }

      // Get or create user achievement
      let userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);

      if (!userAchievement) {
        // Create new user achievement
        const { data: newUserAchievement, error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            current_count: 1
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user achievement:', insertError);
          continue;
        }

        userAchievement = newUserAchievement;
      } else {
        // Update existing user achievement
        const newCount = userAchievement.current_count + 1;
        const isCompleted = newCount >= achievement.requiredCount;

        const { error: updateError } = await supabase
          .from('user_achievements')
          .update({
            current_count: newCount,
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userAchievement.id);

        if (updateError) {
          console.error('Error updating user achievement:', updateError);
          continue;
        }

        userAchievement.current_count = newCount;

        if (isCompleted) {
          userAchievement.completed_at = new Date().toISOString();
          newlyCompletedAchievements.push(achievement);
        }
      }
    }

    return {
      success: true,
      newAchievements: newlyCompletedAchievements
    };
  } catch (error) {
    console.error('Error in processAchievementTrigger:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process supplement evaluation achievements
 */
export async function processSupplementEvaluation(
  userId: string,
  supplementId: string,
  hasBeforeTests: boolean,
  hasAfterTests: boolean,
  hasNotes: boolean
): Promise<AchievementResponse> {
  try {
    if (!userId || !supplementId) {
      return { success: false, error: 'User ID and Supplement ID are required' };
    }

    // Check if this is a complete evaluation
    const isCompleteEvaluation = hasBeforeTests && hasAfterTests && hasNotes;

    if (isCompleteEvaluation) {
      // Trigger supplement cycle completed achievement
      await processAchievementTrigger({
        trigger: AchievementTrigger.SUPPLEMENT_CYCLE_COMPLETED,
        userId,
        metadata: { supplementId }
      });

      // Trigger supplement evaluation completed achievement
      await processAchievementTrigger({
        trigger: AchievementTrigger.SUPPLEMENT_EVALUATION_COMPLETED,
        userId,
        metadata: { supplementId }
      });
    }

    // If detailed notes were added
    if (hasNotes) {
      await processAchievementTrigger({
        trigger: AchievementTrigger.DETAILED_NOTES_ADDED,
        userId,
        metadata: { supplementId }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error in processSupplementEvaluation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process confounding factors achievements
 */
export async function processConfoundingFactors(
  userId: string,
  testId: string,
  factorsLogged: boolean
): Promise<AchievementResponse> {
  try {
    if (!userId || !testId) {
      return { success: false, error: 'User ID and Test ID are required' };
    }

    if (factorsLogged) {
      await processAchievementTrigger({
        trigger: AchievementTrigger.CONFOUNDING_FACTORS_LOGGED,
        userId,
        metadata: { testId }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error in processConfoundingFactors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process supplement data quality achievements
 */
export async function processSupplementDataQuality(
  userId: string,
  supplementId: string,
  isComplete: boolean
): Promise<AchievementResponse> {
  try {
    if (!userId || !supplementId) {
      return { success: false, error: 'User ID and Supplement ID are required' };
    }

    if (isComplete) {
      await processAchievementTrigger({
        trigger: AchievementTrigger.COMPLETE_SUPPLEMENT_DATA,
        userId,
        metadata: { supplementId }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error in processSupplementDataQuality:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check and update streak-based achievements
 */
export async function updateStreakAchievements(userId: string): Promise<AchievementResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get test results ordered by date
    const { data: testResults, error } = await supabase
      .from('test_results')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching test results:', error);
      return { success: false, error: error.message };
    }

    if (!testResults || testResults.length === 0) {
      return { success: true, achievements: [] };
    }

    // Calculate daily streak
    let dailyStreak = 1;
    let lastDate = parseISO(testResults[0].timestamp);

    for (let i = 1; i < testResults.length; i++) {
      const currentDate = parseISO(testResults[i].timestamp);
      const dayDifference = differenceInDays(lastDate, currentDate);

      if (dayDifference === 1) {
        // Consecutive day
        dailyStreak++;
        lastDate = currentDate;
      } else if (dayDifference === 0) {
        // Same day, skip
        continue;
      } else {
        // Streak broken
        break;
      }
    }

    // Process streak achievements
    await processAchievementTrigger({
      trigger: AchievementTrigger.DAILY_STREAK,
      userId,
      metadata: { streakDays: dailyStreak }
    });

    // Weekly streak logic would be similar but checking for tests in consecutive weeks

    return { success: true };
  } catch (error) {
    console.error('Error in updateStreakAchievements:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
