/**
 * Interactive Legend Component
 *
 * Provides an enhanced legend with interactive elements and educational tooltips
 */
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChartConfig, MetricKey } from "../utils/chartUtils";

// Define trend direction type
type TrendDirection = "up" | "down" | "neutral";

interface LegendItemProps {
  name: string;
  color: string;
  isActive: boolean;
  isDashed?: boolean;
  tooltipContent: React.ReactNode;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  trendDirection?: TrendDirection;
  trendPercentage?: number;
}

const LegendItem: React.FC<LegendItemProps> = ({
  name,
  color,
  isActive,
  isDashed = false,
  tooltipContent,
  onClick,
  onMouseEnter,
  onMouseLeave,
  trendDirection,
  trendPercentage,
}) => {
  // Determine trend color and icon
  const getTrendInfo = () => {
    if (!trendDirection || trendPercentage === undefined) return null;

    let trendColor = "text-gray-500";
    let trendIcon = "•";

    if (trendDirection === "up") {
      trendColor = name.includes("Reaction Time")
        ? "text-red-500"
        : "text-green-500";
      trendIcon = "↑";
    } else if (trendDirection === "down") {
      trendColor = name.includes("Reaction Time")
        ? "text-green-500"
        : "text-red-500";
      trendIcon = "↓";
    }

    return (
      <span className={`ml-2 ${trendColor} text-xs font-medium`}>
        {trendIcon} {Math.abs(trendPercentage).toFixed(1)}%
      </span>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center px-2 py-1 rounded cursor-pointer transition-colors text-left",
              isActive ? "bg-accent/30" : "hover:bg-accent/10",
            )}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div className="flex items-center">
              <span
                className={cn(
                  "inline-block w-6 h-0.5 mr-2",
                  isDashed ? "border-t border-dashed border-2" : "h-1.5",
                )}
                style={{ backgroundColor: color, borderColor: color }}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {name}
              </span>
              {getTrendInfo()}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-4">
          <div className="text-sm">{tooltipContent}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export interface InteractiveLegendProps {
  readonly chartConfig: ChartConfig;
  readonly metrics: MetricKey[];
  readonly baselineValues: Record<string, number | null> | null;
  readonly onHighlight: (metric: string | null) => void;
  readonly highlightedMetric: string | null;
  readonly trendData?: Record<
    string,
    { direction: TrendDirection; percentage: number }
  >;
}

export function InteractiveLegend({
  chartConfig,
  metrics,
  baselineValues,
  onHighlight,
  highlightedMetric,
  trendData = {},
}: Readonly<InteractiveLegendProps>) {
  // Define a type for legend items
  interface LegendItemData {
    id: string;
    name: string;
    color: string;
    isDashed: boolean;
    tooltipContent: React.ReactNode;
    trendDirection?: "up" | "down" | "neutral";
    trendPercentage?: number;
  }

  /**
   * Get the appropriate suffix for a metric value
   */
  const getMetricSuffix = (metricKey: MetricKey): string => {
    if (metricKey === "accuracy") return "%";
    if (metricKey === "reactionTime") return "ms";
    return "";
  };

  // Generate legend items for baseline values
  const baselineLegendItems: LegendItemData[] = baselineValues
    ? Object.entries(baselineValues)
        .filter(
          ([key, value]) =>
            metrics.includes(key as MetricKey) && value !== null,
        )
        .map(([key, value]) => {
          const metricKey = key as MetricKey;
          const metricConfig = chartConfig[metricKey];
          const suffix = getMetricSuffix(metricKey);

          return {
            id: `baseline-${metricKey}`,
            name: `Baseline ${metricConfig.label}: ${value}${suffix}`,
            color: metricConfig.color,
            isDashed: true,
            tooltipContent: getBaselineTooltip(metricKey),
          };
        })
    : [];

  // Generate legend items for metrics
  const metricLegendItems: LegendItemData[] = metrics.flatMap((metricKey) => {
    const metricConfig = chartConfig[metricKey];

    // Main metric
    const mainItem: LegendItemData = {
      id: metricKey,
      name: metricConfig.label,
      color: metricConfig.color,
      isDashed: false,
      tooltipContent: getMetricTooltip(metricKey),
      trendDirection: trendData[metricKey]?.direction,
      trendPercentage: trendData[metricKey]?.percentage,
    };

    // Moving average
    const maItem: LegendItemData = {
      id: `${metricKey}MA`,
      name: `${metricConfig.label} MA`,
      color: metricConfig.color,
      isDashed: true,
      tooltipContent: getMATooltip(metricKey),
    };

    return [mainItem, maItem];
  });

  // Combine all legend items
  const allLegendItems = [...baselineLegendItems, ...metricLegendItems];

  return (
    <div className="flex flex-wrap gap-2 mt-2 justify-center">
      {allLegendItems.map((item) => (
        <LegendItem
          key={item.id}
          name={item.name}
          color={item.color}
          isActive={highlightedMetric === item.id}
          isDashed={item.isDashed}
          tooltipContent={item.tooltipContent}
          onClick={() =>
            onHighlight(highlightedMetric === item.id ? null : item.id)
          }
          onMouseEnter={() => onHighlight(item.id)}
          onMouseLeave={() => onHighlight(null)}
          trendDirection={item.trendDirection}
          trendPercentage={item.trendPercentage}
        />
      ))}
    </div>
  );
}

// Helper functions for tooltip content
function getMetricTooltip(metricKey: MetricKey): React.ReactNode {
  switch (metricKey) {
    case "score":
      return (
        <>
          <p className="font-medium mb-1">Score</p>
          <p>
            Your overall cognitive performance score from each test session.
          </p>
          <p className="mt-2 text-xs">
            Higher values indicate better overall cognitive performance.
          </p>
        </>
      );
    case "reactionTime":
      return (
        <>
          <p className="font-medium mb-1">Reaction Time</p>
          <p>How quickly you respond to stimuli, measured in milliseconds.</p>
          <p className="mt-2 text-xs">
            Lower values are better - faster reactions indicate better
            processing speed.
          </p>
        </>
      );
    case "accuracy":
      return (
        <>
          <p className="font-medium mb-1">Accuracy</p>
          <p>The percentage of correct responses in each test.</p>
          <p className="mt-2 text-xs">
            Higher values indicate better precision and fewer errors.
          </p>
        </>
      );
    default:
      return <p>Performance metric</p>;
  }
}

/**
 * Get the display name for a metric
 */
function getMetricDisplayName(metricKey: MetricKey): string {
  if (metricKey === "score") return "Score";
  if (metricKey === "reactionTime") return "Reaction Time";
  return "Accuracy";
}

/**
 * Get the plural form of a metric name
 */
function getMetricPluralName(metricKey: MetricKey): string {
  if (metricKey === "score") return "scores";
  if (metricKey === "reactionTime") return "reaction times";
  return "accuracy percentages";
}

/**
 * Get tooltip content for moving average
 */
function getMATooltip(metricKey: MetricKey): React.ReactNode {
  const displayName = getMetricDisplayName(metricKey);
  const pluralName = getMetricPluralName(metricKey);

  return (
    <>
      <p className="font-medium mb-1">{displayName} Moving Average</p>
      <p>
        The moving average of your recent {pluralName}, calculated over 3 test
        sessions.
      </p>
      <p className="mt-2 text-xs">
        This smooths out day-to-day variations to show your true performance
        trend.
      </p>
    </>
  );
}

function getBaselineTooltip(metricKey: MetricKey): React.ReactNode {
  switch (metricKey) {
    case "score":
      return (
        <>
          <p className="font-medium mb-1">Baseline Score</p>
          <p>
            Your initial or reference cognitive performance score, established
            from your baseline test.
          </p>
          <p className="mt-2 text-xs">
            If your current scores consistently exceed this value, you're
            showing cognitive improvement.
          </p>
        </>
      );
    case "reactionTime":
      return (
        <>
          <p className="font-medium mb-1">Baseline Reaction Time</p>
          <p>Your initial response speed measured in milliseconds.</p>
          <p className="mt-2 text-xs">
            If your current reaction times are consistently below this value,
            your processing speed is improving.
          </p>
        </>
      );
    case "accuracy":
      return (
        <>
          <p className="font-medium mb-1">Baseline Accuracy</p>
          <p>The percentage of correct responses in your baseline test.</p>
          <p className="mt-2 text-xs">
            If your current accuracy percentages exceed this value, your
            cognitive precision is improving.
          </p>
        </>
      );
    default:
      return <p>Baseline metric</p>;
  }
}
