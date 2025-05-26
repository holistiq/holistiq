import {
  LineChart,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { memo } from "react";
import { MAToggle } from "./MAToggle";
import { SingleMetricChartTooltipContent } from "./ChartTooltipHandlers";
import { createReferenceLineData } from "../utils/chartHelpers";
import { FormattedTestResult } from "../utils/chartUtils";
import { createLogger } from "@/lib/logger";
import {
  ProcessedChartData,
  ChartConfig,
  BaselineValues,
  MATrendData,
  ChartDataStats,
  ChartTooltipProps,
} from "../types/chartTypes";

// Create a logger for the SingleMetricChartRenderer component
const logger = createLogger({ namespace: "SingleMetricChartRenderer" });

interface SingleMetricChartRendererProps {
  processedData: ProcessedChartData;
  chartId: string;
  chartTitle: string;
  chartDescription: string;
  chartConfig: ChartConfig;
  height: number | string;
  className: string;
  hideTitle: boolean;
  showMAControls: boolean;
  effectiveShowMA: boolean;
  handleMAToggle: (show: boolean) => void;
  dataKey: "score" | "reactionTime" | "accuracy";
  baselineValues: BaselineValues;
  showBaselineReference: boolean;
  dataStats: ChartDataStats;
  maTrendData: MATrendData;
}

export const SingleMetricChartRenderer = memo(
  function SingleMetricChartRenderer({
    processedData,
    chartId,
    chartTitle,
    chartDescription,
    chartConfig,
    height,
    className,
    hideTitle,
    showMAControls,
    effectiveShowMA,
    handleMAToggle,
    dataKey,
    baselineValues,
    showBaselineReference,
    dataStats,
    maTrendData,
  }: Readonly<SingleMetricChartRendererProps>) {
    // Get metric configuration
    const metricColor = chartConfig[dataKey].color;

    // Determine metric label based on dataKey
    let metricYAxisLabel: string;
    if (dataKey === "reactionTime") {
      metricYAxisLabel = "Reaction Time (ms)";
    } else if (dataKey === "accuracy") {
      metricYAxisLabel = "Accuracy (%)";
    } else {
      metricYAxisLabel = "Score";
    }

    // Calculate domain with padding
    let metricDomain: [number, number];
    let metricTicks: number[];

    if (dataKey === "reactionTime") {
      const min = Math.max(0, Math.floor(dataStats.reactionTime.min * 0.9));
      const max = Math.ceil(dataStats.reactionTime.max * 1.1);
      metricDomain = [min, max];

      // Generate appropriate ticks based on the range
      const range = max - min;
      const tickInterval = Math.ceil(range / 5 / 50) * 50; // Round to nearest 50ms
      metricTicks = Array.from({ length: 6 }, (_, i) => min + i * tickInterval);
    } else {
      // For score and accuracy, use 0-100 scale
      metricDomain = [0, 100];
      metricTicks = [0, 20, 40, 60, 80, 100];
    }

    // Formatter for Y-axis ticks
    const metricTickFormatter = (value: number) => {
      if (dataKey === "accuracy") {
        return `${value}%`;
      } else if (dataKey === "reactionTime") {
        return `${Math.round(value)}`;
      }
      return `${value}`;
    };

    // Get the metric name for display
    let metricName: string;
    if (dataKey === "reactionTime") {
      metricName = "Reaction Time";
    } else if (dataKey === "accuracy") {
      metricName = "Accuracy";
    } else {
      metricName = "Score";
    }

    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          {!hideTitle && (
            <div className="text-lg font-medium" id={`${chartId}-title`}>
              {chartTitle}
            </div>
          )}

          {showMAControls && (
            <MAToggle
              showMovingAverage={effectiveShowMA}
              onToggle={handleMAToggle}
            />
          )}
        </div>
        <div
          className="chart-container"
          style={{
            height: typeof height === "number" ? `${height}px` : height,
            minHeight: "300px",
            maxHeight: "450px" /* Increased max-height to prevent truncation */,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            marginBottom:
              "40px" /* Increased bottom margin to create more space for the legend */,
          }}
          aria-labelledby={`${chartId}-title`}
        >
          <span className="sr-only" id={`${chartId}-desc`}>
            {chartDescription}
          </span>

          {/* Note about spread out data points */}
          {processedData.finalChartData.some(
            (point) =>
              "originalDate" in point && point.originalDate !== point.date,
          ) && (
            <div className="text-xs text-muted-foreground mb-2">
              <span>
                * Dates marked with an asterisk have been adjusted for better
                visualization. Hover for actual times.
              </span>
            </div>
          )}

          <div
            style={{
              width: "100%",
              height: "100%",
              minHeight: "300px",
              position: "relative",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedData.finalChartData}
                margin={{ top: 40, right: 60, left: 80, bottom: 40 }} // Increased bottom margin to prevent truncation
                aria-describedby={`${chartId}-desc`}
                // No legend configuration here - we'll use the Legend component
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(timestamp) => {
                    try {
                      // Find the corresponding data point to check if it has an original date
                      const dataPoint = processedData.finalChartData.find(
                        (point) => point.date === timestamp,
                      );

                      // If this is a spread out data point, add an indicator
                      const hasOriginalDate =
                        dataPoint &&
                        "originalDate" in dataPoint &&
                        dataPoint.originalDate !== dataPoint.date;

                      // Format the date for display
                      const formattedDate = format(
                        new Date(timestamp),
                        "MMM d",
                      );

                      // Add an asterisk to indicate this is a spread out data point
                      return hasOriginalDate
                        ? `${formattedDate}*`
                        : formattedDate;
                    } catch (error) {
                      logger.error("Error formatting X-axis timestamp:", error);
                      return format(new Date(timestamp), "MMM d");
                    }
                  }}
                  padding={{ left: 20, right: 20 }}
                  label={{
                    value: "Date",
                    position: "insideBottom",
                    offset: -5,
                  }}
                  minTickGap={5}
                  height={50}
                  ticks={
                    processedData.finalChartData.length <= 10
                      ? processedData.finalChartData.map((point) => point.date)
                      : undefined
                  }
                  interval={
                    processedData.finalChartData.length <= 5
                      ? 0
                      : "preserveStartEnd"
                  }
                />
                <YAxis
                  domain={metricDomain}
                  ticks={metricTicks}
                  tickFormatter={metricTickFormatter}
                  label={{
                    value: metricYAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: 0,
                    style: {
                      textAnchor: "middle",
                      fill: metricColor,
                      fontWeight: "bold",
                    },
                  }}
                  padding={{ top: 15, bottom: 15 }}
                  width={80}
                  stroke={metricColor}
                />
                <Tooltip
                  content={(props: unknown) =>
                    SingleMetricChartTooltipContent(
                      props as ChartTooltipProps,
                      dataKey,
                      maTrendData,
                    )
                  }
                />
                {/* Override the default legend with an empty one */}
                <Legend content={() => null} />

                {/* Baseline Reference Line */}
                {(() => {
                  if (
                    !(
                      baselineValues &&
                      showBaselineReference &&
                      baselineValues[dataKey]
                    )
                  ) {
                    return null;
                  }

                  // Get the appropriate unit suffix
                  let unitSuffix = "";
                  if (dataKey === "accuracy") {
                    unitSuffix = "%";
                  } else if (dataKey === "reactionTime") {
                    unitSuffix = "ms";
                  }

                  // Get the baseline value
                  const baselineValue = baselineValues[dataKey];

                  // Determine label position
                  const labelPosition =
                    dataKey === "reactionTime"
                      ? "insideBottomLeft"
                      : "insideTopLeft";

                  return (
                    <Line
                      key={`baseline-${dataKey}-line`}
                      name={`Baseline ${metricName}: ${baselineValue}${unitSuffix}`}
                      data={createReferenceLineData(
                        processedData.finalChartData as unknown as FormattedTestResult[],
                        baselineValue,
                      )}
                      dataKey="value"
                      stroke={metricColor}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      label={{
                        position: labelPosition,
                        value: `Baseline ${metricName}`,
                        fill: metricColor,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    />
                  );
                })()}

                <Line
                  key={`${dataKey}-line`}
                  name={metricName}
                  type="linear"
                  dataKey={dataKey}
                  stroke={metricColor}
                  strokeWidth={3}
                  dot={{
                    r: 8,
                    strokeWidth: 2,
                    stroke: metricColor,
                    fill: "white",
                  }}
                  activeDot={{
                    r: 10,
                    strokeWidth: 3,
                    stroke: metricColor,
                    fill: "white",
                  }}
                  connectNulls
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />

                {/* Moving Average Line */}
                {effectiveShowMA && (
                  <Line
                    key={`${dataKey}-ma-line`}
                    name={`${metricName} MA`}
                    type="monotone"
                    dataKey={`${dataKey}MA`}
                    stroke={metricColor}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{
                      r: 6,
                      strokeWidth: 2,
                      stroke: metricColor,
                      fill: "white",
                    }}
                    activeDot={{
                      r: 8,
                      strokeWidth: 2,
                      stroke: metricColor,
                      fill: "white",
                    }}
                    connectNulls
                    isAnimationActive={true}
                    animationDuration={700}
                    animationEasing="ease-in-out"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  },
);
