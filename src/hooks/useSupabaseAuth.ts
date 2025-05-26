import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sessionManager } from "@/services/sessionManager";
import { useToast } from "@/hooks/use-toast";
import {
  getDirectSessionFromStorage,
  extractUserFromSession,
} from "@/utils/sessionUtils";
import { User, Session } from "@supabase/supabase-js";

// Custom event for auth state changes
export const AUTH_EVENTS = {
  SIGNED_OUT: "auth:signed_out",
  SESSION_EXPIRED: "auth:session_expired",
  AUTH_ERROR: "auth:error",
};

// Global state to track initialization across hook instances
interface GlobalAuthState {
  user: User | null;
  loading: boolean;
  sessionInitialized: boolean;
  initializationInProgress: boolean;
  initializationCount: number;
}

// Create a global state object that persists across hook instances
const globalAuthState: GlobalAuthState = {
  user: null,
  loading: true,
  sessionInitialized: false,
  initializationInProgress: false,
  initializationCount: 0,
};

export function useSupabaseAuth() {
  // Use local state that syncs with global state
  const [user, setUser] = useState<User | null>(globalAuthState.user);
  const [loading, setLoading] = useState(globalAuthState.loading);
  const [sessionInitialized, setSessionInitialized] = useState(
    globalAuthState.sessionInitialized,
  );
  const { toast } = useToast();

  // Function to clear stale authentication data
  const clearStaleAuthData = useCallback(() => {
    console.log("Clearing stale authentication data...");
    try {
      // Clear Supabase-related items from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("sb-") ||
            key.includes("supabase") ||
            key.includes("auth"))
        ) {
          keysToRemove.push(key);
        }
      }

      // Remove the identified keys
      keysToRemove.forEach((key) => {
        console.log(`Clearing stale auth data: ${key}`);
        localStorage.removeItem(key);
      });

      // Also check sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (
          key &&
          (key.startsWith("sb-") ||
            key.includes("supabase") ||
            key.includes("auth"))
        ) {
          sessionKeysToRemove.push(key);
        }
      }

      // Remove the identified session keys
      sessionKeysToRemove.forEach((key) => {
        console.log(`Clearing stale auth data from sessionStorage: ${key}`);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing stale auth data:", error);
    }
  }, []);

  // Use a ref to track if this instance has already contributed to initialization
  const hasInitialized = useRef(false);

  // Initialize session - with protection against duplicate initializations
  useEffect(() => {
    // Skip if already initialized globally or initialization is in progress
    if (
      globalAuthState.sessionInitialized ||
      globalAuthState.initializationInProgress
    ) {
      // Just sync with global state
      setSessionInitialized(globalAuthState.sessionInitialized);
      return;
    }

    // Skip if this instance has already tried to initialize
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    globalAuthState.initializationInProgress = true;
    globalAuthState.initializationCount++;

    // Set a timeout to prevent getting stuck in loading state
    const initializationTimeout = setTimeout(() => {
      if (globalAuthState.initializationInProgress) {
        console.warn("Session initialization timed out after 10 seconds");
        globalAuthState.initializationInProgress = false;
        globalAuthState.sessionInitialized = true;
        globalAuthState.loading = false;
        setSessionInitialized(true);
        setLoading(false);

        // Clear stale auth data when initialization times out
        clearStaleAuthData();

        // Dispatch auth error event
        window.dispatchEvent(
          new CustomEvent(AUTH_EVENTS.AUTH_ERROR, {
            detail: {
              message:
                "Session initialization timed out. Please try signing in again.",
              code: "INITIALIZATION_TIMEOUT",
            },
          }),
        );

        // Show toast notification
        toast({
          title: "Authentication Error",
          description:
            "Session initialization timed out. Please try signing in again.",
          variant: "destructive",
        });

        // Redirect to sign-in page after a short delay
        setTimeout(() => {
          window.location.href = "/signin?error=timeout";
        }, 1500);
      }
    }, 10000); // 10 seconds timeout

    const initializeSession = async () => {
      try {
        // Only log on the first initialization attempt
        if (
          process.env.NODE_ENV !== "production" &&
          globalAuthState.initializationCount === 1
        ) {
          console.log("Initializing session...");
        }

        await sessionManager.initialize();

        // Update both local and global state
        globalAuthState.sessionInitialized = true;
        setSessionInitialized(true);
      } catch (err) {
        console.error("Error initializing session:", err);
        // Still mark as initialized to prevent blocking
        globalAuthState.sessionInitialized = true;
        setSessionInitialized(true);
      } finally {
        globalAuthState.initializationInProgress = false;
        clearTimeout(initializationTimeout);
      }
    };

    initializeSession();

    // Cleanup function
    return () => {
      clearTimeout(initializationTimeout);
    };
  }, [clearStaleAuthData, toast]);

  // Track if this instance has set up a listener
  const hasSetupListener = useRef(false);

  // Get session and set up auth state listener
  useEffect(() => {
    if (!sessionInitialized) return;

    // Define a function to handle session timeout
    const handleSessionTimeout = () => {
      console.warn("Session retrieval timed out after 5 seconds");
      globalAuthState.loading = false;
      setLoading(false);

      // Clear stale auth data when session retrieval times out
      clearStaleAuthData();

      // Dispatch auth error event
      window.dispatchEvent(
        new CustomEvent(AUTH_EVENTS.AUTH_ERROR, {
          detail: {
            message:
              "Session retrieval timed out. Please try signing in again.",
            code: "SESSION_TIMEOUT",
          },
        }),
      );

      // Show toast notification
      toast({
        title: "Authentication Error",
        description:
          "Session retrieval timed out. Please try signing in again.",
        variant: "destructive",
      });

      // Redirect to sign-in page after a short delay
      setTimeout(() => {
        window.location.href = "/signin?error=session_timeout";
      }, 1500);
    };

    let listener: { subscription: { unsubscribe: () => void } } | null = null;

    const getSession = async () => {
      // Skip if we already have a user in global state
      if (globalAuthState.user && !globalAuthState.loading) {
        setUser(globalAuthState.user);
        setLoading(false);
        return;
      }

      // Set a timeout to prevent getting stuck in loading state
      const sessionTimeout = setTimeout(() => {
        if (globalAuthState.loading) {
          handleSessionTimeout();
        }
      }, 5000); // 5 seconds timeout

      try {
        // First, get the current session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          // Clear loading state on error
          globalAuthState.loading = false;
          setLoading(false);

          // Clear stale auth data on session error
          clearStaleAuthData();

          // Dispatch auth error event
          window.dispatchEvent(
            new CustomEvent(AUTH_EVENTS.AUTH_ERROR, {
              detail: {
                message: `Session error: ${error.message}`,
                code: "SESSION_ERROR",
                error,
              },
            }),
          );

          // Show toast notification
          toast({
            title: "Authentication Error",
            description: `Session error: ${error.message}. Please try signing in again.`,
            variant: "destructive",
          });

          // Redirect to sign-in page after a short delay
          setTimeout(() => {
            window.location.href = `/signin?error=${encodeURIComponent(error.message)}`;
          }, 1500);
        } else {
          // Enhanced logging to debug session issues
          console.log("Initial session data:", {
            hasSession: !!data.session,
            hasUser: !!data.session?.user,
            userId: data.session?.user?.id,
            userEmail: data.session?.user?.email,
            sessionExpiresAt: data.session?.expires_at,
            currentTime: Math.floor(Date.now() / 1000), // Current time in seconds
          });

          // If we have a session but no user, try to refresh the session
          if (data.session && !data.session.user) {
            console.log(
              "Session exists but user is missing, attempting to refresh session...",
            );

            try {
              // Attempt to refresh the session
              const refreshResult = await supabase.auth.refreshSession();

              if (refreshResult.error) {
                console.error("Session refresh error:", refreshResult.error);

                // Clear stale auth data
                clearStaleAuthData();

                // Show toast notification
                toast({
                  title: "Session Error",
                  description:
                    "Could not refresh your session. Please sign in again.",
                  variant: "destructive",
                });

                // Redirect to sign-in page after a short delay
                setTimeout(() => {
                  window.location.href = "/signin?error=refresh_failed";
                }, 1500);

                // Update state
                globalAuthState.user = null;
                globalAuthState.loading = false;
                setUser(null);
                setLoading(false);
                return;
              }

              // Log the refreshed session data
              console.log("Refreshed session data:", {
                hasSession: !!refreshResult.data.session,
                hasUser: !!refreshResult.data.session?.user,
                userId: refreshResult.data.session?.user?.id,
                userEmail: refreshResult.data.session?.user?.email,
                sessionExpiresAt: refreshResult.data.session?.expires_at,
                currentTime: Math.floor(Date.now() / 1000),
              });

              // Update with the refreshed session data
              const userData = refreshResult.data.session?.user ?? null;
              globalAuthState.user = userData;
              globalAuthState.loading = false;
              setUser(userData);
              setLoading(false);
            } catch (refreshError) {
              console.error(
                "Unexpected error refreshing session:",
                refreshError,
              );

              // Clear stale auth data
              clearStaleAuthData();

              // Update state
              globalAuthState.user = null;
              globalAuthState.loading = false;
              setUser(null);
              setLoading(false);

              // Redirect to sign-in page
              setTimeout(() => {
                window.location.href = "/signin?error=refresh_exception";
              }, 1500);
            }
          } else {
            // Normal case - we have a session with a user
            const userData = data.session?.user ?? null;
            globalAuthState.user = userData;
            globalAuthState.loading = false;
            setUser(userData);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Unexpected error getting session:", err);

        // Try to get the session directly from localStorage as a fallback
        console.log("Attempting to get session directly from localStorage...");
        const directSession = getDirectSessionFromStorage();

        if (directSession) {
          // Extract user from the direct session
          const directUser = extractUserFromSession(directSession);

          if (directUser) {
            console.log(
              "Successfully retrieved user from direct session:",
              directUser,
            );

            // Update state with the user from direct session
            globalAuthState.user = directUser;
            globalAuthState.loading = false;
            setUser(directUser);
            setLoading(false);

            // Clear the timeout
            clearTimeout(sessionTimeout);
            return;
          }
        }

        // If we couldn't get a session directly, proceed with error handling
        globalAuthState.loading = false;
        setLoading(false);

        // Clear stale auth data on unexpected error
        clearStaleAuthData();

        // Dispatch auth error event
        window.dispatchEvent(
          new CustomEvent(AUTH_EVENTS.AUTH_ERROR, {
            detail: {
              message:
                "Unexpected error getting session. Please try signing in again.",
              code: "UNEXPECTED_ERROR",
              error: err,
            },
          }),
        );

        // Show toast notification
        toast({
          title: "Authentication Error",
          description:
            "Unexpected error getting session. Please try signing in again.",
          variant: "destructive",
        });

        // Redirect to sign-in page after a short delay
        setTimeout(() => {
          window.location.href = "/signin?error=unexpected";
        }, 1500);
      } finally {
        clearTimeout(sessionTimeout);
      }
    };

    getSession();

    // Only set up one listener across all hook instances
    if (!hasSetupListener.current) {
      hasSetupListener.current = true;

      // Create a static variable to track if any instance has set up a listener
      interface ExtendedWindow extends Window {
        __authListenerSetup?: boolean;
      }

      if (!(window as ExtendedWindow).__authListenerSetup) {
        (window as ExtendedWindow).__authListenerSetup = true;

        // Helper functions to reduce cognitive complexity
        const handleSignOut = () => {
          // Handle sign out - update global state
          globalAuthState.user = null;
          setUser(null);

          // Dispatch custom event for sign out
          window.dispatchEvent(
            new CustomEvent(AUTH_EVENTS.SIGNED_OUT, {
              detail: { message: "You have been signed out." },
            }),
          );
        };

        const handleSignInOrUpdate = (session: Session | null) => {
          // Handle sign in or user update - update global state
          const userData = session?.user ?? null;

          // Clear any cached data for the previous user if we're signing in as a different user
          if (
            globalAuthState.user?.id &&
            userData?.id &&
            globalAuthState.user.id !== userData.id
          ) {
            clearPreviousUserCache(globalAuthState.user.id);
          }

          // Update global state with new user data
          globalAuthState.user = userData;
          setUser(userData);

          // Clear cache for the new user to ensure fresh data
          if (userData?.id) {
            clearNewUserCache(userData.id);
          }
        };

        const clearPreviousUserCache = async (userId: string) => {
          try {
            // Import cache here to avoid circular dependencies - using dynamic import
            const cacheModule = await import("@/lib/cache");
            const cache = cacheModule.cache;
            if (cache && typeof cache.clearUserCache === "function") {
              console.log("Clearing cache for previous user:", userId);
              cache.clearUserCache(userId);
            }
          } catch (error) {
            console.error("Error clearing previous user cache:", error);
          }
        };

        const clearNewUserCache = async (userId: string) => {
          try {
            // Import cache here to avoid circular dependencies - using dynamic import
            const cacheModule = await import("@/lib/cache");
            const cache = cacheModule.cache;

            if (cache) {
              console.log("Ensuring fresh data for user:", userId);
              // We don't need to clear all user data, just the baseline and test results
              cache.delete(`user_baseline_${userId}_all`);
              cache.delete(`test_results_${userId}_all`);
            }
          } catch (error) {
            console.error("Error clearing new user cache:", error);
          }
        };

        // Main auth state change listener
        listener = supabase.auth.onAuthStateChange((event, session) => {
          // Only log once
          if (process.env.NODE_ENV !== "production") {
            console.log("Auth state changed:", event);
          }

          // Handle different auth events
          switch (event) {
            case "SIGNED_OUT":
              handleSignOut();
              break;
            case "SIGNED_IN":
            case "USER_UPDATED":
              handleSignInOrUpdate(session);
              break;
            case "TOKEN_REFRESHED":
              // Token refresh is handled automatically
              break;
          }
        });
      }
    }

    return () => {
      // Only unsubscribe if we created a listener in this instance
      if (listener) {
        listener.subscription.unsubscribe();
      }
    };
  }, [sessionInitialized, clearStaleAuthData, toast]);

  // Track if this instance has set up a session expiration handler
  const hasSetupExpirationHandler = useRef(false);

  // Set up session expiration handler
  useEffect(() => {
    if (!sessionInitialized) return;

    // Only set up one handler across all hook instances
    if (!hasSetupExpirationHandler.current) {
      hasSetupExpirationHandler.current = true;

      // Create a static variable to track if any instance has set up a handler
      interface ExtendedWindow extends Window {
        __sessionExpirationHandlerSetup?: boolean;
      }

      if (!(window as ExtendedWindow).__sessionExpirationHandlerSetup) {
        (window as ExtendedWindow).__sessionExpirationHandlerSetup = true;

        sessionManager.onSessionExpired(() => {
          // Update global state
          globalAuthState.user = null;
          setUser(null);

          toast({
            title: "Session Expired",
            description: "Your session has expired due to inactivity.",
            variant: "destructive",
          });

          // Dispatch custom event for session expiration
          window.dispatchEvent(
            new CustomEvent(AUTH_EVENTS.SESSION_EXPIRED, {
              detail: {
                message: "Your session has expired. Please sign in again.",
              },
            }),
          );
        });
      }
    }
  }, [sessionInitialized, toast]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Store the current path before signing out
      const currentPath = window.location.pathname;

      // Call the session manager to sign out
      await sessionManager.signOut();

      // Update global state
      globalAuthState.user = null;
      setUser(null);

      // Clear any auth-related data from localStorage and sessionStorage
      try {
        // Use the clearStaleAuthData function to clear all auth-related data
        clearStaleAuthData();

        // Import cache here to avoid circular dependencies - using dynamic import
        import("@/lib/cache")
          .then((cacheModule) => {
            const cache = cacheModule.cache;
            if (cache) {
              // Clear all cache data
              cache.clear();
            }
          })
          .catch((importError) => {
            console.error(
              "Error importing cache module during sign out:",
              importError,
            );
          });
      } catch (storageError) {
        console.error("Error clearing storage during sign out:", storageError);
      }

      // Dispatch custom event for sign out
      window.dispatchEvent(
        new CustomEvent(AUTH_EVENTS.SIGNED_OUT, {
          detail: { message: "You have been signed out." },
        }),
      );

      // Show success toast
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });

      // Navigate to sign-in page if not already there
      if (currentPath !== "/signin" && currentPath !== "/login") {
        window.location.href = "/signin";
      }
    } catch (error) {
      console.error("Error signing out:", error);

      // Even if there's an error, try to clear auth data
      clearStaleAuthData();

      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });

      // Force redirect to sign-in page after a short delay
      setTimeout(() => {
        window.location.href = "/signin?error=signout_failed";
      }, 1500);
    }
  }, [toast, clearStaleAuthData]);

  // Sign in with Google function
  const signInWithGoogle = useCallback(
    async (rememberMe: boolean = false) => {
      try {
        await sessionManager.signInWithGoogle(rememberMe);
      } catch (error) {
        console.error("Error signing in with Google:", error);
        toast({
          title: "Error",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  return {
    user,
    loading,
    signOut,
    signInWithGoogle,
  };
}
