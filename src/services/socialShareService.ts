import { supabase } from "@/integrations/supabase/client";
import { processAchievementTrigger } from "@/services/achievementService";
import { AchievementTrigger } from "@/types/achievement";

/**
 * Interface for the response from tracking a social share
 */
export interface TrackShareResponse {
  success: boolean;
  error?: string;
}

/**
 * Track when a user shares their test results on social media
 *
 * @param userId - The ID of the user sharing their results
 * @param testId - The ID of the test being shared (optional)
 * @param platform - The platform where the results were shared
 * @returns A promise that resolves to a TrackShareResponse
 */
export async function trackSocialShare(
  userId: string,
  testId: string | undefined,
  platform: string,
): Promise<TrackShareResponse> {
  try {
    // Record the share in the database
    const { error } = await supabase.from("social_shares").insert({
      user_id: userId,
      test_id: testId,
      platform,
      shared_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error tracking social share:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Trigger achievement for engagement
    processAchievementTrigger({
      trigger: AchievementTrigger.DAILY_LOGIN,
      userId,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error tracking social share:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
