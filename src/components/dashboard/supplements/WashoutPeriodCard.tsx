/**
 * Washout Period Card Component
 *
 * Displays information about a washout period between supplement cycles
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, differenceInDays, isBefore, isAfter } from "date-fns";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import {
  WashoutPeriod,
  ActiveWashoutPeriod,
  WashoutPeriodStatus,
} from "@/types/washoutPeriod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WashoutPeriodCardProps {
  /** The washout period to display */
  period: WashoutPeriod | ActiveWashoutPeriod;
  /** Optional className for styling */
  className?: string;
  /** Whether to use compact layout */
  compact?: boolean;
}

/**
 * Component that displays information about a washout period
 */
export function WashoutPeriodCard({
  period,
  className,
  compact = false,
}: Readonly<WashoutPeriodCardProps>): JSX.Element {
  // Calculate progress percentage
  const calculateProgress = (): number => {
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    const today = new Date();

    // If the period is completed or today is after the end date, return 100%
    if (
      period.status === WashoutPeriodStatus.COMPLETED ||
      isAfter(today, endDate)
    ) {
      return 100;
    }

    // If today is before the start date, return 0%
    if (isBefore(today, startDate)) {
      return 0;
    }

    // Calculate progress as percentage of days elapsed
    const totalDays = differenceInDays(endDate, startDate);
    const daysElapsed = differenceInDays(today, startDate);
    return Math.min(Math.round((daysElapsed / totalDays) * 100), 100);
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (period.status) {
      case WashoutPeriodStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case WashoutPeriodStatus.ACTIVE:
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case WashoutPeriodStatus.CANCELLED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (): number => {
    const endDate = new Date(period.end_date);
    const today = new Date();

    if (isAfter(today, endDate)) {
      return 0;
    }

    return differenceInDays(endDate, today);
  };

  // Format date range
  const formatDateRange = (): string => {
    const startDate = format(new Date(period.start_date), "MMM d, yyyy");
    const endDate = format(new Date(period.end_date), "MMM d, yyyy");
    return `${startDate} - ${endDate}`;
  };

  // Get progress color
  const getProgressColor = (): string => {
    const progress = calculateProgress();
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-green-400";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-blue-400";
    return "bg-blue-300";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Clock
              className={cn("text-blue-500", compact ? "h-4 w-4" : "h-5 w-5")}
            />
            <h3 className={cn("font-medium", compact && "text-sm")}>
              Washout Period
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-3">
          {/* Date range */}
          <div className="text-sm text-muted-foreground">
            {formatDateRange()}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress
              value={calculateProgress()}
              className="h-2"
              indicatorClassName={getProgressColor()}
            />
          </div>

          {/* Supplements being washed out */}
          {period.supplements && period.supplements.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">
                Supplements:
              </span>
              <div className="flex flex-wrap gap-1">
                {period.supplements.map((supplement, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs">
                          {supplement.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Last taken:{" "}
                          {format(
                            new Date(supplement.last_intake),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Days remaining (only for active periods) */}
          {period.status === WashoutPeriodStatus.ACTIVE && (
            <div className="text-xs text-muted-foreground">
              {getDaysRemaining()} days remaining
            </div>
          )}

          {/* Notes */}
          {period.notes && (
            <div className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Notes:</span> {period.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
