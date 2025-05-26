import { supabase } from "@/integrations/supabase/client";
import { cache, DEFAULT_CACHE_TTL } from "@/lib/cache";
import {
  WashoutPeriod,
  WashoutPeriodStatus,
  WashoutPeriodResponse,
  WashoutPeriodsResponse,
  CreateWashoutPeriodParams,
  UpdateWashoutPeriodParams,
  ActiveWashoutPeriod,
} from "@/types/washoutPeriod";
import { debugLog, debugError } from "@/utils/debugUtils";

/**
 * Create a new washout period
 * @param userId User ID
 * @param params Washout period parameters
 * @returns Promise with the created washout period
 */
export async function createWashoutPeriod(
  userId: string,
  params: CreateWashoutPeriodParams,
): Promise<WashoutPeriodResponse> {
  try {
    console.log(
      `Creating washout period for user ${userId}, supplement ${params.supplement_name}`,
    );

    const { data, error } = await supabase
      .from("washout_periods")
      .insert({
        user_id: userId,
        supplement_id: params.supplement_id,
        supplement_name: params.supplement_name,
        start_date: params.start_date,
        expected_duration_days: params.expected_duration_days,
        reason: params.reason,
        notes: params.notes,
        status: WashoutPeriodStatus.ACTIVE,
      })
      .select();

    if (error) {
      console.error("Error creating washout period:", error);
      return { success: false, error: error.message };
    }

    console.log("Successfully created washout period:", data);

    // Invalidate cache for this user's washout periods
    cache.delete(`washout_periods_${userId}`);

    return {
      success: true,
      washoutPeriod: data[0] as WashoutPeriod,
    };
  } catch (error) {
    console.error("Unexpected error creating washout period:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an existing washout period
 * @param userId User ID
 * @param washoutPeriodId Washout period ID
 * @param params Update parameters
 * @returns Promise with the updated washout period
 */
export async function updateWashoutPeriod(
  userId: string,
  washoutPeriodId: string,
  params: UpdateWashoutPeriodParams,
): Promise<WashoutPeriodResponse> {
  try {
    console.log(
      `Updating washout period ${washoutPeriodId} for user ${userId}`,
    );

    const { data, error } = await supabase
      .from("washout_periods")
      .update(params)
      .eq("id", washoutPeriodId)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Error updating washout period:", error);
      return { success: false, error: error.message };
    }

    console.log("Successfully updated washout period:", data);

    // Invalidate cache for this user's washout periods
    cache.delete(`washout_periods_${userId}`);

    return {
      success: true,
      washoutPeriod: data[0] as WashoutPeriod,
    };
  } catch (error) {
    console.error("Unexpected error updating washout period:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Complete a washout period
 * @param userId User ID
 * @param washoutPeriodId Washout period ID
 * @param notes Optional notes about the completion
 * @returns Promise with the completed washout period
 */
export async function completeWashoutPeriod(
  userId: string,
  washoutPeriodId: string,
  notes?: string,
): Promise<WashoutPeriodResponse> {
  try {
    console.log(
      `Completing washout period ${washoutPeriodId} for user ${userId}`,
    );

    const endDate = new Date().toISOString();

    return await updateWashoutPeriod(userId, washoutPeriodId, {
      end_date: endDate,
      status: WashoutPeriodStatus.COMPLETED,
      notes: notes,
    });
  } catch (error) {
    console.error("Unexpected error completing washout period:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cancel a washout period
 * @param userId User ID
 * @param washoutPeriodId Washout period ID
 * @param notes Optional notes about the cancellation
 * @returns Promise with the cancelled washout period
 */
export async function cancelWashoutPeriod(
  userId: string,
  washoutPeriodId: string,
  notes?: string,
): Promise<WashoutPeriodResponse> {
  try {
    console.log(
      `Cancelling washout period ${washoutPeriodId} for user ${userId}`,
    );

    return await updateWashoutPeriod(userId, washoutPeriodId, {
      status: WashoutPeriodStatus.CANCELLED,
      notes: notes,
    });
  } catch (error) {
    console.error("Unexpected error cancelling washout period:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all washout periods for a user
 * @param userId User ID
 * @returns Promise with washout periods
 */
export async function getWashoutPeriods(
  userId: string,
): Promise<WashoutPeriodsResponse> {
  try {
    debugLog(
      `Fetching washout periods for user (ID: ${userId.substring(0, 8)}...)`,
    );

    // Try to get from cache first
    const cacheKey = `washout_periods_${userId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        debugLog("Cache miss for washout periods, fetching from Supabase");

        // Get all washout periods
        const { data, error } = await supabase
          .from("washout_periods")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false });

        if (error) {
          debugError("Error fetching washout periods:", error);
          return {
            success: false,
            washoutPeriods: [],
            activeWashoutPeriods: [],
            error: error.message,
          };
        }

        // Get active washout periods with additional calculated fields
        const { data: activeData, error: activeError } = await supabase.rpc(
          "get_active_washout_periods",
          {
            p_user_id: userId,
          },
        );

        if (activeError) {
          debugError("Error fetching active washout periods:", activeError);
          return {
            success: false,
            washoutPeriods: [],
            activeWashoutPeriods: [],
            error: activeError.message,
          };
        }

        // Calculate progress percentage for active washout periods
        const activeWashoutPeriods: ActiveWashoutPeriod[] = activeData.map(
          (item) => ({
            ...item,
            progress_percentage: item.expected_duration_days
              ? Math.min(
                  100,
                  Math.round(
                    (item.days_elapsed / item.expected_duration_days) * 100,
                  ),
                )
              : 0,
          }),
        );

        debugLog(
          `Retrieved ${data.length} washout periods, ${activeWashoutPeriods.length} active`,
        );

        return {
          success: true,
          washoutPeriods: data as WashoutPeriod[],
          activeWashoutPeriods,
        };
      },
      DEFAULT_CACHE_TTL.SHORT, // Cache for 5 minutes
    );
  } catch (error) {
    debugError("Unexpected error in getWashoutPeriods:", error);
    return {
      success: false,
      washoutPeriods: [],
      activeWashoutPeriods: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if a supplement is currently in a washout period
 * @param userId User ID
 * @param supplementId Supplement ID
 * @returns Promise with boolean indicating if supplement is in washout
 */
export async function isSupplementInWashout(
  userId: string,
  supplementId: string,
): Promise<{ success: boolean; inWashout: boolean; error?: string }> {
  try {
    debugLog(
      `Checking if supplement ${supplementId} is in washout for user (ID: ${userId.substring(0, 8)}...)`,
    );

    const { data, error } = await supabase.rpc("is_supplement_in_washout", {
      p_user_id: userId,
      p_supplement_id: supplementId,
    });

    if (error) {
      debugError("Error checking if supplement is in washout:", error);
      return { success: false, inWashout: false, error: error.message };
    }

    return {
      success: true,
      inWashout: data as boolean,
    };
  } catch (error) {
    debugError("Unexpected error checking if supplement is in washout:", error);
    return {
      success: false,
      inWashout: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
