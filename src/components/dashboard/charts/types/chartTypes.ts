import { TooltipProps } from 'recharts';

/**
 * Interface for moving average trend data
 */
export interface MATrendData {
  scoreMA?: number;
  reactionTimeMA?: number;
  accuracyMA?: number;
}

/**
 * Interface for chart data point
 */
export interface ChartDataPoint {
  date: number;
  formattedDate: string;
  score?: number;
  scoreMA?: number;
  reactionTime?: number;
  reactionTimeMA?: number;
  accuracy?: number;
  accuracyMA?: number;
  originalDate?: number;
  scoreMATrend?: number;
  reactionTimeMATrend?: number;
  accuracyMATrend?: number;
  [key: string]: unknown;
}

/**
 * Interface for processed chart data
 */
export interface ProcessedChartData {
  finalChartData: ChartDataPoint[];
  [key: string]: unknown;
}

/**
 * Interface for chart configuration
 */
export interface ChartConfig {
  score: {
    color: string;
    [key: string]: unknown;
  };
  reactionTime: {
    color: string;
    [key: string]: unknown;
  };
  accuracy: {
    color: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Interface for chart trend data
 */
export interface ChartTrendData {
  score?: {
    direction: string;
    percentage: number;
  };
  reactionTime?: {
    direction: string;
    percentage: number;
  };
  accuracy?: {
    direction: string;
    percentage: number;
  };
  [key: string]: unknown;
}

/**
 * Interface for chart data statistics
 */
export interface ChartDataStats {
  score: {
    min: number;
    max: number;
  };
  reactionTime: {
    min: number;
    max: number;
  };
  accuracy: {
    min: number;
    max: number;
  };
  [key: string]: unknown;
}

/**
 * Interface for baseline values
 */
export interface BaselineValues {
  score: number | null;
  reactionTime: number | null;
  accuracy: number | null;
  [key: string]: unknown;
}

/**
 * Type for recharts tooltip props with our data
 */
export type ChartTooltipProps = TooltipProps<number, string>;
