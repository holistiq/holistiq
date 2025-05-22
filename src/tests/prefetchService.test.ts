/**
 * Tests for the prefetch service
 */

import { prefetchService, DEFAULT_PREFETCH_CONFIG } from '../services/prefetchService';
import { cache } from '../lib/cache';
import { supabase } from '../integrations/supabase/client';

// Mock dependencies
jest.mock('../lib/cache', () => ({
  cache: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getOrSet: jest.fn()
  },
  DEFAULT_CACHE_TTL: {
    SHORT: 1000 * 60 * 5,
    MEDIUM: 1000 * 60 * 30,
    LONG: 1000 * 60 * 60 * 24
  }
}));

jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis()
  }
}));

jest.mock('../services/supplementService', () => ({
  loadSupplementsFromLocalStorage: jest.fn().mockReturnValue([])
}));

describe('Prefetch Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset prefetch service configuration
    prefetchService.configure({
      ...DEFAULT_PREFETCH_CONFIG,
      logMetrics: false // Disable logging for tests
    });

    // Mock successful Supabase responses
    (supabase.from as jest.Mock).mockImplementation((table) => {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id', email: 'test@example.com' },
          error: null
        })
      };
    });
  });

  test('should configure prefetch service', () => {
    // Configure with custom settings
    prefetchService.configure({
      enabled: false,
      prefetchUserProfile: false,
      maxTestResults: 5
    });

    // Prefetch should not run when disabled
    prefetchService.prefetch('test-user-id');

    // Cache should not be called when prefetching is disabled
    expect(cache.set).not.toHaveBeenCalled();
  });

  test('should prefetch user profile', async () => {
    // Mock Supabase response for user profile
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-user-id', email: 'test@example.com', display_name: 'Test User' },
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
    });

    // Configure to only prefetch user profile
    prefetchService.configure({
      enabled: true,
      prefetchUserProfile: true,
      prefetchTestResults: false,
      prefetchSupplements: false,
      prefetchConfoundingFactors: false,
      prefetchWashoutPeriods: false
    });

    // Prefetch data
    await prefetchService.prefetch('test-user-id');

    // Cache should be called for user profile
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringContaining('user_profile_'),
      expect.objectContaining({
        id: 'test-user-id',
        email: 'test@example.com'
      }),
      expect.any(Number)
    );
  });

  test('should handle prefetch errors gracefully', async () => {
    // Mock Supabase error response
    (supabase.from as jest.Mock).mockImplementation((table) => {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Test error' }
        })
      };
    });

    // Configure to only prefetch user profile
    prefetchService.configure({
      enabled: true,
      prefetchUserProfile: true,
      prefetchTestResults: false,
      prefetchSupplements: false,
      prefetchConfoundingFactors: false,
      prefetchWashoutPeriods: false
    });

    // Prefetch should not throw errors
    await expect(prefetchService.prefetch('test-user-id')).resolves.not.toThrow();

    // Cache should not be called when there's an error
    expect(cache.set).not.toHaveBeenCalled();
  });

  test('should not prefetch again while already prefetching', async () => {
    // Start a prefetch operation
    const firstPrefetch = prefetchService.prefetch('test-user-id');

    // Try to start another prefetch operation
    const secondPrefetch = prefetchService.prefetch('test-user-id');

    // Both should resolve to the same promise
    expect(firstPrefetch).toBe(secondPrefetch);

    // Wait for prefetch to complete
    await firstPrefetch;
  });

  test('should return prefetch metrics', async () => {
    // Configure to only prefetch user profile
    prefetchService.configure({
      enabled: true,
      prefetchUserProfile: true,
      prefetchTestResults: false,
      prefetchSupplements: false,
      prefetchConfoundingFactors: false,
      prefetchWashoutPeriods: false
    });

    // Prefetch data
    await prefetchService.prefetch('test-user-id');

    // Get metrics
    const metrics = prefetchService.getMetrics();

    // Metrics should be defined
    expect(metrics).toBeDefined();
    expect(metrics.totalItems).toBeGreaterThan(0);
    expect(metrics.startTime).toBeDefined();
    expect(metrics.endTime).toBeDefined();
  });
});
