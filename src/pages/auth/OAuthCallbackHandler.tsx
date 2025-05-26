import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sessionManager } from "@/services/sessionManager";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, AlertCircle } from "lucide-react";

// Utility to parse hash fragment into an object
type AuthTokens = Record<string, string>;
function parseHashFragment(hash: string): AuthTokens {
  return hash
    .replace(/^#/, "")
    .split("&")
    .map((kv) => kv.split("="))
    .reduce((acc, [k, v]) => {
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as AuthTokens);
}

/**
 * Handles OAuth callback redirects from authentication providers like Google.
 * This component processes authentication tokens and redirects to the appropriate page.
 */
export default function OAuthCallbackHandler() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>(
    "Checking authentication...",
  );
  const processingRef = useRef<boolean>(false);

  // Helper function to clear any stale auth data (but preserve PKCE code verifier)
  const clearStaleAuthData = () => {
    try {
      console.log("Clearing stale authentication data...");

      // Clear Supabase-related items from localStorage, but preserve PKCE code verifier
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          // Don't remove PKCE code verifier as it's needed for OAuth flow
          if (!key.includes("code-verifier")) {
            keysToRemove.push(key);
          }
        }
      }

      // Remove the identified keys
      keysToRemove.forEach((key) => {
        console.log(`Clearing stale auth data from localStorage: ${key}`);
        localStorage.removeItem(key);
      });

      // Also check sessionStorage, but preserve PKCE code verifier
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          // Don't remove PKCE code verifier as it's needed for OAuth flow
          if (!key.includes("code-verifier")) {
            sessionKeysToRemove.push(key);
          }
        }
      }

      // Remove the identified session keys
      sessionKeysToRemove.forEach((key) => {
        console.log(`Clearing stale auth data from sessionStorage: ${key}`);
        sessionStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error("Error clearing stale auth data:", error);
      return false;
    }
  };

  useEffect(() => {
    // Safety timeout to prevent getting stuck indefinitely
    const safetyTimeout = window.setTimeout(() => {
      if (processingRef.current) {
        console.warn("Authentication process timed out after 15 seconds");
        // Clear any stale auth data before redirecting
        clearStaleAuthData();
        setError("Authentication process timed out. Please try again.");
        navigate("/signin", {
          state: {
            error: "Authentication process timed out. Please try again.",
          },
        });
      }
    }, 15000); // 15 seconds timeout

    // Process hash fragment tokens (implicit flow)
    const processHashTokens = async (hash: string) => {
      if (!hash?.includes("access_token")) {
        return false;
      }

      setProcessingStep("Processing authentication tokens from hash...");
      console.log("Found access token in hash, processing...");

      const tokens = parseHashFragment(hash);

      if (!tokens.access_token) {
        return false;
      }

      // Set the session in Supabase
      setProcessingStep("Setting up your session with hash tokens...");
      console.log("Setting session with tokens from hash...");

      try {
        // Prepare session data - handle case where refresh token might be missing
        const sessionData = tokens.refresh_token
          ? {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
            }
          : { access_token: tokens.access_token };

        const sessionResult = await supabase.auth.setSession(sessionData);

        if (sessionResult.error) {
          console.error(
            "Error setting session from hash:",
            sessionResult.error,
          );

          // Try to get the session directly as a fallback
          const { data: currentSession } = await supabase.auth.getSession();

          if (currentSession?.session) {
            console.log(
              "Found existing session despite error, proceeding with it",
            );
            return await completeAuthentication();
          }

          setError(sessionResult.error.message);
          toast({
            title: "Authentication Error",
            description: sessionResult.error.message,
            variant: "destructive",
          });
          navigate("/signin", {
            state: { error: sessionResult.error.message },
          });
          return false;
        }

        console.log("Session set successfully from hash");
        return await completeAuthentication();
      } catch (sessionError) {
        console.error(
          "Unexpected error setting session from hash:",
          sessionError,
        );
        setError("An unexpected error occurred during authentication");
        navigate("/signin", {
          state: {
            error:
              "An unexpected error occurred during authentication. Please try again.",
          },
        });
        return false;
      }
    };

    // Process code parameter (PKCE flow)
    const processCodeParameter = async (search: string) => {
      if (!search?.includes("code=")) {
        return false;
      }

      setProcessingStep("Processing authentication code...");
      console.log("Found code in URL, processing...");

      try {
        // Extract the code from the URL
        const urlParams = new URLSearchParams(search);
        const code = urlParams.get("code");

        if (!code) {
          console.error("No code found in URL parameters");
          return false;
        }

        console.log("Exchanging code for session...");

        // Use exchangeCodeForSession to handle the PKCE flow properly
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Error exchanging code for session:", error);
          setError(`Authentication failed: ${error.message}`);
          navigate("/signin", {
            state: { error: `Authentication failed: ${error.message}` },
          });
          return false;
        }

        if (data?.session) {
          console.log("Session established after code exchange");
          return await completeAuthentication();
        }

        console.error("No session returned after code exchange");
        setError("Failed to complete authentication");
        navigate("/signin", {
          state: {
            error: "Failed to complete authentication. Please try again.",
          },
        });
        return false;
      } catch (exchangeError) {
        console.error("Unexpected error during code exchange:", exchangeError);
        setError("An unexpected error occurred during authentication");
        navigate("/signin", {
          state: {
            error:
              "An unexpected error occurred during authentication. Please try again.",
          },
        });
        return false;
      }
    };

    // Check for existing session
    const checkExistingSession = async () => {
      console.log("Checking for existing session...");
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth session error:", error);
        setError(error.message);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        navigate("/signin", { state: { error: error.message } });
        return false;
      }

      if (data.session) {
        // Successfully authenticated with a valid session
        console.log("Valid session found");
        return await completeAuthentication();
      }

      return false;
    };

    // Handle authentication failure
    const handleAuthFailure = () => {
      console.warn("No authentication method available");
      setError("No authentication data found");
      navigate("/signin", {
        state: { error: "Authentication failed. Please try again." },
      });
    };

    // Main OAuth redirect handler
    const handleOAuthRedirect = async () => {
      // Set processing flag to true
      processingRef.current = true;

      try {
        setProcessingStep("Checking authentication session...");
        console.log("OAuth callback handler started");

        // Clear any stale auth data before proceeding
        clearStaleAuthData();

        // Check for hash fragment or query parameters (depending on the OAuth flow)
        const { hash, search } = window.location;
        console.log("URL hash:", hash);
        console.log("URL search params:", search);

        // Try each authentication method in sequence
        const hashSuccess = await processHashTokens(hash);
        if (hashSuccess) return;

        const sessionSuccess = await checkExistingSession();
        if (sessionSuccess) return;

        const codeSuccess = await processCodeParameter(search);
        if (codeSuccess) return;

        // If all methods fail, handle the failure
        handleAuthFailure();
      } catch (unexpectedError) {
        console.error("Unexpected error in OAuth callback:", unexpectedError);
        setError("An unexpected error occurred");
        toast({
          title: "Authentication Error",
          description:
            "An unexpected error occurred during authentication. Please try again.",
          variant: "destructive",
        });
        navigate("/signin", {
          state: {
            error:
              "An unexpected error occurred during authentication. Please try again.",
          },
        });
      } finally {
        // Set processing flag to false
        processingRef.current = false;
      }
    };

    // Helper function to complete the authentication process
    const completeAuthentication = async () => {
      try {
        setProcessingStep("Initializing session...");
        console.log("Initializing session manager...");

        // Mark that user just signed in to prevent inappropriate session recovery
        sessionStorage.setItem("holistiq_just_signed_in", "true");

        // Initialize the session manager to ensure proper session handling
        await sessionManager.initialize();

        // Broadcast login event for cross-tab synchronization
        sessionManager.broadcastLogin();

        console.log("Session initialized, redirecting to dashboard...");
        setProcessingStep("Redirecting to dashboard...");

        // Use window.location.replace instead of navigate for a full page reload
        // This ensures all components are properly re-initialized and prevents
        // the callback URL from being added to the browser history
        window.location.replace("/dashboard");
        return true;
      } catch (sessionError) {
        console.error("Session initialization error:", sessionError);
        setError("Failed to initialize session. Please try again.");
        navigate("/signin", {
          state: { error: "Failed to initialize session. Please try again." },
        });
        return false;
      }
    };

    handleOAuthRedirect();

    // Cleanup function
    return () => {
      window.clearTimeout(safetyTimeout);
    };
  }, [navigate, toast]);

  // Function to handle manual sign-in
  const handleManualSignIn = () => {
    // Clear any stale auth data
    clearStaleAuthData();

    // Navigate to sign-in page
    navigate("/signin", {
      state: { message: "Please try signing in again." },
    });
  };

  // Function to reload the page
  const handleReload = () => {
    window.location.reload();
  };

  // State to track if we've been waiting too long
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);

  // Show recovery options after 10 seconds
  useEffect(() => {
    const recoveryTimeout = setTimeout(() => {
      setShowRecoveryOptions(true);
    }, 10000);

    return () => clearTimeout(recoveryTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="text-lg font-semibold animate-pulse">
        {error ? "Authentication error" : processingStep}
      </div>
      <p className="text-muted-foreground mt-2 text-sm mb-6">
        {error || "You'll be redirected automatically"}
      </p>

      {/* Show recovery options if there's an error or we've been waiting too long */}
      {(error || showRecoveryOptions) && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 mb-2">
                {error ? "Authentication Error" : "Taking longer than expected"}
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                {error
                  ? "There was a problem with the authentication process."
                  : "The authentication process is taking longer than expected."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={handleReload}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={handleManualSignIn}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign In Manually
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
