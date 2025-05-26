import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { directGoogleAuth } from "./directGoogleAuth";

// Configuration constants
export const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  WARNING_BEFORE_TIMEOUT: 5 * 60 * 1000, // 5 minutes before timeout
  TOKEN_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
  ACTIVITY_EVENTS: ["mousedown", "keydown", "touchstart", "scroll"],
  STORAGE_KEY: "holistiq_session_data",
  LOG_LEVEL: process.env.NODE_ENV !== "production" ? "error" : "none",
};

// Session storage options
export enum SessionStorageType {
  LOCAL_STORAGE = "localStorage",
  SESSION_STORAGE = "sessionStorage",
  COOKIE = "cookie",
}

// Session state for cross-tab communication
export enum SessionAction {
  LOGGED_IN = "LOGGED_IN",
  LOGGED_OUT = "LOGGED_OUT",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_EXTENDED = "SESSION_EXTENDED",
  MANUAL_LOGOUT = "MANUAL_LOGOUT", // New action for intentional logout
}

// Session manager class
export class SessionManager {
  private lastActivity: number = Date.now();
  private timeoutId: number | null = null;
  private warningTimeoutId: number | null = null;
  private refreshIntervalId: number | null = null;
  private session: Session | null = null;
  private storageType: SessionStorageType;
  private onSessionExpiringCallback: (() => void) | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;
  private isWarningDisplayed: boolean = false;

  constructor(
    storageType: SessionStorageType = SessionStorageType.LOCAL_STORAGE,
  ) {
    this.storageType = storageType;
    this.setupBroadcastListener();
  }

  // Initialize the session manager
  public async initialize(): Promise<void> {
    try {
      // Get current session
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (SESSION_CONFIG.LOG_LEVEL !== "none") {
          console.error("Error getting session:", error);
        }

        // Try to recover session from localStorage as a fallback
        this.tryRecoverSessionFromStorage();
        return;
      }

      this.session = data.session;

      if (this.session) {
        // Log session details in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Session initialized successfully:", {
            userId: this.session.user?.id,
            expiresAt: new Date(this.session.expires_at * 1000).toISOString(),
            provider: this.session.user?.app_metadata?.provider,
          });
        }

        // Setup activity tracking
        this.setupActivityTracking();

        // Setup token refresh
        this.setupTokenRefresh();

        // Start inactivity timeout
        this.resetInactivityTimeout();
      } else {
        // Try to recover session from localStorage as a fallback
        this.tryRecoverSessionFromStorage();
      }
    } catch (error) {
      if (SESSION_CONFIG.LOG_LEVEL !== "none") {
        console.error("Unexpected error initializing session:", error);
      }

      // Try to recover session from localStorage as a fallback
      this.tryRecoverSessionFromStorage();
    }
  }

  // Try to recover session from localStorage
  private tryRecoverSessionFromStorage(): void {
    try {
      // Find Supabase session key in localStorage
      const supabaseKey = Object.keys(localStorage).find(
        (key) => key.startsWith("sb-") && key.endsWith("-auth-token"),
      );

      if (!supabaseKey) {
        if (SESSION_CONFIG.LOG_LEVEL !== "none") {
          console.log(
            "No Supabase session key found in localStorage for recovery",
          );
        }
        return;
      }

      // Get session data
      const sessionStr = localStorage.getItem(supabaseKey);
      if (!sessionStr) {
        return;
      }

      // Parse session data
      const sessionData = JSON.parse(sessionStr);

      // Check if we have a valid session
      if (sessionData?.access_token) {
        if (SESSION_CONFIG.LOG_LEVEL !== "none") {
          console.log("Attempting to recover session from localStorage");
        }

        // Try to set the session in Supabase
        supabase.auth
          .setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token ?? "",
          })
          .then(({ data, error }) => {
            if (error) {
              if (SESSION_CONFIG.LOG_LEVEL !== "none") {
                console.error("Error recovering session:", error);
              }
            } else if (data.session) {
              if (SESSION_CONFIG.LOG_LEVEL !== "none") {
                console.log("Session recovered successfully");
              }

              this.session = data.session;

              // Setup activity tracking
              this.setupActivityTracking();

              // Setup token refresh
              this.setupTokenRefresh();

              // Start inactivity timeout
              this.resetInactivityTimeout();
            }
          })
          .catch((error) => {
            if (SESSION_CONFIG.LOG_LEVEL !== "none") {
              console.error("Unexpected error recovering session:", error);
            }
          });
      }
    } catch (error) {
      if (SESSION_CONFIG.LOG_LEVEL !== "none") {
        console.error("Error recovering session from localStorage:", error);
      }
    }
  }

  // Set up activity tracking
  private setupActivityTracking(): void {
    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.resetInactivityTimeout();

      // If warning was displayed, hide it
      if (this.isWarningDisplayed) {
        this.isWarningDisplayed = false;
        this.broadcastSessionAction(SessionAction.SESSION_EXTENDED);
      }
    };

    // Add event listeners for user activity
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach((eventType) => {
      window.addEventListener(eventType, updateActivity, { passive: true });
    });
  }

  // Reset inactivity timeout
  private resetInactivityTimeout(): void {
    // Clear existing timeouts
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
    if (this.warningTimeoutId) {
      window.clearTimeout(this.warningTimeoutId);
    }

    // Set warning timeout
    const warningTime =
      SESSION_CONFIG.INACTIVITY_TIMEOUT - SESSION_CONFIG.WARNING_BEFORE_TIMEOUT;
    this.warningTimeoutId = window.setTimeout(() => {
      this.isWarningDisplayed = true;
      if (this.onSessionExpiringCallback) {
        this.onSessionExpiringCallback();
      }
    }, warningTime);

    // Set session timeout
    this.timeoutId = window.setTimeout(() => {
      this.handleSessionTimeout();
    }, SESSION_CONFIG.INACTIVITY_TIMEOUT);
  }

  // Handle session timeout
  private async handleSessionTimeout(): Promise<void> {
    // Reset warning flag since session is now expired
    this.isWarningDisplayed = false;

    // Sign out the user automatically (not manual)
    await this.signOut(false);

    // Broadcast session expiration
    this.broadcastSessionAction(SessionAction.SESSION_EXPIRED);

    // Call session expired callback
    if (this.onSessionExpiredCallback) {
      this.onSessionExpiredCallback();
    }
  }

  // Set up token refresh
  private setupTokenRefresh(): void {
    // Clear existing interval
    if (this.refreshIntervalId) {
      window.clearInterval(this.refreshIntervalId);
    }

    // Set up interval to refresh token
    this.refreshIntervalId = window.setInterval(async () => {
      if (!this.session) {
        if (SESSION_CONFIG.LOG_LEVEL !== "none") {
          console.log("No session to refresh");
        }
        return;
      }

      try {
        // First check if the session is still valid
        const { data: sessionData } = await supabase.auth.getSession();

        // If no session exists, don't try to refresh as it will cause an AuthSessionMissingError
        if (!sessionData?.session) {
          if (SESSION_CONFIG.LOG_LEVEL !== "none") {
            console.log("Session no longer exists, skipping refresh");
          }

          // Try to recover session
          this.tryRecoverSessionFromStorage();
          return;
        }

        // Try to refresh the session
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          // Check for specific error types
          if (error.message?.includes("Auth session missing")) {
            if (SESSION_CONFIG.LOG_LEVEL !== "none") {
              console.log(
                "Auth session missing during refresh - attempting recovery",
              );
            }

            // Try to recover session
            this.tryRecoverSessionFromStorage();
            return;
          }

          if (SESSION_CONFIG.LOG_LEVEL !== "none") {
            console.error("Error refreshing session:", error);
          }
          return;
        }

        // Update the session
        this.session = data.session;

        if (
          SESSION_CONFIG.LOG_LEVEL !== "none" &&
          process.env.NODE_ENV !== "production"
        ) {
          console.log("Session refreshed successfully");
        }
      } catch (error) {
        // Check for specific error types
        if (
          error instanceof Error &&
          error.message?.includes("Auth session missing")
        ) {
          if (SESSION_CONFIG.LOG_LEVEL !== "none") {
            console.log(
              "Auth session missing during refresh - attempting recovery",
            );
          }

          // Try to recover session
          this.tryRecoverSessionFromStorage();
          return;
        }

        if (SESSION_CONFIG.LOG_LEVEL !== "none") {
          console.error("Unexpected error refreshing session:", error);
        }
      }
    }, SESSION_CONFIG.TOKEN_REFRESH_INTERVAL);
  }

  // Set up broadcast channel listener for cross-tab communication
  private setupBroadcastListener(): void {
    window.addEventListener("storage", (event) => {
      if (event.key !== "holistiq_session_action") return;

      const action = event.newValue as SessionAction;

      switch (action) {
        case SessionAction.LOGGED_OUT:
        case SessionAction.SESSION_EXPIRED:
          // Handle logout or session expiration from another tab
          this.cleanup();
          if (this.onSessionExpiredCallback) {
            this.onSessionExpiredCallback();
          }
          break;

        case SessionAction.MANUAL_LOGOUT:
          // Handle manual logout from another tab
          this.cleanup();
          // Don't show session expired callback for manual logout
          break;

        case SessionAction.SESSION_EXTENDED:
          // Reset timeout if session was extended in another tab
          if (this.session) {
            this.resetInactivityTimeout();
            this.isWarningDisplayed = false;
          }
          break;

        case SessionAction.LOGGED_IN:
          // Refresh the page to get the new session
          window.location.reload();
          break;
      }
    });
  }

  // Broadcast session action for cross-tab communication
  private broadcastSessionAction(action: SessionAction): void {
    try {
      localStorage.setItem("holistiq_session_action", action);
      // Immediately remove to trigger another event next time
      setTimeout(() => {
        localStorage.removeItem("holistiq_session_action");
      }, 100);
    } catch (error) {
      if (SESSION_CONFIG.LOG_LEVEL !== "none") {
        console.error("Error broadcasting session action:", error);
      }
    }
  }

  // Clean up resources
  public cleanup(): void {
    // Clear timeouts and intervals
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      window.clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
    if (this.refreshIntervalId) {
      window.clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }

    // Remove event listeners
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach((eventType) => {
      window.removeEventListener(eventType, () => {});
    });
  }

  // Set callback for when session is about to expire
  public onSessionExpiring(callback: () => void): void {
    this.onSessionExpiringCallback = callback;
  }

  // Set callback for when session has expired
  public onSessionExpired(callback: () => void): void {
    this.onSessionExpiredCallback = callback;
  }

  // Extend the session manually
  public extendSession(): void {
    this.lastActivity = Date.now();
    this.resetInactivityTimeout();
    this.isWarningDisplayed = false;

    // Broadcast session extension
    this.broadcastSessionAction(SessionAction.SESSION_EXTENDED);
  }

  // Track logout intent to distinguish between manual and automatic signouts
  private setLogoutIntent(isManual: boolean): void {
    try {
      const intent = {
        isManual,
        timestamp: Date.now(),
      };
      localStorage.setItem("holistiq_logout_intent", JSON.stringify(intent));

      // Also set a flag that persists across page refreshes for a short time
      if (isManual) {
        sessionStorage.setItem("holistiq_manual_logout", "true");
        // Clear the flag after 30 seconds to prevent it from persisting too long
        setTimeout(() => {
          sessionStorage.removeItem("holistiq_manual_logout");
        }, 30000);
      }
    } catch (error) {
      console.error("Error setting logout intent:", error);
    }
  }

  // Get logout intent to determine if the last logout was manual
  public getLogoutIntent(): { isManual: boolean; timestamp: number } | null {
    try {
      const intentStr = localStorage.getItem("holistiq_logout_intent");
      if (!intentStr) return null;

      const intent = JSON.parse(intentStr);

      // Clear old intents (older than 5 minutes)
      if (Date.now() - intent.timestamp > 5 * 60 * 1000) {
        localStorage.removeItem("holistiq_logout_intent");
        return null;
      }

      return intent;
    } catch (error) {
      console.error("Error getting logout intent:", error);
      return null;
    }
  }

  // Clear logout intent
  public clearLogoutIntent(): void {
    try {
      localStorage.removeItem("holistiq_logout_intent");
      sessionStorage.removeItem("holistiq_manual_logout");
    } catch (error) {
      console.error("Error clearing logout intent:", error);
    }
  }

  // Sign out the user with manual flag
  public async signOut(isManual: boolean = true): Promise<void> {
    try {
      // Track logout intent
      this.setLogoutIntent(isManual);

      // Get the current user ID before signing out (for cache clearing)
      const userId = this.session?.user?.id;

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out from Supabase:", error);
      }

      // Clear session state
      this.session = null;

      // Clean up resources (timeouts, intervals, event listeners)
      this.cleanup();

      // Clear any cached user data
      if (userId) {
        // Import cache here to avoid circular dependencies - using dynamic import
        import("@/lib/cache")
          .then((cacheModule) => {
            const cache = cacheModule.cache;
            if (cache && typeof cache.clearUserCache === "function") {
              console.log("Clearing cache for user:", userId);
              cache.clearUserCache(userId);
            }
          })
          .catch((cacheError) => {
            console.error("Error clearing user cache:", cacheError);
          });
      }

      // Clear any local storage items related to the user session
      try {
        // Clear specific items related to authentication
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.removeItem("supabase.auth.token");

        // Clear any custom session data
        localStorage.removeItem("holistiq_last_activity");
        sessionStorage.removeItem("holistiq_last_activity");
      } catch (storageError) {
        console.error("Error clearing storage items:", storageError);
      }

      // Broadcast appropriate action based on logout type
      const action = isManual
        ? SessionAction.MANUAL_LOGOUT
        : SessionAction.LOGGED_OUT;
      this.broadcastSessionAction(action);

      // Dispatch a custom event for components to react to
      window.dispatchEvent(
        new CustomEvent("holistiq:signed-out", {
          detail: { isManual },
        }),
      );

      if (SESSION_CONFIG.LOG_LEVEL !== "none") {
        console.log(
          `User successfully signed out (${isManual ? "manual" : "automatic"})`,
        );
      }
    } catch (error) {
      console.error("Error during sign out process:", error);
      // Still try to broadcast logout even if there was an error
      const action = isManual
        ? SessionAction.MANUAL_LOGOUT
        : SessionAction.LOGGED_OUT;
      this.broadcastSessionAction(action);
      throw error;
    }
  }

  // Sign in with remember me option
  public async signInWithGoogle(rememberMe: boolean = false): Promise<void> {
    console.log("SessionManager: Starting direct Google OAuth sign-in");
    console.log("SessionManager: Remember me:", rememberMe);

    // Set storage type based on remember me option
    this.storageType = rememberMe
      ? SessionStorageType.LOCAL_STORAGE
      : SessionStorageType.SESSION_STORAGE;

    // Store preference
    this.storeSessionPreference(rememberMe);

    try {
      // Use direct Google OAuth to show myholistiq.com in consent screen
      await directGoogleAuth.signInWithGoogle(rememberMe);

      console.log("SessionManager: Direct Google OAuth completed successfully");

      // Mark that user just signed in to prevent inappropriate session recovery
      sessionStorage.setItem("holistiq_just_signed_in", "true");

      // Initialize session after successful authentication
      await this.initialize();

      // Broadcast login for cross-tab synchronization
      this.broadcastLogin();

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(
        "SessionManager: Error during direct Google OAuth sign-in:",
        error,
      );
      throw error;
    }
  }

  // Broadcast login event for cross-tab synchronization
  public broadcastLogin(): void {
    this.broadcastSessionAction(SessionAction.LOGGED_IN);
  }

  // Store session preference
  private storeSessionPreference(rememberMe: boolean): void {
    try {
      localStorage.setItem("holistiq_remember_me", JSON.stringify(rememberMe));
    } catch (error) {
      if (SESSION_CONFIG.LOG_LEVEL !== "none") {
        console.error("Error storing session preference:", error);
      }
    }
  }

  // Get session preference
  public getSessionPreference(): boolean {
    try {
      const preference = localStorage.getItem("holistiq_remember_me");
      return preference ? JSON.parse(preference) : false;
    } catch (error) {
      if (SESSION_CONFIG.LOG_LEVEL !== "none") {
        console.error("Error getting session preference:", error);
      }
      return false;
    }
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();
