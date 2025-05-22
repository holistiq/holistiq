import { supabase } from '@/integrations/supabase/client';
import { NBackTestResult } from '@/components/tests/NBackTest';
import { ReactionTimeTestResult } from '@/components/tests/ReactionTimeTest';
import { supabaseCache, CACHE_CONFIG } from '@/lib/supabaseCache';
import { TestResult } from '@/lib/testResultUtils';

/**
 * Save a test result to Supabase and local storage
 */
export async function saveTestResult(
  userId: string | undefined,
  testType: string,
  result: NBackTestResult | ReactionTimeTestResult,
  isBaseline: boolean = false
): Promise<{ success: boolean; error?: string; testId?: string }> {
  try {
    console.log(`Saving test result for user ${userId}, test type ${testType}, isBaseline: ${isBaseline}`);

    // Get current timestamp
    const timestamp = new Date().toISOString();

    // Format the result for storage
    const formattedResult = {
      test_type: testType,
      score: result.score,
      reaction_time: result.reactionTime,
      accuracy: result.accuracy,
      raw_data: result.rawData,
      environmental_factors: result.rawData.environmentalFactors,
      timestamp // Add timestamp explicitly
    };

    // Create standardized test result object
    const testResultData: TestResult = {
      date: timestamp,
      score: result.score,
      reactionTime: result.reactionTime,
      accuracy: result.accuracy
    };

    // Save to local storage first (as backup and for offline use)
    const storageKey = isBaseline ? 'baselineResult' : 'testResults';

    if (isBaseline) {
      // For baseline, just store the single result
      localStorage.setItem(storageKey, JSON.stringify(testResultData));
      console.log('Saved baseline to localStorage:', testResultData);
    } else {
      // For regular tests, append to the existing array
      const existingTests = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedTests = [...existingTests, testResultData];
      localStorage.setItem(storageKey, JSON.stringify(updatedTests));
      console.log(`Updated localStorage with ${updatedTests.length} tests`);
    }

    // If user is logged in, save to Supabase
    if (userId) {
      console.log('Saving to Supabase...');

      const { data, error } = await supabase
        .from('test_results')
        .insert({
          user_id: userId,
          ...formattedResult
        })
        .select();

      if (error) {
        console.error('Error saving test result to Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully saved to Supabase:', data);

      // Invalidate all caches related to this user's test results
      console.log("Invalidating test result caches for user:", userId);
      supabaseCache.invalidateForUser('TEST_RESULTS', userId);
      supabaseCache.invalidateForUser('CONFOUNDING_FACTORS', userId);
      supabaseCache.invalidateForUser('STATISTICAL_ANALYSES', userId);

      // Return the test ID for linking with confounding factors
      return { success: true, testId: data[0]?.id };
    } else {
      console.log('User not logged in, test result saved to local storage only');
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error saving test result:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all test results for a user from Supabase with caching
 */
export async function getTestResults(userId: string) {
  try {
    console.log(`Fetching test results for user ${userId}`);

    // Use the cache key pattern from our configuration
    const cacheKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.ALL(userId);

    // Use the enhanced caching system
    return await supabaseCache.query(
      'TEST_RESULTS',
      cacheKey,
      async () => {
        console.log('Cache miss for test results, fetching from Supabase');

        // Implement retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError = null;

        while (retryCount < maxRetries) {
          try {
            // Explicitly avoid any limits and ensure we get all results
            console.log("Fetching ALL test results for user:", userId);

            // Get the filtered results
            const { data, error } = await supabase
              .from('test_results')
              .select('*')
              .eq('user_id', userId)
              .order('timestamp', { ascending: true }); // Get oldest first for proper trend visualization

            if (error) {
              console.error(`Error fetching test results (attempt ${retryCount + 1}):`, error);
              lastError = error;
              retryCount++;
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              continue;
            }

            console.log(`Retrieved ${data?.length || 0} test results from Supabase`);

            if (data && data.length > 0) {
              // Check for duplicate timestamps
              const timestamps = data.map(result => result.timestamp);
              const uniqueTimestamps = new Set(timestamps);

              if (timestamps.length !== uniqueTimestamps.size) {
                console.warn(`Found ${timestamps.length - uniqueTimestamps.size} duplicate timestamps in Supabase results`);
              }
            } else {
              console.warn("No test results found for user:", userId);
            }

            return { success: true, data };
          } catch (error) {
            console.error(`Unexpected error fetching test results (attempt ${retryCount + 1}):`, error);
            lastError = error;
            retryCount++;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }

        // If we get here, all retries failed
        return {
          success: false,
          error: lastError instanceof Error ? lastError.message : 'Failed after multiple retries',
          data: null
        };
      },
      CACHE_CONFIG.TEST_RESULTS.TTL
    );
  } catch (error) {
    console.error('Unexpected error in getTestResults:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

/**
 * Get baseline test result for a user from Supabase with caching
 */
export async function getBaselineResult(userId: string, testType: string) {
  try {
    console.log(`Fetching baseline result for user ${userId} and test type ${testType}`);

    // Use the cache key pattern from our configuration
    const cacheKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.BASELINE(userId, testType);

    // Use the enhanced caching system
    return await supabaseCache.query(
      'TEST_RESULTS',
      cacheKey,
      async () => {
        console.log('Cache miss for baseline result, fetching from Supabase');

        // First, try to get the earliest test result as the baseline
        const { data, error } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: true })
          .limit(1);

        if (error) {
          console.error('Error fetching baseline result:', error);
          return { success: false, error: error.message, data: null };
        }

        console.log(`Baseline result found: ${data && data.length > 0 ? 'Yes' : 'No'}`);
        if (data && data.length > 0) {
          console.log('Baseline data:', data[0]);
          return { success: true, data: data[0] };
        }

        // If no results found, try to find any test result as a fallback
        console.log('No baseline found, checking for any test result as fallback');
        const { data: anyData, error: anyError } = await supabase
          .from('test_results')
          .select('*')
          .eq('user_id', userId)
          .limit(1);

        if (anyError) {
          console.error('Error fetching any test result:', anyError);
          return { success: false, error: anyError.message, data: null };
        }

        console.log(`Any test result found: ${anyData && anyData.length > 0 ? 'Yes' : 'No'}`);
        if (anyData && anyData.length > 0) {
          console.log('Using any test result as baseline:', anyData[0]);
          return { success: true, data: anyData[0] };
        }

        return { success: true, data: null };
      },
      CACHE_CONFIG.TEST_RESULTS.TTL
    );
  } catch (error) {
    console.error('Unexpected error fetching baseline result:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

/**
 * Link a test result with confounding factors
 */
export async function linkTestWithConfoundingFactors(
  testId: string,
  confoundingFactorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Linking test ${testId} with confounding factors ${confoundingFactorId}`);

    // Call the Supabase function to link the test with confounding factors
    const { data, error } = await supabase
      .rpc('link_test_confounding_factor', {
        p_test_id: testId,
        p_confounding_factor_id: confoundingFactorId
      });

    if (error) {
      console.error('Error linking test with confounding factors:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully linked test with confounding factors:', data);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error linking test with confounding factors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get tests without confounding factors
 */
export async function getTestsWithoutConfoundingFactors(
  userId: string,
  limit: number = 10
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log(`Fetching tests without confounding factors for user ${userId}`);

    // Use the cache key pattern from our configuration
    const cacheKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.WITHOUT_CONFOUNDING(userId);

    // Use the enhanced caching system
    return await supabaseCache.query(
      'TEST_RESULTS',
      cacheKey,
      async () => {
        console.log('Cache miss for tests without confounding factors, fetching from Supabase');

        // Call the Supabase function to get tests without confounding factors
        const { data, error } = await supabase
          .rpc('get_tests_without_confounding_factors', {
            p_user_id: userId,
            p_limit: limit
          });

        if (error) {
          console.error('Error fetching tests without confounding factors:', error);
          return { success: false, error: error.message };
        }

        console.log(`Retrieved ${data?.length ?? 0} tests without confounding factors`);
        return { success: true, data };
      },
      CACHE_CONFIG.TEST_RESULTS.TTL
    );
  } catch (error) {
    console.error('Unexpected error fetching tests without confounding factors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}