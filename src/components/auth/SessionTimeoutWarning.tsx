import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, RefreshCw } from "lucide-react";
import {
  sessionManager,
  SESSION_CONFIG,
  SessionAction,
} from "@/services/sessionManager";

interface SessionTimeoutWarningProps {
  onExtend?: () => void;
  onLogout?: () => void;
}

export function SessionTimeoutWarning({
  onExtend,
  onLogout,
}: Readonly<SessionTimeoutWarningProps>) {
  const [countdown, setCountdown] = useState(
    Math.floor(SESSION_CONFIG.WARNING_BEFORE_TIMEOUT / 1000),
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set up session expiring callback
    sessionManager.onSessionExpiring(() => {
      setIsVisible(true);
      setCountdown(Math.floor(SESSION_CONFIG.WARNING_BEFORE_TIMEOUT / 1000));
    });

    // Set up session expired callback to auto-dismiss the warning
    sessionManager.onSessionExpired(() => {
      setIsVisible(false);
    });

    // Listen for session expired events from storage events (cross-tab communication)
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "holistiq_session_action" &&
        event.newValue === SessionAction.SESSION_EXPIRED
      ) {
        setIsVisible(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Separate effect for countdown timer to avoid dependency issues
  useEffect(() => {
    let countdownInterval: number | null = null;

    if (isVisible) {
      countdownInterval = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownInterval) {
              clearInterval(countdownInterval);
            }
            // Auto-dismiss the dialog when countdown reaches 0
            setIsVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isVisible]);

  // Format countdown as minutes and seconds
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle extend session
  const handleExtendSession = () => {
    sessionManager.extendSession();
    setIsVisible(false);
    if (onExtend) {
      onExtend();
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionManager.signOut();
    setIsVisible(false);
    if (onLogout) {
      onLogout();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in fade-in-50 zoom-in-95">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle>Session Timeout Warning</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Your session will expire in{" "}
            <span className="font-bold text-amber-500">
              {formatCountdown()}
            </span>{" "}
            due to inactivity.
          </p>
          <p>
            Click "Extend Session" to continue working, or "Logout" to end your
            session now.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleLogout} className="flex-1">
            Logout
          </Button>
          <Button onClick={handleExtendSession} className="flex-1 gap-2">
            <RefreshCw className="h-4 w-4" />
            Extend Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
