/**
 * Debug Toggle Component
 *
 * A simple component that allows toggling debug logging on and off.
 * Only visible in development mode when debug logging is enabled.
 */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, X } from "lucide-react";
import {
  isDebugLoggingEnabled,
  toggleDebugLogging,
  isDebugModeAvailable,
} from "@/utils/debugUtils";

export function DebugToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  useEffect(() => {
    setIsEnabled(isDebugLoggingEnabled());
  }, []);

  // Don't render if debug mode is not available (production or debug disabled)
  if (!isDebugModeAvailable()) {
    return null;
  }

  const handleToggle = () => {
    const newState = toggleDebugLogging();
    setIsEnabled(newState);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Floating button to toggle visibility
  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full bg-background shadow-md"
        onClick={toggleVisibility}
        title="Toggle Debug Mode"
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  // Full debug panel
  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Debug Controls</CardTitle>
        <Button variant="ghost" size="icon" onClick={toggleVisibility}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="debug-mode" className="cursor-pointer">
            Enable Debug Logging
          </Label>
          <Switch
            id="debug-mode"
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isEnabled
            ? "Debug logging is enabled. Check the console for detailed logs."
            : "Debug logging is disabled. Toggle to see detailed logs in the console."}
        </p>
      </CardContent>
    </Card>
  );
}

export default DebugToggle;
