import { memo, useMemo } from "react";
import { PerformanceChart } from "./PerformanceChart";
import { TestResult } from "@/lib/testResultUtils";
import { TimeRangeOption } from "./PerformanceChart";
import { createLogger } from "@/lib/logger";
import { RenderProfiler } from "@/components/debug/RenderProfiler";

const logger = createLogger({ namespace: "StablePerformanceChart" });

interface StablePerformanceChartProps {
  testResults: TestResult[];
  baselineResult?: TestResult | null;
  mode: "single" | "comprehensive";
  dataKey?: string;
  title?: string;
  height?: number | string;
  className?: string;
  hideTitle?: boolean;
  showMAControls?: boolean;
  showMA?: boolean;
  onMAToggle?: (show: boolean) => void;
  showTimeRangeSelector?: boolean;
  timeRange?: TimeRangeOption;
  onTimeRangeChange?: (range: TimeRangeOption) => void;
  showInteractiveLegend?: boolean;
  showBaselineReference?: boolean;
}

/**
 * A stable wrapper around PerformanceChart that prevents unnecessary re-renders
 * This component uses React.memo with a custom comparison function to only re-render
 * when the props that actually affect the chart change
 */
export const StablePerformanceChart = memo(
  function StablePerformanceChartInner(props: StablePerformanceChartProps) {
    // Generate a stable ID for the chart based on its props
    const chartId = useMemo(() => {
      const { mode, dataKey, testResults } = props;
      return `stable-chart-${mode}-${dataKey || "performance"}-${testResults.length}`;
    }, [props.mode, props.dataKey, props.testResults.length]);

    // Log when this component renders
    logger.debug(`Rendering StablePerformanceChart: ${chartId}`);

    return (
      <RenderProfiler id={`chart-${props.mode}-${props.dataKey || "all"}`}>
        <PerformanceChart {...props} />
      </RenderProfiler>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if these props change
    const propsToCheck = [
      "testResults",
      "baselineResult",
      "mode",
      "dataKey",
      "showMA",
      "timeRange",
    ] as const;

    // Check if the length of testResults has changed
    if (prevProps.testResults.length !== nextProps.testResults.length) {
      return false; // Re-render
    }

    // Check if the test results have changed (by comparing the last result's timestamp)
    if (prevProps.testResults.length > 0 && nextProps.testResults.length > 0) {
      const prevLastTest =
        prevProps.testResults[prevProps.testResults.length - 1];
      const nextLastTest =
        nextProps.testResults[nextProps.testResults.length - 1];

      if (prevLastTest.timestamp !== nextLastTest.timestamp) {
        return false; // Re-render
      }
    }

    // Check if any of the other important props have changed
    for (const prop of propsToCheck) {
      if (prop === "testResults") continue; // Already checked above

      if (prevProps[prop] !== nextProps[prop]) {
        return false; // Re-render
      }
    }

    // If we get here, no important props have changed
    return true; // Don't re-render
  },
);
