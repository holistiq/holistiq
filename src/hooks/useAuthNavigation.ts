import { sessionManager } from "@/services/sessionManager";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_EVENTS } from "./useSupabaseAuth";

/**
 * Hook to handle authentication-related navigation
 * This hook should only be used in components that are children of a Router
 */
export function useAuthNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle sign out event
    const handleSignOut = (event: CustomEvent) => {
      const isManual = event.detail?.isManual ?? false;

      // Check logout intent from sessionManager
      const logoutIntent = sessionManager.getLogoutIntent();
      const wasManualLogout = logoutIntent?.isManual ?? isManual;

      // Check if this is a page refresh after manual logout
      const isManualLogoutRefresh =
        sessionStorage.getItem("holistiq_manual_logout") === "true";

      // Only show message for automatic signouts or genuine unexpected signouts
      if (!wasManualLogout && !isManualLogoutRefresh) {
        const message = event.detail?.message ?? "You have been signed out.";
        navigate("/signin", {
          state: { message },
        });
      } else {
        // For manual logouts, navigate without showing the warning message
        navigate("/signin");
        // Clear the logout intent since we've handled it
        sessionManager.clearLogoutIntent();
      }
    };

    // Handle session expired event
    const handleSessionExpired = (event: CustomEvent) => {
      const message =
        event.detail?.message ??
        "Your session has expired. Please sign in again.";
      navigate("/signin", {
        state: { message },
      });
    };

    // Add event listeners
    window.addEventListener(
      AUTH_EVENTS.SIGNED_OUT,
      handleSignOut as EventListener,
    );
    window.addEventListener(
      AUTH_EVENTS.SESSION_EXPIRED,
      handleSessionExpired as EventListener,
    );

    // Clean up event listeners
    return () => {
      window.removeEventListener(
        AUTH_EVENTS.SIGNED_OUT,
        handleSignOut as EventListener,
      );
      window.removeEventListener(
        AUTH_EVENTS.SESSION_EXPIRED,
        handleSessionExpired as EventListener,
      );
    };
  }, [navigate]);
}
