/**
 * Tests for the enhanced cache implementation with persistent storage
 */

import { cache, CacheConfig } from '../lib/cache';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
    getAllItems: () => store
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Enhanced Cache with Persistent Storage', () => {
  beforeEach(() => {
    // Clear localStorage and cache before each test
    localStorageMock.clear();
    cache.clear();
  });

  test('should store and retrieve values', () => {
    const key = 'test-key';
    const value = { name: 'Test Value', count: 42 };

    cache.set(key, value);
    const retrieved = cache.get(key);

    expect(retrieved).toEqual(value);
  });

  test('should respect TTL values', () => {
    const key = 'ttl-test';
    const value = 'This should expire';

    // Set with a very short TTL (10ms)
    cache.set(key, value, 10);

    // Value should be available immediately
    expect(cache.get(key)).toBe(value);

    // Wait for expiration
    return new Promise(resolve => {
      setTimeout(() => {
        // Value should be gone after TTL
        expect(cache.get(key)).toBeUndefined();
        resolve(true);
      }, 20);
    });
  });

  test('should persist values to localStorage', () => {
    const key = 'persistent-test';
    const value = { persistent: true, data: [1, 2, 3] };

    cache.set(key, value);

    // Check that something was stored in localStorage
    expect(Object.keys(localStorageMock.getAllItems()).length).toBeGreaterThan(0);

    // Create a new cache instance (simulating page reload)
    const newCache = new (cache.constructor as new (config?: Partial<CacheConfig>) => typeof cache)();

    // The new instance should be able to retrieve the value
    expect(newCache.get(key)).toEqual(value);
  });

  test('should handle large values', () => {
    const key = 'large-value';
    // Create a large object
    const largeValue = { data: Array(10000).fill('x').join('') };

    cache.set(key, largeValue);

    // Should be able to retrieve large values
    expect(cache.get(key)).toEqual(largeValue);
  });

  test('should delete values', () => {
    const key = 'delete-test';
    const value = 'This should be deleted';

    cache.set(key, value);
    expect(cache.get(key)).toBe(value);

    cache.delete(key);
    expect(cache.get(key)).toBeUndefined();

    // Should also be removed from localStorage
    const storageKey = Object.keys(localStorageMock.getAllItems())
      .find(k => k.includes(key));
    expect(storageKey).toBeUndefined();
  });

  test('should delete values by regex', () => {
    // Set multiple values with a pattern
    cache.set('prefix-1', 'value1');
    cache.set('prefix-2', 'value2');
    cache.set('other', 'value3');

    // Delete by regex
    cache.delete(/^prefix/);

    // Prefix values should be gone
    expect(cache.get('prefix-1')).toBeUndefined();
    expect(cache.get('prefix-2')).toBeUndefined();

    // Other values should remain
    expect(cache.get('other')).toBe('value3');
  });

  test('should provide cache statistics', () => {
    cache.set('stats-test-1', 'value1');
    cache.set('stats-test-2', 'value2');

    const stats = cache.getStats();

    expect(stats.memoryItemCount).toBe(2);
    expect(stats.persistentItemCount).toBe(2);
    expect(stats.totalSize).toBeGreaterThan(0);
    expect(stats.version).toBeDefined();
    expect(stats.lastCleaned).toBeInstanceOf(Date);
  });

  test('should handle getOrSet pattern', async () => {
    const key = 'get-or-set';
    const value = 'computed-value';

    // First call should compute
    const computeFn = jest.fn().mockResolvedValue(value);
    const result1 = await cache.getOrSet(key, computeFn);

    expect(result1).toBe(value);
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await cache.getOrSet(key, computeFn);

    expect(result2).toBe(value);
    // Function should not be called again
    expect(computeFn).toHaveBeenCalledTimes(1);
  });
});
