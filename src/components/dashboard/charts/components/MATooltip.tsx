/**
 * Moving Average Tooltip Component
 *
 * Displays trend analysis when hovering over moving average lines
 */
import React from "react";
import { format } from "date-fns";

export interface MATooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
    payload: {
      date: number;
      formattedDate: string;
      scoreMA?: number;
      reactionTimeMA?: number;
      accuracyMA?: number;
      scoreMATrend?: number;
      reactionTimeMATrend?: number;
      accuracyMATrend?: number;
    };
  }>;
  readonly label?: number;
}

export function MATooltip({
  active,
  payload,
  label,
}: Readonly<MATooltipProps>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Get the data point
  const data = payload[0].payload;

  // Format the date
  const dateString =
    data.formattedDate || format(new Date(data.date), "MMM d, yyyy");

  // Determine which MA metric is being displayed
  const isScoreMA = payload.some((p) => p.dataKey === "scoreMA");
  const isReactionTimeMA = payload.some((p) => p.dataKey === "reactionTimeMA");
  const isAccuracyMA = payload.some((p) => p.dataKey === "accuracyMA");

  // Get trend information
  const getTrendInfo = (
    value: number | undefined,
    trend: number | undefined,
    isReactionTime = false,
  ) => {
    if (value === undefined || trend === undefined) return null;

    // For reaction time, lower is better, so we invert the trend direction
    const isPositiveTrend = isReactionTime ? trend < 0 : trend > 0;
    const trendClass = isPositiveTrend ? "text-green-500" : "text-red-500";
    const trendIcon = isPositiveTrend ? "↑" : "↓";

    return (
      <span className={`${trendClass} ml-1`}>
        {trendIcon} {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  // Get trend description
  const getTrendDescription = (
    trend: number | undefined,
    isReactionTime = false,
  ) => {
    if (trend === undefined) return null;

    if (Math.abs(trend) < 1) {
      return "Stable performance (less than 1% change)";
    }

    // For reaction time, lower is better, so we invert the trend direction
    const isPositiveTrend = isReactionTime ? trend < 0 : trend > 0;

    if (isReactionTime) {
      return isPositiveTrend
        ? "Improving reaction speed (faster responses)"
        : "Declining reaction speed (slower responses)";
    } else {
      return isPositiveTrend
        ? "Improving performance trend"
        : "Declining performance trend";
    }
  };

  return (
    <div className="bg-background border rounded-md shadow-md p-3 max-w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium">{dateString}</p>
        <p className="text-xs text-muted-foreground">Moving Average</p>
      </div>

      <div className="space-y-2">
        {isScoreMA && data.scoreMA !== undefined && (
          <div>
            <p className="text-sm flex justify-between">
              <span>Score MA:</span>
              <span className="font-medium">
                {data.scoreMA.toFixed(1)}
                {getTrendInfo(data.scoreMA, data.scoreMATrend)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getTrendDescription(data.scoreMATrend)}
            </p>
          </div>
        )}

        {isReactionTimeMA && data.reactionTimeMA !== undefined && (
          <div>
            <p className="text-sm flex justify-between">
              <span>Reaction Time MA:</span>
              <span className="font-medium">
                {data.reactionTimeMA.toFixed(0)} ms
                {getTrendInfo(
                  data.reactionTimeMA,
                  data.reactionTimeMATrend,
                  true,
                )}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getTrendDescription(data.reactionTimeMATrend, true)}
            </p>
          </div>
        )}

        {isAccuracyMA && data.accuracyMA !== undefined && (
          <div>
            <p className="text-sm flex justify-between">
              <span>Accuracy MA:</span>
              <span className="font-medium">
                {data.accuracyMA.toFixed(1)}%
                {getTrendInfo(data.accuracyMA, data.accuracyMATrend)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getTrendDescription(data.accuracyMATrend)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
        <p>
          This line shows the 3-point moving average, smoothing out daily
          fluctuations to reveal your true performance trend.
        </p>
      </div>
    </div>
  );
}
