import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { TestResult } from '@/lib/testResultUtils';
import { calculateChange } from '@/utils/formatUtils';

interface PerformanceMetricCardProps {
  title: string;
  icon: React.ReactNode;
  tooltipText: string;
  tooltipSubtext: string;
  baselineResult: TestResult | null;
  latestResult: TestResult | null;
  isLoading: boolean;
  metricKey: 'score' | 'reactionTime' | 'accuracy';
  isInverted?: boolean; // For metrics where lower is better (like reaction time)
  labelText?: string; // Text to show next to the percentage (e.g., "vs. baseline", "faster")
}

export function PerformanceMetricCard({
  title,
  icon,
  tooltipText,
  tooltipSubtext,
  baselineResult,
  latestResult,
  isLoading,
  metricKey,
  isInverted = false,
  labelText = "vs. baseline"
}: Readonly<PerformanceMetricCardProps>) {
  // Determine if the card should show green (improvement) or red (decline)
  const getCardColor = useMemo(() => {
    if (!latestResult || !baselineResult) return 'bg-gray-500';

    if (isInverted) {
      // For inverted metrics (like reaction time), lower is better
      return latestResult[metricKey] < baselineResult[metricKey] ? 'bg-green-500' : 'bg-red-500';
    } else {
      // For regular metrics, higher is better
      return latestResult[metricKey] > baselineResult[metricKey] ? 'bg-green-500' : 'bg-red-500';
    }
  }, [latestResult, baselineResult, metricKey, isInverted]);

  // Main function to calculate and format the percentage change
  const renderPercentageChange = useMemo(() => {
    // Helper functions moved inside useMemo to avoid dependency issues

    // Helper functions to get the appropriate trend icons
    const getImprovedIcon = (isInverted: boolean) => {
      return isInverted ?
        <TrendingDown className="h-4 w-4 inline" /> :
        <TrendingUp className="h-4 w-4 inline" />;
    };

    const getDeclinedIcon = (isInverted: boolean) => {
      return isInverted ?
        <TrendingUp className="h-4 w-4 inline" /> :
        <TrendingDown className="h-4 w-4 inline" />;
    };

    // Handle the case where both values are zero
    const renderZeroChange = () => {
      return (
        <>
          0.0%<span className="text-gray-500 text-sm ml-1">
            <TrendingUp className="h-4 w-4 inline" />
          </span>
        </>
      );
    };

    // Handle the case where baseline is zero but latest is not
    const renderZeroBaselineChange = (latestValue: number) => {
      const improved = isInverted ? latestValue < 0 : latestValue > 0;
      const color = improved ? "text-green-500 text-sm ml-1" : "text-red-500 text-sm ml-1";
      const icon = improved ? getImprovedIcon(isInverted) : getDeclinedIcon(isInverted);

      return (
        <>
          {isInverted ? "Faster" : "Improved"}<span className={color}>
            {icon}
          </span>
        </>
      );
    };

    // Handle normal percentage change calculation
    const renderNormalChange = (baselineValue: number, latestValue: number) => {
      let change: number;

      if (isInverted) {
        // For inverted metrics, calculate how much faster/better (negative means improvement)
        change = calculateChange(latestValue, baselineValue);
        // Invert the sign because lower is better
        change = -change;
      } else {
        // For regular metrics, calculate normal change
        change = calculateChange(latestValue, baselineValue);
      }

      const improved = change >= 0;
      const color = improved ? "text-green-500 text-sm ml-1" : "text-red-500 text-sm ml-1";
      const icon = improved ? getImprovedIcon(isInverted) : getDeclinedIcon(isInverted);

      return (
        <>
          {Math.abs(change).toFixed(1)}%<span className={color}>
            {icon}
          </span>
        </>
      );
    };

    if (!latestResult || !baselineResult) return null;

    // Get the values
    const baselineValue = baselineResult[metricKey];
    const latestValue = latestResult[metricKey];

    // Handle different cases
    if (baselineValue === 0) {
      if (latestValue === 0) {
        return renderZeroChange();
      }
      return renderZeroBaselineChange(latestValue);
    }

    return renderNormalChange(baselineValue, latestValue);
  }, [baselineResult, latestResult, metricKey, isInverted]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="metric-card overflow-hidden touch-friendly-control card-elevation-2 interactive-card">
            <div className={`h-3 w-full ${getCardColor}`}></div>
            <CardHeader className="p-6 sm:p-8 md:p-10 pb-3 sm:pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="dashboard-heading-4 flex items-center gap-3">
                  {icon}
                  {title}
                </CardTitle>
                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 md:p-10 pt-3 sm:pt-4">
              {isLoading ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    {latestResult && baselineResult && renderPercentageChange}
                  </div>
                  <div className="dashboard-text-secondary mt-3 sm:mt-0">{labelText}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="p-4 max-w-xs">
          <p className="dashboard-text">{tooltipText}</p>
          <p className="dashboard-text-small mt-3">{tooltipSubtext}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
