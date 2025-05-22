/**
 * Supplement Timeline Component
 *
 * Visualizes a timeline of supplement intake periods
 */
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, differenceInDays, isWithinInterval } from "date-fns";
import { Pill, Info } from "lucide-react";
import { PeriodType } from "@/utils/performanceCorrelationUtils";
import { DateRange } from "@/hooks/useDashboardFilters";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SupplementTimelineProps {
  /** Name of the supplement */
  supplementName: string;
  /** ID of the supplement */
  supplementId: string;
  /** Array of periods to display */
  periods: Array<{
    startDate: Date;
    endDate?: Date;
    type: PeriodType;
    supplementId?: string;
    supplementName?: string;
  }>;
  /** Date range for the timeline */
  dateRange: DateRange;
  /** Optional className for styling */
  className?: string;
}

/**
 * Component that visualizes a timeline of supplement intake periods
 */
export function SupplementTimeline({
  supplementName,
  supplementId,
  periods,
  dateRange,
  className,
}: Readonly<SupplementTimelineProps>): JSX.Element {
  // Filter periods for this supplement
  const supplementPeriods = periods.filter(
    (period) => period.supplementId === supplementId
  );

  // Calculate the total number of days in the date range
  const totalDays = differenceInDays(
    dateRange.to || new Date(),
    dateRange.from || new Date()
  );

  // Function to calculate the position and width of a period on the timeline
  const calculateTimelinePosition = (
    startDate: Date,
    endDate?: Date
  ): { left: string; width: string } => {
    const rangeStart = dateRange.from || new Date();
    const rangeEnd = dateRange.to || new Date();

    // Ensure the start date is within the range
    const effectiveStartDate = isWithinInterval(startDate, {
      start: rangeStart,
      end: rangeEnd,
    })
      ? startDate
      : startDate < rangeStart
      ? rangeStart
      : rangeEnd;

    // Ensure the end date is within the range
    const effectiveEndDate = endDate
      ? isWithinInterval(endDate, { start: rangeStart, end: rangeEnd })
        ? endDate
        : endDate > rangeEnd
        ? rangeEnd
        : rangeStart
      : new Date(); // If no end date, use current date

    // Calculate position and width as percentages
    const startOffset = differenceInDays(effectiveStartDate, rangeStart);
    const periodDuration = differenceInDays(
      effectiveEndDate,
      effectiveStartDate
    );

    const left = `${(startOffset / totalDays) * 100}%`;
    const width = `${(periodDuration / totalDays) * 100}%`;

    return { left, width };
  };

  // Function to format date range for tooltip
  const formatDateRange = (startDate: Date, endDate?: Date): string => {
    const start = format(startDate, "MMM d, yyyy");
    if (!endDate) {
      return `${start} - Present`;
    }
    const end = format(endDate, "MMM d, yyyy");
    return `${start} - ${end}`;
  };

  // Function to calculate duration for tooltip
  const calculateDuration = (startDate: Date, endDate?: Date): string => {
    const end = endDate || new Date();
    const days = differenceInDays(end, startDate);
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="h-4 w-4 text-primary" />
          <h3 className="font-medium">{supplementName}</h3>
        </div>

        <div className="relative h-8 bg-muted rounded-md mb-2">
          {/* Timeline markers */}
          <div className="absolute inset-0 flex justify-between px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-full w-px bg-muted-foreground/20"
                style={{ left: `${(i * 25)}%` }}
              />
            ))}
          </div>

          {/* Supplement periods */}
          {supplementPeriods.map((period, index) => {
            const { left, width } = calculateTimelinePosition(
              period.startDate,
              period.endDate
            );

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute h-6 top-1 rounded-md bg-primary/80 hover:bg-primary cursor-pointer transition-colors"
                      style={{ left, width }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{supplementName}</p>
                      <p className="text-xs">
                        {formatDateRange(period.startDate, period.endDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duration: {calculateDuration(period.startDate, period.endDate)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Timeline labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{dateRange.from ? format(dateRange.from, "MMM d") : ""}</span>
          <span>{dateRange.to ? format(dateRange.to, "MMM d") : ""}</span>
        </div>

        {/* Empty state */}
        {supplementPeriods.length === 0 && (
          <div className="flex items-center justify-center h-8 absolute inset-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>No data for this period</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
