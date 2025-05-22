import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  /** Metric title */
  title: string;
  /** Metric value */
  value: React.ReactNode;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional description for tooltip */
  description?: string;
  /** Optional change indicator (positive/negative) */
  change?: {
    value: number;
    label?: string;
    isPositive: boolean;
    isInverted?: boolean;
  };
  /** Loading state */
  isLoading?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * A standardized metric card component for displaying key metrics.
 */
export function MetricCard({
  title,
  value,
  icon,
  description,
  change,
  isLoading = false,
  className
}: MetricCardProps) {
  // Determine the color for the change indicator
  const getChangeColor = () => {
    if (!change) return '';
    
    const { isPositive, isInverted } = change;
    
    // For inverted metrics (like reaction time), lower is better
    if (isInverted) {
      return isPositive ? 'text-red-500' : 'text-green-500';
    }
    
    // For regular metrics, higher is better
    return isPositive ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-sm",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {icon && <div className="text-muted-foreground">{icon}</div>}
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
              </div>
              
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground/70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold">{value}</div>
              
              {change && (
                <div className={cn(
                  "text-sm font-medium flex items-center",
                  getChangeColor()
                )}>
                  {change.isPositive ? '+' : ''}{change.value.toFixed(1)}%
                  {change.label && <span className="ml-1">{change.label}</span>}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsRowProps {
  /** Metrics to display */
  metrics: MetricCardProps[];
  /** Optional className for styling */
  className?: string;
}

/**
 * A component for displaying a row of metrics in a consistent layout.
 */
export function DashboardMetricsRow({
  metrics,
  className
}: DashboardMetricsRowProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
      className
    )}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}
