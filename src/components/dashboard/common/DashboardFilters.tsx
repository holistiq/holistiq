import React, { useCallback } from 'react';
import { format, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

/**
 * Interface for supplement option
 */
interface SupplementOption {
  readonly id: string;
  readonly name: string;
}

/**
 * Props for the DashboardFilters component
 */
export interface DashboardFiltersProps {
  readonly dateRange: {
    from?: Date;
    to?: Date;
  };
  readonly setDateRange: React.Dispatch<React.SetStateAction<{ from?: Date; to?: Date }>>;
  readonly selectedSupplement: string;
  readonly setSelectedSupplement: (id: string) => void;
  readonly supplementOptions: SupplementOption[];
}

/**
 * Component for rendering dashboard filters
 * Includes date range picker and supplement selector
 */
export function DashboardFilters({
  dateRange,
  setDateRange,
  selectedSupplement,
  setSelectedSupplement,
  supplementOptions
}: Readonly<DashboardFiltersProps>): JSX.Element {
  /**
   * Renders the date range text for the date picker button
   */
  const renderDateRangeText = useCallback((): JSX.Element => {
    if (!dateRange.from) {
      return <span>Pick a date range</span>;
    }

    if (!dateRange.to) {
      return <span>{format(dateRange.from, "LLL dd, y")}</span>;
    }

    return (
      <span>
        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
      </span>
    );
  }, [dateRange.from, dateRange.to]);

  /**
   * Resets all filters to their default values
   */
  const resetFilters = useCallback((): void => {
    setSelectedSupplement('all');
    setDateRange({
      from: subMonths(new Date(), 12),
      to: new Date()
    });
  }, [setSelectedSupplement, setDateRange]);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal"
            aria-label="Select date range"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {renderDateRangeText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(range) => {
              if (range) {
                setDateRange({
                  from: range.from,
                  to: range.to
                });
              } else {
                setDateRange({ from: undefined, to: undefined });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Supplement Filter */}
      <Select
        value={selectedSupplement}
        onValueChange={setSelectedSupplement}
        aria-label="Filter by supplement"
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by supplement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Supplements</SelectItem>
          {supplementOptions.map((supplement) => (
            <SelectItem key={supplement.id} value={supplement.id}>
              {supplement.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset Filters Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={resetFilters}
        title="Reset filters"
        aria-label="Reset filters"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
