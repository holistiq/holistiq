/**
 * Chart Utilities
 *
 * Provides utility functions for processing and formatting chart data
 */
import { TestResult } from '@/lib/testResultUtils';
import { format, subDays } from 'date-fns';
import { debugWarn, debugError } from '@/utils/debugUtils';

/**
 * Represents a formatted test result for chart display
 */
export interface FormattedTestResult {
  date: number;
  formattedDate: string;
  score: number;
  reactionTime: number;
  accuracy: number;
  scoreMA?: number;
  reactionTimeMA?: number;
  accuracyMA?: number;
  scoreTrend?: number;
  reactionTimeTrend?: number;
  accuracyTrend?: number;
  originalDate?: number | string;
}

/**
 * Metadata about accuracy values
 */
export interface AccuracyMetadata {
  hasSmallAccuracyRange: boolean;
  accuracyRange: number;
  minAccuracy: number;
  maxAccuracy: number;
}

/**
 * Processed chart data
 */
export interface ProcessedChartData {
  chartData: FormattedTestResult[];
  finalChartData: FormattedTestResult[];
  accuracyMetadata: AccuracyMetadata;
}

/**
 * Options for processing chart data
 */
export interface ProcessChartDataOptions {
  timeRange: 'all' | '7d' | '30d' | '90d';
  movingAverageWindow?: number;
  includeMovingAverage?: boolean;
  baselineResult?: TestResult | null;
}

/**
 * Type for chart metric keys
 */
export type MetricKey = 'score' | 'reactionTime' | 'accuracy';

/**
 * Chart configuration type
 */
export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
    yAxisId: string;
  };
}

/**
 * Chart configuration for metrics
 */
export function getChartConfig() {
  return {
    score: {
      label: 'Score',
      color: 'hsl(var(--primary))',
      yAxisId: 'score'
    },
    reactionTime: {
      label: 'Reaction Time',
      color: 'hsl(var(--destructive))',
      yAxisId: 'reactionTime'
    },
    accuracy: {
      label: 'Accuracy',
      color: '#22c55e',
      yAxisId: 'accuracy'
    }
  };
}

/**
 * Process test results for chart display
 */
export function processChartData(
  testResults: TestResult[],
  options: ProcessChartDataOptions | 'all' | '30d' | '90d'
): ProcessedChartData {
  // Handle backward compatibility with old function signature
  const timeRange = typeof options === 'string' ? options : options.timeRange;
  const movingAverageWindow = typeof options === 'string' ? 3 : (options.movingAverageWindow || 3);
  const includeMovingAverage = typeof options === 'string' ? true : (options.includeMovingAverage !== false);

  // Process chart data with the given options

  if (!testResults || testResults.length === 0) {
    return {
      chartData: [],
      finalChartData: [],
      accuracyMetadata: {
        hasSmallAccuracyRange: false,
        accuracyRange: 0,
        minAccuracy: 0,
        maxAccuracy: 0
      }
    };
  }

  // Make a copy of the test results to avoid modifying the original
  const results = [...testResults];

  // Filter out any results with invalid dates
  const validResults = results.filter(result => {
    const date = new Date(result.date);
    const isValid = !isNaN(date.getTime());
    if (!isValid) {
      debugWarn("Filtered out test result with invalid date:", result);
    }
    return isValid;
  });

  if (validResults.length === 0) {
    debugWarn("No valid test results after date validation");
    return {
      chartData: [],
      finalChartData: [],
      accuracyMetadata: {
        hasSmallAccuracyRange: false,
        accuracyRange: 0,
        minAccuracy: 0,
        maxAccuracy: 0
      }
    };
  }

  // Sort by date (oldest first)
  validResults.sort((a, b) => {
    const dateA = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
    const dateB = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
    return dateA - dateB;
  });

  // Remove duplicates (same date)
  const uniqueResults = removeDuplicates(validResults);

  // Filter and format test results
  let chartData = formatTestResults(uniqueResults);

  // Calculate trends between consecutive data points
  chartData = calculateTrends(chartData);

  // Always remove any existing MA data first to ensure clean state
  chartData = chartData.map(point => {
    // Create a new object without any MA properties
    const { scoreMA, reactionTimeMA, accuracyMA, ...rest } = point;
    return rest;
  });

  // Calculate moving averages if needed
  if (includeMovingAverage) {
    chartData = calculateMovingAverage(chartData, 'score', movingAverageWindow);
    chartData = calculateMovingAverage(chartData, 'reactionTime', movingAverageWindow);
    chartData = calculateMovingAverage(chartData, 'accuracy', movingAverageWindow);
  }

  // Apply time range filter if needed
  chartData = applyTimeRangeFilter(chartData, timeRange);

  // For a single data point, create a duplicate point to show a line
  let finalChartData = createFinalChartData(chartData);

  // Ensure MA data consistency with the includeMovingAverage flag
  const finalHasMAData = finalChartData.some(point =>
    'scoreMA' in point || 'reactionTimeMA' in point || 'accuracyMA' in point
  );

  // If there's a mismatch between expected and actual MA data presence, fix it
  if (includeMovingAverage !== finalHasMAData) {
    if (includeMovingAverage && !finalHasMAData) {
      // Recalculate MA data if it should be present but isn't
      let fixedData = calculateMovingAverage(finalChartData, 'score', movingAverageWindow);
      fixedData = calculateMovingAverage(fixedData, 'reactionTime', movingAverageWindow);
      finalChartData = calculateMovingAverage(fixedData, 'accuracy', movingAverageWindow);
    } else if (!includeMovingAverage && finalHasMAData) {
      // Remove MA data if it shouldn't be present but is
      finalChartData = finalChartData.map(point => {
        const { scoreMA, reactionTimeMA, accuracyMA, ...rest } = point;
        return rest;
      });
    }
  }

  // Calculate accuracy metadata
  const accuracyMetadata = calculateAccuracyMetadata(finalChartData);

  return {
    chartData,
    finalChartData,
    accuracyMetadata
  };
}

/**
 * Remove duplicate test results with the same timestamp
 */
function removeDuplicates(results: TestResult[]): TestResult[] {
  const uniqueTimestamps = new Map<string, TestResult>();

  results.forEach(result => {
    try {
      // Get a consistent timestamp key for comparison
      let timestampKey: string;

      if (typeof result.date === 'number') {
        timestampKey = new Date(result.date).toISOString();
      } else if (typeof result.date === 'string') {
        let dateStr = result.date;

        if (dateStr.includes(' ') && dateStr.includes('+00')) {
          dateStr = dateStr.replace(' ', 'T').replace('+00', 'Z');
        }

        const dateObj = new Date(dateStr);

        if (isNaN(dateObj.getTime())) {
          return; // Skip this result
        }

        timestampKey = dateObj.toISOString();
      } else {
        return; // Skip this result
      }

      uniqueTimestamps.set(timestampKey, result);
    } catch (error) {
      debugError("Error processing date in removeDuplicates:", error);
    }
  });

  return Array.from(uniqueTimestamps.values());
}

/**
 * Format test results for chart display
 */
function formatTestResults(results: TestResult[]): FormattedTestResult[] {
  return results.map((result, index) => {
    try {
      // Parse the date
      const dateValue = parseDate(result.date);

      // Format the date for display
      const formattedDate = format(new Date(dateValue), 'MMM d, yyyy');

      // Parse numeric values
      const score = parseNumericValue(result.score, 0, 100);
      const reactionTime = parseNumericValue(result.reactionTime, 0, 5000);
      const accuracy = parseNumericValue(result.accuracy, 0, 100);

      return {
        date: dateValue,
        formattedDate,
        score,
        reactionTime,
        accuracy,
        originalDate: result.date
      };
    } catch (error) {
      debugError("Error formatting test result:", error, result);

      return {
        date: 0,
        formattedDate: 'Invalid Date',
        score: 0,
        reactionTime: 0,
        accuracy: 0
      };
    }
  });
}

/**
 * Parse a date value to a timestamp
 */
function parseDate(dateValue: any): number {
  if (typeof dateValue === 'number') {
    return dateValue;
  } else if (typeof dateValue === 'string') {
    let dateStr = dateValue;

    if (dateStr.includes(' ') && dateStr.includes('+00')) {
      dateStr = dateStr.replace(' ', 'T').replace('+00', 'Z');
    }

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateValue}`);
    }

    return date.getTime();
  } else {
    throw new Error(`Unsupported date format: ${dateValue}`);
  }
}

/**
 * Parse a numeric value with bounds
 */
function parseNumericValue(value: any, min: number, max: number): number {
  let parsedValue = 0;

  if (typeof value === 'number') {
    parsedValue = value;
  } else if (value) {
    parsedValue = parseFloat(String(value));
  }

  if (isNaN(parsedValue) || parsedValue < min || parsedValue > max) {
    parsedValue = min;
  }

  return parsedValue;
}

/**
 * Calculate trends between consecutive data points
 */
function calculateTrends(data: FormattedTestResult[]): FormattedTestResult[] {
  if (data.length <= 1) return data;

  return data.map((point, index) => {
    if (index === 0) return point;

    const prevPoint = data[index - 1];

    // Calculate percentage change and round to 1 decimal place
    const scoreTrend = Math.round(((point.score - prevPoint.score) / prevPoint.score) * 1000) / 10;
    const reactionTimeTrend = Math.round(((prevPoint.reactionTime - point.reactionTime) / prevPoint.reactionTime) * 1000) / 10;
    const accuracyTrend = Math.round(((point.accuracy - prevPoint.accuracy) / prevPoint.accuracy) * 1000) / 10;

    return {
      ...point,
      scoreTrend,
      reactionTimeTrend,
      accuracyTrend
    };
  });
}

/**
 * Calculate moving average for a specific metric
 */
function calculateMovingAverage(
  data: FormattedTestResult[],
  metric: 'score' | 'reactionTime' | 'accuracy',
  windowSize: number = 3
): FormattedTestResult[] {
  if (data.length <= 1) {
    return data;
  }

  // Ensure window size is at least 2 and not larger than the data length
  const effectiveWindowSize = Math.min(Math.max(2, windowSize), data.length);
  const maKey = `${metric}MA` as keyof FormattedTestResult;

  return data.map((point, index) => {
    // For the first few points, we don't have enough data for a moving average
    if (index < effectiveWindowSize - 1) {
      return point;
    }

    // Calculate the sum of the current and previous points
    let sum = 0;
    for (let i = 0; i < effectiveWindowSize; i++) {
      sum += data[index - i][metric];
    }

    // Calculate the average
    const average = sum / effectiveWindowSize;

    // Return a new point with the moving average
    return {
      ...point,
      [maKey]: average
    };
  });
}

/**
 * Apply time range filter to chart data
 */
function applyTimeRangeFilter(
  data: FormattedTestResult[],
  timeRange: 'all' | '7d' | '30d' | '90d'
): FormattedTestResult[] {
  if (timeRange === 'all' || data.length === 0) {
    return data;
  }

  const now = new Date();
  let cutoffDate: number;

  switch (timeRange) {
    case '7d':
      cutoffDate = subDays(now, 7).getTime();
      break;
    case '30d':
      cutoffDate = subDays(now, 30).getTime();
      break;
    case '90d':
      cutoffDate = subDays(now, 90).getTime();
      break;
    default:
      return data;
  }

  return data.filter(point => point.date >= cutoffDate);
}

/**
 * Prepare final chart data, handling edge cases like single data points
 */
function createFinalChartData(data: FormattedTestResult[]): FormattedTestResult[] {
  if (data.length === 0) {
    return [];
  }

  if (data.length === 1) {
    try {
      // Create a duplicate point 1 day before for single data points
      const originalPoint = data[0];

      // Ensure the original point has a valid date
      if (originalPoint.date === 0) {
        return [];
      }

      const newDate = new Date(originalPoint.date);
      newDate.setDate(newDate.getDate() - 1);

      // Preserve MA properties if they exist
      const duplicatePoint: FormattedTestResult = {
        ...originalPoint,
        date: newDate.getTime(),
        formattedDate: format(newDate, 'MMM d, yyyy')
      };

      return [duplicatePoint, originalPoint];
    } catch (error) {
      debugError("Error creating duplicate point:", error);
      return data;
    }
  }

  // For multiple points, ensure they're sorted by date
  const sortedData = [...data].sort((a, b) => a.date - b.date);

  // Check if all data points are from the same day
  const allSameDay = sortedData.length > 1 && sortedData.every((point, index) => {
    if (index === 0) return true;
    const currentDate = new Date(point.date);
    const previousDate = new Date(sortedData[index - 1].date);
    return currentDate.getFullYear() === previousDate.getFullYear() &&
           currentDate.getMonth() === previousDate.getMonth() &&
           currentDate.getDate() === previousDate.getDate();
  });

  // If all points are from the same day, spread them out for better visualization
  if (allSameDay && sortedData.length > 1) {
    // Create a copy of the data with adjusted dates
    const result = sortedData.map((point, index) => {
      if (index === 0) return point; // Keep the first point as is

      // Create a new date by adding days based on the index
      const newDate = new Date(point.date);
      newDate.setDate(newDate.getDate() + index); // Add days based on index

      // Update the formatted date
      const formattedDate = format(newDate, 'MMM d, yyyy');

      // Return the point with the adjusted date, preserving all properties
      return {
        ...point,
        date: newDate.getTime(),
        formattedDate,
        originalDate: point.date // Keep the original date for reference
      };
    });

    return result;
  }

  return sortedData;
}

/**
 * Calculate accuracy metadata
 */
function calculateAccuracyMetadata(data: FormattedTestResult[]): AccuracyMetadata {
  if (data.length === 0) {
    return {
      hasSmallAccuracyRange: false,
      accuracyRange: 0,
      minAccuracy: 0,
      maxAccuracy: 0
    };
  }

  // Calculate min and max accuracy
  const accuracies = data.map(point => point.accuracy);
  const minAccuracy = Math.min(...accuracies);
  const maxAccuracy = Math.max(...accuracies);
  const accuracyRange = maxAccuracy - minAccuracy;

  // Determine if the accuracy range is small
  const hasSmallAccuracyRange = accuracyRange < 5;

  return {
    hasSmallAccuracyRange,
    accuracyRange,
    minAccuracy,
    maxAccuracy
  };
}

/**
 * Get baseline values for reference lines
 */
export function getBaselineValues(baselineResult: TestResult | null) {
  if (!baselineResult) {
    return null;
  }

  // Validate score
  const score = typeof baselineResult.score === 'number' && !isNaN(baselineResult.score)
    ? baselineResult.score
    : null;

  // Validate reaction time
  const reactionTime = typeof baselineResult.reactionTime === 'number' && !isNaN(baselineResult.reactionTime)
    ? baselineResult.reactionTime
    : null;

  // Validate accuracy
  const accuracy = typeof baselineResult.accuracy === 'number' && !isNaN(baselineResult.accuracy)
    ? baselineResult.accuracy
    : null;

  return {
    score,
    reactionTime,
    accuracy
  };
}

/**
 * Direction type for trend indicators
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Calculate trend data for metrics
 */
export function calculateTrendData(data: FormattedTestResult[]) {
  if (data.length < 2) {
    return {};
  }

  // Get the first and last data points
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    return previous === 0 ? 0 : ((current - previous) / previous) * 100;
  };

  // Calculate direction and percentage for each metric
  const scoreTrend = calculateChange(lastPoint.score, firstPoint.score);
  const reactionTimeTrend = calculateChange(firstPoint.reactionTime, lastPoint.reactionTime); // Inverted for reaction time
  const accuracyTrend = calculateChange(lastPoint.accuracy, firstPoint.accuracy);

  // Determine direction
  const getDirection = (value: number, isInverted = false): TrendDirection => {
    if (Math.abs(value) < 0.5) {
      return 'neutral'; // Less than 0.5% change is considered neutral
    }

    let direction: TrendDirection;
    if (isInverted) {
      direction = value < 0 ? 'down' : 'up';
    } else {
      direction = value > 0 ? 'down' : 'up';
    }

    return direction;
  };

  return {
    score: {
      direction: getDirection(scoreTrend),
      percentage: Math.abs(scoreTrend)
    },
    reactionTime: {
      direction: getDirection(reactionTimeTrend, true),
      percentage: Math.abs(reactionTimeTrend)
    },
    accuracy: {
      direction: getDirection(accuracyTrend),
      percentage: Math.abs(accuracyTrend)
    }
  };
}

/**
 * Calculate data statistics for axis scaling
 */
export function calculateDataStats(chartData: FormattedTestResult[]) {
  const scores = chartData.map(d => d.score);
  const reactionTimes = chartData.map(d => d.reactionTime);
  const accuracies = chartData.map(d => d.accuracy);

  // Filter out any undefined or NaN values
  const validScores = scores.filter(s => s !== undefined && !isNaN(s));
  const validReactionTimes = reactionTimes.filter(r => r !== undefined && !isNaN(r));
  const validAccuracies = accuracies.filter(a => a !== undefined && !isNaN(a));

  // If there are no valid values, use default ranges
  const minScore = validScores.length > 0 ? Math.min(...validScores) : 0;
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : 100;

  const minReactionTime = validReactionTimes.length > 0 ? Math.min(...validReactionTimes) : 0;
  const maxReactionTime = validReactionTimes.length > 0 ? Math.max(...validReactionTimes) : 1000;

  const minAccuracy = validAccuracies.length > 0 ? Math.min(...validAccuracies) : 0;
  const maxAccuracy = validAccuracies.length > 0 ? Math.max(...validAccuracies) : 100;

  return {
    score: {
      min: minScore,
      max: maxScore
    },
    reactionTime: {
      min: minReactionTime,
      max: maxReactionTime
    },
    accuracy: {
      min: minAccuracy,
      max: maxAccuracy
    }
  };
}
