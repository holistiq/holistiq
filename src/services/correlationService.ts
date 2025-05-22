import { supabase } from '@/integrations/supabase/client';
import { cache, DEFAULT_CACHE_TTL } from '@/lib/cache';
import { 
  SupplementCorrelation, 
  CorrelationAnalysisOptions, 
  CorrelationResponse,
  CorrelationsResponse
} from '@/types/correlation';
import { TestResult } from '@/lib/testResultUtils';
import { Supplement } from '@/types/supplement';
import { getTestResults } from './testResultService';
import { getSupplements } from './supplementService';

/**
 * Calculate correlation between a supplement and cognitive test results
 * @param userId User ID
 * @param options Analysis options
 * @returns Promise with correlation results
 */
export async function calculateCorrelation(
  userId: string,
  options: CorrelationAnalysisOptions
): Promise<CorrelationResponse> {
  try {
    console.log(`Calculating correlation for user ${userId}, supplement ${options.supplementId}`);

    // Call the Supabase function to calculate correlation
    const { data, error } = await supabase.rpc(
      'calculate_supplement_correlation',
      {
        p_user_id: userId,
        p_supplement_id: options.supplementId,
        p_test_type: options.testType,
        p_onset_delay_days: options.onsetDelayDays,
        p_cumulative_effect_threshold: options.cumulativeEffectThreshold,
        p_analysis_period_start: options.analysisStartDate,
        p_analysis_period_end: options.analysisEndDate
      }
    );

    if (error) {
      console.error('Error calculating correlation:', error);
      return { success: false, error: error.message };
    }

    console.log('Correlation calculation result:', data);

    // Fetch the newly created/updated correlation
    const correlationId = data;
    const { data: correlationData, error: fetchError } = await supabase
      .from('supplement_correlations')
      .select('*')
      .eq('id', correlationId)
      .single();

    if (fetchError) {
      console.error('Error fetching correlation:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Invalidate cache
    cache.delete(`correlations_${userId}`);
    cache.delete(`correlation_${correlationId}`);

    return {
      success: true,
      correlation: correlationData as SupplementCorrelation
    };
  } catch (error) {
    console.error('Unexpected error calculating correlation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all correlations for a user
 * @param userId User ID
 * @returns Promise with correlations
 */
export async function getCorrelations(userId: string): Promise<CorrelationsResponse> {
  try {
    console.log(`Fetching correlations for user ${userId}`);

    // Try to get from cache first
    const cacheKey = `correlations_${userId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        console.log('Cache miss for correlations, fetching from Supabase');

        // Implement retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError = null;

        while (retryCount < maxRetries) {
          try {
            const { data, error } = await supabase
              .from('supplement_correlations')
              .select('*')
              .eq('user_id', userId)
              .order('updated_at', { ascending: false });

            if (error) {
              console.error(`Error fetching correlations (attempt ${retryCount + 1}):`, error);
              lastError = error;
              retryCount++;
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              continue;
            }

            console.log(`Retrieved ${data?.length || 0} correlations from Supabase`);

            return {
              success: true,
              correlations: data as SupplementCorrelation[]
            };
          } catch (error) {
            console.error(`Unexpected error fetching correlations (attempt ${retryCount + 1}):`, error);
            lastError = error;
            retryCount++;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }

        // If we get here, all retries failed
        return {
          success: false,
          correlations: [],
          error: lastError instanceof Error ? lastError.message : 'Failed after multiple retries'
        };
      },
      DEFAULT_CACHE_TTL.SHORT // Cache for 5 minutes
    );
  } catch (error) {
    console.error('Unexpected error in getCorrelations:', error);
    return {
      success: false,
      correlations: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a specific correlation by ID
 * @param correlationId Correlation ID
 * @returns Promise with correlation
 */
export async function getCorrelationById(correlationId: string): Promise<CorrelationResponse> {
  try {
    console.log(`Fetching correlation ${correlationId}`);

    // Try to get from cache first
    const cacheKey = `correlation_${correlationId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        console.log('Cache miss for correlation, fetching from Supabase');

        const { data, error } = await supabase
          .from('supplement_correlations')
          .select('*')
          .eq('id', correlationId)
          .single();

        if (error) {
          console.error('Error fetching correlation:', error);
          return { success: false, error: error.message };
        }

        return {
          success: true,
          correlation: data as SupplementCorrelation
        };
      },
      DEFAULT_CACHE_TTL.MEDIUM // Cache for 30 minutes
    );
  } catch (error) {
    console.error('Unexpected error in getCorrelationById:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete a correlation
 * @param correlationId Correlation ID
 * @returns Promise with success status
 */
export async function deleteCorrelation(correlationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Deleting correlation ${correlationId}`);

    // Get the correlation first to get the user ID for cache invalidation
    const { data: correlationData, error: fetchError } = await supabase
      .from('supplement_correlations')
      .select('user_id')
      .eq('id', correlationId)
      .single();

    if (fetchError) {
      console.error('Error fetching correlation for deletion:', fetchError);
      return { success: false, error: fetchError.message };
    }

    const userId = correlationData.user_id;

    // Delete the correlation
    const { error } = await supabase
      .from('supplement_correlations')
      .delete()
      .eq('id', correlationId);

    if (error) {
      console.error('Error deleting correlation:', error);
      return { success: false, error: error.message };
    }

    // Invalidate cache
    cache.delete(`correlations_${userId}`);
    cache.delete(`correlation_${correlationId}`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting correlation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
