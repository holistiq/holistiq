import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  StatisticalAnalysisOptions,
  ContextType
} from '@/types/statisticalSignificance';
import { Supplement } from '@/types/supplement';
import { ConfoundingFactor } from '@/types/confoundingFactor';

interface StatisticalSignificanceFormProps {
  readonly onSubmit: (options: StatisticalAnalysisOptions) => void;
  readonly isLoading?: boolean;
  readonly supplements?: Supplement[];
  readonly confoundingFactors?: ConfoundingFactor[];
}

export function StatisticalSignificanceForm({
  onSubmit,
  isLoading = false,
  supplements = [],
  confoundingFactors = []
}: Readonly<StatisticalSignificanceFormProps>): JSX.Element {
  // Test type options
  const testTypes = [
    { value: 'n-back-2', label: 'N-Back (2)' },
    { value: 'reaction-time', label: 'Reaction Time' },
    { value: 'memory-span', label: 'Memory Span' }
  ];

  // Form state
  const [testType, setTestType] = useState('n-back-2');
  const [baselineStart, setBaselineStart] = useState<Date | undefined>(subDays(new Date(), 30));
  const [baselineEnd, setBaselineEnd] = useState<Date | undefined>(subDays(new Date(), 16));
  const [comparisonStart, setComparisonStart] = useState<Date | undefined>(subDays(new Date(), 15));
  const [comparisonEnd, setComparisonEnd] = useState<Date | undefined>(new Date());
  const [contextType, setContextType] = useState<ContextType>(ContextType.GENERAL);
  const [contextId, setContextId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    // Validate dates
    if (!baselineStart || !baselineEnd || !comparisonStart || !comparisonEnd) {
      toast({
        title: "Missing dates",
        description: "Please select all date ranges for the analysis.",
        variant: "destructive"
      });
      return;
    }

    // Validate date order
    if (baselineStart > baselineEnd || comparisonStart > comparisonEnd || baselineEnd > comparisonStart) {
      toast({
        title: "Invalid date range",
        description: "Please ensure dates are in chronological order: baseline start → baseline end → comparison start → comparison end.",
        variant: "destructive"
      });
      return;
    }

    // Prepare options
    const options: StatisticalAnalysisOptions = {
      testType,
      baselinePeriodStart: baselineStart.toISOString(),
      baselinePeriodEnd: baselineEnd.toISOString(),
      comparisonPeriodStart: comparisonStart.toISOString(),
      comparisonPeriodEnd: comparisonEnd.toISOString(),
      contextType
    };

    // Add context ID and name if applicable
    if (contextType !== ContextType.GENERAL && contextId) {
      options.contextId = contextId;

      // Find the name based on context type
      if (contextType === ContextType.SUPPLEMENT) {
        const supplement = supplements.find(s => s.id === contextId);
        if (supplement) {
          options.contextName = supplement.name;
        }
      } else if (contextType === ContextType.CONFOUNDING_FACTOR) {
        const factor = confoundingFactors.find(f => f.id === contextId);
        if (factor) {
          options.contextName = `Factor from ${format(new Date(factor.recorded_at), "MMM d, yyyy")}`;
        }
      }
    }

    onSubmit(options);
  };

  // Get context options based on selected context type
  const getContextOptions = (): Array<{ value: string; label: string }> => {
    if (contextType === ContextType.SUPPLEMENT) {
      return supplements.map(supplement => ({
        value: supplement.id,
        label: supplement.name
      }));
    } else if (contextType === ContextType.CONFOUNDING_FACTOR) {
      return confoundingFactors.map(factor => ({
        value: factor.id,
        label: `Factor from ${format(new Date(factor.recorded_at), "MMM d, yyyy")}`
      }));
    }
    return [];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Statistical Analysis</CardTitle>
        <CardDescription>
          Compare two time periods to determine if changes in cognitive performance are statistically significant
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-type">Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger id="test-type">
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                {testTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Baseline Period Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !baselineStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {baselineStart ? format(baselineStart, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={baselineStart}
                    onSelect={setBaselineStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Baseline Period End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !baselineEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {baselineEnd ? format(baselineEnd, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={baselineEnd}
                    onSelect={setBaselineEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Comparison Period Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !comparisonStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {comparisonStart ? format(comparisonStart, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={comparisonStart}
                    onSelect={setComparisonStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Comparison Period End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !comparisonEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {comparisonEnd ? format(comparisonEnd, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={comparisonEnd}
                    onSelect={setComparisonEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context-type">Analysis Context</Label>
            <Select value={contextType} onValueChange={(value) => {
              setContextType(value as ContextType);
              setContextId(''); // Reset context ID when type changes
            }}>
              <SelectTrigger id="context-type">
                <SelectValue placeholder="Select context type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ContextType.GENERAL}>General Analysis</SelectItem>
                <SelectItem value={ContextType.SUPPLEMENT}>Supplement Analysis</SelectItem>
                <SelectItem value={ContextType.CONFOUNDING_FACTOR}>Confounding Factor Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contextType !== ContextType.GENERAL && (
            <div className="space-y-2">
              <Label htmlFor="context-id">
                {contextType === ContextType.SUPPLEMENT ? 'Supplement' : 'Confounding Factor'}
              </Label>
              <Select value={contextId} onValueChange={setContextId}>
                <SelectTrigger id="context-id">
                  <SelectValue placeholder={`Select ${contextType === ContextType.SUPPLEMENT ? 'supplement' : 'factor'}`} />
                </SelectTrigger>
                <SelectContent>
                  {getContextOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Analysis...
              </>
            ) : (
              "Run Analysis"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
