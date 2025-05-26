import { ChartTooltip, TooltipProps } from "./ChartTooltip";
import { MATooltip, MATooltipProps } from "./MATooltip";
import { MATrendData, ChartTooltipProps } from "../types/chartTypes";

/**
 * Tooltip content function for comprehensive chart
 * Extracted to reduce cognitive complexity in the main component
 */
export function ComprehensiveChartTooltipContent(
  props: ChartTooltipProps,
  maTrendData: MATrendData,
) {
  // Check if we're hovering over an MA line
  const isMALine = props.payload?.some((p) => {
    return (
      p.dataKey === "scoreMA" ||
      p.dataKey === "reactionTimeMA" ||
      p.dataKey === "accuracyMA"
    );
  });

  // Add MA trend data to payload
  if (isMALine && props.payload && props.payload.length > 0) {
    props.payload.forEach((p) => {
      if (p.payload) {
        p.payload.scoreMATrend = maTrendData.scoreMA;
        p.payload.reactionTimeMATrend = maTrendData.reactionTimeMA;
        p.payload.accuracyMATrend = maTrendData.accuracyMA;
      }
    });

    // Use proper typing with specific type
    return <MATooltip {...(props as unknown as Readonly<MATooltipProps>)} />;
  }

  // Use proper typing with specific type
  return <ChartTooltip {...(props as unknown as Readonly<TooltipProps>)} />;
}

/**
 * Tooltip content function for single metric chart
 * Extracted to reduce cognitive complexity in the main component
 */
export function SingleMetricChartTooltipContent(
  props: ChartTooltipProps,
  dataKey: string,
  maTrendData: MATrendData,
) {
  // Check if we're hovering over an MA line
  const isMALine = props.payload?.some((p) => {
    return p.dataKey === `${dataKey}MA`;
  });

  // Add MA trend data to payload
  if (isMALine && props.payload && props.payload.length > 0) {
    props.payload.forEach((p) => {
      if (p.payload) {
        p.payload.scoreMATrend = maTrendData.scoreMA;
        p.payload.reactionTimeMATrend = maTrendData.reactionTimeMA;
        p.payload.accuracyMATrend = maTrendData.accuracyMA;
      }
    });

    // Use proper typing with specific type
    return <MATooltip {...(props as unknown as Readonly<MATooltipProps>)} />;
  }

  // Use proper typing with specific type
  return <ChartTooltip {...(props as unknown as Readonly<TooltipProps>)} />;
}
