import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LockIcon, LogIn } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { AuthenticationRecovery } from "./AuthenticationRecovery";

interface AuthenticationRequiredProps {
  readonly message?: string;
  readonly redirectPath?: string;
  readonly countdownSeconds?: number;
}

/**
 * A component that displays a prominent modal notification when authentication is required.
 * It includes a countdown timer and automatically redirects to the sign in page.
 */
export function AuthenticationRequired({
  message = "You need to be logged in to access this feature.",
  redirectPath = "/signin",
  countdownSeconds = 5,
  children,
}: React.PropsWithChildren<AuthenticationRequiredProps>) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(countdownSeconds);
  const { user, loading } = useSupabaseAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, loading]);

  // Start countdown for automatic redirect if not authenticated
  useEffect(() => {
    if (!showAuthModal) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, redirectPath, showAuthModal]);

  // If loading, show loading state with recovery options
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold mb-2">Authenticating...</p>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          Checking your authentication status. This should only take a moment.
        </p>

        {/* Show recovery options if loading takes too long */}
        <AuthenticationRecovery loadingTime={10000} />
      </div>
    );
  }

  // If user is authenticated, render children
  if (user && !showAuthModal) {
    return <>{children}</>;
  }

  // If not authenticated, show auth modal
  return (
    <>
      {/* Render children behind the modal */}
      <div className="opacity-50 pointer-events-none">{children}</div>

      {/* Authentication modal */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card border rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden">
          {/* Progress bar that decreases as countdown progresses */}
          <div className="w-full bg-muted h-1">
            <div
              className="bg-primary h-1 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / countdownSeconds) * 100}%` }}
            ></div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <LockIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Authentication Required</h2>
            </div>

            <p className="mb-6 text-muted-foreground">
              {message}
              <br />
              Redirecting to sign in page in{" "}
              <span className="font-medium text-foreground">
                {countdown}
              </span>{" "}
              seconds...
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => navigate(redirectPath)}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in now
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/")}
              >
                Return to home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
