/**
 * Grouped Legend Layout Component
 *
 * A standalone component that displays a grouped legend below the chart
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { ChartConfig, MetricKey } from '../utils/chartUtils';

interface LegendItem {
  type: 'metric' | 'movingAverage' | 'baseline';
  metricKey: MetricKey;
  label: string;
  color: string;
}

interface GroupedLegendLayoutProps {
  readonly chartConfig: ChartConfig;
  readonly showMovingAverage: boolean;
  readonly baselineValues?: Record<string, number | null> | null;
  readonly className?: string;
}

export function GroupedLegendLayout({
  chartConfig,
  showMovingAverage,
  baselineValues,
  className
}: Readonly<GroupedLegendLayoutProps>) {
  // Create legend items
  const createLegendItems = (): LegendItem[] => {
    const items: LegendItem[] = [];

    // Add score items
    items.push({
      type: 'metric',
      metricKey: 'score',
      label: 'Score',
      color: chartConfig.score.color
    });

    if (showMovingAverage) {
      items.push({
        type: 'movingAverage',
        metricKey: 'score',
        label: 'Score MA',
        color: chartConfig.score.color
      });
    }

    if (baselineValues?.score) {
      items.push({
        type: 'baseline',
        metricKey: 'score',
        label: `Baseline Score: ${baselineValues.score}`,
        color: chartConfig.score.color
      });
    }

    // Add reaction time items
    items.push({
      type: 'metric',
      metricKey: 'reactionTime',
      label: 'Reaction Time',
      color: chartConfig.reactionTime.color
    });

    if (showMovingAverage) {
      items.push({
        type: 'movingAverage',
        metricKey: 'reactionTime',
        label: 'Reaction Time MA',
        color: chartConfig.reactionTime.color
      });
    }

    if (baselineValues?.reactionTime) {
      items.push({
        type: 'baseline',
        metricKey: 'reactionTime',
        label: `Baseline Reaction Time: ${baselineValues.reactionTime}ms`,
        color: chartConfig.reactionTime.color
      });
    }

    // Add accuracy items
    items.push({
      type: 'metric',
      metricKey: 'accuracy',
      label: 'Accuracy',
      color: chartConfig.accuracy.color
    });

    if (showMovingAverage) {
      items.push({
        type: 'movingAverage',
        metricKey: 'accuracy',
        label: 'Accuracy MA',
        color: chartConfig.accuracy.color
      });
    }

    if (baselineValues?.accuracy) {
      items.push({
        type: 'baseline',
        metricKey: 'accuracy',
        label: `Baseline Accuracy: ${baselineValues.accuracy}%`,
        color: chartConfig.accuracy.color
      });
    }

    return items;
  };

  const legendItems = createLegendItems();

  // Group items by metric
  const scoreItems = legendItems.filter(item => item.metricKey === 'score');
  const reactionTimeItems = legendItems.filter(item => item.metricKey === 'reactionTime');
  const accuracyItems = legendItems.filter(item => item.metricKey === 'accuracy');

  const renderLegendItem = (item: LegendItem) => {
    const isDashed = item.type === 'movingAverage' || item.type === 'baseline';

    return (
      <div key={item.label} className="flex items-center gap-3 px-1 w-full">
        <div className="flex-shrink-0">
          <span
            className={cn(
              "inline-block w-10 h-0.5",
              isDashed ? "border-t border-dashed border-2" : "h-1.5"
            )}
            style={{
              backgroundColor: item.color,
              borderColor: item.color
            }}
          />
        </div>
        <span className="text-xs whitespace-nowrap">
          {item.label}
        </span>
      </div>
    );
  };

  const renderGroup = (title: string, items: LegendItem[], color: string) => {
    if (items.length === 0) return null;

    return (
      <div className="flex flex-col items-center border rounded-md shadow-sm bg-card m-2 overflow-hidden min-w-[180px] flex-1 max-w-[250px]"
           style={{ borderColor: `${color}40` }}>
        {/* Card header with colored background */}
        <div className="w-full text-center py-1.5 px-4 font-medium text-sm text-white"
             style={{ backgroundColor: color }}>
          {title}
        </div>

        {/* Card content */}
        <div className="flex flex-col gap-2.5 p-3 w-full">
          {items.map(renderLegendItem)}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-wrap justify-center gap-2 mt-4 mb-2", className)}>
      {renderGroup('Score', scoreItems, chartConfig.score.color)}
      {renderGroup('Reaction Time', reactionTimeItems, chartConfig.reactionTime.color)}
      {renderGroup('Accuracy', accuracyItems, chartConfig.accuracy.color)}
    </div>
  );
}
