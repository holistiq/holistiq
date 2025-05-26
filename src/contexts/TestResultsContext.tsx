import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { TestResult, normalizeDate } from "@/lib/testResultUtils";
import { UserBaseline, BaselineCalculationOptions } from "@/types/baseline";
import { debounce } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { cache, DEFAULT_CACHE_TTL } from "@/lib/cache";
import { ErrorObject, DatabaseRecord } from "@/types/utility-types";
import { TestResultsContext } from "./TestResultsContextDef";
import { LoadingState, LoadingProgress } from "@/types/loading";
import { useTestResults } from "./useTestResults";

// Define the shape of the baseline data as it comes from Supabase
interface SupabaseUserBaseline {
  id: string;
  user_id: string;
  test_type: string;
  baseline_score: number;
  baseline_reaction_time: number;
  baseline_accuracy: number;
  calculation_method: string;
  sample_size: number;
  confidence_level: number;
  variance_score: number;
  variance_reaction_time: number;
  variance_accuracy: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

// These types have been moved to separate files

/**
 * Fetch test results from localStorage
 */
function fetchFromLocalStorage(): {
  baseline: TestResult | null;
  results: TestResult[];
} {
  // Only log in development and only when debugging is needed
  if (
    process.env.NODE_ENV === "development" &&
    localStorage.getItem("debug_logging") === "true"
  ) {
    console.log("Fetching from localStorage...");
  }

  let baseline: TestResult | null = null;
  let results: TestResult[] = [];

  // Load baseline result
  try {
    const storedBaseline = localStorage.getItem("baselineResult");
    if (storedBaseline) {
      baseline = JSON.parse(storedBaseline);
    }
  } catch (error) {
    console.error("Error parsing baseline from localStorage:", error);
  }

  // Load test results
  try {
    const storedResults = localStorage.getItem("testResults");
    if (storedResults) {
      const parsedResults = JSON.parse(storedResults);

      // Normalize dates for consistent handling
      results = parsedResults.map((result: TestResult) => {
        if (result.date) {
          const normalizedDate = normalizeDate(result.date);
          return {
            ...result,
            date: normalizedDate,
          };
        }
        return result;
      });
    }
  } catch (error) {
    console.error("Error parsing test results from localStorage:", error);
  }

  // If no specific baseline but we have test results, use the first (oldest) test as baseline
  if (!baseline && results.length > 0) {
    // Sort by date (oldest first)
    const sortedResults = [...results].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    baseline = sortedResults[0];
  }

  return { baseline, results };
}

/**
 * Fetch test results from Supabase with caching
 */
async function fetchFromSupabase(
  userId: string,
): Promise<{ baseline: TestResult | null; results: TestResult[] }> {
  // Only log in development and only when debugging is needed
  if (
    process.env.NODE_ENV === "development" &&
    localStorage.getItem("debug_logging") === "true"
  ) {
    console.log("Fetching from Supabase for user:", userId);
  }

  let baseline: TestResult | null = null;
  let results: TestResult[] = [];

  try {
    // Generate a cache key for this user's test results
    const cacheKey = `test_results_${userId}_all`;

    // Try to get from cache first with a TTL of 5 minutes
    const cachedData = await cache.getOrSet(
      cacheKey,
      async () => {
        // Only log cache misses when debug_logging is enabled
        if (
          process.env.NODE_ENV === "development" &&
          localStorage.getItem("debug_logging") === "true"
        ) {
          console.log("Cache miss for test results, fetching from Supabase");
        }

        // Implement retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError = null;

        while (retryCount < maxRetries) {
          try {
            // Get all test results
            const { data, error } = await supabase
              .from("test_results")
              .select("*")
              .eq("user_id", userId)
              .order("timestamp", { ascending: false });

            if (error) {
              // Check if this is a "no rows" error, which is not a real error
              if (
                error.message.includes("No rows found") ||
                error.code === "PGRST116"
              ) {
                return { data: [], error: null };
              }

              throw error;
            }

            return { data, error: null };
          } catch (err) {
            lastError = err;
            retryCount++;

            if (retryCount < maxRetries) {
              // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
              const delay = Math.pow(2, retryCount - 1) * 500;
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        // If we get here, all retries failed
        console.error(
          "Failed to fetch test results after multiple retries:",
          lastError,
        );
        return { data: [], error: lastError };
      },
      DEFAULT_CACHE_TTL.SHORT, // 5 minutes
    );

    // Process the data from cache or fresh fetch
    if (cachedData.error) {
      console.error("Error fetching test results:", cachedData.error);
    } else if (cachedData.data) {
      // Convert from Supabase format to our TestResult format
      results = cachedData.data
        // Do NOT filter by test_type to ensure we get all test results
        .map((result: DatabaseRecord) => {
          // Normalize the date for consistent handling
          const normalizedDate = normalizeDate(result.timestamp as string);

          return {
            date: normalizedDate,
            score: result.score as number,
            reactionTime: result.reaction_time as number,
            accuracy: result.accuracy as number,
            test_type: result.test_type as string, // Include test_type in the result
          };
        });

      // If we have results, sort them by date (oldest first)
      if (results.length > 0) {
        results.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      }
    }

    // Get baseline result (the earliest test)
    if (results.length > 0) {
      baseline = results[0];
    }
  } catch (error) {
    console.error("Error fetching test results from Supabase:", error);
  }

  return { baseline, results };
}

/**
 * Calculate baseline from local test results
 */
function calculateBaselineLocally(
  testResults: TestResult[],
  options: BaselineCalculationOptions = {},
): UserBaseline | null {
  try {
    if (!testResults || testResults.length === 0) {
      return null;
    }

    // Sort test results by date (oldest first)
    const sortedResults = [...testResults].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Determine which calculation method to use
    const calculationMethod = options.calculationMethod || "first_n_tests";
    const sampleSize = options.sampleSize || 3;

    let baselineResults: TestResult[] = [];

    if (calculationMethod === "first_n_tests") {
      // Use the first N test results
      baselineResults = sortedResults.slice(0, sampleSize);
    } else if (
      calculationMethod === "date_range" &&
      options.startDate &&
      options.endDate
    ) {
      // Use test results within the specified date range
      const startDate = new Date(options.startDate).getTime();
      const endDate = new Date(options.endDate).getTime();

      baselineResults = sortedResults.filter((result) => {
        const resultDate = new Date(result.date).getTime();
        return resultDate >= startDate && resultDate <= endDate;
      });
    } else {
      // Default to first N tests if method is not supported locally
      baselineResults = sortedResults.slice(0, sampleSize);
    }

    if (baselineResults.length === 0) {
      return null;
    }

    // Calculate average metrics
    const baselineScore =
      baselineResults.reduce((sum, result) => sum + result.score, 0) /
      baselineResults.length;
    const baselineReactionTime =
      baselineResults.reduce((sum, result) => sum + result.reactionTime, 0) /
      baselineResults.length;
    const baselineAccuracy =
      baselineResults.reduce((sum, result) => sum + result.accuracy, 0) /
      baselineResults.length;

    // Calculate variance
    const varianceScore = calculateVariance(
      baselineResults.map((r) => r.score),
    );
    const varianceReactionTime = calculateVariance(
      baselineResults.map((r) => r.reactionTime),
    );
    const varianceAccuracy = calculateVariance(
      baselineResults.map((r) => r.accuracy),
    );

    // Calculate confidence level based on sample size and variance
    const normalizedSampleSize = Math.min(baselineResults.length / 10, 1);
    const normalizedVariance =
      varianceScore > 0 ? 1 / (1 + Math.log(varianceScore)) : 0.5;
    const confidenceLevel =
      0.7 * normalizedSampleSize + 0.3 * normalizedVariance;

    return {
      id: "local-baseline",
      userId: "local-user",
      testType: "all", // Use 'all' consistently for test_type
      baselineScore,
      baselineReactionTime,
      baselineAccuracy,
      calculationMethod,
      sampleSize: baselineResults.length,
      confidenceLevel,
      varianceScore,
      varianceReactionTime,
      varianceAccuracy,
      startDate: baselineResults[0].date,
      endDate: baselineResults[baselineResults.length - 1].date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calculating baseline locally:", error);
    return null;
  }
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length <= 1) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Get a user's baseline for a specific test type with caching
 * Note: testType parameter is kept for API consistency but not used in the query
 */
async function getUserBaseline(
  userId: string,
  testType: string,
): Promise<{
  success: boolean;
  baseline: UserBaseline | null;
  error?: string;
}> {
  try {
    // Generate a cache key for this user's baseline
    const cacheKey = `user_baseline_${userId}_${testType}`;

    // Try to get from cache first with a TTL of 30 minutes (longer than test results)
    return await cache.getOrSet(
      cacheKey,
      async () => {
        // Only log cache misses when debug_logging is enabled
        if (
          process.env.NODE_ENV === "development" &&
          localStorage.getItem("debug_logging") === "true"
        ) {
          console.log(
            `Cache miss for user baseline, fetching from Supabase for user ${userId}`,
          );
        }

        // Implement retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError = null;

        while (retryCount < maxRetries) {
          try {
            // Get all baselines for this user, don't filter by test_type
            const { data, error } = await supabase
              .from("user_baselines")
              .select("*")
              .eq("user_id", userId)
              // Don't filter by test_type to see all available baselines
              .order("created_at", { ascending: false })
              .limit(1); // Get the most recent baseline

            if (error) {
              // Check if this is a "no rows" error, which is not a real error
              if (
                error.message.includes("No rows found") ||
                error.code === "PGRST116"
              ) {
                return { success: true, baseline: null };
              }

              throw error;
            }

            // Check if we have any results
            if (!data || data.length === 0) {
              return { success: true, baseline: null };
            }

            // Use the first result (most recent)
            const baselineData = data[0];

            return {
              success: true,
              baseline: {
                id: baselineData.id,
                userId: baselineData.user_id,
                testType: baselineData.test_type,
                baselineScore: baselineData.baseline_score,
                baselineReactionTime: baselineData.baseline_reaction_time,
                baselineAccuracy: baselineData.baseline_accuracy,
                calculationMethod: baselineData.calculation_method,
                sampleSize: baselineData.sample_size,
                confidenceLevel: baselineData.confidence_level,
                varianceScore: baselineData.variance_score,
                varianceReactionTime: baselineData.variance_reaction_time,
                varianceAccuracy: baselineData.variance_accuracy,
                startDate: baselineData.start_date,
                endDate: baselineData.end_date,
                createdAt: baselineData.created_at,
                updatedAt: baselineData.updated_at,
              },
            };
          } catch (err) {
            lastError = err;
            retryCount++;

            if (retryCount < maxRetries) {
              // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
              const delay = Math.pow(2, retryCount - 1) * 500;
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        // If we get here, all retries failed
        console.error(
          "Failed to fetch user baseline after multiple retries:",
          lastError,
        );
        return {
          success: false,
          error:
            lastError instanceof Error
              ? lastError.message
              : "Unknown error after multiple retries",
          baseline: null,
        };
      },
      DEFAULT_CACHE_TTL.MEDIUM, // 30 minutes - baselines change less frequently
    );
  } catch (error) {
    console.error("Unexpected error in getUserBaseline:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      baseline: null,
    };
  }
}

/**
 * Check if an error is a "no rows" error
 */
function isNoRowsError(error: ErrorObject): boolean {
  const errorObj = error as { message?: string; code?: string };
  const hasNoRowsMessage = errorObj.message?.includes("No rows found") ?? false;
  const hasNoRowsCode = errorObj.code === "PGRST116";
  return Boolean(hasNoRowsMessage ?? hasNoRowsCode);
}

/**
 * Handle exponential backoff for retries
 */
async function handleBackoff(retryCount: number): Promise<void> {
  // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
  const delay = Math.pow(2, retryCount - 1) * 500;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Handle errors from Supabase queries
 */
function handleQueryError<T>(
  error: ErrorObject,
  errorHandler?: (
    error: ErrorObject,
  ) => { success: boolean; data?: T | null; error?: string } | null,
): { success: boolean; data?: T | null; error?: string } | null {
  // Check if this is a "no rows" error, which is not a real error
  if (isNoRowsError(error)) {
    return { success: true, data: null };
  }

  // If we have a custom error handler, use it
  if (errorHandler) {
    return errorHandler(error);
  }

  return null;
}

/**
 * Format error message for retry failures
 */
function formatRetryError(error: ErrorObject): string {
  return error instanceof Error
    ? error.message
    : "Unknown error after multiple retries";
}

/**
 * Execute a Supabase RPC call with retry logic
 */
async function executeWithRetry<T>(
  fn: () => Promise<{ data: unknown; error: ErrorObject | null }>,
  errorHandler?: (
    error: ErrorObject,
  ) => { success: boolean; data?: T | null; error?: string } | null,
): Promise<{ success: boolean; data?: T | null; error?: string }> {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    try {
      // Need to await the result of fn() to get the actual Promise
      const result = await fn();
      const { data, error } = result;

      if (error) {
        const errorResult = handleQueryError<T>(error, errorHandler);
        if (errorResult) return errorResult;
        throw error;
      }

      return { success: true, data: data as T };
    } catch (err) {
      lastError = err;
      retryCount++;

      if (retryCount < maxRetries) {
        await handleBackoff(retryCount);
      }
    }
  }

  // If we get here, all retries failed
  console.error("Failed after multiple retries:", lastError);
  return {
    success: false,
    error: formatRetryError(lastError as ErrorObject),
    data: null,
  };
}

/**
 * Calculate a user's cognitive baseline with caching
 */
async function calculateBaseline(
  userId: string,
  testType: string,
  options: BaselineCalculationOptions = {},
): Promise<{
  success: boolean;
  baseline: UserBaseline | null;
  error?: string;
}> {
  try {
    // Set default values
    const calculationMethod = options.calculationMethod || "first_n_tests";
    const sampleSize = options.sampleSize || 3;
    const startDate = options.startDate || null;
    const endDate = options.endDate || null;

    // Generate a unique cache key based on the calculation parameters
    const cacheKey = `baseline_calc_${userId}_${testType}_${calculationMethod}_${sampleSize}_${startDate || "null"}_${endDate || "null"}`;

    // Invalidate any existing user baseline cache since we're calculating a new one
    cache.delete(`user_baseline_${userId}_${testType}`);

    // Call the Supabase function with retry logic
    const result = await executeWithRetry<SupabaseUserBaseline>(async () => {
      const response = await supabase.rpc("calculate_user_baseline", {
        p_user_id: userId,
        p_test_type: "all", // Use 'all' to include all test types
        p_calculation_method: calculationMethod,
        p_sample_size: sampleSize,
        p_start_date: startDate,
        p_end_date: endDate,
      });
      return response;
    });

    if (!result.success || !result.data) {
      return {
        success: result.success,
        error: result.error,
        baseline: null,
      };
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Baseline calculation completed for user:", userId);
    }

    const data = result.data;
    const baselineResult = {
      success: true,
      baseline: {
        id: data.id,
        userId,
        testType,
        baselineScore: data.baseline_score,
        baselineReactionTime: data.baseline_reaction_time,
        baselineAccuracy: data.baseline_accuracy,
        calculationMethod,
        sampleSize: data.sample_size,
        confidenceLevel: data.confidence_level,
        varianceScore: data.variance_score,
        varianceReactionTime: data.variance_reaction_time,
        varianceAccuracy: data.variance_accuracy,
        startDate: data.start_date,
        endDate: data.end_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };

    // Cache the result for future use
    cache.set(cacheKey, baselineResult, DEFAULT_CACHE_TTL.MEDIUM);

    return baselineResult;
  } catch (error) {
    console.error("Unexpected error calculating baseline:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      baseline: null,
    };
  }
}

// Helper function to create initial loading progress
const createInitialLoadingProgress = (): LoadingProgress => ({
  stage: "idle",
  message: "Ready to load data",
  progress: 0,
  startTime: Date.now(),
  elapsedTime: 0,
});

// Helper function to update loading progress
const updateLoadingProgress = (
  current: LoadingProgress,
  updates: Partial<LoadingProgress>,
): LoadingProgress => {
  const now = Date.now();
  return {
    ...current,
    ...updates,
    elapsedTime: now - current.startTime,
  };
};

// Re-export the useTestResults hook
export { useTestResults };

export function TestResultsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useSupabaseAuth();
  const [baselineResult, setBaselineResult] = useState<TestResult | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);
  const [userBaseline, setUserBaseline] = useState<UserBaseline | null>(null);

  // New loading state machine
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>(
    createInitialLoadingProgress(),
  );

  // Legacy loading states (kept for backward compatibility)
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [isCalculatingBaseline, setIsCalculatingBaseline] = useState(false);

  // Track the last fetch time to implement conditional fetching
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  // Track partial loading states
  const [isLoadingLocal, setIsLoadingLocal] = useState<boolean>(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  // Track data freshness
  const [isDataStale, setIsDataStale] = useState<boolean>(true);

  // Refs to track ongoing operations and prevent duplicate calls
  const fetchingBaselineRef = useRef(false);
  const fetchingTestsRef = useRef(false);

  // Debug logging helpers
  const debugLog = useCallback((message: string, data?: unknown) => {
    const isDevelopment = process.env.NODE_ENV === "development";
    const isDebugModeEnabled =
      import.meta.env.VITE_ENABLE_DEBUG_LOGGING === "true";
    const isLocalStorageDebugEnabled =
      localStorage.getItem("debug_logging") === "true";

    if (isDevelopment && isDebugModeEnabled && isLocalStorageDebugEnabled) {
      if (data) {
        console.log(`[TestResults] ${message}`, data);
      } else {
        console.log(`[TestResults] ${message}`);
      }
    }
  }, []);

  const debugWarn = useCallback((message: string, data?: unknown) => {
    const isDevelopment = process.env.NODE_ENV === "development";
    const isDebugModeEnabled =
      import.meta.env.VITE_ENABLE_DEBUG_LOGGING === "true";
    const isLocalStorageDebugEnabled =
      localStorage.getItem("debug_logging") === "true";

    if (isDevelopment && isDebugModeEnabled && isLocalStorageDebugEnabled) {
      if (data) {
        console.warn(`[TestResults] ${message}`, data);
      } else {
        console.warn(`[TestResults] ${message}`);
      }
    }
  }, []);

  const debugError = useCallback((message: string, data?: unknown) => {
    // Always log errors, but with different verbosity based on environment
    if (data) {
      console.error(`[TestResults] ${message}`, data);
    } else {
      console.error(`[TestResults] ${message}`);
    }
  }, []);

  // Function to transition loading state with proper progress updates
  const transitionLoadingState = useCallback(
    (
      newState: LoadingState,
      message: string,
      progress: number,
      error?: string,
    ) => {
      setLoadingState(newState);
      setLoadingProgress((current) =>
        updateLoadingProgress(current, {
          stage: newState,
          message,
          progress,
          error,
        }),
      );

      // Log state transitions in development mode
      debugLog(
        `Loading state transition: ${newState} (${progress}%) - ${message}`,
      );

      // Update legacy loading states for backward compatibility
      if (newState === "idle" || newState === "complete") {
        setIsLoadingTests(false);
        fetchingTestsRef.current = false;

        // Dispatch an event to notify that test results loading has completed
        window.dispatchEvent(new CustomEvent("test-results-loaded"));
      } else if (newState === "error") {
        setIsLoadingTests(false);
        fetchingTestsRef.current = false;
        setIsDataStale(true);

        // Dispatch an event to notify that test results loading has completed (with error)
        window.dispatchEvent(new CustomEvent("test-results-loaded"));
      } else if (newState === "fetching_local") {
        setIsLoadingLocal(true);
      } else if (newState === "fetching_remote") {
        setIsLoadingSupabase(true);
      } else {
        setIsLoadingTests(true);
      }

      // Set a safety timeout for non-terminal states to ensure we don't get stuck
      if (
        newState !== "idle" &&
        newState !== "complete" &&
        newState !== "error"
      ) {
        const safetyTimeout = setTimeout(() => {
          // Check if we're still in this state after the timeout
          if (loadingState === newState) {
            debugWarn(
              `Safety timeout triggered for state: ${newState} - forcing transition to error state`,
            );

            // Force transition to error state
            setLoadingState("error");
            setLoadingProgress((current) =>
              updateLoadingProgress(current, {
                stage: "error",
                message: `Loading timed out in state: ${newState}`,
                progress: 0,
                error: "Operation took too long",
              }),
            );

            // Reset loading flags
            setIsLoadingTests(false);
            fetchingTestsRef.current = false;

            // Dispatch an event to notify that test results loading has completed (forced by timeout)
            window.dispatchEvent(new CustomEvent("test-results-loaded"));
          }
        }, 6000); // 6 second safety timeout for each state

        return () => clearTimeout(safetyTimeout);
      }
    },
    [debugLog, debugWarn, loadingState],
  );

  /**
   * Helper function to validate a test result
   */
  const isValidTestResult = useCallback((result: unknown): boolean => {
    if (!result || typeof result !== "object") return false;

    const testResult = result as Partial<TestResult>;
    return !!(
      testResult.date &&
      typeof testResult.score === "number" &&
      !isNaN(testResult.score) &&
      typeof testResult.reactionTime === "number" &&
      !isNaN(testResult.reactionTime) &&
      typeof testResult.accuracy === "number" &&
      !isNaN(testResult.accuracy)
    );
  }, []);

  /**
   * Helper function to fetch data from localStorage
   */
  const fetchLocalData = useCallback(() => {
    transitionLoadingState(
      "fetching_local",
      "Loading data from local storage...",
      20,
    );
    let localData = { baseline: null, results: [] };

    try {
      localData = fetchFromLocalStorage();
      // Only log in development and only when debugging is needed
      if (
        process.env.NODE_ENV === "development" &&
        localStorage.getItem("debug_logging") === "true"
      ) {
        console.log(
          `Loaded ${localData.results.length} results from localStorage`,
        );
      }
      transitionLoadingState("processing", "Processing local data...", 40);
    } catch (localError) {
      console.error(
        "Error fetching from localStorage, using empty data:",
        localError,
      );
      transitionLoadingState(
        "error",
        "Error loading local data",
        0,
        localError instanceof Error ? localError.message : "Unknown error",
      );
    } finally {
      setIsLoadingLocal(false);
    }

    return localData;
  }, [transitionLoadingState, setIsLoadingLocal]);

  /**
   * Helper function to fetch data from Supabase
   */
  const fetchSupabaseData = useCallback(
    async (userId: string) => {
      transitionLoadingState(
        "fetching_remote",
        "Loading data from server...",
        50,
      );
      let supabaseData = { baseline: null, results: [] };

      try {
        supabaseData = await fetchFromSupabase(userId);
        debugLog(`Loaded ${supabaseData.results.length} results from Supabase`);
        transitionLoadingState("processing", "Processing server data...", 70);
      } catch (supabaseError) {
        // Check if this is a network error or a server error
        const errorMessage =
          supabaseError instanceof Error
            ? supabaseError.message
            : String(supabaseError);

        if (
          errorMessage.includes("network") ||
          errorMessage.includes("timeout")
        ) {
          debugWarn(
            "Network error fetching from Supabase, using cached data:",
            errorMessage,
          );
          transitionLoadingState(
            "error",
            "Network error loading data from server",
            50,
            errorMessage,
          );
        } else {
          debugError(
            "Error fetching from Supabase, using empty data:",
            supabaseError,
          );
          transitionLoadingState(
            "error",
            "Error loading data from server",
            50,
            errorMessage,
          );
        }
      } finally {
        setIsLoadingSupabase(false);
      }

      return supabaseData;
    },
    [
      transitionLoadingState,
      debugLog,
      debugWarn,
      debugError,
      setIsLoadingSupabase,
    ],
  );

  /**
   * Helper function to merge and deduplicate test results
   */
  const mergeTestResults = useCallback(
    (localResults: TestResult[], supabaseResults: TestResult[]) => {
      // Filter out any invalid results before merging
      const validLocalResults = localResults.filter(isValidTestResult);
      const validSupabaseResults = supabaseResults.filter(isValidTestResult);

      // Deduplicate results by date
      const resultMap = new Map<string, TestResult>();

      // Add local results to the map
      validLocalResults.forEach((result) => {
        resultMap.set(result.date, result);
      });

      // Add Supabase results to the map, overriding local results if they exist
      validSupabaseResults.forEach((result) => {
        resultMap.set(result.date, result);
      });

      // Convert map back to array
      const mergedResults = Array.from(resultMap.values());

      debugLog(
        `Merged ${validLocalResults.length} local and ${validSupabaseResults.length} Supabase results into ${mergedResults.length} unique results`,
      );

      return mergedResults;
    },
    [isValidTestResult, debugLog],
  );

  /**
   * Helper function to sort test results by date
   */
  const sortTestResults = useCallback(
    (tests: TestResult[]) => {
      return [...tests].sort((a, b) => {
        try {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();

          // Check for invalid dates
          if (isNaN(dateA) || isNaN(dateB)) {
            debugWarn("Invalid date detected during sorting:", {
              dateA: a.date,
              dateB: b.date,
            });

            // If one date is invalid, prioritize the valid one
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            return 0;
          }

          return dateA - dateB;
        } catch (error) {
          debugError("Error sorting test results by date:", error);
          return 0;
        }
      });
    },
    [debugWarn, debugError],
  );

  /**
   * Helper function to create a latest result
   */
  const createLatestResult = useCallback((allTests: TestResult[]) => {
    let latest: TestResult | null = null;

    if (allTests.length > 1) {
      // If we have more than one test, use the most recent one
      latest = allTests[allTests.length - 1];
    } else if (allTests.length === 1) {
      // If we only have one test (the baseline), create a slightly modified version for comparison
      // This is a temporary solution to demonstrate the UI when only one test exists
      const baselineTest = allTests[0];
      latest = {
        ...baselineTest,
        score: baselineTest.score * 1.05, // 5% better score
        reactionTime: baselineTest.reactionTime * 0.95, // 5% faster reaction time
        accuracy: Math.min(100, baselineTest.accuracy * 1.05), // 5% better accuracy, max 100
      };
    }

    return latest;
  }, []);

  // Debug helper functions are now defined earlier in the component

  /**
   * Helper function to check if data is fresh
   *
   * IMPORTANT: We've removed testHistory from the dependency array to prevent
   * unnecessary recreation of this function, which was causing continuous fetching.
   * Instead, we access testHistory.length directly in the function body.
   */
  const isDataFresh = useCallback(
    (forceRefresh: boolean, timeSinceLastFetch: number) => {
      const REFRESH_THRESHOLD = 300 * 1000; // 5 minutes (increased from 1 minute)

      if (forceRefresh) {
        return false; // Force refresh always fetches fresh data
      }

      // Check if we have data and it's recent enough
      // We access testHistory.length directly instead of including it in dependencies
      const hasData = testHistory.length > 0;
      const isRecent = timeSinceLastFetch < REFRESH_THRESHOLD && !isDataStale;
      const isFresh = isRecent && hasData;

      if (isFresh) {
        debugLog("Data is fresh", {
          timeSinceLastFetch: `${Math.round(timeSinceLastFetch / 1000)}s`,
          threshold: `${REFRESH_THRESHOLD / 1000}s`,
          testCount: testHistory.length,
        });
      }

      return isFresh;
    },
    [isDataStale, debugLog],
  );

  /**
   * Helper function to process test results and create test history
   */
  const processTestResults = useCallback(
    (mergedResults: TestResult[], finalBaseline: TestResult | null) => {
      // Create the full test history including baseline
      let allTests: TestResult[] = [];

      if (finalBaseline) {
        // Filter out the baseline from regular tests to avoid duplication
        const nonBaselineTests = mergedResults.filter(
          (test) => test.date !== finalBaseline.date,
        );

        allTests =
          nonBaselineTests.length > 0
            ? [finalBaseline, ...nonBaselineTests]
            : [finalBaseline];
      } else if (mergedResults.length > 0) {
        // If no explicit baseline but we have results, use all results
        allTests = [...mergedResults];
      }

      // Sort tests by date
      return sortTestResults(allTests);
    },
    [sortTestResults],
  );

  /**
   * Helper function to find the baseline to use
   */
  const findBaselineToUse = useCallback(
    (finalBaseline: TestResult | null, allTests: TestResult[]) => {
      // Start with the provided baseline
      let baselineToUse = finalBaseline;

      // If no explicit baseline but we have tests, use the oldest test as baseline
      if (!baselineToUse && allTests.length > 0) {
        // The tests are already sorted by date at this point, so the first one is the oldest
        baselineToUse = allTests[0];

        debugLog(
          "No explicit baseline found, using oldest test as baseline:",
          baselineToUse.date,
        );
      }

      return baselineToUse;
    },
    [debugLog],
  );

  /**
   * Main fetch function with conditional fetching
   */
  const fetchTestResults = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        // Prevent duplicate calls
        if (fetchingTestsRef.current && !forceRefresh) {
          debugLog("Skipping duplicate fetch call");
          return;
        }

        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTime;

        // Skip fetching if data is fresh
        if (isDataFresh(forceRefresh, timeSinceLastFetch)) {
          debugLog("Data is fresh, skipping fetch");

          // Only update loading states if they're actually loading
          // This prevents unnecessary state updates that cause re-renders
          if (isLoadingTests) {
            setIsLoadingTests(false);
          }

          if (fetchingTestsRef.current) {
            fetchingTestsRef.current = false;

            // Only dispatch the event if we were actually fetching
            // This prevents unnecessary event dispatches that cause re-renders
            window.dispatchEvent(new CustomEvent("test-results-loaded"));
          }

          return;
        }

        // Initialize loading state
        if (testHistory.length === 0) {
          transitionLoadingState("initializing", "Initializing data...", 10);
        } else {
          transitionLoadingState(
            "refreshing",
            forceRefresh ? "Refreshing data..." : "Updating data...",
            10,
          );
        }

        fetchingTestsRef.current = true;
        setIsLoadingTests(true);
        setLastFetchTime(now);

        // Get data from local storage and Supabase
        const localData = fetchLocalData();
        let supabaseData = { baseline: null, results: [] };

        if (user) {
          supabaseData = await fetchSupabaseData(user.id);
        }

        // Update progress
        transitionLoadingState("processing", "Processing test results...", 80);

        // Prefer Supabase baseline if available
        const finalBaseline = supabaseData.baseline ?? localData.baseline;

        // Merge and deduplicate test results
        let mergedResults: TestResult[] = [];
        try {
          mergedResults = mergeTestResults(
            localData.results,
            supabaseData.results,
          );
        } catch (mergeError) {
          debugError("Error merging results, using empty array:", mergeError);
          transitionLoadingState(
            "error",
            "Error merging test results",
            80,
            mergeError instanceof Error
              ? mergeError.message
              : "Unknown error merging results",
          );

          // Dispatch an event to notify that test results loading has completed (with error)
          window.dispatchEvent(new CustomEvent("test-results-loaded"));
          return;
        }

        // Process test results and create test history
        const allTests = processTestResults(mergedResults, finalBaseline);

        // Find the baseline to use
        const baselineToUse = findBaselineToUse(finalBaseline, allTests);

        // Update progress
        transitionLoadingState("processing", "Finalizing data...", 90);

        // Set state
        setBaselineResult(baselineToUse);
        setTestHistory(allTests);
        setIsDataStale(false);

        // Set latest result
        const latest = createLatestResult(allTests);
        setLatestResult(latest);

        // Complete the loading process
        transitionLoadingState("complete", "Data loaded successfully", 100);

        debugLog("Test data loaded:", {
          testCount: allTests.length,
          hasBaseline: !!baselineToUse,
          fromCache: !forceRefresh && timeSinceLastFetch < 60 * 1000,
        });

        // Dispatch an event to notify that test results loading has completed
        window.dispatchEvent(new CustomEvent("test-results-loaded"));
      } catch (error) {
        debugError("Unexpected error fetching test results:", error);
        transitionLoadingState(
          "error",
          "Unexpected error loading data",
          0,
          error instanceof Error ? error.message : "Unknown error",
        );
        setIsDataStale(true);

        // Dispatch an event to notify that test results loading has completed (with error)
        window.dispatchEvent(new CustomEvent("test-results-loaded"));
      } finally {
        // These are handled by the transitionLoadingState function now
        // but we keep them for safety
        setIsLoadingTests(false);
        fetchingTestsRef.current = false;
      }
    },
    [
      lastFetchTime,
      isDataFresh,
      user,
      fetchLocalData,
      fetchSupabaseData,
      mergeTestResults,
      processTestResults,
      findBaselineToUse,
      createLatestResult,
      transitionLoadingState,
      debugLog,
      debugError,
      testHistory.length,
    ],
  );

  // Create a debounced version of fetchTestResults
  // First, create a function that will be debounced
  const handleFetchTestResults = useCallback(
    (forceRefresh: boolean = false) => {
      // Check if we're already loading
      if (isLoadingTests || fetchingTestsRef.current) {
        debugWarn("Already loading test results, skipping duplicate fetch");

        // We'll still set a safety timeout, but we won't trigger another fetch
        // This prevents the UI from getting stuck in a loading state
        const safetyTimeoutId = setTimeout(() => {
          if (fetchingTestsRef.current || isLoadingTests) {
            debugWarn("Safety timeout triggered - resetting loading state");

            // Only update state if it's actually loading
            if (isLoadingTests) {
              setIsLoadingTests(false);
            }

            if (fetchingTestsRef.current) {
              fetchingTestsRef.current = false;

              // Only dispatch event if we were actually fetching
              window.dispatchEvent(new CustomEvent("test-results-loaded"));
            }
          }
        }, 8000); // 8 second safety timeout

        // Return a cleanup function to clear the timeout if the component unmounts
        return () => clearTimeout(safetyTimeoutId);
      }

      // If not already loading, proceed with fetch
      fetchTestResults(forceRefresh);
    },
    [isLoadingTests, fetchTestResults, debugWarn, setIsLoadingTests],
  );

  // Then create the debounced version using a ref to avoid recreation on every render
  const debouncedFetchTestResultsRef =
    useRef<(forceRefresh: boolean) => void>();

  // Update the ref whenever handleFetchTestResults changes
  useEffect(() => {
    debouncedFetchTestResultsRef.current = debounce(
      handleFetchTestResults,
      300,
    );
  }, [handleFetchTestResults]);

  // Create a stable function that uses the ref
  const debouncedFetchTestResults = useCallback(
    (forceRefresh: boolean = false) => {
      debouncedFetchTestResultsRef.current?.(forceRefresh);
    },
    [],
  );

  // Function to refresh test results with optional force refresh
  const refreshTestResults = useCallback(
    (forceRefresh: boolean = false) => {
      // Mark data as stale if forcing refresh
      if (forceRefresh) {
        setIsDataStale(true);
      }

      // Check if we're already loading - if so, don't trigger another fetch
      if (isLoadingTests || fetchingTestsRef.current) {
        debugWarn(
          "Refresh called while already loading - skipping duplicate fetch",
        );
        return () => {}; // Return empty cleanup function
      }

      // Set a maximum loading time to prevent getting stuck
      const safetyTimeout = setTimeout(() => {
        if (isLoadingTests || fetchingTestsRef.current) {
          debugWarn("Maximum loading time exceeded - resetting loading state");
          // Update loading state to error with timeout message
          transitionLoadingState(
            "error",
            "Loading timed out - please try again",
            0,
            "Loading operation took too long",
          );

          // Only update state if it's actually loading
          if (isLoadingTests) {
            setIsLoadingTests(false);
          }

          if (fetchingTestsRef.current) {
            fetchingTestsRef.current = false;

            // Only dispatch event if we were actually fetching
            window.dispatchEvent(new CustomEvent("test-results-loaded"));
          }
        }
      }, 12000); // 12 second maximum loading time

      // Set a shorter interval check that runs more frequently
      const intervalCheck = setInterval(() => {
        // If loading has completed but flags weren't reset
        if (!isLoadingTests && fetchingTestsRef.current) {
          debugWarn(
            "Inconsistent loading state detected - resetting fetching flag",
          );
          fetchingTestsRef.current = false;

          // Dispatch an event to notify that test results loading has completed
          window.dispatchEvent(new CustomEvent("test-results-loaded"));
          clearInterval(intervalCheck);
        }
      }, 1000); // Check every second

      // Trigger the actual fetch
      debouncedFetchTestResults(forceRefresh);

      // Return cleanup function to clear the timeout and interval
      return () => {
        clearTimeout(safetyTimeout);
        clearInterval(intervalCheck);

        // Ensure loading states are reset on cleanup
        if (isLoadingTests) {
          setIsLoadingTests(false);
        }

        if (fetchingTestsRef.current) {
          fetchingTestsRef.current = false;
        }
      };
    },
    [
      debouncedFetchTestResults,
      isLoadingTests,
      transitionLoadingState,
      debugWarn,
      setIsDataStale,
      setIsLoadingTests,
    ],
  );

  // Fetch user's baseline from Supabase
  const fetchUserBaseline = useCallback(async () => {
    // Prevent duplicate calls
    if (fetchingBaselineRef.current || !user) {
      // If already fetching or no user, use local calculation
      const localBaseline = calculateBaselineLocally(testHistory);
      setUserBaseline(localBaseline);
      return;
    }

    try {
      fetchingBaselineRef.current = true;

      // Use 'all' consistently for test_type
      const response = await getUserBaseline(user.id, "all");

      if (response.success && response.baseline) {
        setUserBaseline(response.baseline);
      } else {
        const localBaseline = calculateBaselineLocally(testHistory);
        setUserBaseline(localBaseline);
      }
    } catch (error) {
      console.error("Error fetching user baseline:", error);
      // Fallback to local calculation
      const localBaseline = calculateBaselineLocally(testHistory);
      setUserBaseline(localBaseline);
    } finally {
      fetchingBaselineRef.current = false;
    }
  }, [user, testHistory]);

  // Calculate user baseline - wrapped in useCallback to prevent unnecessary re-renders
  const calculateUserBaseline = useCallback(
    async (
      options?: BaselineCalculationOptions,
    ): Promise<UserBaseline | null> => {
      if (!user) {
        const localBaseline = calculateBaselineLocally(testHistory, options);
        setUserBaseline(localBaseline);
        return localBaseline;
      }

      try {
        setIsCalculatingBaseline(true);

        // Use 'all' consistently for test_type
        const response = await calculateBaseline(user.id, "all", options);

        if (response.success && response.baseline) {
          setUserBaseline(response.baseline);
          return response.baseline;
        } else {
          debugError("Baseline calculation failed:", response.error);
          return null;
        }
      } catch (error) {
        debugError("Error calculating user baseline:", error);
        return null;
      } finally {
        setIsCalculatingBaseline(false);
      }
    },
    [user, testHistory, setUserBaseline, setIsCalculatingBaseline, debugError],
  );

  // Initial fetch of test results - only run once on mount
  useEffect(
    () => {
      // Don't force refresh on initial load to allow caching to work
      // This prevents unnecessary double fetching
      fetchTestResults(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      /* Run only once on mount */
    ],
  );

  // Fetch user baseline only when test history length changes, not on every render
  // This prevents continuous fetching that was causing flickering
  const testHistoryLengthRef = useRef(0);

  useEffect(() => {
    // Only fetch if the length has changed and we have data
    if (
      testHistory.length > 0 &&
      testHistory.length !== testHistoryLengthRef.current &&
      !isLoadingTests
    ) {
      // Update the ref to the new length
      testHistoryLengthRef.current = testHistory.length;

      // Fetch the user baseline
      fetchUserBaseline();
    }
  }, [testHistory.length, fetchUserBaseline, isLoadingTests]);

  // Re-fetch test results when user ID changes (e.g., after login)
  // We use a ref to track the previous user ID to prevent unnecessary fetches
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only proceed if we have a user
    if (!user) {
      prevUserIdRef.current = null;
      return;
    }

    // Check if the user ID has actually changed
    if (user.id !== prevUserIdRef.current) {
      // Update the ref with the new user ID
      prevUserIdRef.current = user.id;

      // When user ID changes, force refresh to get the latest data
      debugLog("User ID changed, refreshing test results and baseline data");
      fetchTestResults(true);

      // Clear any cached baseline data to ensure we get fresh data
      cache.delete(`user_baseline_${user.id}_all`);
      cache.delete(`test_results_${user.id}_all`);
    }
  }, [user?.id, debugLog, fetchTestResults]); // Only depend on user?.id, not the entire user object

  const value = useMemo(
    () => ({
      // Data
      baselineResult,
      testHistory,
      latestResult,
      userBaseline,

      // New loading state machine
      loadingState,
      loadingProgress,

      // Legacy loading states (kept for backward compatibility)
      isLoadingTests,
      isLoadingLocal,
      isLoadingSupabase,
      isCalculatingBaseline,
      isDataStale,

      // Actions
      refreshTestResults,
      calculateUserBaseline,
    }),
    [
      // Data
      baselineResult,
      testHistory,
      latestResult,
      userBaseline,

      // New loading state machine
      loadingState,
      loadingProgress,

      // Legacy loading states
      isLoadingTests,
      isLoadingLocal,
      isLoadingSupabase,
      isCalculatingBaseline,
      isDataStale,

      // Actions
      refreshTestResults,
      calculateUserBaseline,
    ],
  );

  return (
    <TestResultsContext.Provider value={value}>
      {children}
    </TestResultsContext.Provider>
  );
}

// The useTestResults hook has been moved to a separate file
