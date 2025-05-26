/**
 * Moving Average Toggle Component
 *
 * Provides a toggle switch to show/hide moving average lines on the chart
 */
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { MAInfoPopover } from "./MAInfoPopover";
import { debugLog } from "@/utils/debugUtils";

interface MAToggleProps {
  showMovingAverage: boolean;
  onToggle: (show: boolean) => void;
  showInfoButton?: boolean;
}

export function MAToggle({
  showMovingAverage,
  onToggle,
  showInfoButton = true,
}: Readonly<MAToggleProps>) {
  const handleToggle = (checked: boolean) => {
    debugLog(
      "MAToggle - Toggle state changing from",
      showMovingAverage,
      "to",
      checked,
    );

    // Call the parent component's toggle handler
    onToggle(checked);

    // Log after the toggle
    debugLog(
      "MAToggle - Toggle state after change (component state):",
      showMovingAverage,
    );
  };

  // Log the current state on each render
  debugLog("MAToggle rendering with showMovingAverage =", showMovingAverage);

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="ma-toggle"
        checked={showMovingAverage}
        onCheckedChange={handleToggle}
      />
      <Label
        htmlFor="ma-toggle"
        className="text-sm cursor-pointer"
        onClick={() => handleToggle(!showMovingAverage)}
      >
        Moving Average {showMovingAverage ? "ON" : "OFF"}
      </Label>

      {showInfoButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex">
                <MAInfoPopover>
                  <button
                    type="button"
                    className="ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Learn about moving averages"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </MAInfoPopover>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="text-xs">
              Learn about moving averages
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
