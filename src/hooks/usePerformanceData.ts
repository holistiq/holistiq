import { useMemo } from 'react';
import { TestResult } from '@/lib/testResultUtils';
import { Supplement } from '@/types/supplement';
import { WashoutPeriod, ActiveWashoutPeriod } from '@/types/washoutPeriod';
import {
  generatePeriods,
  enrichTestResults,
  generatePerformanceDataPoints,
  filterByDateRange,
  filterBySupplement,
  formatChartDate
} from '@/utils/performanceCorrelationUtils';

/**
 * Interface for the date range
 */
interface DateRange {
  from?: Date;
  to?: Date;
}

/**
 * Interface for the supplement option
 */
interface SupplementOption {
  id: string;
  name: string;
}

/**
 * Interface for the performance data hook result
 */
interface PerformanceDataResult {
  periods: ReturnType<typeof generatePeriods>;
  filteredData: ReturnType<typeof generatePerformanceDataPoints>;
  chartData: Array<ReturnType<typeof generatePerformanceDataPoints>[number] & { 
    date: number;
    formattedDate: string;
  }>;
  uniqueSupplements: SupplementOption[];
  hasData: boolean;
}

/**
 * Custom hook for processing performance data
 * 
 * @param testResults - Array of test results
 * @param supplements - Array of supplements
 * @param washoutPeriods - Array of washout periods
 * @param dateRange - Date range for filtering
 * @param selectedSupplement - Selected supplement ID for filtering
 * @returns Processed performance data
 */
export function usePerformanceData(
  testResults: TestResult[],
  supplements: Supplement[],
  washoutPeriods: WashoutPeriod[] | ActiveWashoutPeriod[],
  dateRange: DateRange,
  selectedSupplement: string
): PerformanceDataResult {
  // Process data for visualization
  return useMemo(() => {
    // Generate periods from supplements and washout periods
    const periods = generatePeriods(supplements, washoutPeriods);

    // Enrich test results with period information
    const enrichedTestResults = enrichTestResults(testResults, periods);

    // Generate performance data points
    const performanceData = generatePerformanceDataPoints(enrichedTestResults, supplements);

    // Apply filters
    let filteredData = filterByDateRange(
      performanceData,
      dateRange.from,
      dateRange.to
    );

    if (selectedSupplement !== 'all') {
      filteredData = filterBySupplement(filteredData, selectedSupplement);
    }

    // Format data for charts
    const chartData = filteredData.map(point => ({
      ...point,
      date: point.date.getTime(), // Convert to timestamp for Recharts
      formattedDate: formatChartDate(point.date)
    }));

    // Get unique supplements for the filter dropdown
    const uniqueSupplements = Array.from(
      new Set(supplements.map(s => s.name))
    ).map(name => {
      const supplement = supplements.find(s => s.name === name);
      return {
        id: supplement?.id || '',
        name
      };
    });

    return {
      periods,
      filteredData,
      chartData,
      uniqueSupplements,
      hasData: testResults.length > 0
    };
  }, [testResults, supplements, washoutPeriods, dateRange, selectedSupplement]);
}
