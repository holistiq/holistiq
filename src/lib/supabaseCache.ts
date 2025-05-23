/**
 * Enhanced caching system for Supabase queries
 * Provides consistent caching patterns, cache invalidation, and performance metrics
 */

import { cache, DEFAULT_CACHE_TTL } from './cache';

// Cache configuration by entity type
export const CACHE_CONFIG = {
  TEST_RESULTS: {
    TTL: DEFAULT_CACHE_TTL.SHORT, // 5 minutes
    PREFIX: 'test_results_',
    PATTERNS: {
      ALL: (userId: string) => `test_results_${userId}_all`,
      BY_TYPE: (userId: string, testType: string) => `test_results_${userId}_type_${testType}`,
      BASELINE: (userId: string, testType: string) => `baseline_result_${userId}_${testType}`,
      WITHOUT_CONFOUNDING: (userId: string) => `tests_without_confounding_${userId}`,
      USER_BASELINE: (userId: string, testType: string) => `user_baseline_${userId}_${testType}`
    }
  },
  USER_BASELINES: {
    TTL: DEFAULT_CACHE_TTL.SHORT, // Use shorter TTL to ensure we get fresh data more often
    PREFIX: 'user_baselines_',
    PATTERNS: {
      ALL: (userId: string) => `user_baselines_${userId}_all`,
      BY_TYPE: (userId: string, testType: string) => `user_baselines_${userId}_type_${testType}`
    }
  },
  SUPPLEMENTS: {
    TTL: DEFAULT_CACHE_TTL.MEDIUM, // 30 minutes
    PREFIX: 'supplements_',
    PATTERNS: {
      ALL: (userId: string) => `supplements_${userId}_all`,
      BY_ID: (supplementId: string) => `supplement_${supplementId}`,
      RECENT: (userId: string) => `supplements_${userId}_recent`
    }
  },
  CONFOUNDING_FACTORS: {
    TTL: DEFAULT_CACHE_TTL.SHORT, // 5 minutes
    PREFIX: 'confounding_factors_',
    PATTERNS: {
      ALL: (userId: string) => `confounding_factors_${userId}_all`,
      BY_TEST: (testId: string) => `confounding_factors_test_${testId}`,
      ANALYSIS: (userId: string, testType: string) => `confounding_analysis_${userId}_${testType}`
    }
  },
  ACHIEVEMENTS: {
    TTL: DEFAULT_CACHE_TTL.MEDIUM, // 30 minutes
    PREFIX: 'achievements_',
    PATTERNS: {
      ALL: (userId: string) => `achievements_${userId}_all`,
      BY_ID: (achievementId: string) => `achievement_${achievementId}`,
      BY_CATEGORY: (userId: string, category: string) => `achievements_${userId}_category_${category}`
    }
  },
  USER_BADGES: {
    TTL: DEFAULT_CACHE_TTL.MEDIUM, // 30 minutes
    PREFIX: 'user_badges_',
    PATTERNS: {
      ALL: (userId: string) => `user_badges_${userId}_all`,
      BY_ID: (badgeId: string) => `user_badge_${badgeId}`,
      BY_ACHIEVEMENT: (userId: string, achievementId: string) => `user_badges_${userId}_achievement_${achievementId}`
    }
  },
  CORRELATIONS: {
    TTL: DEFAULT_CACHE_TTL.MEDIUM, // 30 minutes
    PREFIX: 'correlations_',
    PATTERNS: {
      ALL: (userId: string) => `correlations_${userId}_all`,
      BY_ID: (correlationId: string) => `correlation_${correlationId}`
    }
  },
  WASHOUT_PERIODS: {
    TTL: DEFAULT_CACHE_TTL.MEDIUM, // 30 minutes
    PREFIX: 'washout_periods_',
    PATTERNS: {
      ALL: (userId: string) => `washout_periods_${userId}_all`,
      ACTIVE: (userId: string) => `washout_periods_${userId}_active`
    }
  },
  STATISTICAL_ANALYSES: {
    TTL: DEFAULT_CACHE_TTL.MEDIUM, // 30 minutes
    PREFIX: 'statistical_analyses_',
    PATTERNS: {
      ALL: (userId: string) => `statistical_analyses_${userId}_all`,
      BY_ID: (analysisId: string) => `statistical_analysis_${analysisId}`,
      BY_CONTEXT: (userId: string, contextType: string) =>
        `statistical_analyses_${userId}_${contextType}`
    }
  }
};

// Performance metrics tracking
interface QueryMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageQueryTime: number;
  totalQueryTime: number;
}

class SupabaseCache {
  private metrics: Record<string, QueryMetrics> = {};

  constructor() {
    // Initialize metrics for each entity type
    Object.keys(CACHE_CONFIG).forEach(entityType => {
      this.metrics[entityType] = {
        totalQueries: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageQueryTime: 0,
        totalQueryTime: 0
      };
    });
  }

  /**
   * Execute a Supabase query with caching
   * @param entityType The type of entity being queried (TEST_RESULTS, SUPPLEMENTS, etc.)
   * @param cacheKey The cache key to use
   * @param queryFn Function that executes the Supabase query
   * @param ttl Optional TTL override
   * @returns The query result
   */
  async query<T>(
    entityType: keyof typeof CACHE_CONFIG,
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const startTime = performance.now();
    const metrics = this.metrics[entityType];
    metrics.totalQueries++;

    let isCacheHit = false;
    const shouldLog = process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true';

    try {
      // Check if we already have this in cache before calling getOrSet
      const existingCacheItem = cache.get(cacheKey);
      const hasCacheItem = existingCacheItem !== undefined;

      // If we're in development mode, add more detailed logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SupabaseCache] Query for ${entityType}: ${cacheKey}`);
        if (hasCacheItem) {
          console.log(`[SupabaseCache] Cache HIT - Using cached data`);
        }
      }

      const result = await cache.getOrSet(
        cacheKey,
        async () => {
          metrics.cacheMisses++;
          if (shouldLog || process.env.NODE_ENV === 'development') {
            console.log(`[SupabaseCache] Cache MISS for ${entityType}: ${cacheKey}`);
            console.log(`[SupabaseCache] Fetching from database...`);
          }
          return await queryFn();
        },
        ttl || CACHE_CONFIG[entityType].TTL
      );

      // If we didn't increment cacheMisses, it was a cache hit
      if (metrics.totalQueries > (metrics.cacheHits + metrics.cacheMisses)) {
        metrics.cacheHits++;
        isCacheHit = true;
        if (shouldLog && !hasCacheItem) {
          console.log(`[SupabaseCache] Cache hit for ${entityType}: ${cacheKey}`);
        }
      }

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Update metrics
      metrics.totalQueryTime += queryTime;
      metrics.averageQueryTime = metrics.totalQueryTime / metrics.totalQueries;

      // Only log in development and when debugging is enabled
      if (shouldLog) {
        console.log(`${entityType} query ${isCacheHit ? '(cached)' : '(database)'} completed in ${queryTime.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      console.error(`Error in cached query for ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific entity type and user
   * @param entityType The type of entity
   * @param userId The user ID
   */
  invalidateForUser(entityType: keyof typeof CACHE_CONFIG, userId: string): void {
    const prefix = CACHE_CONFIG[entityType].PREFIX;
    const pattern = new RegExp(`^${prefix}${userId}`);
    const shouldLog = process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (shouldLog || isDevelopment) {
      console.log(`[SupabaseCache] Invalidating cache for ${entityType} and user ${userId}`);
      console.log(`[SupabaseCache] Cache pattern: ${pattern}`);
    }

    // Also clear localStorage cache for this pattern
    try {
      const allKeys = Object.keys(localStorage);
      const cacheKeys = allKeys.filter(key =>
        key.startsWith('holistiq_cache_') &&
        key.includes(prefix) &&
        key.includes(userId)
      );

      if (cacheKeys.length > 0 && (shouldLog || isDevelopment)) {
        console.log(`[SupabaseCache] Clearing ${cacheKeys.length} localStorage cache items`);
      }

      cacheKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error clearing localStorage cache:', e);
    }

    cache.delete(pattern);

    if (shouldLog || isDevelopment) {
      console.log(`[SupabaseCache] Cache invalidation complete for ${entityType}`);
    }
  }

  /**
   * Invalidate cache for a specific entity by ID
   * @param entityType The type of entity
   * @param id The entity ID
   */
  invalidateById(entityType: keyof typeof CACHE_CONFIG, id: string): void {
    const patterns = CACHE_CONFIG[entityType].PATTERNS;
    if ('BY_ID' in patterns) {
      const cacheKey = patterns.BY_ID(id);
      const shouldLog = process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true';

      if (shouldLog) {
        console.log(`Invalidating cache for ${entityType} with ID ${id}`);
      }
      cache.delete(cacheKey);
    }
  }

  /**
   * Invalidate all caches for a user
   * @param userId The user ID
   */
  invalidateAllForUser(userId: string): void {
    Object.keys(CACHE_CONFIG).forEach(entityType => {
      this.invalidateForUser(entityType as keyof typeof CACHE_CONFIG, userId);
    });

    const shouldLog = process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true';
    if (shouldLog) {
      console.log(`Invalidated all caches for user ${userId}`);
    }
  }

  /**
   * Get performance metrics for all entity types
   * @returns Object with metrics for each entity type
   */
  getMetrics(): Record<string, QueryMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get cache hit rate for a specific entity type
   * @param entityType The type of entity
   * @returns The cache hit rate as a percentage
   */
  getCacheHitRate(entityType: keyof typeof CACHE_CONFIG): number {
    const metrics = this.metrics[entityType];
    if (metrics.totalQueries === 0) return 0;
    return (metrics.cacheHits / metrics.totalQueries) * 100;
  }

  /**
   * Get overall cache hit rate
   * @returns The overall cache hit rate as a percentage
   */
  getOverallCacheHitRate(): number {
    let totalQueries = 0;
    let totalHits = 0;

    Object.values(this.metrics).forEach(metric => {
      totalQueries += metric.totalQueries;
      totalHits += metric.cacheHits;
    });

    if (totalQueries === 0) return 0;
    return (totalHits / totalQueries) * 100;
  }
}

// Create a singleton instance
export const supabaseCache = new SupabaseCache();
