import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { Supplement } from "@/types/supplement";
import { ComparisonType } from "@/utils/comparativeAnalysisUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplementPeriodSelectorProps {
  supplements: Supplement[];
  isLoading: boolean;
  onComparisonChange: (
    comparisonType: ComparisonType,
    supplementId1: string,
    supplementId2?: string,
    dateRange?: { from: Date; to: Date },
  ) => void;
}

/**
 * Format date range for display
 * @param from Start date
 * @param to End date
 * @returns Formatted date range string or placeholder
 */
function formatDateRange(
  from: Date | undefined,
  to: Date | undefined,
): JSX.Element {
  if (!from) {
    return <span>Pick a date range</span>;
  }

  if (!to) {
    return <>{format(from, "LLL dd, y")}</>;
  }

  return (
    <>
      {format(from, "LLL dd, y")} - {format(to, "LLL dd, y")}
    </>
  );
}

export function SupplementPeriodSelector({
  supplements,
  isLoading,
  onComparisonChange,
}: Readonly<SupplementPeriodSelectorProps>) {
  const [comparisonType, setComparisonType] = useState<ComparisonType>(
    ComparisonType.ON_OFF,
  );
  const [supplementId1, setSupplementId1] = useState<string>("");
  const [supplementId2, setSupplementId2] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Update the comparison when inputs change
  useEffect(() => {
    if (supplementId1) {
      if (
        comparisonType === ComparisonType.BETWEEN_SUPPLEMENTS &&
        supplementId2
      ) {
        onComparisonChange(comparisonType, supplementId1, supplementId2);
      } else if (
        comparisonType === ComparisonType.BEFORE_AFTER &&
        dateRange.from &&
        dateRange.to
      ) {
        onComparisonChange(comparisonType, supplementId1, undefined, {
          from: dateRange.from,
          to: dateRange.to,
        });
      } else if (comparisonType === ComparisonType.ON_OFF) {
        onComparisonChange(comparisonType, supplementId1);
      }
    }
  }, [
    comparisonType,
    supplementId1,
    supplementId2,
    dateRange,
    onComparisonChange,
  ]);

  // Reset supplement2 when changing comparison type
  useEffect(() => {
    if (comparisonType !== ComparisonType.BETWEEN_SUPPLEMENTS) {
      setSupplementId2("");
    }
  }, [comparisonType]);

  // Set first supplement when supplements load
  useEffect(() => {
    if (supplements.length > 0 && !supplementId1) {
      setSupplementId1(supplements[0].id);
    }
  }, [supplements, supplementId1]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comparative Analysis</CardTitle>
            <CardDescription>
              Compare your performance during different supplement periods
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Compare your cognitive performance during different periods to
                  see how supplements affect you. You can compare on/off periods
                  for a supplement, or compare two different supplements.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="comparison-type"
              className="text-sm font-medium mb-2 block"
            >
              Comparison Type
            </label>
            <Tabs
              id="comparison-type"
              value={comparisonType}
              onValueChange={(value) =>
                setComparisonType(value as ComparisonType)
              }
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value={ComparisonType.ON_OFF}>
                  On/Off Periods
                </TabsTrigger>
                <TabsTrigger value={ComparisonType.BETWEEN_SUPPLEMENTS}>
                  Between Supplements
                </TabsTrigger>
                <TabsTrigger value={ComparisonType.BEFORE_AFTER}>
                  Before/After
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label
              htmlFor="supplement-select-1"
              className="text-sm font-medium mb-2 block"
            >
              {comparisonType === ComparisonType.BETWEEN_SUPPLEMENTS
                ? "First Supplement"
                : "Supplement"}
            </label>
            <Select
              value={supplementId1}
              onValueChange={setSupplementId1}
              disabled={supplements.length === 0}
            >
              <SelectTrigger id="supplement-select-1">
                <SelectValue placeholder="Select a supplement" />
              </SelectTrigger>
              <SelectContent>
                {supplements.map((supplement) => (
                  <SelectItem key={supplement.id} value={supplement.id}>
                    {supplement.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {comparisonType === ComparisonType.BETWEEN_SUPPLEMENTS && (
            <div>
              <label
                htmlFor="supplement-select-2"
                className="text-sm font-medium mb-2 block"
              >
                Second Supplement
              </label>
              <Select
                value={supplementId2}
                onValueChange={setSupplementId2}
                disabled={supplements.length <= 1}
              >
                <SelectTrigger id="supplement-select-2">
                  <SelectValue placeholder="Select a supplement" />
                </SelectTrigger>
                <SelectContent>
                  {supplements
                    .filter((supplement) => supplement.id !== supplementId1)
                    .map((supplement) => (
                      <SelectItem key={supplement.id} value={supplement.id}>
                        {supplement.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {comparisonType === ComparisonType.BEFORE_AFTER && (
            <div>
              <label
                htmlFor="date-range-picker"
                className="text-sm font-medium mb-2 block"
              >
                Date Range
              </label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-range-picker"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateRange(dateRange.from, dateRange.to)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from || new Date(),
                        to: dateRange.to || new Date(),
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({
                            from: range.from,
                            to: range.to,
                          });
                          onComparisonChange(
                            comparisonType,
                            supplementId1,
                            undefined,
                            { from: range.from, to: range.to },
                          );
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
