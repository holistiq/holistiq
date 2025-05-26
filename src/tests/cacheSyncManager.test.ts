/**
 * Tests for the cache synchronization manager
 */

import { CacheSyncManager, SyncMessageType } from "../lib/cacheSyncManager";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  const listeners: Array<(event: StorageEvent) => void> = [];

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      const oldValue = store[key];
      store[key] = value;

      // Trigger storage event for listeners
      const event = new StorageEvent("storage", {
        key,
        oldValue,
        newValue: value,
        storageArea: store as unknown,
        url: window.location.href,
      });

      listeners.forEach((listener) => listener(event));
    },
    removeItem: (key: string) => {
      const oldValue = store[key];
      delete store[key];

      // Trigger storage event for listeners
      const event = new StorageEvent("storage", {
        key,
        oldValue,
        newValue: null,
        storageArea: store as unknown,
        url: window.location.href,
      });

      listeners.forEach((listener) => listener(event));
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
    getAllItems: () => store,
    addEventListener: (event: string, listener: EventListener) => {
      if (event === "storage") {
        listeners.push(listener);
      }
    },
    removeEventListener: (event: string, listener: EventListener) => {
      if (event === "storage") {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    },
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.addEventListener
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;
const listeners: Record<string, Array<(event: Event) => void>> = {};

window.addEventListener = jest.fn((event, listener) => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(listener as EventListener);

  // Also call original to allow the sync manager to work
  originalAddEventListener.call(window, event, listener);
});

window.removeEventListener = jest.fn((event, listener) => {
  if (listeners[event]) {
    const index = listeners[event].indexOf(listener as EventListener);
    if (index !== -1) {
      listeners[event].splice(index, 1);
    }
  }

  // Also call original
  originalRemoveEventListener.call(window, event, listener);
});

describe("CacheSyncManager", () => {
  let syncManager: CacheSyncManager;

  beforeEach(() => {
    // Clear localStorage
    localStorageMock.clear();

    // Reset listeners
    Object.keys(listeners).forEach((event) => {
      listeners[event] = [];
    });

    // Create a new sync manager
    syncManager = new CacheSyncManager({
      enabled: true,
      logEvents: false,
    });

    // Initialize the sync manager
    syncManager.initialize();
  });

  afterEach(() => {
    // Shut down the sync manager
    syncManager.shutdown();
  });

  test("should initialize with default config", () => {
    const manager = new CacheSyncManager();
    expect(manager.isSyncEnabled()).toBe(false); // Not initialized yet

    manager.initialize();
    expect(manager.isSyncEnabled()).toBe(true);

    manager.shutdown();
  });

  test("should broadcast update message", () => {
    // Set up a spy on localStorage.setItem
    const setItemSpy = jest.spyOn(localStorageMock, "setItem");

    // Broadcast an update
    syncManager.broadcastUpdate("test-key");

    // Check that localStorage.setItem was called
    expect(setItemSpy).toHaveBeenCalled();

    // Check that the message was stored in localStorage
    const syncMessage = localStorageMock.getItem("holistiq_cache_sync");
    expect(syncMessage).not.toBeNull();

    // Parse the message
    const message = JSON.parse(syncMessage || "{}");
    expect(message.type).toBe(SyncMessageType.UPDATE);
    expect(message.key).toBe("test-key");
    expect(message.tabId).toBe(syncManager.getTabId());
  });

  test("should broadcast delete message", () => {
    // Set up a spy on localStorage.setItem
    const setItemSpy = jest.spyOn(localStorageMock, "setItem");

    // Broadcast a delete
    syncManager.broadcastDelete("test-key");

    // Check that localStorage.setItem was called
    expect(setItemSpy).toHaveBeenCalled();

    // Check that the message was stored in localStorage
    const syncMessage = localStorageMock.getItem("holistiq_cache_sync");
    expect(syncMessage).not.toBeNull();

    // Parse the message
    const message = JSON.parse(syncMessage || "{}");
    expect(message.type).toBe(SyncMessageType.DELETE);
    expect(message.key).toBe("test-key");
    expect(message.tabId).toBe(syncManager.getTabId());
  });

  test("should broadcast clear message", () => {
    // Set up a spy on localStorage.setItem
    const setItemSpy = jest.spyOn(localStorageMock, "setItem");

    // Broadcast a clear
    syncManager.broadcastClear();

    // Check that localStorage.setItem was called
    expect(setItemSpy).toHaveBeenCalled();

    // Check that the message was stored in localStorage
    const syncMessage = localStorageMock.getItem("holistiq_cache_sync");
    expect(syncMessage).not.toBeNull();

    // Parse the message
    const message = JSON.parse(syncMessage || "{}");
    expect(message.type).toBe(SyncMessageType.CLEAR);
    expect(message.tabId).toBe(syncManager.getTabId());
  });

  test("should receive messages from other tabs", () => {
    // Set up a listener for update events
    const updateListener = jest.fn();
    syncManager.addEventListener(SyncMessageType.UPDATE, updateListener);

    // Simulate a storage event from another tab
    const otherTabId = "other-tab-id";
    const syncMessage = {
      type: SyncMessageType.UPDATE,
      key: "test-key",
      timestamp: Date.now(),
      tabId: otherTabId,
      version: "1.0.0",
    };

    // Set the message in localStorage
    localStorageMock.setItem(
      "holistiq_cache_sync",
      JSON.stringify(syncMessage),
    );

    // Check that the listener was called
    expect(updateListener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: SyncMessageType.UPDATE,
        key: "test-key",
        tabId: otherTabId,
      }),
    );
  });

  test("should track active tabs", () => {
    // Initially, only our tab should be active
    expect(syncManager.getActiveTabCount()).toBe(1);

    // Simulate a heartbeat from another tab
    const otherTabId = "other-tab-id";
    const syncMessage = {
      type: SyncMessageType.HEARTBEAT,
      timestamp: Date.now(),
      tabId: otherTabId,
      version: "1.0.0",
    };

    // Set the message in localStorage
    localStorageMock.setItem(
      "holistiq_cache_sync",
      JSON.stringify(syncMessage),
    );

    // Now there should be two active tabs
    expect(syncManager.getActiveTabCount()).toBe(2);
  });

  test("should handle configuration changes", () => {
    // Initially enabled
    expect(syncManager.isSyncEnabled()).toBe(true);

    // Disable synchronization
    syncManager.configure({ enabled: false });
    expect(syncManager.isSyncEnabled()).toBe(false);

    // Re-enable synchronization
    syncManager.configure({ enabled: true });
    expect(syncManager.isSyncEnabled()).toBe(true);
  });
});
