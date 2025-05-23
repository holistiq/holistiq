/**
 * NoDataDisplay Component
 * 
 * Displays a message when no chart data is available
 */
import { cn } from '@/lib/utils';

interface NoDataDisplayProps {
  /** Height of the container */
  readonly height?: number | string;
  /** Title of the chart */
  readonly title?: string;
  /** ID for accessibility */
  readonly chartId?: string;
  /** Additional class names */
  readonly className?: string;
}

/**
 * Component to display when no data is available for a chart
 */
export function NoDataDisplay({
  height = 300,
  title = 'Performance Trend',
  chartId = 'chart-no-data',
  className = ''
}: Readonly<NoDataDisplayProps>) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-lg font-medium mb-2" id={`${chartId}-title`}>
        {title}
      </div>
      <div
        className="flex items-center justify-center border border-dashed rounded-md"
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '300px'
        }}
        aria-labelledby={`${chartId}-title`}
      >
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">No data available</p>
          <p className="text-sm text-muted-foreground">Complete a cognitive test to see your performance trend</p>
        </div>
      </div>
    </div>
  );
}
