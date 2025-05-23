/**
 * Utilities for correlating cognitive performance with supplement intake
 */
import { TestResult } from '@/lib/testResultUtils';
import { Supplement } from '@/types/supplement';
import { WashoutPeriod, ActiveWashoutPeriod, WashoutPeriodStatus } from '@/types/washoutPeriod';

/**
 * Period types for categorizing test results
 */
export enum PeriodType {
  BASELINE = 'baseline',
  SUPPLEMENT = 'supplement',
  WASHOUT = 'washout',
  UNKNOWN = 'unknown'
}

/**
 * Interface for a time period with a specific type
 */
export interface Period {
  type: PeriodType;
  startDate: Date;
  endDate: Date | null;
  supplementId?: string;
  supplementName?: string;
  washoutPeriodId?: string;
}

/**
 * Interface for a test result with period information
 */
export interface EnrichedTestResult extends TestResult {
  periodType: PeriodType;
  supplementId?: string;
  supplementName?: string;
}

/**
 * Interface for performance data point on the chart
 */
export interface PerformanceDataPoint {
  date: Date;
  score: number;
  reactionTime: number;
  accuracy: number;
  periodType: PeriodType;
  supplementId?: string;
  supplementName?: string;
  isTestResult: boolean;
}

/**
 * Interface for supplement intake event
 */
export interface SupplementIntakeEvent {
  date: Date;
  supplementId: string;
  supplementName: string;
}

/**
 * Generate periods from supplements and washout periods
 */
export function generatePeriods(
  supplements: Supplement[],
  washoutPeriods: WashoutPeriod[] | ActiveWashoutPeriod[]
): Period[] {
  const periods: Period[] = [];

  // Sort supplements by intake time (oldest first)
  const sortedSupplements = [...supplements].sort(
    (a, b) => new Date(a.intake_time).getTime() - new Date(b.intake_time).getTime()
  );

  // Group supplements by name to create continuous periods
  const supplementGroups: { [key: string]: Supplement[] } = {};

  sortedSupplements.forEach(supplement => {
    if (!supplementGroups[supplement.name]) {
      supplementGroups[supplement.name] = [];
    }
    supplementGroups[supplement.name].push(supplement);
  });

  // Create supplement periods
  Object.entries(supplementGroups).forEach(([name, supplements]) => {
    // Sort by intake time
    const sortedGroupSupplements = supplements.sort(
      (a, b) => new Date(a.intake_time).getTime() - new Date(b.intake_time).getTime()
    );

    // Create periods based on supplement frequency
    sortedGroupSupplements.forEach(supplement => {
      // For simplicity, we'll consider each supplement intake as a 7-day period
      // This can be refined based on the actual frequency data
      const startDate = new Date(supplement.intake_time);

      // Determine end date based on frequency
      const endDate: Date | null = new Date(startDate);

      if (supplement.frequency === 'daily') {
        endDate.setDate(endDate.getDate() + 1);
      } else if (supplement.frequency === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else if (supplement.frequency === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        // Default to 7 days if frequency is not specified
        endDate.setDate(endDate.getDate() + 7);
      }

      periods.push({
        type: PeriodType.SUPPLEMENT,
        startDate,
        endDate,
        supplementId: supplement.id,
        supplementName: supplement.name
      });
    });
  });

  // Add washout periods
  washoutPeriods.forEach(washoutPeriod => {
    const startDate = new Date(washoutPeriod.start_date);
    let endDate: Date | null = null;

    if (washoutPeriod.end_date) {
      endDate = new Date(washoutPeriod.end_date);
    } else if (washoutPeriod.status === WashoutPeriodStatus.ACTIVE && washoutPeriod.expected_duration_days) {
      // For active washout periods, use expected duration
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + washoutPeriod.expected_duration_days);
    }

    periods.push({
      type: PeriodType.WASHOUT,
      startDate,
      endDate,
      supplementName: washoutPeriod.supplement_name,
      washoutPeriodId: washoutPeriod.id
    });
  });

  // Sort periods by start date
  return periods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Determine the period type for a given test result
 */
export function determineTestPeriodType(
  test: TestResult,
  periods: Period[]
): { periodType: PeriodType; supplementId?: string; supplementName?: string } {
  const testDate = new Date(test.date);

  // Check if the test falls within any period
  for (const period of periods) {
    if (testDate >= period.startDate && (!period.endDate || testDate <= period.endDate)) {
      return {
        periodType: period.type,
        supplementId: period.supplementId,
        supplementName: period.supplementName
      };
    }
  }

  // If no matching period is found, return unknown
  return { periodType: PeriodType.UNKNOWN };
}

/**
 * Enrich test results with period information
 */
export function enrichTestResults(
  testResults: TestResult[],
  periods: Period[]
): EnrichedTestResult[] {
  return testResults.map(test => {
    const { periodType, supplementId, supplementName } = determineTestPeriodType(test, periods);

    return {
      ...test,
      periodType,
      supplementId,
      supplementName
    };
  });
}

/**
 * Generate performance data points for charting
 */
export function generatePerformanceDataPoints(
  testResults: EnrichedTestResult[],
  supplements: Supplement[]
): PerformanceDataPoint[] {
  const dataPoints: PerformanceDataPoint[] = [];

  // Add test results as data points
  testResults.forEach(test => {
    dataPoints.push({
      date: new Date(test.date),
      score: test.score,
      reactionTime: test.reactionTime,
      accuracy: test.accuracy,
      periodType: test.periodType,
      supplementId: test.supplementId,
      supplementName: test.supplementName,
      isTestResult: true
    });
  });

  // Sort by date
  return dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Generate supplement intake events for visualization
 */
export function generateSupplementIntakeEvents(
  supplements: Supplement[]
): SupplementIntakeEvent[] {
  return supplements.map(supplement => ({
    date: new Date(supplement.intake_time),
    supplementId: supplement.id,
    supplementName: supplement.name
  }));
}

/**
 * Filter performance data by date range
 */
export function filterByDateRange(
  data: PerformanceDataPoint[],
  startDate?: Date,
  endDate?: Date
): PerformanceDataPoint[] {
  if (!startDate && !endDate) return data;

  return data.filter(point => {
    if (startDate && point.date < startDate) return false;
    if (endDate && point.date > endDate) return false;
    return true;
  });
}

/**
 * Filter performance data by supplement
 */
export function filterBySupplement(
  data: PerformanceDataPoint[],
  supplementId?: string
): PerformanceDataPoint[] {
  if (!supplementId) return data;

  return data.filter(point =>
    point.supplementId === supplementId || point.periodType === PeriodType.BASELINE
  );
}

/**
 * Format date for display
 */
export function formatChartDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
