/**
 * Performance Chart Component
 *
 * A flexible chart component that displays cognitive performance metrics
 * with support for multiple visualization modes.
 */
// Note: Annotation feature is temporarily disabled but code is preserved for future implementation
import { useState, useMemo, memo } from "react";
import { TestResult } from "@/lib/testResultUtils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import "./styles/chart.css";

// Import utility functions and components
import {
  processChartData,
  getChartConfig,
  calculateDataStats,
  getBaselineValues,
  calculateTrendData,
} from "./utils/chartUtils";

// Define a type alias for time range
export type TimeRangeOption = "7d" | "30d" | "90d" | "all";

import { NoDataDisplay } from "./components/NoDataDisplay";
import { CardLegend } from "./components/CardLegend";
import { MetricDefinitionsPanel } from "./components/MetricDefinitionsPanel";
// Keep the Annotation type for type checking
import { Annotation } from "./components/ChartAnnotation";
// Annotation component preserved but not directly imported to avoid linting warnings
// Will be re-enabled in future implementation
import { ComprehensiveChartRenderer } from "./components/ComprehensiveChartRenderer";
import { SingleMetricChartRenderer } from "./components/SingleMetricChartRenderer";
import { calculateMATrendData } from "./utils/chartHelpers";
import { ProcessedChartData } from "./types/chartTypes";
import { createLogger } from "@/lib/logger";

// Create a logger for the PerformanceChart component
const logger = createLogger({ namespace: "PerformanceChart" });

/**
 * Props for the PerformanceChart component
 */
export interface PerformanceChartProps {
  // Data inputs
  readonly testResults: TestResult[];
  readonly baselineResult?: TestResult | null;

  // Display options
  readonly mode?: "comprehensive" | "single";
  readonly metrics?: Array<"score" | "reactionTime" | "accuracy">;
  readonly height?: number | string;
  readonly className?: string;
  readonly hideTitle?: boolean;

  // Feature toggles
  readonly showMovingAverage?: boolean;
  readonly onMovingAverageChange?: (show: boolean) => void;
  readonly showBaselineReference?: boolean;
  readonly showInteractiveLegend?: boolean;
  readonly showMetricDefinitions?: boolean;
  readonly showTimeRangeSelector?: boolean;
  readonly showAnnotations?: boolean;
  readonly showMAControls?: boolean;

  // Time range options
  readonly timeRange?: TimeRangeOption;
  readonly onTimeRangeChange?: (range: TimeRangeOption) => void;

  // Annotation options
  readonly annotations?: Array<{
    id: string;
    date: number;
    label: string;
    description: string;
    color: string;
  }>;
  readonly onAddAnnotation?: (annotation: Omit<Annotation, "id">) => void;
  readonly onEditAnnotation?: (
    id: string,
    annotation: Partial<Annotation>,
  ) => void;
  readonly onDeleteAnnotation?: (id: string) => void;

  // Single metric mode options
  readonly title?: string;
  readonly dataKey?: "score" | "reactionTime" | "accuracy";
  readonly isLoading?: boolean;
}

/**
 * Performance Chart Component
 *
 * A flexible chart component that can display cognitive performance metrics
 * in different modes and configurations.
 */
export const PerformanceChart = memo(function PerformanceChart({
  // Data inputs
  testResults,
  baselineResult = null,

  // Display options
  mode = "comprehensive",
  metrics = ["score", "reactionTime", "accuracy"],
  height = 300,
  className = "",
  hideTitle = false,

  // Feature toggles
  showMovingAverage = false,
  onMovingAverageChange,
  showBaselineReference = true,
  showInteractiveLegend = false,
  showMetricDefinitions = false,
  showTimeRangeSelector = false,
  // Annotation feature temporarily disabled
  // showAnnotations = false,
  showMAControls = true,

  // Time range options
  timeRange = "all",
  onTimeRangeChange,

  // Annotation options - temporarily disabled but preserved for future implementation
  // annotations = [],
  // Annotation handlers are temporarily unused while the feature is disabled
  // onAddAnnotation, onEditAnnotation, onDeleteAnnotation,

  // Single metric mode options
  title,
  dataKey = "score",
  isLoading = false,
}: Readonly<PerformanceChartProps>) {
  // State for highlighting metrics on hover
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(
    null,
  );

  // Local state for moving average if no external control is provided
  const [localShowMA, setLocalShowMA] = useState<boolean>(showMovingAverage);

  // Local state for time range if no external control is provided
  const [localTimeRange, setLocalTimeRange] =
    useState<TimeRangeOption>(timeRange);

  // Use either controlled or uncontrolled states
  const effectiveShowMA = onMovingAverageChange
    ? showMovingAverage
    : localShowMA;
  const effectiveTimeRange = onTimeRangeChange ? timeRange : localTimeRange;

  // Debug logging removed

  // Handle moving average toggle
  const handleMAToggle = (show: boolean) => {
    if (onMovingAverageChange) {
      onMovingAverageChange(show);
    } else {
      setLocalShowMA(show);
    }
  };

  // Handle time range changes
  const handleTimeRangeChange = (newRange: TimeRangeOption) => {
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    } else {
      setLocalTimeRange(newRange);
    }
  };

  // Process chart data and calculate derived values - memoized to prevent unnecessary recalculations
  const {
    processedData,
    trendData,
    maTrendData,
    chartConfig,
    hasNoData,
    baselineValues,
    dataStats,
    chartId,
    chartTitle,
    chartDescription,
  } = useMemo(
    () =>
      processChartDataAndDeriveValues({
        testResults,
        baselineResult,
        effectiveTimeRange,
        effectiveShowMA,
        mode,
        dataKey,
        title,
      }),
    [
      testResults,
      baselineResult,
      effectiveTimeRange,
      effectiveShowMA,
      mode,
      dataKey,
      title,
    ],
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className="text-lg font-medium mb-2" id={`${chartId}-title`}>
          {chartTitle}
        </div>
        <div
          className="flex items-center justify-center bg-muted/20 animate-pulse rounded-md"
          style={{
            height: typeof height === "number" ? `${height}px` : height,
            minHeight: "300px",
          }}
          aria-labelledby={`${chartId}-title`}
          aria-busy="true"
        >
          <span className="sr-only">Loading chart data...</span>
        </div>
      </div>
    );
  }

  // Render no data state
  if (hasNoData) {
    return (
      <NoDataDisplay
        height={height}
        title={chartTitle}
        chartId={chartId}
        className={className}
      />
    );
  }

  // Helper function to process chart data and derive values
  function processChartDataAndDeriveValues({
    testResults,
    baselineResult,
    effectiveTimeRange,
    effectiveShowMA,
    mode,
    dataKey,
    title,
  }: {
    testResults: TestResult[];
    baselineResult: TestResult | null;
    effectiveTimeRange: TimeRangeOption;
    effectiveShowMA: boolean;
    mode: string;
    dataKey: string;
    title?: string;
  }) {
    // Force a new object to be created each time to ensure proper re-rendering
    const options = {
      timeRange: effectiveTimeRange,
      movingAverageWindow: 3,
      includeMovingAverage: effectiveShowMA,
      baselineResult,
    };

    const processedData = processChartData(testResults, options);

    // Calculate trend data for metrics - non-memoized for consistency
    const trendData = calculateTrendData(processedData.finalChartData);

    // Calculate MA trend data using the extracted helper function
    const maTrendData = calculateMATrendData(processedData.finalChartData);

    // Get chart configuration
    const chartConfig = getChartConfig();

    // Check if we have data to display
    const hasNoData =
      !processedData.finalChartData ||
      processedData.finalChartData.length === 0;

    // Get baseline values for reference lines
    const baselineValues = getBaselineValues(baselineResult);

    // Calculate min/max values for better axis scaling - non-memoized
    const dataStats = calculateDataStats(processedData.chartData);

    // Generate a stable ID for accessibility - using a deterministic approach
    const chartId = `chart-${mode}-${dataKey || "performance"}-${testResults.length}`;

    // Generate a title for the chart - non-memoized
    let chartTitle = title || "Performance Trend";

    if (!title && mode === "single") {
      switch (dataKey) {
        case "score":
          chartTitle = "Score Trend";
          break;
        case "reactionTime":
          chartTitle = "Reaction Time Trend";
          break;
        case "accuracy":
          chartTitle = "Accuracy Trend";
          break;
      }
    }

    // Create an accessible description of the chart - non-memoized
    let chartDescription = `${chartTitle} showing performance metrics over time.`;

    if (hasNoData) {
      chartDescription += " No data available.";
    } else {
      try {
        const data = processedData.finalChartData;
        const startDate = format(new Date(data[0].date), "MMM d, yyyy");
        const endDate = format(
          new Date(data[data.length - 1].date),
          "MMM d, yyyy",
        );

        chartDescription += ` Contains ${data.length} data points from ${startDate} to ${endDate}.`;
      } catch (error) {
        // Use our logger for errors
        logger.error("Error formatting dates for chart description:", error);
        chartDescription += ` Contains ${processedData.finalChartData.length} data points.`;
      }
    }

    return {
      processedData,
      trendData,
      maTrendData,
      chartConfig,
      hasNoData,
      baselineValues,
      dataStats,
      chartId,
      chartTitle,
      chartDescription,
    };
  }

  // Render the chart content based on the mode
  const chartContent =
    mode === "single" ? renderSingleMetricChart() : renderComprehensiveChart();

  // Render the complete chart with legend and additional components
  return (
    <div
      className={cn("flex flex-col", className)}
      style={{
        height: "100%",
        width: "100%",
        minHeight: "300px",
        position: "relative",
      }}
    >
      {/* Chart content with fixed height to prevent overlap */}
      <div
        style={{
          height: mode === "single" ? "350px" : "450px", // Increased height to prevent truncation
          maxHeight: mode === "single" ? "350px" : "450px", // Increased max-height to match
          overflow: "visible",
          marginBottom: "20px", // Added margin to ensure space between chart and legend
        }}
      >
        {chartContent}
      </div>

      {/* Card-based Legend with proper spacing */}
      <div style={{ marginTop: "40px" }}>
        {" "}
        {/* Increased top margin for better separation */}
        <CardLegend
          chartConfig={chartConfig}
          showMovingAverage={effectiveShowMA}
          baselineValues={baselineValues}
          mode={mode}
          dataKey={dataKey}
        />
      </div>

      {showMetricDefinitions && <MetricDefinitionsPanel />}
      {/*
        Annotation feature temporarily disabled but preserved for future implementation
        {showAnnotations && (
          <ChartAnnotation
            annotations={annotations}
            onAddAnnotation={(annotation) => onAddAnnotation?.(annotation)}
            onEditAnnotation={(id, annotation) => onEditAnnotation?.(id, annotation)}
            onDeleteAnnotation={(id) => onDeleteAnnotation?.(id)}
          />
        )}
      */}
    </div>
  );

  // Render a comprehensive chart with all metrics
  function renderComprehensiveChart() {
    // Type assertion to match the expected type in ComprehensiveChartRenderer
    // Using double assertion through unknown to safely convert between similar but incompatible types
    const typedProcessedData = processedData as unknown as ProcessedChartData;

    return (
      <ComprehensiveChartRenderer
        processedData={typedProcessedData}
        chartId={chartId}
        chartTitle={chartTitle}
        chartDescription={chartDescription}
        chartConfig={chartConfig}
        height={height}
        className={className}
        hideTitle={hideTitle}
        showMAControls={showMAControls}
        effectiveShowMA={effectiveShowMA}
        handleMAToggle={handleMAToggle}
        showTimeRangeSelector={showTimeRangeSelector}
        effectiveTimeRange={effectiveTimeRange}
        handleTimeRangeChange={handleTimeRangeChange}
        showInteractiveLegend={showInteractiveLegend}
        metrics={metrics}
        baselineValues={baselineValues}
        showBaselineReference={showBaselineReference}
        highlightedMetric={highlightedMetric}
        setHighlightedMetric={setHighlightedMetric}
        trendData={trendData}
        maTrendData={maTrendData}
        dataStats={dataStats}
        // Annotation props temporarily disabled but preserved for future implementation
        // showAnnotations={showAnnotations}
        // annotations={annotations}
      />
    );
  }

  // Render a single metric chart
  function renderSingleMetricChart() {
    // Type assertion to match the expected type in SingleMetricChartRenderer
    // Using double assertion through unknown to safely convert between similar but incompatible types
    const typedProcessedData = processedData as unknown as ProcessedChartData;

    return (
      <SingleMetricChartRenderer
        processedData={typedProcessedData}
        chartId={chartId}
        chartTitle={chartTitle}
        chartDescription={chartDescription}
        chartConfig={chartConfig}
        height={height}
        className={className}
        hideTitle={hideTitle}
        showMAControls={showMAControls}
        effectiveShowMA={effectiveShowMA}
        handleMAToggle={handleMAToggle}
        dataKey={dataKey}
        baselineValues={baselineValues}
        showBaselineReference={showBaselineReference}
        dataStats={dataStats}
        maTrendData={maTrendData}
      />
    );
  }
});
