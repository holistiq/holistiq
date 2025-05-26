/**
 * Utility functions for formatting and calculations
 */
import { debugLog, debugWarn, debugError } from "@/utils/debugUtils";

/**
 * Format a date string consistently
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    debugError("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Calculate percentage change between two values with safety checks and debugging
 */
export function calculateChange(current: number, baseline: number): number {
  debugLog("calculateChange called with:", { current, baseline });

  // Safety checks
  if (typeof current !== "number" || isNaN(current)) {
    debugWarn("Invalid current value for calculating change:", current);
    return 0;
  }

  if (typeof baseline !== "number" || isNaN(baseline)) {
    debugWarn("Invalid baseline value for calculating change:", baseline);
    return 0;
  }

  if (baseline === 0) {
    // Handle zero baseline case
    if (current === 0) {
      // If both are zero, there's no change
      return 0;
    } else {
      // If baseline is zero but current is not, we can't calculate a percentage
      // but we can indicate that there is a change
      debugLog("Baseline value is zero, using absolute value for change");
      return current > 0 ? 100 : -100; // Indicate a significant change
    }
  }

  // Calculate percentage change
  const change = ((current - baseline) / baseline) * 100;
  debugLog("Calculated change:", change);
  return change;
}

/**
 * Get badge color class based on score change
 */
export function getBadgeColorClass(change: number): string {
  if (change > 0) return "bg-green-500/10 text-green-600 border-green-200";
  if (change < 0) return "bg-red-500/10 text-red-600 border-red-200";
  return "bg-gray-500/10";
}

/**
 * Get text color class based on change
 */
export function getChangeColorClass(change: number): string {
  if (change > 0) return "text-green-600";
  if (change < 0) return "text-red-600";
  return "";
}

/**
 * Get change indicator arrow
 */
export function getChangeIndicator(
  change: number,
  isReactionTime: boolean = false,
): string {
  // For reaction time, lower is better, so arrows are inverted
  if (isReactionTime) {
    if (change > 0) return "↓"; // Improved (lower reaction time)
    if (change < 0) return "↑"; // Worse (higher reaction time)
  } else {
    if (change > 0) return "↑"; // Improved
    if (change < 0) return "↓"; // Worse
  }
  return "";
}
