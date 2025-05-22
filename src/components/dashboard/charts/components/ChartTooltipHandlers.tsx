import { TooltipProps } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { MATooltip } from './MATooltip';

/**
 * Interface for moving average trend data
 */
interface MATrendData {
  scoreMA?: number;
  reactionTimeMA?: number;
  accuracyMA?: number;
}

/**
 * Tooltip content function for comprehensive chart
 * Extracted to reduce cognitive complexity in the main component
 */
export function ComprehensiveChartTooltipContent(props: TooltipProps<any, any>, maTrendData: MATrendData) {
  // Check if we're hovering over an MA line
  const isMALine = props.payload?.some(p =>
    p.dataKey === 'scoreMA' ||
    p.dataKey === 'reactionTimeMA' ||
    p.dataKey === 'accuracyMA'
  );

  // Add MA trend data to payload
  if (isMALine && props.payload && props.payload.length > 0) {
    props.payload.forEach(p => {
      if (p.payload) {
        p.payload.scoreMATrend = maTrendData.scoreMA;
        p.payload.reactionTimeMATrend = maTrendData.reactionTimeMA;
        p.payload.accuracyMATrend = maTrendData.accuracyMA;
      }
    });

    // Use type assertion to handle the type mismatch
    return <MATooltip {...(props as any)} />;
  }

  // Use type assertion to handle the type mismatch
  return <ChartTooltip {...(props as any)} />;
}

/**
 * Tooltip content function for single metric chart
 * Extracted to reduce cognitive complexity in the main component
 */
export function SingleMetricChartTooltipContent(props: TooltipProps<any, any>, dataKey: string, maTrendData: MATrendData) {
  // Check if we're hovering over an MA line
  const isMALine = props.payload?.some(p =>
    p.dataKey === `${dataKey}MA`
  );

  // Add MA trend data to payload
  if (isMALine && props.payload && props.payload.length > 0) {
    props.payload.forEach(p => {
      if (p.payload) {
        p.payload.scoreMATrend = maTrendData.scoreMA;
        p.payload.reactionTimeMATrend = maTrendData.reactionTimeMA;
        p.payload.accuracyMATrend = maTrendData.accuracyMA;
      }
    });

    // Use type assertion to handle the type mismatch
    return <MATooltip {...(props as any)} />;
  }

  // Use type assertion to handle the type mismatch
  return <ChartTooltip {...(props as any)} />;
}
