/**
 * Enhanced cache utility with TTL support and persistent storage
 * Supports both in-memory caching and persistent storage via localStorage
 * Includes cross-tab synchronization for consistent cache state
 * Features data compression to reduce memory usage
 */

import {
  CacheSyncManager,
  SyncMessageType,
  SyncMetrics,
} from "./cacheSyncManager";
import * as LZString from "lz-string";

// Cache version for handling structure changes
const CACHE_VERSION = "1.2.0"; // Updated version to handle LRU eviction
const CACHE_PREFIX = "holistiq_cache_";
const CACHE_META_KEY = `${CACHE_PREFIX}meta`;
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB default max size
const MAX_ITEM_SIZE = 500 * 1024; // 500KB max size per item
const COMPRESSION_THRESHOLD = 10 * 1024; // 10KB - only compress items larger than this
const DEFAULT_MAX_ITEMS = 1000; // Default maximum number of items in cache

// Type for cache values
export type CacheValue =
  | string
  | number
  | boolean
  | null
  | object
  | Array<unknown>;

// Cache item structure
interface CacheItem<T> {
  value: T;
  expiry: number | null; // null means no expiry
  created: number; // timestamp when the item was created
  lastAccessed: number; // timestamp when the item was last accessed
  size: number; // approximate size in bytes
  compressed?: boolean; // whether the value is compressed
  originalSize?: number; // original size before compression
}

// Cache metadata structure
interface CacheMetadata {
  version: string;
  totalSize: number;
  itemCount: number;
  lastCleaned: number;
  evictionCount: number; // Number of items evicted due to LRU
  lastEviction: number; // Timestamp of last eviction
}

// Storage adapter interface
interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  keys(): string[];
  isAvailable(): boolean;
}

// LocalStorage adapter
class LocalStorageAdapter implements StorageAdapter {
  isAvailable(): boolean {
    try {
      const testKey = `${CACHE_PREFIX}test`;
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      // Intentionally catching and returning false if localStorage is not available
      // This is expected behavior for feature detection
      if (process.env.NODE_ENV !== "production") {
        console.debug(
          "localStorage is not available:",
          e instanceof Error ? e.message : String(e),
        );
      }
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Error reading from localStorage:", e);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Error writing to localStorage:", e);
      // If we hit a quota error, try to free up space
      if (
        e instanceof DOMException &&
        (e.name === "QuotaExceededError" ||
          e.name === "NS_ERROR_DOM_QUOTA_REACHED")
      ) {
        console.warn("Storage quota exceeded, cleaning up old items");
        this.cleanUp();
        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
        } catch (retryError) {
          console.error(
            "Still unable to write to localStorage after cleanup:",
            retryError,
          );
        }
      }
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Error removing from localStorage:", e);
    }
  }

  clear(): void {
    try {
      // Only clear our cache items, not all localStorage
      const allKeys = this.keys();
      for (const key of allKeys) {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn("Error clearing localStorage:", e);
    }
  }

  keys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (e) {
      console.warn("Error getting keys from localStorage:", e);
      return [];
    }
  }

  // Clean up old or expired items to free up space
  private cleanUp(): void {
    try {
      const allKeys = this.keys();
      // Sort by oldest accessed first
      const itemsToRemove: { key: string; lastAccessed: number }[] = [];

      for (const key of allKeys) {
        const item = this.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed.lastAccessed) {
              itemsToRemove.push({ key, lastAccessed: parsed.lastAccessed });
            }
          } catch (parseError) {
            // If we can't parse it, it's probably corrupted, so remove it
            // This is intentional cleanup of corrupted data
            console.warn(`Removing corrupted cache item: ${key}`, parseError);
            this.removeItem(key);
          }
        }
      }

      // Sort by oldest accessed first
      itemsToRemove.sort((a, b) => a.lastAccessed - b.lastAccessed);

      // Remove the oldest 20% of items
      const removeCount = Math.ceil(itemsToRemove.length * 0.2);
      for (let i = 0; i < removeCount && i < itemsToRemove.length; i++) {
        this.removeItem(itemsToRemove[i].key);
      }
    } catch (e) {
      console.error("Error during storage cleanup:", e);
    }
  }
}

// In-memory fallback adapter
class MemoryStorageAdapter implements StorageAdapter {
  private readonly storage: Map<string, string> = new Map();

  isAvailable(): boolean {
    return true; // Memory storage is always available
  }

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  keys(): string[] {
    return Array.from(this.storage.keys());
  }
}

// Cache configuration
export interface CacheConfig {
  syncEnabled: boolean;
  logLevel: "none" | "error" | "warn" | "info" | "debug";
  resolveConflicts: boolean;
  heartbeatEnabled: boolean;
  cleanupInterval: number;
  compressionEnabled: boolean; // whether to enable compression
  compressionThreshold: number; // size threshold in bytes for compression
  maxItems: number; // maximum number of items in cache (LRU eviction)
  maxSize: number; // maximum size in bytes (LRU eviction)
  evictionStrategy: "lru" | "ttl" | "size"; // strategy for eviction
  evictionPercentage: number; // percentage of items to evict when limit is reached (0-1)
}

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  syncEnabled: true,
  logLevel: process.env.NODE_ENV !== "production" ? "error" : "none",
  resolveConflicts: true,
  heartbeatEnabled: true,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  compressionEnabled: true, // enable compression by default
  compressionThreshold: COMPRESSION_THRESHOLD, // use the defined threshold
  maxItems: DEFAULT_MAX_ITEMS, // maximum number of items in cache
  maxSize: MAX_STORAGE_SIZE, // maximum size in bytes
  evictionStrategy: "lru", // use LRU eviction by default
  evictionPercentage: 0.2, // evict 20% of items when limit is reached
};

class Cache {
  private readonly memoryCache: Map<string, CacheItem<CacheValue>> = new Map();
  private readonly storage: StorageAdapter;
  private readonly syncManager: CacheSyncManager;
  private metadata: CacheMetadata;
  private config: CacheConfig;
  private cleanupIntervalId: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    // Initialize configuration
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };

    // Try to use localStorage, fall back to memory if not available
    const localStorageAdapter = new LocalStorageAdapter();
    this.storage = localStorageAdapter.isAvailable()
      ? localStorageAdapter
      : new MemoryStorageAdapter();

    // Initialize metadata
    this.metadata = this.loadMetadata();

    // Initialize sync manager
    this.syncManager = new CacheSyncManager({
      enabled: this.config.syncEnabled,
      logLevel: this.config.logLevel,
      resolveConflicts: this.config.resolveConflicts,
      heartbeatEnabled: this.config.heartbeatEnabled,
    });

    // Load persisted cache into memory on startup
    this.loadFromStorage();

    // Set up cross-tab synchronization
    this.setupSyncListeners();

    // Periodically clean up expired items
    this.setupCleanupInterval();
  }

  /**
   * Compress a value using LZ-string
   * @param value The value to compress
   * @returns The compressed value and metadata
   */
  private compressValue<T>(value: T): {
    compressedValue: string;
    originalSize: number;
    compressedSize: number;
  } {
    try {
      // Serialize the value to a string
      const serialized = JSON.stringify(value);
      const originalSize = serialized.length * 2; // Approximate size in bytes (UTF-16)

      // Compress the serialized string
      const compressed = LZString.compressToUTF16(serialized);
      const compressedSize = compressed.length * 2; // Approximate size in bytes (UTF-16)

      return {
        compressedValue: compressed,
        originalSize,
        compressedSize,
      };
    } catch (error) {
      // If compression fails, log the error and return null
      console.error("Error compressing cache value:", error);
      throw new Error("Compression failed");
    }
  }

  /**
   * Decompress a value using LZ-string
   * @param compressedValue The compressed value
   * @returns The decompressed value
   */
  private decompressValue<T>(compressedValue: string): T {
    try {
      // Decompress the string
      const decompressed = LZString.decompressFromUTF16(compressedValue);
      if (!decompressed) {
        throw new Error("Decompression resulted in null or empty string");
      }

      // Parse the JSON string back to the original value
      return JSON.parse(decompressed) as T;
    } catch (error) {
      // If decompression fails, log the error and return null
      console.error("Error decompressing cache value:", error);
      throw new Error("Decompression failed");
    }
  }

  /**
   * Set a value in the cache with an optional TTL
   * @param key The cache key
   * @param value The value to store
   * @param ttlMs Time to live in milliseconds (optional)
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const expiry = ttlMs ? now + ttlMs : null;

    // First, serialize to check the size
    const serialized = JSON.stringify(value);
    const size = serialized.length * 2; // Approximate size in bytes (UTF-16)

    // Check if the item is too large
    if (size > MAX_ITEM_SIZE) {
      if (this.config.logLevel !== "none") {
        console.warn(
          `Cache item ${key} is too large (${size} bytes), not caching`,
        );
      }
      return;
    }

    // Determine if we should compress this item
    let item: CacheItem<T | string>;
    let shouldCompress =
      this.config.compressionEnabled && size > this.config.compressionThreshold;

    if (shouldCompress) {
      try {
        // Compress the value
        const { compressedValue, originalSize, compressedSize } =
          this.compressValue(value);

        // Only use compression if it actually saves space
        if (compressedSize < originalSize) {
          // Create cache item with compressed value
          item = {
            value: compressedValue as unknown as T, // Store the compressed string
            expiry,
            created: now,
            lastAccessed: now,
            size: compressedSize,
            compressed: true,
            originalSize,
          };

          if (this.config.logLevel === "debug") {
            const savingsPercent = Math.round(
              (1 - compressedSize / originalSize) * 100,
            );
            console.log(
              `Compressed cache item ${key}: ${originalSize} -> ${compressedSize} bytes (${savingsPercent}% savings)`,
            );
          }
        } else {
          // Compression didn't help, store uncompressed
          shouldCompress = false;
        }
      } catch (error) {
        // If compression fails, fall back to uncompressed storage
        console.warn(
          `Compression failed for cache item ${key}, storing uncompressed:`,
          error,
        );
        shouldCompress = false;
      }
    }

    // If not compressed, create a regular cache item
    if (!shouldCompress) {
      item = {
        value,
        expiry,
        created: now,
        lastAccessed: now,
        size,
        compressed: false,
      };
    }

    // Update in-memory cache
    this.memoryCache.set(key, item);

    // Update persistent storage
    this.persistItem(key, item);

    // Broadcast change to other tabs using the sync manager
    if (this.config.syncEnabled) {
      this.syncManager.broadcastUpdate(key, {
        expiry,
        size: item.size,
        valueType: typeof value,
        compressed: item.compressed,
      });
    }
  }

  /**
   * Configure the cache
   * @param config Partial configuration to apply
   */
  configure(config: Partial<CacheConfig>): void {
    const wasSyncEnabled = this.config.syncEnabled;

    // Update config
    this.config = { ...this.config, ...config };

    // Update sync manager config
    this.syncManager.configure({
      enabled: this.config.syncEnabled,
      logLevel: this.config.logLevel,
      resolveConflicts: this.config.resolveConflicts,
      heartbeatEnabled: this.config.heartbeatEnabled,
    });

    // Initialize sync manager if it was disabled and is now enabled
    if (!wasSyncEnabled && this.config.syncEnabled) {
      this.syncManager.initialize();
      this.setupSyncListeners();
    }

    // Update cleanup interval if needed
    this.setupCleanupInterval();
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    // Try memory cache first
    const item = this.memoryCache.get(key);

    // If not in memory, try persistent storage
    if (!item) {
      const storedItem = this.getFromStorage<T>(key);
      if (storedItem) {
        // Add to memory cache for faster access next time
        this.memoryCache.set(key, storedItem);
        return this.processRetrievedItem(key, storedItem);
      }
      return undefined;
    }

    return this.processRetrievedItem(key, item);
  }

  /**
   * Process a retrieved cache item, handling expiration and access tracking
   */
  private processRetrievedItem<T>(
    key: string,
    item: CacheItem<T | string>,
  ): T | undefined {
    // Check if the item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(key);
      return undefined;
    }

    // Update last accessed time
    item.lastAccessed = Date.now();
    this.memoryCache.set(key, item);

    // Update last accessed time in storage (debounced to reduce writes)
    this.debouncedUpdateAccess(key, item);

    // Handle decompression if needed
    if (item.compressed) {
      try {
        // The value is a compressed string, decompress it
        const decompressedValue = this.decompressValue<T>(item.value as string);

        // For frequently accessed items, consider storing the decompressed value
        // in memory to avoid repeated decompression
        if (this.config.logLevel === "debug") {
          console.log(
            `Decompressed cache item ${key}: ${item.size} -> ${item.originalSize} bytes`,
          );
        }

        return decompressedValue;
      } catch (error) {
        // If decompression fails, log the error and delete the corrupted item
        console.error(`Error decompressing cache item ${key}:`, error);
        this.delete(key);
        return undefined;
      }
    }

    // Return the uncompressed value
    return item.value as T;
  }

  // Debounced function to update last accessed time in storage
  private readonly debouncedUpdateAccess = (() => {
    const updates = new Map<string, CacheItem<CacheValue>>();
    let timeoutId: NodeJS.Timeout | null = null;

    return (key: string, item: CacheItem<CacheValue>) => {
      updates.set(key, item);

      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          updates.forEach((item, key) => {
            this.persistItem(key, item);
          });
          updates.clear();
          timeoutId = null;
        }, 5000); // Update storage every 5 seconds at most
      }
    };
  })();

  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Remove a key from the cache
   * @param key The cache key or a RegExp to match multiple keys
   */
  delete(key: string | RegExp): void {
    if (typeof key === "string") {
      // Delete from memory cache
      this.memoryCache.delete(key);

      // Delete from persistent storage
      const storageKey = `${CACHE_PREFIX}${key}`;
      this.storage.removeItem(storageKey);

      // Update metadata
      this.updateMetadataAfterDelete(key);

      // Broadcast deletion to other tabs using the sync manager
      if (this.config.syncEnabled) {
        this.syncManager.broadcastDelete(key);
      }
    } else {
      // Delete all keys that match the RegExp
      const keysToDelete: string[] = [];

      // Find matching keys in memory cache
      for (const cacheKey of this.memoryCache.keys()) {
        if (key.test(cacheKey)) {
          keysToDelete.push(cacheKey);
        }
      }

      // Find matching keys in storage
      for (const storageKey of this.storage.keys()) {
        const keyWithoutPrefix = storageKey.substring(CACHE_PREFIX.length);
        if (
          key.test(keyWithoutPrefix) &&
          !keysToDelete.includes(keyWithoutPrefix)
        ) {
          keysToDelete.push(keyWithoutPrefix);
        }
      }

      // Delete each key
      if (keysToDelete.length > 0) {
        if (
          this.config.logLevel === "debug" ||
          this.config.logLevel === "info"
        ) {
          console.log(
            `Deleting ${keysToDelete.length} cache keys matching pattern`,
          );
        }

        // Delete individual keys
        for (const keyToDelete of keysToDelete) {
          // Delete from memory cache
          this.memoryCache.delete(keyToDelete);

          // Delete from persistent storage
          const storageKey = `${CACHE_PREFIX}${keyToDelete}`;
          this.storage.removeItem(storageKey);

          // Update metadata
          this.updateMetadataAfterDelete(keyToDelete);
        }

        // Broadcast bulk deletion to other tabs
        if (this.config.syncEnabled) {
          this.syncManager.broadcastBulkDelete(keysToDelete);
        }
      }
    }
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear persistent storage
    this.storage.clear();

    // Reset metadata
    this.metadata = {
      version: CACHE_VERSION,
      totalSize: 0,
      itemCount: 0,
      lastCleaned: Date.now(),
      evictionCount: 0,
      lastEviction: 0,
    };
    this.saveMetadata();

    // Broadcast clear to other tabs using the sync manager
    if (this.config.syncEnabled) {
      this.syncManager.broadcastClear();
    }
  }

  /**
   * Get a value from the cache or compute it if not found
   * @param key The cache key
   * @param fn Function to compute the value if not in cache
   * @param ttlMs Time to live in milliseconds (optional)
   * @returns The cached or computed value
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): {
    memoryItemCount: number;
    persistentItemCount: number;
    totalSize: number;
    version: string;
    lastCleaned: Date;
    compressionEnabled: boolean;
    compressedItemCount: number;
    originalSize: number;
    compressionRatio: number;
    spaceSaved: number;
    evictionCount: number;
    lastEviction: Date | null;
    evictionStrategy: string;
    maxItems: number;
    maxSize: number;
  } {
    // Calculate compression statistics
    let compressedItemCount = 0;
    let originalSize = 0;
    let compressedSize = 0;

    this.memoryCache.forEach((item) => {
      if (item.compressed && item.originalSize) {
        compressedItemCount++;
        originalSize += item.originalSize;
        compressedSize += item.size;
      }
    });

    // Calculate compression ratio and space saved
    const compressionRatio =
      originalSize > 0 ? compressedSize / originalSize : 1;
    const spaceSaved = originalSize - compressedSize;

    return {
      memoryItemCount: this.memoryCache.size,
      persistentItemCount: this.metadata.itemCount,
      totalSize: this.metadata.totalSize,
      version: this.metadata.version,
      lastCleaned: new Date(this.metadata.lastCleaned),
      compressionEnabled: this.config.compressionEnabled,
      compressedItemCount,
      originalSize,
      compressionRatio,
      spaceSaved,
      evictionCount: this.metadata.evictionCount,
      lastEviction: this.metadata.lastEviction
        ? new Date(this.metadata.lastEviction)
        : null,
      evictionStrategy: this.config.evictionStrategy,
      maxItems: this.config.maxItems,
      maxSize: this.config.maxSize,
    };
  }

  /**
   * Load metadata from storage
   */
  private loadMetadata(): CacheMetadata {
    try {
      const metaString = this.storage.getItem(CACHE_META_KEY);
      if (metaString) {
        const parsed = JSON.parse(metaString);
        // If version mismatch, clear cache
        if (parsed.version !== CACHE_VERSION) {
          if (this.config.logLevel !== "none") {
            console.log(
              `Cache version mismatch (stored: ${parsed.version}, current: ${CACHE_VERSION}), clearing cache`,
            );
          }
          this.storage.clear();
          return {
            version: CACHE_VERSION,
            totalSize: 0,
            itemCount: 0,
            lastCleaned: Date.now(),
            evictionCount: 0,
            lastEviction: 0,
          };
        }
        return parsed;
      }
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn("Error loading cache metadata:", e);
      }
    }

    // Default metadata
    return {
      version: CACHE_VERSION,
      totalSize: 0,
      itemCount: 0,
      lastCleaned: Date.now(),
      evictionCount: 0,
      lastEviction: 0,
    };
  }

  /**
   * Save metadata to storage
   */
  private saveMetadata(): void {
    try {
      this.storage.setItem(CACHE_META_KEY, JSON.stringify(this.metadata));
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn("Error saving cache metadata:", e);
      }
    }
  }

  /**
   * Load cache items from persistent storage into memory
   */
  private loadFromStorage(): void {
    try {
      // Get all keys from storage
      const keys = this.storage.keys();

      // Load each item into memory cache
      for (const storageKey of keys) {
        // Skip metadata
        if (storageKey === CACHE_META_KEY) continue;

        // Extract the actual key
        const key = storageKey.substring(CACHE_PREFIX.length);

        // Get the item from storage
        const item = this.getFromStorage(key);
        if (item) {
          // Check if expired
          if (item.expiry && Date.now() > item.expiry) {
            // Remove expired item
            this.storage.removeItem(storageKey);
            this.updateMetadataAfterDelete(key);
          } else {
            // Add to memory cache
            this.memoryCache.set(key, item);
          }
        }
      }
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn("Error loading cache from storage:", e);
      }
    }
  }

  /**
   * Get an item from persistent storage
   */
  private getFromStorage<T>(key: string): CacheItem<T> | null {
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      const itemString = this.storage.getItem(storageKey);
      if (itemString) {
        return JSON.parse(itemString);
      }
    } catch (e) {
      console.warn(`Error getting item ${key} from storage:`, e);
    }
    return null;
  }

  /**
   * Persist an item to storage
   */
  private persistItem<T>(key: string, item: CacheItem<T>): void {
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      const itemString = JSON.stringify(item);

      // Check if we need to update metadata
      const existingItem = this.getFromStorage(key);
      const newSize = itemString.length * 2; // Approximate size in bytes

      // Update metadata
      if (existingItem) {
        this.metadata.totalSize =
          this.metadata.totalSize - existingItem.size + newSize;
      } else {
        this.metadata.totalSize += newSize;
        this.metadata.itemCount++;
      }

      // Check if we need to clean up before adding (size or item count limit)
      if (
        this.metadata.totalSize > this.config.maxSize ||
        this.metadata.itemCount > this.config.maxItems
      ) {
        this.cleanupStorage();
      }

      // Save the item
      this.storage.setItem(storageKey, itemString);

      // Save updated metadata
      this.saveMetadata();
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn(`Error persisting item ${key} to storage:`, e);
      }
    }
  }

  /**
   * Update metadata after deleting an item
   */
  private updateMetadataAfterDelete(key: string): void {
    try {
      const existingItem = this.getFromStorage(key);
      if (existingItem) {
        this.metadata.totalSize -= existingItem.size;
        this.metadata.itemCount--;
        this.saveMetadata();
      }
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn(`Error updating metadata after deleting ${key}:`, e);
      }
    }
  }

  /**
   * Clean up storage when it gets too large or exceeds item count limit
   * Implements LRU (Least Recently Used) eviction strategy
   */
  private cleanupStorage(): void {
    try {
      if (this.config.logLevel === "debug" || this.config.logLevel === "info") {
        console.log("Cleaning up cache storage using LRU strategy...");
      }

      // Get all items from storage
      const items: { key: string; item: CacheItem<CacheValue> }[] = [];
      for (const storageKey of this.storage.keys()) {
        // Skip metadata
        if (storageKey === CACHE_META_KEY) continue;

        const key = storageKey.substring(CACHE_PREFIX.length);
        const item = this.getFromStorage(key);
        if (item) {
          items.push({ key, item });
        }
      }

      // If no items, nothing to clean
      if (items.length === 0) return;

      // Sort by last accessed (oldest first) - LRU strategy
      items.sort((a, b) => a.item.lastAccessed - b.item.lastAccessed);

      // Determine if we need to evict based on size or count
      const currentSize = this.metadata.totalSize;
      const currentCount = items.length;
      const sizeExceeded = currentSize > this.config.maxSize;
      const countExceeded = currentCount > this.config.maxItems;

      if (!sizeExceeded && !countExceeded) {
        return; // No need to evict
      }

      // Calculate how many items to evict
      let itemsToEvict = 0;

      if (this.config.evictionStrategy === "lru") {
        if (countExceeded) {
          // Evict a percentage of items over the limit
          const excessItems = currentCount - this.config.maxItems;
          itemsToEvict = Math.max(
            Math.ceil(excessItems * (1 + this.config.evictionPercentage)),
            1, // At least one item
          );
        }

        if (sizeExceeded) {
          // Calculate target size (80% of max by default)
          const targetSize =
            this.config.maxSize * (1 - this.config.evictionPercentage);
          const sizeToFree = currentSize - targetSize;
          let sizeFreed = 0;
          let itemsForSize = 0;

          // Count how many items we need to evict to get under the size limit
          for (const { item } of items) {
            if (sizeFreed >= sizeToFree) break;
            sizeFreed += item.size;
            itemsForSize++;
          }

          // Take the larger of the two calculations
          itemsToEvict = Math.max(itemsToEvict, itemsForSize);
        }
      } else if (this.config.evictionStrategy === "ttl") {
        // For TTL strategy, we only evict expired items
        // This is handled in cleanupExpiredItems, but we'll still evict LRU if size is exceeded
        if (sizeExceeded) {
          const targetSize =
            this.config.maxSize * (1 - this.config.evictionPercentage);
          const sizeToFree = currentSize - targetSize;
          let sizeFreed = 0;

          for (const { item } of items) {
            if (sizeFreed >= sizeToFree) break;
            sizeFreed += item.size;
            itemsToEvict++;
          }
        }
      } else if (this.config.evictionStrategy === "size") {
        // For size strategy, we prioritize evicting larger items first
        // Sort by size (largest first)
        items.sort((a, b) => b.item.size - a.item.size);

        if (sizeExceeded) {
          const targetSize =
            this.config.maxSize * (1 - this.config.evictionPercentage);
          const sizeToFree = currentSize - targetSize;
          let sizeFreed = 0;

          for (const { item } of items) {
            if (sizeFreed >= sizeToFree) break;
            sizeFreed += item.size;
            itemsToEvict++;
          }
        }

        // Re-sort by LRU for actual eviction
        items.sort((a, b) => a.item.lastAccessed - b.item.lastAccessed);
      }

      // Evict the calculated number of items
      if (itemsToEvict > 0) {
        const itemsToRemove = items.slice(0, itemsToEvict);
        let sizeFreed = 0;

        for (const { key, item } of itemsToRemove) {
          // Remove this item
          this.delete(key);
          sizeFreed += item.size;

          // Log eviction if debug is enabled
          if (this.config.logLevel === "debug") {
            console.log(
              `[Cache] LRU eviction: ${key} (${item.size} bytes, last accessed ${new Date(item.lastAccessed).toISOString()})`,
            );
          }
        }

        // Update eviction metadata
        this.metadata.evictionCount += itemsToEvict;
        this.metadata.lastEviction = Date.now();

        if (
          this.config.logLevel === "info" ||
          this.config.logLevel === "debug"
        ) {
          console.log(
            `[Cache] LRU eviction complete: ${itemsToEvict} items evicted, ${sizeFreed} bytes freed`,
          );
        }
      }

      // Update last cleaned timestamp
      this.metadata.lastCleaned = Date.now();
      this.saveMetadata();

      if (this.config.logLevel === "debug" || this.config.logLevel === "info") {
        console.log(
          `Cache cleanup complete. New size: ${this.metadata.totalSize} bytes, Items: ${this.metadata.itemCount}`,
        );
      }
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn("Error cleaning up storage:", e);
      }
    }
  }

  /**
   * Set up periodic cleanup of expired items
   */
  private setupCleanupInterval(): void {
    // Clear existing interval if any
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    // Set up new interval based on configuration
    if (this.config.cleanupInterval > 0) {
      this.cleanupIntervalId = window.setInterval(() => {
        this.cleanupExpiredItems();
      }, this.config.cleanupInterval);

      // Run an initial cleanup
      this.cleanupExpiredItems();
    }
  }

  /**
   * Clean up expired items and enforce LRU eviction if needed
   */
  private cleanupExpiredItems(): void {
    try {
      if (this.config.logLevel === "debug" || this.config.logLevel === "info") {
        console.log("Cleaning up expired cache items...");
      }
      const now = Date.now();
      let expiredCount = 0;

      // Check memory cache
      for (const [key, item] of this.memoryCache.entries()) {
        if (item.expiry && now > item.expiry) {
          this.delete(key);
          expiredCount++;
        }
      }

      // Check persistent storage
      for (const storageKey of this.storage.keys()) {
        // Skip metadata
        if (storageKey === CACHE_META_KEY) continue;

        const key = storageKey.substring(CACHE_PREFIX.length);
        const item = this.getFromStorage(key);
        if (item?.expiry && now > item.expiry) {
          this.delete(key);
          expiredCount++;
        }
      }

      if (
        expiredCount > 0 &&
        (this.config.logLevel === "debug" || this.config.logLevel === "info")
      ) {
        console.log(`[Cache] Removed ${expiredCount} expired items`);
      }

      // Check if we need to enforce LRU eviction based on size or count limits
      if (
        this.metadata.totalSize > this.config.maxSize ||
        this.metadata.itemCount > this.config.maxItems
      ) {
        if (this.config.logLevel === "debug") {
          console.log(
            `[Cache] Size (${this.metadata.totalSize}/${this.config.maxSize}) or count (${this.metadata.itemCount}/${this.config.maxItems}) limit exceeded, enforcing LRU eviction`,
          );
        }
        this.cleanupStorage();
      }

      // Update last cleaned timestamp
      this.metadata.lastCleaned = Date.now();
      this.saveMetadata();
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn("Error cleaning up expired items:", e);
      }
    }
  }

  /**
   * Set up cross-tab synchronization
   */
  private setupSyncListeners(): void {
    if (!this.config.syncEnabled) return;

    // Initialize the sync manager
    this.syncManager.initialize();

    // Listen for update events
    this.syncManager.addEventListener(SyncMessageType.UPDATE, (message) => {
      if (message.key) {
        // Reload this item from storage
        const item = this.getFromStorage(message.key);
        if (item) {
          this.memoryCache.set(message.key, item);
          if (this.config.logLevel === "debug") {
            console.log(
              `[Cache] Updated item from another tab: ${message.key}`,
            );
          }
        }
      }
    });

    // Listen for delete events
    this.syncManager.addEventListener(SyncMessageType.DELETE, (message) => {
      if (message.key) {
        // Delete from memory cache only (storage already updated)
        this.memoryCache.delete(message.key);
        if (this.config.logLevel === "debug") {
          console.log(`[Cache] Deleted item from another tab: ${message.key}`);
        }
      }
    });

    // Listen for bulk update events
    this.syncManager.addEventListener(
      SyncMessageType.BULK_UPDATE,
      (message) => {
        if (message.keys && message.keys.length > 0) {
          // Reload these items from storage
          for (const key of message.keys) {
            const item = this.getFromStorage(key);
            if (item) {
              this.memoryCache.set(key, item);
            }
          }
          if (this.config.logLevel === "debug") {
            console.log(
              `[Cache] Bulk updated ${message.keys.length} items from another tab`,
            );
          }
        }
      },
    );

    // Listen for bulk delete events
    this.syncManager.addEventListener(
      SyncMessageType.BULK_DELETE,
      (message) => {
        if (message.keys && message.keys.length > 0) {
          // Delete from memory cache only (storage already updated)
          for (const key of message.keys) {
            this.memoryCache.delete(key);
          }
          if (this.config.logLevel === "debug") {
            console.log(
              `[Cache] Bulk deleted ${message.keys.length} items from another tab`,
            );
          }
        }
      },
    );

    // Listen for clear events
    this.syncManager.addEventListener(SyncMessageType.CLEAR, () => {
      // Clear memory cache only (storage already cleared)
      this.memoryCache.clear();
      // Reload metadata
      this.metadata = this.loadMetadata();
      if (this.config.logLevel === "debug") {
        console.log(`[Cache] Cleared all items from another tab`);
      }
    });
  }

  /**
   * Get sync manager metrics
   * @returns The sync manager metrics
   */
  getSyncMetrics(): SyncMetrics {
    return this.syncManager.getMetrics();
  }

  /**
   * Get the number of active tabs
   * @returns The number of active tabs
   */
  getActiveTabCount(): number {
    return this.syncManager.getActiveTabCount();
  }

  /**
   * Check if this is the only active tab
   * @returns True if this is the only active tab
   */
  isOnlyActiveTab(): boolean {
    return this.syncManager.isOnlyActiveTab();
  }

  /**
   * Check if synchronization is enabled
   * @returns True if synchronization is enabled
   */
  isSyncEnabled(): boolean {
    return this.config.syncEnabled && this.syncManager.isSyncEnabled();
  }

  /**
   * Enable or disable synchronization
   * @param enabled Whether synchronization should be enabled
   */
  setSyncEnabled(enabled: boolean): void {
    this.configure({ syncEnabled: enabled });
  }

  /**
   * Clear all user-related cache items
   * @param userId The user ID
   */
  clearUserCache(userId: string): void {
    if (!userId) return;

    try {
      const userCacheKeys: string[] = [];

      // Collect all keys from memory cache that contain the user ID
      this.memoryCache.forEach((_, key) => {
        if (key.includes(userId)) {
          userCacheKeys.push(key);
        }
      });

      // Collect all keys from storage that contain the user ID
      for (const storageKey of this.storage.keys()) {
        const keyWithoutPrefix = storageKey.substring(CACHE_PREFIX.length);
        if (
          keyWithoutPrefix.includes(userId) &&
          !userCacheKeys.includes(keyWithoutPrefix)
        ) {
          userCacheKeys.push(keyWithoutPrefix);
        }
      }

      // Delete from memory cache and storage
      if (userCacheKeys.length > 0) {
        if (
          this.config.logLevel === "debug" ||
          this.config.logLevel === "info"
        ) {
          console.log(
            `Clearing ${userCacheKeys.length} cache items for user ${userId}`,
          );
        }

        // Delete individual keys
        for (const keyToDelete of userCacheKeys) {
          this.delete(keyToDelete);
        }
      }
    } catch (e) {
      if (this.config.logLevel !== "none") {
        console.warn(`Error clearing user cache for ${userId}:`, e);
      }
    }
  }
}

// Create a singleton instance
export const cache = new Cache();

// Default TTL values (in milliseconds)
export const DEFAULT_CACHE_TTL = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 30, // 30 minutes
  LONG: 1000 * 60 * 60 * 24, // 24 hours
};

/**
 * Utility function to log cache compression statistics
 * Useful for debugging and performance monitoring
 */
export function logCacheCompressionStats(): void {
  const stats = cache.getStats();
  const compressionEnabled = stats.compressionEnabled ? "enabled" : "disabled";
  const compressionRatio = (stats.compressionRatio * 100).toFixed(2);
  const spaceSavedKB = (stats.spaceSaved / 1024).toFixed(2);
  const originalSizeKB = (stats.originalSize / 1024).toFixed(2);

  console.log(`
Cache Compression Statistics:
----------------------------
Compression: ${compressionEnabled}
Compressed items: ${stats.compressedItemCount} of ${stats.memoryItemCount} (${stats.memoryItemCount > 0 ? ((stats.compressedItemCount / stats.memoryItemCount) * 100).toFixed(2) : 0}%)
Original size: ${originalSizeKB} KB
Compression ratio: ${compressionRatio}%
Space saved: ${spaceSavedKB} KB
  `);
}

/**
 * Utility function to log cache eviction statistics
 * Useful for debugging and performance monitoring
 */
export function logCacheEvictionStats(): void {
  const stats = cache.getStats();
  const totalSizeKB = (stats.totalSize / 1024).toFixed(2);
  const maxSizeKB = (stats.maxSize / 1024).toFixed(2);
  const lastEviction = stats.lastEviction
    ? stats.lastEviction.toISOString()
    : "Never";

  console.log(`
Cache Eviction Statistics:
-------------------------
Eviction strategy: ${stats.evictionStrategy}
Total items: ${stats.memoryItemCount} / ${stats.maxItems} (${((stats.memoryItemCount / stats.maxItems) * 100).toFixed(2)}% full)
Total size: ${totalSizeKB} KB / ${maxSizeKB} KB (${((stats.totalSize / stats.maxSize) * 100).toFixed(2)}% full)
Items evicted: ${stats.evictionCount}
Last eviction: ${lastEviction}
  `);
}
