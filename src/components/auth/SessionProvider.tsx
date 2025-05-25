import { ReactNode, useEffect, useState, useCallback } from 'react';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { SessionExpiredModal } from './SessionExpiredModal';
import { useToast } from '@/hooks/use-toast';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { prefetchService } from '@/services/prefetchService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { getDirectSessionFromStorage, extractUserFromSession, SupabaseSession } from '@/utils/sessionUtils';

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * SessionProvider component
 *
 * Provides session management functionality to the application:
 * - Automatic session timeout detection
 * - Session timeout warning
 * - Session expiration handling
 * - Cross-tab session synchronization
 */
export function SessionProvider({ children }: Readonly<SessionProviderProps>) {
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  // Initialize auth navigation
  useAuthNavigation();

  /**
   * Attempts to get the current session as a last resort
   * @returns True if a valid session was found
   */
  const tryGetCurrentSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Attempting to get a new session...");
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session) {
        console.log("Successfully retrieved current session");
        return true;
      }

      console.log("No current session found");
      return false;
    } catch (getSessionError) {
      console.error("Error getting current session:", getSessionError);
      return false;
    }
  }, []);

  /**
   * Attempts to set a session using tokens from a direct session
   * @param directSession The session retrieved directly from storage
   * @returns True if session was successfully set
   */
  const trySetSessionFromDirectTokens = useCallback(async (directSession: SupabaseSession): Promise<boolean> => {
    if (!directSession.access_token) {
      console.log("No access token in direct session");
      return false;
    }

    console.log("Setting session with tokens from direct session...");

    try {
      // If we don't have a refresh token, try to use just the access token
      // This is not ideal but might work for Google sign-in where the token might still be valid
      const sessionData = {
        access_token: directSession.access_token,
        // Add refresh_token only if it exists
        ...(directSession.refresh_token && { refresh_token: directSession.refresh_token })
      };

      // Use proper typing for the session data
      const { data, error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token || ''
      });

      if (error) {
        console.error("Error setting session from direct tokens:", error);

        // If the error is related to an expired token, try to sign in again
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          return await tryGetCurrentSession();
        }
        return false;
      }

      if (data.session) {
        console.log("Successfully set session from direct tokens");
        return true;
      }

      return false;
    } catch (setSessionError) {
      console.error("Error setting session from direct tokens:", setSessionError);
      return false;
    }
  }, [tryGetCurrentSession]);

  // Initialize session manager and perform session recovery only when appropriate
  useEffect(() => {
    const initializeWithFallback = async () => {
      try {
        // Only perform session recovery if:
        // 1. No user is currently authenticated
        // 2. We're not in the middle of an OAuth callback flow
        // 3. We're not on the sign-in page (which indicates intentional sign-in)
        const currentPath = window.location.pathname;
        const isOAuthCallback = currentPath.includes('/auth/callback');
        const isSignInPage = currentPath === '/signin' || currentPath === '/login';
        const isJustSignedIn = sessionStorage.getItem('holistiq_just_signed_in') === 'true';

        if (!user && !isOAuthCallback && !isSignInPage && !isJustSignedIn) {
          console.log("No user found and not in authentication flow - checking for recoverable session...");

          // Try to get session directly from localStorage
          const directSession = getDirectSessionFromStorage();

          if (directSession) {
            // Extract user from direct session
            const directUser = extractUserFromSession(directSession);

            if (directUser) {
              console.log("Found recoverable session for user:", directUser.email);
              const recovered = await trySetSessionFromDirectTokens(directSession);

              if (recovered) {
                console.log("Session recovery completed successfully");
              }
            }
          } else {
            // As a last resort, try to get the current session directly
            await tryGetCurrentSession();
          }
        } else if (isJustSignedIn) {
          // Clear the just signed in flag after processing
          sessionStorage.removeItem('holistiq_just_signed_in');
          console.log("Skipping session recovery - user just completed sign-in");
        }
      } catch (error) {
        console.error("Error in session initialization:", error);
      } finally {
        // Mark as initialized regardless of the outcome
        setInitialized(true);
      }
    };

    initializeWithFallback();
  }, [user, toast, trySetSessionFromDirectTokens, tryGetCurrentSession]);

  // Prefetch data when user is authenticated
  useEffect(() => {
    if (user && initialized) {
      // Configure prefetch service with appropriate log level for the environment
      prefetchService.configure({
        logLevel: process.env.NODE_ENV !== 'production' ? 'error' : 'none'
      });

      // Start prefetching data in the background
      prefetchService.prefetch(user.id)
        .catch(() => {
          // Errors are already logged by the prefetch service based on log level
          // Don't show error to user as prefetching is a background optimization
        });
    }
  }, [user, initialized]);

  // Handle session extension
  const handleExtendSession = () => {
    toast({
      title: "Session Extended",
      description: "Your session has been extended.",
      duration: 3000,
    });
  };

  // Handle logout
  const handleLogout = () => {
    // The navigation will be handled by the useAuthNavigation hook
    // through the custom event dispatched by sessionManager.signOut()
  };

  if (!initialized) {
    return null; // Don't render anything until session manager is initialized
  }

  return (
    <>
      {children}
      <SessionTimeoutWarning
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
      <SessionExpiredModal />
    </>
  );
}
