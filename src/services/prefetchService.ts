/**
 * Prefetch Service
 *
 * This service handles prefetching commonly accessed data when the application initializes.
 * It improves perceived performance by loading data before the user needs it.
 */

import { supabase } from "@/integrations/supabase/client";
import { cache, DEFAULT_CACHE_TTL } from "@/lib/cache";
import { CACHE_CONFIG } from "@/lib/supabaseCache";
import { loadSupplementsFromLocalStorage } from "@/services/supplementService";

// Configuration for prefetching
export interface PrefetchConfig {
  // Whether prefetching is enabled
  enabled: boolean;

  // Which data types to prefetch
  prefetchUserProfile: boolean;
  prefetchTestResults: boolean;
  prefetchSupplements: boolean;
  prefetchConfoundingFactors: boolean;
  prefetchWashoutPeriods: boolean;

  // Maximum number of items to prefetch for each type
  maxTestResults: number;
  maxSupplements: number;
  maxConfoundingFactors: number;
  maxWashoutPeriods: number;

  // Logging configuration
  logLevel: "none" | "error" | "warn" | "info" | "debug";
}

// Default prefetch configuration
export const DEFAULT_PREFETCH_CONFIG: PrefetchConfig = {
  enabled: true,
  prefetchUserProfile: true,
  prefetchTestResults: true,
  prefetchSupplements: true,
  prefetchConfoundingFactors: true,
  prefetchWashoutPeriods: true,
  maxTestResults: 20,
  maxSupplements: 10,
  maxConfoundingFactors: 10,
  maxWashoutPeriods: 5,
  logLevel: process.env.NODE_ENV !== "production" ? "error" : "none",
};

// Metrics for prefetching performance
interface PrefetchMetrics {
  startTime: number;
  endTime: number | null;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  itemMetrics: Record<
    string,
    {
      startTime: number;
      endTime: number | null;
      success: boolean;
      error?: string;
    }
  >;
}

class PrefetchService {
  private config: PrefetchConfig = DEFAULT_PREFETCH_CONFIG;
  private metrics: PrefetchMetrics = this.initializeMetrics();
  private prefetchPromise: Promise<void> | null = null;
  private isPrefetching: boolean = false;

  /**
   * Initialize prefetch metrics
   */
  private initializeMetrics(): PrefetchMetrics {
    return {
      startTime: 0,
      endTime: null,
      totalItems: 0,
      successfulItems: 0,
      failedItems: 0,
      itemMetrics: {},
    };
  }

  /**
   * Configure the prefetch service
   * @param config Partial configuration to override defaults
   */
  configure(config: Partial<PrefetchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start prefetching data for the given user
   * @param userId The user ID
   * @returns Promise that resolves when prefetching is complete
   */
  async prefetch(userId: string): Promise<void> {
    // Skip if prefetching is disabled or already in progress
    if (!this.config.enabled || this.isPrefetching) {
      // Return existing promise if there's one in progress, otherwise resolve immediately
      return this.prefetchPromise ?? Promise.resolve();
    }

    // Initialize metrics
    this.metrics = this.initializeMetrics();
    this.metrics.startTime = performance.now();
    this.isPrefetching = true;

    // Create a promise for the prefetching process
    this.prefetchPromise = this.doPrefetch(userId).finally(() => {
      this.isPrefetching = false;
      this.metrics.endTime = performance.now();

      // Log metrics based on configured log level
      this.logMetrics();
    });

    return this.prefetchPromise;
  }

  /**
   * Perform the actual prefetching
   * @param userId The user ID
   */
  private async doPrefetch(userId: string): Promise<void> {
    const prefetchTasks: Promise<void>[] = [];

    // Prefetch user profile
    if (this.config.prefetchUserProfile) {
      prefetchTasks.push(this.prefetchUserProfile(userId));
    }

    // Prefetch test results
    if (this.config.prefetchTestResults) {
      prefetchTasks.push(this.prefetchTestResults(userId));
    }

    // Prefetch supplements
    if (this.config.prefetchSupplements) {
      prefetchTasks.push(this.prefetchSupplements(userId));
    }

    // Prefetch confounding factors
    if (this.config.prefetchConfoundingFactors) {
      prefetchTasks.push(this.prefetchConfoundingFactors(userId));
    }

    // Prefetch washout periods
    if (this.config.prefetchWashoutPeriods) {
      prefetchTasks.push(this.prefetchWashoutPeriods(userId));
    }

    // Wait for all prefetch tasks to complete
    await Promise.allSettled(prefetchTasks);
  }

  /**
   * Prefetch user profile data
   * @param userId The user ID
   */
  private async prefetchUserProfile(userId: string): Promise<void> {
    const metricKey = "userProfile";
    this.metrics.totalItems++;
    this.metrics.itemMetrics[metricKey] = {
      startTime: performance.now(),
      endTime: null,
      success: false,
    };

    try {
      // Fetch user profile
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Cache the user profile
      if (data) {
        cache.set(`user_profile_${userId}`, data, DEFAULT_CACHE_TTL.MEDIUM);
        this.metrics.successfulItems++;
        this.metrics.itemMetrics[metricKey].success = true;
      }
    } catch (error) {
      this.metrics.failedItems++;
      this.metrics.itemMetrics[metricKey].error =
        error instanceof Error ? error.message : String(error);
      if (this.config.logLevel !== "none") {
        console.error("Error prefetching user profile:", error);
      }
    } finally {
      this.metrics.itemMetrics[metricKey].endTime = performance.now();
    }
  }

  /**
   * Prefetch test results data
   * @param userId The user ID
   */
  private async prefetchTestResults(userId: string): Promise<void> {
    const metricKey = "testResults";
    this.metrics.totalItems++;
    this.metrics.itemMetrics[metricKey] = {
      startTime: performance.now(),
      endTime: null,
      success: false,
    };

    try {
      // Fetch recent test results
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(this.config.maxTestResults);

      if (error) throw error;

      // Cache the test results
      if (data) {
        // Cache all test results
        const allResultsKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.ALL(userId);
        cache.set(
          allResultsKey,
          { success: true, data },
          CACHE_CONFIG.TEST_RESULTS.TTL,
        );

        // Group test results by type for type-specific caching
        const resultsByType: Record<string, unknown[]> = {};
        data.forEach((result) => {
          if (!resultsByType[result.test_type]) {
            resultsByType[result.test_type] = [];
          }
          resultsByType[result.test_type].push(result);
        });

        // Cache test results by type
        Object.entries(resultsByType).forEach(([testType, results]) => {
          const typeKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.BY_TYPE(
            userId,
            testType,
          );
          cache.set(
            typeKey,
            { success: true, data: results },
            CACHE_CONFIG.TEST_RESULTS.TTL,
          );

          // Cache baseline (first test) for each type
          if (results.length > 0) {
            const sortedResults = [...results].sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );
            const baseline = sortedResults[0];
            const baselineKey = CACHE_CONFIG.TEST_RESULTS.PATTERNS.BASELINE(
              userId,
              testType,
            );
            cache.set(
              baselineKey,
              { success: true, data: baseline },
              CACHE_CONFIG.TEST_RESULTS.TTL,
            );
          }
        });

        this.metrics.successfulItems++;
        this.metrics.itemMetrics[metricKey].success = true;
      }
    } catch (error) {
      this.metrics.failedItems++;
      this.metrics.itemMetrics[metricKey].error =
        error instanceof Error ? error.message : String(error);
      if (this.config.logLevel !== "none") {
        console.error("Error prefetching test results:", error);
      }
    } finally {
      this.metrics.itemMetrics[metricKey].endTime = performance.now();
    }
  }

  /**
   * Prefetch supplements data
   * @param userId The user ID
   */
  private async prefetchSupplements(userId: string): Promise<void> {
    const metricKey = "supplements";
    this.metrics.totalItems++;
    this.metrics.itemMetrics[metricKey] = {
      startTime: performance.now(),
      endTime: null,
      success: false,
    };

    try {
      // First try to load from local storage for immediate availability
      const localSupplements = loadSupplementsFromLocalStorage();

      // Cache local supplements if available
      if (localSupplements && localSupplements.length > 0) {
        const localSupplementsKey = `local_supplements`;
        cache.set(
          localSupplementsKey,
          { success: true, supplements: localSupplements },
          DEFAULT_CACHE_TTL.MEDIUM,
        );
      }

      // Fetch supplements from Supabase
      const { data, error } = await supabase
        .from("supplements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(this.config.maxSupplements);

      if (error) throw error;

      // Cache the supplements
      if (data) {
        const allSupplementsKey = CACHE_CONFIG.SUPPLEMENTS.PATTERNS.ALL(userId);
        cache.set(
          allSupplementsKey,
          { success: true, supplements: data },
          CACHE_CONFIG.SUPPLEMENTS.TTL,
        );

        // Cache recent supplements
        const recentSupplementsKey =
          CACHE_CONFIG.SUPPLEMENTS.PATTERNS.RECENT(userId);
        cache.set(
          recentSupplementsKey,
          { success: true, recentSupplements: data.slice(0, 3) },
          CACHE_CONFIG.SUPPLEMENTS.TTL,
        );

        // Cache individual supplements
        data.forEach((supplement) => {
          const supplementKey = CACHE_CONFIG.SUPPLEMENTS.PATTERNS.BY_ID(
            supplement.id,
          );
          cache.set(
            supplementKey,
            { success: true, supplement },
            CACHE_CONFIG.SUPPLEMENTS.TTL,
          );
        });

        this.metrics.successfulItems++;
        this.metrics.itemMetrics[metricKey].success = true;
      }
    } catch (error) {
      this.metrics.failedItems++;
      this.metrics.itemMetrics[metricKey].error =
        error instanceof Error ? error.message : String(error);
      if (this.config.logLevel !== "none") {
        console.error("Error prefetching supplements:", error);
      }
    } finally {
      this.metrics.itemMetrics[metricKey].endTime = performance.now();
    }
  }

  /**
   * Prefetch confounding factors data
   * @param userId The user ID
   */
  private async prefetchConfoundingFactors(userId: string): Promise<void> {
    const metricKey = "confoundingFactors";
    this.metrics.totalItems++;
    this.metrics.itemMetrics[metricKey] = {
      startTime: performance.now(),
      endTime: null,
      success: false,
    };

    try {
      // Fetch confounding factors
      const { data, error } = await supabase
        .from("confounding_factors")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(this.config.maxConfoundingFactors);

      if (error) throw error;

      // Cache the confounding factors
      if (data) {
        const allFactorsKey =
          CACHE_CONFIG.CONFOUNDING_FACTORS.PATTERNS.ALL(userId);
        cache.set(
          allFactorsKey,
          { success: true, factors: data },
          CACHE_CONFIG.CONFOUNDING_FACTORS.TTL,
        );

        this.metrics.successfulItems++;
        this.metrics.itemMetrics[metricKey].success = true;
      }
    } catch (error) {
      this.metrics.failedItems++;
      this.metrics.itemMetrics[metricKey].error =
        error instanceof Error ? error.message : String(error);
      if (this.config.logLevel !== "none") {
        console.error("Error prefetching confounding factors:", error);
      }
    } finally {
      this.metrics.itemMetrics[metricKey].endTime = performance.now();
    }
  }

  /**
   * Prefetch washout periods data
   * @param userId The user ID
   */
  private async prefetchWashoutPeriods(userId: string): Promise<void> {
    const metricKey = "washoutPeriods";
    this.metrics.totalItems++;
    this.metrics.itemMetrics[metricKey] = {
      startTime: performance.now(),
      endTime: null,
      success: false,
    };

    try {
      // Fetch washout periods
      const { data, error } = await supabase
        .from("washout_periods")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(this.config.maxWashoutPeriods);

      if (error) throw error;

      // Cache the washout periods
      if (data) {
        const allPeriodsKey = CACHE_CONFIG.WASHOUT_PERIODS.PATTERNS.ALL(userId);
        cache.set(
          allPeriodsKey,
          { success: true, periods: data },
          CACHE_CONFIG.WASHOUT_PERIODS.TTL,
        );

        // Cache active washout periods
        const now = new Date().toISOString();
        const activeWashoutPeriods = data.filter(
          (period) => period.end_date && period.end_date > now,
        );

        const activePeriodsKey =
          CACHE_CONFIG.WASHOUT_PERIODS.PATTERNS.ACTIVE(userId);
        cache.set(
          activePeriodsKey,
          { success: true, activePeriods: activeWashoutPeriods },
          CACHE_CONFIG.WASHOUT_PERIODS.TTL,
        );

        this.metrics.successfulItems++;
        this.metrics.itemMetrics[metricKey].success = true;
      }
    } catch (error) {
      this.metrics.failedItems++;
      this.metrics.itemMetrics[metricKey].error =
        error instanceof Error ? error.message : String(error);
      if (this.config.logLevel !== "none") {
        console.error("Error prefetching washout periods:", error);
      }
    } finally {
      this.metrics.itemMetrics[metricKey].endTime = performance.now();
    }
  }

  /**
   * Log prefetching metrics
   */
  private logMetrics(): void {
    // Skip if endTime is not set or logging is disabled
    if (this.metrics.endTime === null || this.config.logLevel === "none")
      return;

    // Only log detailed metrics if log level is info or debug
    if (this.config.logLevel === "info" || this.config.logLevel === "debug") {
      const totalTime = this.metrics.endTime - this.metrics.startTime;
      console.group("Prefetch Service Metrics");
      console.log(`Total prefetch time: ${totalTime.toFixed(2)}ms`);
      console.log(`Total items: ${this.metrics.totalItems}`);
      console.log(`Successful items: ${this.metrics.successfulItems}`);
      console.log(`Failed items: ${this.metrics.failedItems}`);

      // Log individual item metrics
      Object.entries(this.metrics.itemMetrics).forEach(([key, metric]) => {
        // Skip if endTime is not set
        if (metric.endTime === null) return;

        const itemTime = metric.endTime - metric.startTime;
        console.log(
          `${key}: ${itemTime.toFixed(2)}ms (${metric.success ? "Success" : "Failed"})`,
        );

        // Always log errors if they exist and log level is at least error
        if (metric.error && this.config.logLevel !== "none") {
          console.error(`${key} error:`, metric.error);
        }
      });

      console.groupEnd();
    } else if (
      this.config.logLevel === "warn" &&
      this.metrics.failedItems > 0
    ) {
      // For warn level, only log if there were failures
      console.warn(
        `Prefetch completed with ${this.metrics.failedItems} failed items out of ${this.metrics.totalItems}`,
      );
    }
  }

  /**
   * Get prefetching metrics
   * @returns The current prefetching metrics
   */
  getMetrics(): PrefetchMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if prefetching is in progress
   * @returns Whether prefetching is in progress
   */
  isPrefetchingInProgress(): boolean {
    return this.isPrefetching;
  }
}

// Create a singleton instance
export const prefetchService = new PrefetchService();
