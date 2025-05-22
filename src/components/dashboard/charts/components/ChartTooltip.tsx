/**
 * Chart Tooltip Component
 *
 * Displays detailed information when hovering over chart data points
 */
import { format } from 'date-fns';
import { debugError } from '@/utils/debugUtils';

interface TooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
    payload: {
      date: number;
      formattedDate: string;
      score?: number;
      reactionTime?: number;
      accuracy?: number;
      originalDate?: number | string;
      scoreTrend?: number;
      reactionTimeTrend?: number;
      accuracyTrend?: number;
    };
  }>;
  readonly label?: number;
}

/**
 * Enhanced tooltip component for performance charts
 * Shows detailed information about the data point being hovered
 */
export function ChartTooltip({ active, payload, label }: Readonly<TooltipProps>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Get the data point
  const data = payload[0].payload;

  // Format the date
  const dateString = data.formattedDate || format(new Date(data.date), 'MMM d, yyyy');

  // Format the original date if available (for spread out data points)
  let originalDateString = '';
  if (data.originalDate) {
    try {
      const originalDate = new Date(data.originalDate);
      if (!isNaN(originalDate.getTime())) {
        originalDateString = format(originalDate, 'MMM d, yyyy h:mm a');
      }
    } catch (error) {
      debugError("Error formatting original date:", error);
    }
  }

  return (
    <div className="bg-background border rounded-md shadow-md p-3 max-w-[250px]">
      <p className="font-medium mb-2">{dateString}</p>

      {originalDateString && (
        <p className="text-xs text-muted-foreground mb-2">Actual time: {originalDateString}</p>
      )}

      <div className="space-y-1">
        {data.score !== undefined && (
          <p className="text-sm flex justify-between">
            <span>Score:</span>
            <span className="font-medium">
              {data.score.toFixed(1)}
              {data.scoreTrend !== undefined && data.scoreTrend !== 0 && (
                <span className={data.scoreTrend > 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                  {data.scoreTrend > 0 ? "↑" : "↓"} {Math.abs(data.scoreTrend).toFixed(1)}%
                </span>
              )}
            </span>
          </p>
        )}

        {data.reactionTime !== undefined && (
          <p className="text-sm flex justify-between">
            <span>Reaction Time:</span>
            <span className="font-medium">
              {data.reactionTime.toFixed(0)} ms
              {data.reactionTimeTrend !== undefined && data.reactionTimeTrend !== 0 && (
                <span className={data.reactionTimeTrend > 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                  {data.reactionTimeTrend > 0 ? "↑" : "↓"} {Math.abs(data.reactionTimeTrend).toFixed(1)}%
                </span>
              )}
            </span>
          </p>
        )}

        {data.accuracy !== undefined && (
          <p className="text-sm flex justify-between">
            <span>Accuracy:</span>
            <span className="font-medium">
              {data.accuracy.toFixed(1)}%
              {data.accuracyTrend !== undefined && data.accuracyTrend !== 0 && (
                <span className={data.accuracyTrend > 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                  {data.accuracyTrend > 0 ? "↑" : "↓"} {Math.abs(data.accuracyTrend).toFixed(1)}%
                </span>
              )}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
