/**
 * Custom hook for managing dashboard filters
 */
import { useState, useCallback, useMemo } from "react";
import { subMonths } from "date-fns";

/**
 * Interface for date range
 */
export interface DateRange {
  from?: Date;
  to?: Date;
}

/**
 * Interface for supplement option
 */
export interface SupplementOption {
  readonly id: string;
  readonly name: string;
}

/**
 * Interface for dashboard filters hook result
 */
export interface DashboardFiltersResult {
  // Filter state
  dateRange: DateRange;
  selectedSupplement: string;

  // Filter setters
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  setSelectedSupplement: (id: string) => void;

  // Helper functions
  resetFilters: () => void;
}

/**
 * Custom hook for managing dashboard filters
 *
 * @param initialDateRange - Initial date range
 * @param initialSupplement - Initial selected supplement
 * @returns Dashboard filters state and functions
 */
export function useDashboardFilters(
  initialDateRange?: DateRange,
  initialSupplement: string = "all",
): DashboardFiltersResult {
  // Default date range is last 12 months, memoized to prevent recreation on each render
  const defaultDateRange = useMemo<DateRange>(
    () => ({
      from: subMonths(new Date(), 12),
      to: new Date(),
    }),
    [],
  );

  // Initialize state
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || defaultDateRange,
  );
  const [selectedSupplement, setSelectedSupplement] =
    useState<string>(initialSupplement);

  /**
   * Reset filters to default values
   */
  const resetFilters = useCallback((): void => {
    setSelectedSupplement("all");
    setDateRange(defaultDateRange);
  }, [defaultDateRange]);

  return {
    // Filter state
    dateRange,
    selectedSupplement,

    // Filter setters
    setDateRange,
    setSelectedSupplement,

    // Helper functions
    resetFilters,
  };
}
