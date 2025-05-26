/**
 * Cache Synchronization Manager
 *
 * Handles cross-tab synchronization for the cache system.
 * Ensures data consistency across multiple browser tabs/windows.
 */

// Constants
const SYNC_CHANNEL_KEY = "holistiq_cache_sync";
const SYNC_LOCK_KEY = "holistiq_cache_sync_lock";
const SYNC_HEARTBEAT_KEY = "holistiq_cache_sync_heartbeat";
const SYNC_VERSION = "1.0.0";
const LOCK_TIMEOUT = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds

// Sync message types
export enum SyncMessageType {
  UPDATE = "update",
  DELETE = "delete",
  CLEAR = "clear",
  BULK_UPDATE = "bulk_update",
  BULK_DELETE = "bulk_delete",
  HEARTBEAT = "heartbeat",
  LOCK_REQUEST = "lock_request",
  LOCK_ACQUIRED = "lock_acquired",
  LOCK_RELEASED = "lock_released",
}

// Metadata type for sync messages
export type SyncMetadataValue = string | number | boolean | null | undefined;
export interface SyncMetadata {
  [key: string]:
    | SyncMetadataValue
    | SyncMetadataValue[]
    | Record<string, SyncMetadataValue>;
}

// Sync message structure
export interface SyncMessage {
  type: SyncMessageType;
  key?: string;
  keys?: string[];
  timestamp: number;
  tabId: string;
  version: string;
  metadata?: SyncMetadata;
}

// Sync configuration
export interface SyncConfig {
  enabled: boolean;
  logLevel: "none" | "error" | "warn" | "info" | "debug";
  resolveConflicts: boolean;
  heartbeatEnabled: boolean;
  lockTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Default sync configuration
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  logLevel: process.env.NODE_ENV !== "production" ? "error" : "none",
  resolveConflicts: true,
  heartbeatEnabled: true,
  lockTimeout: LOCK_TIMEOUT,
  retryAttempts: 3,
  retryDelay: 100,
};

// Sync metrics
export interface SyncMetrics {
  messagesSent: number;
  messagesReceived: number;
  conflictsDetected: number;
  conflictsResolved: number;
  errors: number;
  lastSyncTime: number | null;
  activeTabs: number;
  lockAcquisitions: number;
  lockTimeouts: number;
}

// Sync event listener type
export type SyncEventListener = (message: SyncMessage) => void;

/**
 * Cache Synchronization Manager
 *
 * Manages cross-tab synchronization for the cache system.
 */
export class CacheSyncManager {
  private config: SyncConfig;
  private metrics: SyncMetrics;
  private readonly tabId: string;
  private isInitialized: boolean = false;
  private syncInProgress: boolean = false;
  private heartbeatIntervalId: number | null = null;
  private lockTimeoutId: number | null = null;
  private readonly eventListeners: Map<SyncMessageType, SyncEventListener[]> =
    new Map();
  private readonly activeTabs: Set<string> = new Set();
  private lockOwner: string | null = null;
  private readonly lockQueue: Array<{
    resolve: (value: boolean) => void;
    reject: (reason: Error) => void;
  }> = [];

  /**
   * Create a new CacheSyncManager
   * @param config Sync configuration
   */
  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    this.tabId = this.generateTabId();
  }

  /**
   * Initialize the sync manager
   */
  initialize(): void {
    if (this.isInitialized || !this.config.enabled) return;

    // Set up storage event listener
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("storage", this.handleStorageEvent);
      window.addEventListener("beforeunload", this.handleBeforeUnload);
      this.isInitialized = true;

      // Start heartbeat if enabled
      if (this.config.heartbeatEnabled) {
        this.startHeartbeat();
      }

      // Announce this tab
      this.sendHeartbeat();

      if (this.config.logLevel === "info" || this.config.logLevel === "debug") {
        console.log(
          `[CacheSyncManager] Initialized with tab ID: ${this.tabId}`,
        );
      }
    }
  }

  /**
   * Shut down the sync manager
   */
  shutdown(): void {
    if (!this.isInitialized) return;

    // Remove event listeners
    if (typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("storage", this.handleStorageEvent);
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
    }

    // Stop heartbeat
    if (this.heartbeatIntervalId !== null) {
      window.clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }

    // Release lock if we own it
    if (this.lockOwner === this.tabId) {
      this.releaseLock();
    }

    this.isInitialized = false;

    if (this.config.logLevel === "info" || this.config.logLevel === "debug") {
      console.log(`[CacheSyncManager] Shut down tab ID: ${this.tabId}`);
    }
  }

  /**
   * Configure the sync manager
   * @param config Partial configuration to apply
   */
  configure(config: Partial<SyncConfig>): void {
    const wasEnabled = this.config.enabled;
    const wasHeartbeatEnabled = this.config.heartbeatEnabled;

    // Update config
    this.config = { ...this.config, ...config };

    // Handle enable/disable changes
    if (!wasEnabled && this.config.enabled) {
      this.initialize();
    } else if (wasEnabled && !this.config.enabled) {
      this.shutdown();
    }

    // Handle heartbeat changes
    if (this.config.enabled) {
      if (!wasHeartbeatEnabled && this.config.heartbeatEnabled) {
        this.startHeartbeat();
      } else if (wasHeartbeatEnabled && !this.config.heartbeatEnabled) {
        if (this.heartbeatIntervalId !== null) {
          window.clearInterval(this.heartbeatIntervalId);
          this.heartbeatIntervalId = null;
        }
      }
    }
  }

  /**
   * Add an event listener for sync events
   * @param type The type of event to listen for
   * @param listener The listener function
   */
  addEventListener(type: SyncMessageType, listener: SyncEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.push(listener);
    }
  }

  /**
   * Remove an event listener
   * @param type The type of event
   * @param listener The listener function to remove
   */
  removeEventListener(
    type: SyncMessageType,
    listener: SyncEventListener,
  ): void {
    if (!this.eventListeners.has(type)) return;

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Broadcast a cache update to other tabs
   * @param key The cache key that was updated
   * @param metadata Additional metadata about the update
   */
  broadcastUpdate(key: string, metadata?: SyncMetadata): void {
    if (!this.config.enabled || !this.isInitialized) return;

    this.broadcastMessage({
      type: SyncMessageType.UPDATE,
      key,
      timestamp: Date.now(),
      tabId: this.tabId,
      version: SYNC_VERSION,
      metadata,
    });
  }

  /**
   * Broadcast a cache deletion to other tabs
   * @param key The cache key that was deleted
   * @param metadata Additional metadata about the deletion
   */
  broadcastDelete(key: string, metadata?: SyncMetadata): void {
    if (!this.config.enabled || !this.isInitialized) return;

    this.broadcastMessage({
      type: SyncMessageType.DELETE,
      key,
      timestamp: Date.now(),
      tabId: this.tabId,
      version: SYNC_VERSION,
      metadata,
    });
  }

  /**
   * Broadcast a cache clear to other tabs
   * @param metadata Additional metadata about the clear
   */
  broadcastClear(metadata?: SyncMetadata): void {
    if (!this.config.enabled || !this.isInitialized) return;

    this.broadcastMessage({
      type: SyncMessageType.CLEAR,
      timestamp: Date.now(),
      tabId: this.tabId,
      version: SYNC_VERSION,
      metadata,
    });
  }

  /**
   * Broadcast a bulk update to other tabs
   * @param keys The cache keys that were updated
   * @param metadata Additional metadata about the updates
   */
  broadcastBulkUpdate(keys: string[], metadata?: SyncMetadata): void {
    if (!this.config.enabled || !this.isInitialized || keys.length === 0)
      return;

    this.broadcastMessage({
      type: SyncMessageType.BULK_UPDATE,
      keys,
      timestamp: Date.now(),
      tabId: this.tabId,
      version: SYNC_VERSION,
      metadata,
    });
  }

  /**
   * Broadcast a bulk delete to other tabs
   * @param keys The cache keys that were deleted
   * @param metadata Additional metadata about the deletions
   */
  broadcastBulkDelete(keys: string[], metadata?: SyncMetadata): void {
    if (!this.config.enabled || !this.isInitialized || keys.length === 0)
      return;

    this.broadcastMessage({
      type: SyncMessageType.BULK_DELETE,
      keys,
      timestamp: Date.now(),
      tabId: this.tabId,
      version: SYNC_VERSION,
      metadata,
    });
  }

  /**
   * Get the current sync metrics
   * @returns The current sync metrics
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics, activeTabs: this.activeTabs.size };
  }

  /**
   * Reset the sync metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Get the number of active tabs
   * @returns The number of active tabs
   */
  getActiveTabCount(): number {
    return this.activeTabs.size;
  }

  /**
   * Check if this is the only active tab
   * @returns True if this is the only active tab
   */
  isOnlyActiveTab(): boolean {
    return this.activeTabs.size === 1 && this.activeTabs.has(this.tabId);
  }

  /**
   * Get the tab ID
   * @returns The tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Check if synchronization is enabled
   * @returns True if synchronization is enabled
   */
  isSyncEnabled(): boolean {
    return this.config.enabled && this.isInitialized;
  }

  /**
   * Acquire a lock for exclusive operations
   * @param timeoutMs Optional custom timeout
   * @returns Promise that resolves to true if lock was acquired, false if timed out
   */
  async acquireLock(timeoutMs?: number): Promise<boolean> {
    if (!this.config.enabled || !this.isInitialized) {
      return false;
    }

    // If we already own the lock, return true
    if (this.lockOwner === this.tabId) {
      return true;
    }

    // If someone else owns the lock, queue up
    if (this.lockOwner !== null) {
      return new Promise<boolean>((resolve, reject) => {
        this.lockQueue.push({ resolve, reject });

        // Set timeout to reject if lock isn't acquired in time
        setTimeout(() => {
          const index = this.lockQueue.findIndex(
            (item) => item.resolve === resolve,
          );
          if (index !== -1) {
            this.lockQueue.splice(index, 1);
            this.metrics.lockTimeouts++;
            reject(new Error("Lock acquisition timed out"));
          }
        }, timeoutMs || this.config.lockTimeout);
      });
    }

    // Try to acquire the lock
    try {
      const lockData = {
        tabId: this.tabId,
        timestamp: Date.now(),
      };

      localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify(lockData));

      // Broadcast lock acquisition
      this.broadcastMessage({
        type: SyncMessageType.LOCK_ACQUIRED,
        timestamp: Date.now(),
        tabId: this.tabId,
        version: SYNC_VERSION,
      });

      this.lockOwner = this.tabId;
      this.metrics.lockAcquisitions++;

      // Set timeout to auto-release lock
      this.lockTimeoutId = window.setTimeout(() => {
        this.releaseLock();
      }, timeoutMs || this.config.lockTimeout);

      return true;
    } catch (error) {
      if (this.config.logLevel !== "none") {
        console.error("[CacheSyncManager] Error acquiring lock:", error);
      }
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Release the lock
   * @returns True if the lock was released
   */
  releaseLock(): boolean {
    if (this.lockOwner !== this.tabId) {
      return false;
    }

    try {
      localStorage.removeItem(SYNC_LOCK_KEY);

      // Broadcast lock release
      this.broadcastMessage({
        type: SyncMessageType.LOCK_RELEASED,
        timestamp: Date.now(),
        tabId: this.tabId,
        version: SYNC_VERSION,
      });

      this.lockOwner = null;

      // Clear timeout
      if (this.lockTimeoutId !== null) {
        window.clearTimeout(this.lockTimeoutId);
        this.lockTimeoutId = null;
      }

      // Process next item in queue
      if (this.lockQueue.length > 0) {
        const nextItem = this.lockQueue.shift();
        if (nextItem) {
          const { resolve } = nextItem;
          this.acquireLock().then(resolve);
        }
      }

      return true;
    } catch (error) {
      if (this.config.logLevel !== "none") {
        console.error("[CacheSyncManager] Error releasing lock:", error);
      }
      this.metrics.errors++;
      return false;
    }
  }

  // Private methods

  /**
   * Initialize metrics
   */
  private initializeMetrics(): SyncMetrics {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      errors: 0,
      lastSyncTime: null,
      activeTabs: 0,
      lockAcquisitions: 0,
      lockTimeouts: 0,
    };
  }

  /**
   * Generate a unique tab ID
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Start the heartbeat interval
   */
  private startHeartbeat(): void {
    if (this.heartbeatIntervalId !== null) {
      window.clearInterval(this.heartbeatIntervalId);
    }

    this.heartbeatIntervalId = window.setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Send a heartbeat message
   */
  private sendHeartbeat(): void {
    this.broadcastMessage({
      type: SyncMessageType.HEARTBEAT,
      timestamp: Date.now(),
      tabId: this.tabId,
      version: SYNC_VERSION,
    });

    // Add ourselves to active tabs
    this.activeTabs.add(this.tabId);
  }

  /**
   * Handle beforeunload event
   */
  private readonly handleBeforeUnload = (): void => {
    // Release lock if we own it
    if (this.lockOwner === this.tabId) {
      this.releaseLock();
    }
  };

  /**
   * Handle storage events from other tabs
   */
  private readonly handleStorageEvent = (event: StorageEvent): void => {
    if (!event.key || !event.newValue) return;

    // Handle sync events
    if (event.key === SYNC_CHANNEL_KEY) {
      try {
        const message = JSON.parse(event.newValue) as SyncMessage;
        this.handleSyncMessage(message);
      } catch (error) {
        if (this.config.logLevel !== "none") {
          console.error(
            "[CacheSyncManager] Error parsing sync message:",
            error,
          );
        }
        this.metrics.errors++;
      }
    }
  };

  /**
   * Handle a sync message
   */
  private handleSyncMessage(message: SyncMessage): void {
    // Skip our own messages
    if (message.tabId === this.tabId) return;

    this.metrics.messagesReceived++;
    this.metrics.lastSyncTime = Date.now();

    // Update active tabs for heartbeats
    if (message.type === SyncMessageType.HEARTBEAT) {
      this.activeTabs.add(message.tabId);
    }

    // Notify listeners
    this.notifyListeners(message);
  }

  /**
   * Notify event listeners of a sync message
   */
  private notifyListeners(message: SyncMessage): void {
    if (!this.eventListeners.has(message.type)) return;

    const listeners = this.eventListeners.get(message.type);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(message);
      } catch (error) {
        if (this.config.logLevel !== "none") {
          console.error(
            `[CacheSyncManager] Error in listener for ${message.type}:`,
            error,
          );
        }
        this.metrics.errors++;
      }
    }
  }

  /**
   * Broadcast a message to other tabs
   */
  private broadcastMessage(message: SyncMessage): void {
    if (!this.config.enabled || !this.isInitialized) return;

    try {
      this.syncInProgress = true;
      localStorage.setItem(SYNC_CHANNEL_KEY, JSON.stringify(message));
      this.metrics.messagesSent++;

      if (this.config.logLevel === "debug") {
        console.log(`[CacheSyncManager] Broadcast ${message.type}:`, message);
      }

      // Small delay to prevent race conditions
      setTimeout(() => {
        this.syncInProgress = false;
      }, 50);
    } catch (error) {
      if (this.config.logLevel !== "none") {
        console.error("[CacheSyncManager] Error broadcasting message:", error);
      }
      this.metrics.errors++;
      this.syncInProgress = false;
    }
  }
}
