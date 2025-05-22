import { supabase } from '@/integrations/supabase/client';
import { cache, DEFAULT_CACHE_TTL } from '@/lib/cache';
import {
  ConfoundingFactor,
  ConfoundingFactorInput,
  ConfoundingFactorsResponse,
  FactorAnalysisResult,
  FactorAnalysisResponse
} from '@/types/confoundingFactor';
import { debugLog, debugError } from '@/utils/debugUtils';

/**
 * Save a confounding factor to Supabase
 */
export async function saveConfoundingFactor(
  userId: string,
  factor: ConfoundingFactorInput
): Promise<{ success: boolean; error?: string; data?: ConfoundingFactor }> {
  try {
    console.log(`Saving confounding factor for user ${userId}`);

    // Format the factor for storage
    const formattedFactor = {
      user_id: userId,
      recorded_at: factor.recorded_at || new Date().toISOString(),
      sleep_duration: factor.sleep_duration,
      sleep_quality: factor.sleep_quality,
      stress_level: factor.stress_level,
      exercise_duration: factor.exercise_duration,
      exercise_intensity: factor.exercise_intensity,
      exercise_type: factor.exercise_type,
      meal_timing: factor.meal_timing,
      caffeine_intake: factor.caffeine_intake,
      alcohol_intake: factor.alcohol_intake,
      water_intake: factor.water_intake,
      location: factor.location,
      noise_level: factor.noise_level,
      temperature: factor.temperature,
      mood: factor.mood,
      energy_level: factor.energy_level,
      illness: factor.illness,
      illness_details: factor.illness_details,
      notes: factor.notes
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from('confounding_factors')
      .insert(formattedFactor)
      .select();

    if (error) {
      console.error('Error saving confounding factor to Supabase:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully saved confounding factor to Supabase:', data);

    // Invalidate cache for this user's confounding factors
    cache.delete(`confounding_factors_${userId}`);

    // Return the saved factor with Supabase ID
    if (data && data.length > 0) {
      return {
        success: true,
        data: data[0] as ConfoundingFactor
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error saving confounding factor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all confounding factors for a user from Supabase with caching
 */
export async function getConfoundingFactors(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<ConfoundingFactorsResponse> {
  try {
    debugLog(`Fetching confounding factors for user (ID: ${userId.substring(0, 8)}...)`);

    // Try to get from cache first
    const cacheKey = `confounding_factors_${userId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        debugLog('Cache miss for confounding factors, fetching from Supabase');

        // Implement retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError = null;

        while (retryCount < maxRetries) {
          try {
            let query = supabase
              .from('confounding_factors')
              .select('*')
              .eq('user_id', userId)
              .order('recorded_at', { ascending: false });

            // Add date range filters if provided
            if (startDate) {
              query = query.gte('recorded_at', startDate);
            }
            if (endDate) {
              query = query.lte('recorded_at', endDate);
            }

            const { data, error } = await query;

            if (error) {
              debugError(`Error fetching confounding factors (attempt ${retryCount + 1}):`, error);
              lastError = error;
              retryCount++;
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              continue;
            }

            debugLog(`Retrieved ${data?.length || 0} confounding factors from Supabase`);

            return {
              success: true,
              factors: data as ConfoundingFactor[]
            };
          } catch (error) {
            debugError(`Unexpected error fetching confounding factors (attempt ${retryCount + 1}):`, error);
            lastError = error;
            retryCount++;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }

        // If we get here, all retries failed
        debugError('All retries failed when fetching confounding factors');
        return {
          success: false,
          factors: [],
          error: lastError instanceof Error ? lastError.message : 'Failed to fetch confounding factors after multiple attempts'
        };
      },
      DEFAULT_CACHE_TTL.SHORT // Cache for 5 minutes
    );
  } catch (error) {
    debugError('Unexpected error in getConfoundingFactors:', error);
    return {
      success: false,
      factors: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyze correlations between confounding factors and test results
 */
export async function analyzeConfoundingFactors(
  userId: string,
  testType: string,
  startDate: string,
  endDate: string
): Promise<FactorAnalysisResponse> {
  try {
    debugLog(`Analyzing confounding factors for user (ID: ${userId.substring(0, 8)}...), test type ${testType}`);

    // Call the Supabase function to analyze correlations
    const { data, error } = await supabase
      .rpc('analyze_confounding_factors', {
        p_user_id: userId,
        p_test_type: testType,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      debugError('Error analyzing confounding factors:', error);
      return { success: false, analysis: null, error: error.message };
    }

    debugLog('Successfully analyzed confounding factors');

    return {
      success: true,
      analysis: data as FactorAnalysisResult
    };
  } catch (error) {
    debugError('Unexpected error analyzing confounding factors:', error);
    return {
      success: false,
      analysis: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get confounding factors for a specific test result
 */
export async function getTestConfoundingFactors(
  userId: string,
  testId: string
): Promise<{ success: boolean; data?: ConfoundingFactor | null; error?: string }> {
  try {
    debugLog(`Fetching confounding factors for test ${testId}`);

    // Call the Supabase function to get confounding factors for a test
    const { data, error } = await supabase
      .rpc('get_test_confounding_factors', {
        p_user_id: userId,
        p_test_id: testId
      });

    if (error) {
      debugError('Error fetching test confounding factors:', error);
      return { success: false, error: error.message };
    }

    debugLog('Successfully fetched test confounding factors');

    return {
      success: true,
      data: data as ConfoundingFactor
    };
  } catch (error) {
    debugError('Unexpected error fetching test confounding factors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
