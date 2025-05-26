import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Brain,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import {
  StatisticalAnalysis,
  MetricSignificance,
  getSignificanceColor,
  getRecommendation,
} from "@/types/statisticalSignificance";

interface StatisticalSignificanceCardProps {
  readonly analysis: StatisticalAnalysis | null;
  readonly isLoading?: boolean;
  readonly onDelete?: (analysisId: string) => void;
}

export function StatisticalSignificanceCard({
  analysis,
  isLoading = false,
  onDelete,
}: Readonly<StatisticalSignificanceCardProps>): JSX.Element {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis?.results.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistical Significance Analysis</CardTitle>
          <CardDescription>
            {analysis?.results.error || "No analysis data available"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Analysis Unavailable</p>
              <p className="text-sm text-muted-foreground">
                {analysis?.results.error ||
                  "There was an error running the statistical analysis. Please try again with different parameters."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { baseline_period, comparison_period, significance_analysis } =
    analysis.results;

  if (!baseline_period || !comparison_period || !significance_analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistical Significance Analysis</CardTitle>
          <CardDescription>Incomplete analysis data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Incomplete Analysis</p>
              <p className="text-sm text-muted-foreground">
                The analysis results are incomplete. Please try again with
                different parameters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format dates
  const baselineStart = format(new Date(baseline_period.start), "MMM d, yyyy");
  const baselineEnd = format(new Date(baseline_period.end), "MMM d, yyyy");
  const comparisonStart = format(
    new Date(comparison_period.start),
    "MMM d, yyyy",
  );
  const comparisonEnd = format(new Date(comparison_period.end), "MMM d, yyyy");

  // Helper function to render a metric row
  const renderMetricRow = (
    label: string,
    icon: JSX.Element,
    baselineValue: number,
    comparisonValue: number,
    significance: MetricSignificance,
    isPositiveGood: boolean = true,
  ): JSX.Element => {
    const changePercent = significance.change_percent;
    const isPositiveChange = changePercent > 0;
    const changeIcon = isPositiveChange ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
    const significanceColor = getSignificanceColor(
      significance,
      isPositiveGood,
    );

    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Baseline</div>
            <div className="font-medium">{baselineValue.toFixed(1)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current</div>
            <div className="font-medium">{comparisonValue.toFixed(1)}</div>
          </div>
          <div className="min-w-[100px] text-right">
            <div className="text-sm text-muted-foreground">Change</div>
            <div
              className={`font-medium flex items-center justify-end gap-1 ${significanceColor}`}
            >
              {changeIcon}
              {Math.abs(changePercent).toFixed(1)}%
              {significance.is_significant && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CheckCircle className="h-4 w-4 ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Statistically significant (p=
                        {significance.p_value.toFixed(3)})
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Statistical Significance Analysis</CardTitle>
            <CardDescription>
              Comparing {baselineStart} - {baselineEnd} with {comparisonStart} -{" "}
              {comparisonEnd}
            </CardDescription>
          </div>
          {analysis.context_name && (
            <Badge variant="outline" className="ml-2">
              {analysis.context_name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Info className="h-4 w-4" />
              Sample Sizes
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of test results in each period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-between text-sm">
            <span>
              Baseline period:{" "}
              <strong>{baseline_period.sample_size} tests</strong>
            </span>
            <span>
              Comparison period:{" "}
              <strong>{comparison_period.sample_size} tests</strong>
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Brain className="h-4 w-4" />
              Performance Metrics
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Statistical significance is calculated using t-tests with
                    p-value &lt; {significance_analysis.alpha}. Effect size
                    shows the magnitude of the change.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-1">
            {renderMetricRow(
              "Overall Score",
              <Brain className="h-4 w-4 text-blue-500" />,
              baseline_period.mean_score,
              comparison_period.mean_score,
              significance_analysis.score,
              true, // Higher is better
            )}

            {renderMetricRow(
              "Reaction Time",
              <Clock className="h-4 w-4 text-amber-500" />,
              baseline_period.mean_reaction_time,
              comparison_period.mean_reaction_time,
              significance_analysis.reaction_time,
              false, // Lower is better
            )}

            {renderMetricRow(
              "Accuracy",
              <Target className="h-4 w-4 text-green-500" />,
              baseline_period.mean_accuracy,
              comparison_period.mean_accuracy,
              significance_analysis.accuracy,
              true, // Higher is better
            )}
          </div>
        </div>

        <Separator />

        <div className="bg-secondary/30 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">
            Interpretation & Recommendation
          </h3>
          <p className="text-sm text-muted-foreground">
            {getRecommendation(significance_analysis)}
          </p>
        </div>
      </CardContent>

      {onDelete && (
        <CardFooter className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(analysis.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            Delete Analysis
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
