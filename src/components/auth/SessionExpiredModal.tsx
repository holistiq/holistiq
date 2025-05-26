import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LockIcon, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sessionManager, SessionAction } from "@/services/sessionManager";

export function SessionExpiredModal() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up session expired callback
    sessionManager.onSessionExpired(() => {
      setIsVisible(true);
    });

    // Listen for session expired events from storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "holistiq_session_action" &&
        event.newValue === SessionAction.SESSION_EXPIRED
      ) {
        setIsVisible(true);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Handle login redirect
  const handleLogin = () => {
    setIsVisible(false);
    navigate("/signin", {
      state: {
        message: "Your session has expired. Please sign in again.",
      },
    });
  };

  // Handle close modal
  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in fade-in-50 zoom-in-95 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <CardHeader>
          <div className="flex items-center gap-2">
            <LockIcon className="h-5 w-5 text-red-500" />
            <CardTitle>Session Expired</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>
            Your session has expired due to inactivity. Please sign in again to
            continue.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleLogin}>Sign In</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
