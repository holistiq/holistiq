/**
 * Hook for fetching test results with caching
 */
import { useState, useEffect } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseAuth } from './useSupabaseAuth';
import { CACHE_CONFIG } from '@/lib/supabaseCache';
import { supabase } from '@/integrations/supabase/client';

// Define types for raw_data and environmental_factors
interface TestRawData {
  answers?: Array<{
    question?: string;
    answer?: string;
    correct?: boolean;
    time_taken?: number;
  }>;
  duration?: number;
  total_questions?: number;
  correct_answers?: number;
  [key: string]: unknown;
}

interface EnvironmentalFactors {
  location?: string;
  noise_level?: number;
  temperature?: number;
  lighting?: number;
  device_type?: string;
  [key: string]: unknown;
}

interface TestResult {
  id: string;
  user_id: string;
  test_type: string;
  timestamp: string;
  score: number;
  reaction_time?: number;
  accuracy?: number;
  raw_data?: TestRawData;
  environmental_factors?: EnvironmentalFactors;
  confounding_factor_id?: string;
}

interface UseTestResultsOptions {
  testType?: string;
  limit?: number;
  skipCache?: boolean;
  enabled?: boolean;
}

/**
 * Hook for fetching test results with caching
 * @param options Options for fetching test results
 * @returns Test results and loading state
 */
export function useTestResultsWithCache(options: UseTestResultsOptions = {}) {
  const { user } = useSupabaseAuth();
  const userId = user?.id;
  const {
    testType,
    limit = 100,
    skipCache = false,
    enabled = true
  } = options;

  // Generate the cache key based on the options
  const cacheKey = testType
    ? CACHE_CONFIG.TEST_RESULTS.PATTERNS.BY_TYPE(userId || '', testType)
    : CACHE_CONFIG.TEST_RESULTS.PATTERNS.ALL(userId || '');

  // Use the useSupabaseQuery hook to fetch test results with caching
  const {
    data: queryResult,
    isLoading,
    error,
    refetch,
    isFromCache
  } = useSupabaseQuery<{ success: boolean; data: TestResult[] | null; error?: string }>(
    () => {
      let query = supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId);

      if (testType) {
        query = query.eq('test_type', testType);
      }

      return query
        .order('timestamp', { ascending: false })
        .limit(limit);
    },
    {
      entityType: 'TEST_RESULTS',
      cacheKeyPattern: cacheKey,
      skipCache,
      dependencies: [userId, testType, limit],
      enabled: enabled && !!userId
    }
  );

  // Process the test results
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    if (queryResult?.success && queryResult.data) {
      setTestResults(queryResult.data);
    } else {
      setTestResults([]);
    }
  }, [queryResult]);

  // Get the baseline result (earliest test)
  const baseline = testResults.length > 0
    ? testResults[testResults.length - 1]
    : null;

  // Get the latest result
  const latestResult = testResults.length > 0
    ? testResults[0]
    : null;

  return {
    testResults,
    baseline,
    latestResult,
    isLoading,
    error,
    refetch,
    isFromCache
  };
}

/**
 * Hook for fetching a baseline test result with caching
 * @param testType The type of test
 * @returns Baseline test result and loading state
 */
export function useBaselineWithCache(testType: string) {
  const { user } = useSupabaseAuth();
  const userId = user?.id;

  // Generate the cache key
  const cacheKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.BASELINE(userId || '', testType);

  // Use the useSupabaseQuery hook to fetch the baseline result with caching
  return useSupabaseQuery<{ success: boolean; data: TestResult | null; error?: string }>(
    () => {
      return supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId)
        .eq('test_type', testType)
        .order('timestamp', { ascending: true })
        .limit(1);
    },
    {
      entityType: 'TEST_RESULTS',
      cacheKeyPattern: cacheKey,
      dependencies: [userId, testType],
      enabled: !!userId && !!testType
    }
  );
}

/**
 * Hook for fetching tests without confounding factors with caching
 * @param limit Maximum number of tests to fetch
 * @returns Tests without confounding factors and loading state
 */
export function useTestsWithoutConfoundingFactors(limit: number = 10) {
  const { user } = useSupabaseAuth();
  const userId = user?.id;

  // Generate the cache key
  const cacheKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.WITHOUT_CONFOUNDING(userId || '');

  // Use the useSupabaseRpc hook to call the RPC function with caching
  return useSupabaseQuery<{ success: boolean; data: TestResult[] | null; error?: string }>(
    () => {
      return supabase
        .rpc('get_tests_without_confounding_factors', {
          p_user_id: userId,
          p_limit: limit
        });
    },
    {
      entityType: 'TEST_RESULTS',
      cacheKeyPattern: cacheKey,
      dependencies: [userId, limit],
      enabled: !!userId
    }
  );
}
