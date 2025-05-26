/**
 * Tests for Logout Intent Utilities
 */

import {
  isAfterManualLogout,
  shouldShowSignedOutWarning,
  clearLogoutIntent,
} from "../logoutIntentUtils";

// Mock localStorage and sessionStorage
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
  };
})();

const sessionStorageMock = (() => {
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
  };
})();

// Replace global storage objects
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

describe("Logout Intent Utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe("isAfterManualLogout", () => {
    it("should return true when sessionStorage flag is set", () => {
      sessionStorageMock.setItem("holistiq_manual_logout", "true");
      expect(isAfterManualLogout()).toBe(true);
    });

    it("should return true when localStorage intent is recent and manual", () => {
      const intent = {
        isManual: true,
        timestamp: Date.now() - 1000, // 1 second ago
      };
      localStorageMock.setItem(
        "holistiq_logout_intent",
        JSON.stringify(intent),
      );
      expect(isAfterManualLogout()).toBe(true);
    });

    it("should return false when localStorage intent is old", () => {
      const intent = {
        isManual: true,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      };
      localStorageMock.setItem(
        "holistiq_logout_intent",
        JSON.stringify(intent),
      );
      expect(isAfterManualLogout()).toBe(false);
    });

    it("should return false when localStorage intent is not manual", () => {
      const intent = {
        isManual: false,
        timestamp: Date.now() - 1000, // 1 second ago
      };
      localStorageMock.setItem(
        "holistiq_logout_intent",
        JSON.stringify(intent),
      );
      expect(isAfterManualLogout()).toBe(false);
    });

    it("should return false when no intent is stored", () => {
      expect(isAfterManualLogout()).toBe(false);
    });

    it("should handle invalid JSON gracefully", () => {
      localStorageMock.setItem("holistiq_logout_intent", "invalid json");
      expect(isAfterManualLogout()).toBe(false);
    });
  });

  describe("shouldShowSignedOutWarning", () => {
    it("should return false when after manual logout", () => {
      sessionStorageMock.setItem("holistiq_manual_logout", "true");
      expect(shouldShowSignedOutWarning()).toBe(false);
    });

    it("should return true when not after manual logout", () => {
      expect(shouldShowSignedOutWarning()).toBe(true);
    });
  });

  describe("clearLogoutIntent", () => {
    it("should clear both localStorage and sessionStorage", () => {
      // Set up some data
      localStorageMock.setItem("holistiq_logout_intent", "test");
      sessionStorageMock.setItem("holistiq_manual_logout", "true");

      // Clear intent
      clearLogoutIntent();

      // Verify data is cleared
      expect(localStorageMock.getItem("holistiq_logout_intent")).toBeNull();
      expect(sessionStorageMock.getItem("holistiq_manual_logout")).toBeNull();
    });

    it("should handle storage errors gracefully", () => {
      // Mock storage to throw errors
      const originalRemoveItem = localStorageMock.removeItem;
      localStorageMock.removeItem = () => {
        throw new Error("Storage error");
      };

      // Should not throw
      expect(() => clearLogoutIntent()).not.toThrow();

      // Restore original method
      localStorageMock.removeItem = originalRemoveItem;
    });
  });
});
