/**
 * Utility functions for API calls
 */

/**
 * Execute an API call with a timeout
 * @param apiCall Function that returns a Promise
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that resolves with the API call result or rejects with a timeout error
 */
export async function executeWithTimeout<T>(
  apiCall: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await Promise.race([
      apiCall(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);

    // Log performance metrics
    const duration = performance.now() - startTime;
    console.log(`API call completed in ${duration.toFixed(2)}ms`);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`API call failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Pagination helper for data arrays
 * @param data Array of data
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @returns Paginated array
 */
export function paginateData<T>(data: T[], page: number = 1, pageSize: number = 10): T[] {
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

/**
 * Simple in-memory cache for API responses
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache: Record<string, CacheEntry<unknown>> = {};

  /**
   * Get data from cache or execute the API call
   * @param key Cache key
   * @param apiFn Function to execute if cache miss
   * @param ttlMs Time to live in milliseconds
   * @returns Promise with the data
   */
  async getOrSet<T>(key: string, apiFn: () => Promise<T>, ttlMs: number = 5 * 60 * 1000): Promise<T> {
    const now = Date.now();
    const entry = this.cache[key] as CacheEntry<T> | undefined;

    // Return from cache if valid
    if (entry && entry.expiresAt > now) {
      console.log(`Cache hit for key: ${key}`);
      return entry.data;
    }

    // Execute API call on cache miss
    console.log(`Cache miss for key: ${key}`);
    const data = await apiFn();

    // Store in cache
    this.cache[key] = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs
    };

    return data;
  }

  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  invalidate(key: string): void {
    delete this.cache[key];
  }

  /**
   * Invalidate all cache entries
   */
  clear(): void {
    this.cache = {};
  }
}

// Export a singleton instance
export const apiCache = new ApiCache();
