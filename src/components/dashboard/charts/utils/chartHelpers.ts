import { FormattedTestResult } from './chartUtils';

/**
 * Helper function to create reference line data
 * Extracted to reduce cognitive complexity in the main component
 */
export function createReferenceLineData(chartData: FormattedTestResult[], value: number) {
  if (!chartData || chartData.length === 0) return [];
  if (chartData.length === 1) {
    // If only one point, create two points to form a line
    const point = chartData[0];
    return [
      { date: point.date - 86400000, value }, // One day before
      { date: point.date, value }
    ];
  }

  // Use only first and last points for efficiency
  return [
    { date: chartData[0].date, value },
    { date: chartData[chartData.length - 1].date, value }
  ];
}

/**
 * Calculate moving average trend data
 * Extracted to reduce cognitive complexity in the main component
 */
export function calculateMATrendData(chartData: FormattedTestResult[]) {
  // Filter out points that don't have MA values
  const maPoints = chartData.filter(point =>
    point.scoreMA !== undefined ||
    point.reactionTimeMA !== undefined ||
    point.accuracyMA !== undefined
  );

  if (maPoints.length < 2) {
    return {
      scoreMA: 0,
      reactionTimeMA: 0,
      accuracyMA: 0
    };
  }

  // Get first and last points with MA values
  const firstPoint = maPoints[0];
  const lastPoint = maPoints[maPoints.length - 1];

  // Calculate percentage changes for MA values
  const calculateChange = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    scoreMA: calculateChange(lastPoint.scoreMA, firstPoint.scoreMA),
    reactionTimeMA: calculateChange(firstPoint.reactionTimeMA, lastPoint.reactionTimeMA), // Inverted for reaction time
    accuracyMA: calculateChange(lastPoint.accuracyMA, firstPoint.accuracyMA)
  };
}
