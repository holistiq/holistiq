/**
 * Time Range Selector Component
 *
 * Allows users to select different time periods for viewing their performance data
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TimeRangeOption } from '../PerformanceChart';

interface TimeRangeSelectorProps {
  selectedRange: TimeRangeOption;
  onChange: (range: TimeRangeOption) => void;
  className?: string;
}

export function TimeRangeSelector({
  selectedRange,
  onChange,
  className
}: Readonly<TimeRangeSelectorProps>) {
  const ranges: { value: TimeRangeOption; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <span className="text-sm text-muted-foreground mr-2">Time Range:</span>
      <div className="flex rounded-md overflow-hidden">
        {ranges.map((range) => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 px-3 rounded-none",
              selectedRange === range.value ? "bg-primary text-primary-foreground" : "bg-background",
              range.value === '7d' && "rounded-l-md",
              range.value === 'all' && "rounded-r-md"
            )}
            onClick={() => onChange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
