/**
 * Unit tests for the LRU cache eviction strategy
 */
import { cache } from '../cache';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    keys: (): string[] => {
      return Object.keys(store);
    },
    length: 0, // Not used in our implementation
    key: (index: number): string | null => null, // Not used in our implementation
  };
})();

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('LRU Cache Eviction Strategy', () => {
  beforeEach(() => {
    // Clear localStorage and reset cache
    mockLocalStorage.clear();
    cache.clear();

    // Configure cache with small limits for testing
    cache.configure({
      maxItems: 5, // Small limit for testing
      maxSize: 1000, // Small size limit for testing
      evictionStrategy: 'lru',
      evictionPercentage: 0.2,
      logLevel: 'none', // Disable logging for tests
      syncEnabled: false, // Disable sync for tests
      cleanupInterval: 0 // Disable automatic cleanup
    });
  });

  test('should evict least recently used items when item count limit is reached', async () => {
    // Add items up to the limit
    for (let i = 0; i < 5; i++) {
      cache.set(`key${i}`, { value: `value${i}` });
    }

    // Access some items to update their lastAccessed timestamp
    // key0 and key1 will be the least recently used
    cache.get('key2');
    cache.get('key3');
    cache.get('key4');

    // Add a new item to trigger eviction
    cache.set('key5', { value: 'value5' });

    // The least recently used item should be evicted
    expect(cache.has('key0')).toBe(false);

    // Other items should still be in the cache
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
    expect(cache.has('key5')).toBe(true);

    // Add another item to trigger another eviction
    cache.set('key6', { value: 'value6' });

    // The next least recently used item should be evicted
    expect(cache.has('key1')).toBe(false);

    // Other items should still be in the cache
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
    expect(cache.has('key5')).toBe(true);
    expect(cache.has('key6')).toBe(true);
  });

  test('should evict least recently used items when size limit is reached', async () => {
    // Configure cache with a very small size limit
    cache.configure({
      maxItems: 100, // Large item limit
      maxSize: 200, // Very small size limit
      evictionStrategy: 'lru'
    });

    // Add items that will exceed the size limit
    cache.set('key1', { value: 'a'.repeat(50) }); // ~100 bytes
    cache.set('key2', { value: 'b'.repeat(50) }); // ~100 bytes

    // Access key2 to make it more recently used
    cache.get('key2');

    // Add another item to trigger eviction
    cache.set('key3', { value: 'c'.repeat(50) }); // ~100 bytes

    // The least recently used item should be evicted
    expect(cache.has('key1')).toBe(false);

    // More recently used items should still be in the cache
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
  });

  test('should track eviction statistics', async () => {
    // Configure cache with a very small limits
    cache.configure({
      maxItems: 3,
      maxSize: 1000,
      evictionStrategy: 'lru'
    });

    // Add items up to the limit
    for (let i = 0; i < 3; i++) {
      cache.set(`key${i}`, { value: `value${i}` });
    }

    // Add more items to trigger evictions
    for (let i = 3; i < 6; i++) {
      cache.set(`key${i}`, { value: `value${i}` });
    }

    // Get cache stats
    const stats = cache.getStats();

    // Check eviction statistics
    expect(stats.evictionCount).toBeGreaterThan(0);
    expect(stats.lastEviction).not.toBeNull();
  });

  test('should respect the eviction strategy setting', async () => {
    // Configure cache with 'size' eviction strategy
    cache.configure({
      maxItems: 10,
      maxSize: 500,
      evictionStrategy: 'size'
    });

    // Add items with different sizes
    cache.set('small1', { value: 'a'.repeat(10) }); // Small
    cache.set('small2', { value: 'b'.repeat(10) }); // Small
    cache.set('large1', { value: 'c'.repeat(200) }); // Large
    cache.set('large2', { value: 'd'.repeat(200) }); // Large

    // Access small items to make them more recently used
    cache.get('small1');
    cache.get('small2');

    // Add another large item to trigger eviction
    cache.set('large3', { value: 'e'.repeat(200) });

    // With 'size' strategy, larger items should be evicted first, even if more recently used
    expect(cache.has('large1')).toBe(false);
    expect(cache.has('large2')).toBe(false);

    // Small items should still be in the cache
    expect(cache.has('small1')).toBe(true);
    expect(cache.has('small2')).toBe(true);
    expect(cache.has('large3')).toBe(true);
  });
});
