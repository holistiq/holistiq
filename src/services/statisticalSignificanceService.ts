import { supabase } from "@/integrations/supabase/client";
import { cache, DEFAULT_CACHE_TTL } from "@/lib/cache";
import {
  StatisticalAnalysis,
  StatisticalAnalysisOptions,
  StatisticalAnalysisResponse,
  StatisticalAnalysesResponse,
  ContextType,
} from "@/types/statisticalSignificance";
import {
  getAnalytics,
  convertAnalyticsToStatisticalAnalyses,
} from "@/services/analyticsService";

/**
 * Run a statistical significance analysis
 * @param userId User ID
 * @param options Analysis options
 * @returns Promise with analysis results
 */
export async function runStatisticalAnalysis(
  userId: string,
  options: StatisticalAnalysisOptions,
): Promise<StatisticalAnalysisResponse> {
  try {
    console.log(
      `Running statistical analysis for user ${userId}, test type ${options.testType}`,
    );

    // Call the Supabase function to run and save the analysis
    const { data, error } = await supabase.rpc(
      "run_and_save_statistical_analysis",
      {
        p_user_id: userId,
        p_test_type: options.testType,
        p_baseline_period_start: options.baselinePeriodStart,
        p_baseline_period_end: options.baselinePeriodEnd,
        p_comparison_period_start: options.comparisonPeriodStart,
        p_comparison_period_end: options.comparisonPeriodEnd,
        p_alpha: options.alpha || 0.05,
        p_context_type: options.contextType || ContextType.GENERAL,
        p_context_id: options.contextId || null,
        p_context_name: options.contextName || null,
      },
    );

    if (error) {
      console.error("Error running statistical analysis:", error);
      return { success: false, error: error.message };
    }

    // The function returns the analysis ID, so we need to fetch the full analysis
    return await getStatisticalAnalysis(userId, data as string);
  } catch (error) {
    console.error("Unexpected error running statistical analysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a specific statistical analysis by ID
 * @param userId User ID
 * @param analysisId Analysis ID
 * @returns Promise with analysis
 */
export async function getStatisticalAnalysis(
  userId: string,
  analysisId: string,
): Promise<StatisticalAnalysisResponse> {
  try {
    console.log(
      `Fetching statistical analysis ${analysisId} for user ${userId}`,
    );

    // Try to get from cache first
    const cacheKey = `statistical_analysis_${analysisId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        console.log(
          "Cache miss for statistical analysis, fetching from Supabase",
        );

        const { data, error } = await supabase
          .from("statistical_analyses")
          .select("*")
          .eq("id", analysisId)
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching statistical analysis:", error);
          return { success: false, error: error.message };
        }

        return {
          success: true,
          analysis: data as StatisticalAnalysis,
        };
      },
      DEFAULT_CACHE_TTL.MEDIUM, // Cache for 30 minutes
    );
  } catch (error) {
    console.error("Unexpected error in getStatisticalAnalysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all statistical analyses for a user
 * @param userId User ID
 * @param contextType Optional context type filter
 * @param contextId Optional context ID filter
 * @returns Promise with analyses
 */
export async function getStatisticalAnalyses(
  userId: string,
  contextType?: ContextType,
  contextId?: string,
): Promise<StatisticalAnalysesResponse> {
  try {
    console.log(
      `Fetching statistical analyses for user ${userId}, context type: ${contextType || "all"}, context ID: ${contextId || "none"}`,
    );

    // Try to get from cache first
    // Use a unique cache key for each context type to avoid cache conflicts
    const contextTypeStr = contextType ? contextType.toString() : "all";
    const cacheKey = `statistical_analyses_${userId}_${contextTypeStr}_${contextId || "all"}`;

    console.log(`Using cache key: ${cacheKey}`);

    // Clear any existing cache for this user if it's for a different context type
    // This ensures we don't show stale data when switching tabs
    if (contextType) {
      cache.delete(
        new RegExp(`^statistical_analyses_${userId}_(?!${contextTypeStr})`),
      );
    }

    return await cache.getOrSet(
      cacheKey,
      async () => {
        console.log(
          "Cache miss for statistical analyses, fetching from Supabase",
        );

        // First try to get data from the statistical_analyses table
        try {
          let query = supabase
            .from("statistical_analyses")
            .select("*")
            .eq("user_id", userId);

          if (contextType) {
            query = query.eq("context_type", contextType);
          }

          if (contextId) {
            query = query.eq("context_id", contextId);
          }

          const { data, error } = await query.order("created_at", {
            ascending: false,
          });

          if (!error && data && data.length > 0) {
            console.log(
              `Retrieved ${data.length} statistical analyses from Supabase`,
            );
            return {
              success: true,
              analyses: data as StatisticalAnalysis[],
            };
          }
        } catch (error) {
          console.log(
            "Error fetching from statistical_analyses table, will try analytics data instead:",
            error,
          );
        }

        // If we get here, either there was an error or no data in the statistical_analyses table
        // Try to use analytics data instead
        console.log("Falling back to analytics data for statistical analyses");

        // Get analytics data and convert it to statistical analyses format
        const analyticsResult = await getAnalytics(userId);

        if (!analyticsResult.success) {
          return {
            success: false,
            analyses: [],
            error: analyticsResult.error || "Failed to retrieve analytics data",
          };
        }

        if (analyticsResult.data.length === 0) {
          return {
            success: true,
            analyses: [],
          };
        }

        // Convert analytics data to statistical analyses format
        // Limit to 15 analyses to provide enough data for each tab (3-5 per tab)
        // Make sure to pass the contextType to properly filter the analyses
        console.log(
          `Passing context type to convertAnalyticsToStatisticalAnalyses: ${contextType || "all"}`,
        );
        return await convertAnalyticsToStatisticalAnalyses(
          analyticsResult.data,
          contextType,
          contextId,
          15,
        );
      },
      DEFAULT_CACHE_TTL.SHORT, // Cache for 5 minutes
    );
  } catch (error) {
    console.error("Unexpected error in getStatisticalAnalyses:", error);
    return {
      success: false,
      analyses: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a statistical analysis
 * @param userId User ID
 * @param analysisId Analysis ID
 * @returns Promise with success status
 */
export async function deleteStatisticalAnalysis(
  userId: string,
  analysisId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `Deleting statistical analysis ${analysisId} for user ${userId}`,
    );

    const { error } = await supabase
      .from("statistical_analyses")
      .delete()
      .eq("id", analysisId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting statistical analysis:", error);
      return { success: false, error: error.message };
    }

    // Invalidate cache
    cache.delete(`statistical_analysis_${analysisId}`);
    cache.delete(new RegExp(`^statistical_analyses_${userId}`));

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting statistical analysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
