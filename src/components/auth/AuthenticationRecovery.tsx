import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthenticationRecoveryProps {
  loadingTime?: number; // Time in milliseconds before showing recovery options
}

/**
 * Component that provides recovery options when authentication is taking too long
 * or appears to be stuck.
 */
export function AuthenticationRecovery({
  loadingTime = 10000,
}: Readonly<AuthenticationRecoveryProps>) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Show recovery options after the specified loading time
    const timeout = setTimeout(() => {
      setShowRecovery(true);
    }, loadingTime);

    return () => clearTimeout(timeout);
  }, [loadingTime]);

  // Function to clear all authentication data
  const clearAuthData = () => {
    console.log("Clearing authentication data...");

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
        console.log(`Removing: ${key}`);
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
        console.log(`Removing from sessionStorage: ${key}`);
        sessionStorage.removeItem(key);
      });

      return true;
    } catch (error) {
      console.error("Error clearing authentication data:", error);
      return false;
    }
  };

  // Function to force sign out
  const forceSignOut = async () => {
    setIsRecovering(true);

    try {
      // Try to sign out through Supabase
      await supabase.auth.signOut();

      // Clear all authentication data
      const cleared = clearAuthData();

      if (cleared) {
        toast({
          title: "Signed Out",
          description:
            "Authentication data has been cleared. Please sign in again.",
        });
      } else {
        toast({
          title: "Warning",
          description:
            "Could not fully clear authentication data. You may need to clear browser data manually.",
          variant: "destructive",
        });
      }

      // Navigate to sign-in page
      navigate("/signin", {
        state: { message: "Authentication was reset. Please sign in again." },
      });
    } catch (error) {
      console.error("Error during force sign out:", error);

      // Even if there's an error, try to clear auth data and redirect
      clearAuthData();

      toast({
        title: "Error",
        description:
          "There was an error signing out. Authentication data has been cleared.",
        variant: "destructive",
      });

      // Navigate to sign-in page
      navigate("/signin", {
        state: {
          message:
            "Authentication was reset due to an error. Please sign in again.",
        },
      });
    } finally {
      setIsRecovering(false);
    }
  };

  // Function to reload the page
  const reloadPage = () => {
    window.location.reload();
  };

  if (!showRecovery) {
    return null;
  }

  return (
    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-800 mb-2">
            Authentication Taking Too Long
          </h3>
          <p className="text-sm text-amber-700 mb-4">
            The authentication process seems to be taking longer than expected.
            This might be due to:
          </p>
          <ul className="text-sm text-amber-700 list-disc pl-5 mb-4 space-y-1">
            <li>Stale authentication data</li>
            <li>Network connectivity issues</li>
            <li>Session token expiration</li>
            <li>Database connection problems</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={reloadPage}
              disabled={isRecovering}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={forceSignOut}
              disabled={isRecovering}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isRecovering ? "Resetting..." : "Reset Authentication"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
