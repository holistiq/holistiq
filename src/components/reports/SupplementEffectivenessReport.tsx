import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import {
  Brain,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Share2
} from 'lucide-react';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Supplement } from '@/types/supplement';
import { TestResult } from '@/lib/testResultUtils';
import { SupplementEvaluationStatus } from '@/components/supplements/SupplementEvaluationStatus';
import {
  SupplementCorrelation,
  ImpactSignificance,
  getImpactSignificance,
  getConfidenceLevel
} from '@/types/correlation';
import {
  StatisticalAnalysis,
  MetricSignificance,
  getSignificanceColor,
  getSignificanceInterpretation
} from '@/types/statisticalSignificance';

// Custom tooltip component for the charts
interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload?.[0]?.payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <p className="font-medium">{data.formattedDate}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
          <span className="text-sm">Score:</span>
          <span className="text-sm font-medium">{data.score}</span>
          <span className="text-sm">Reaction Time:</span>
          <span className="text-sm font-medium">{data.reactionTime}ms</span>
          <span className="text-sm">Accuracy:</span>
          <span className="text-sm font-medium">{data.accuracy}%</span>
        </div>
      </div>
    );
  }
  return null;
};

interface SupplementEffectivenessReportProps {
  readonly supplement: Supplement;
  readonly correlations: SupplementCorrelation[];
  readonly analyses: StatisticalAnalysis[];
  readonly testResults: TestResult[];
  readonly isLoading?: boolean;
  readonly onExport?: () => void;
  readonly onShare?: () => void;
}

export function SupplementEffectivenessReport({
  supplement,
  correlations,
  analyses,
  testResults,
  isLoading = false,
  onExport,
  onShare
}: SupplementEffectivenessReportProps) {
  const [activeTab, setActiveTab] = useState('summary');

  // Get the most recent correlation for this supplement
  const latestCorrelation = useMemo(() => {
    if (!correlations.length) return null;
    const sortedCorrelations = [...correlations].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return sortedCorrelations[0];
  }, [correlations]);

  // Get the most recent statistical analysis for this supplement
  const latestAnalysis = useMemo(() => {
    if (!analyses.length) return null;
    const sortedAnalyses = [...analyses].sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return sortedAnalyses[0];
  }, [analyses]);

  // Prepare data for charts
  const performanceData = useMemo(() => {
    if (!testResults.length) return [];

    // Filter test results to only include those after supplement start date
    const supplementStartDate = new Date(supplement.intake_time);
    const relevantResults = testResults
      .filter(result => new Date(result.timestamp) >= supplementStartDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return relevantResults.map(result => ({
      date: new Date(result.timestamp).getTime(),
      formattedDate: format(new Date(result.timestamp), 'MMM d, yyyy'),
      score: result.score,
      reactionTime: result.reaction_time,
      accuracy: result.accuracy
    }));
  }, [testResults, supplement]);

  // Prepare impact data for bar chart
  const impactData = useMemo(() => {
    if (!latestCorrelation) return [];

    return [
      {
        metric: 'Score',
        impact: latestCorrelation.score_impact || 0,
        color: getMetricColor(latestCorrelation.score_impact, true)
      },
      {
        metric: 'Reaction Time',
        impact: latestCorrelation.reaction_time_impact || 0,
        color: getMetricColor(latestCorrelation.reaction_time_impact, false)
      },
      {
        metric: 'Accuracy',
        impact: latestCorrelation.accuracy_impact || 0,
        color: getMetricColor(latestCorrelation.accuracy_impact, true)
      }
    ];
  }, [latestCorrelation]);

  // Helper function to get color based on impact
  function getMetricColor(impact: number | null, isPositiveGood: boolean): string {
    if (impact === null) return '#888888';

    const normalizedImpact = isPositiveGood ? impact : -impact;

    if (normalizedImpact > 10) return '#22c55e'; // Significant positive - green
    if (normalizedImpact > 5) return '#4ade80'; // Moderate positive - light green
    if (normalizedImpact > -5) return '#888888'; // Neutral - gray
    if (normalizedImpact > -10) return '#f87171'; // Moderate negative - light red
    return '#ef4444'; // Significant negative - red
  }

  // We'll use the ChartTooltip component defined outside this component

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
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {supplement.name} Effectiveness Report
            </CardTitle>
            <CardDescription>
              Analysis of how {supplement.name} affects your cognitive performance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport} className="gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
            {onShare && (
              <Button variant="outline" size="sm" onClick={onShare} className="gap-1">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="statistics">Statistical Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {renderSummaryTab()}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {renderTrendsTab()}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {renderStatisticsTab()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function renderSummaryTab() {
    if (!latestCorrelation) {
      return (
        <>
          {/* Supplement Evaluation Status */}
          <div className="mb-4">
            <SupplementEvaluationStatus
              supplement={supplement}
              onStatusChange={() => {}}
            />
          </div>

          <div className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Effectiveness Data Available</h3>
            <p className="text-muted-foreground mb-4">
              We don't have enough data to analyze the effectiveness of {supplement.name} yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Continue taking cognitive tests while using this supplement to generate an effectiveness report.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        {/* Supplement Evaluation Status */}
        <div className="mb-4">
          <SupplementEvaluationStatus
            supplement={supplement}
            onStatusChange={() => {}}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Overall Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderImpactCard(
              'Score',
              <Brain className="h-5 w-5 text-blue-500" />,
              latestCorrelation.score_impact,
              true
            )}
            {renderImpactCard(
              'Reaction Time',
              <Clock className="h-5 w-5 text-amber-500" />,
              latestCorrelation.reaction_time_impact,
              false
            )}
            {renderImpactCard(
              'Accuracy',
              <Target className="h-5 w-5 text-green-500" />,
              latestCorrelation.accuracy_impact,
              true
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Impact Visualization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={impactData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[-20, 20]} />
                <YAxis dataKey="metric" type="category" width={100} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Impact']}
                  labelFormatter={(label) => `${label} Impact`}
                />
                <ReferenceLine x={0} stroke="#888" />
                <Bar dataKey="impact" fill="#8884d8" barSize={30}>
                  {impactData.map((entry) => (
                    <Bar key={`cell-${entry.metric}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Analysis Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Analysis Period:</span>
                <span className="font-medium">
                  {format(new Date(latestCorrelation.analysis_period_start), 'MMM d, yyyy')} -
                  {format(new Date(latestCorrelation.analysis_period_end), 'MMM d, yyyy')}
                </span>
              </p>
              <p className="flex justify-between mt-2">
                <span className="text-muted-foreground">Sample Size:</span>
                <span className="font-medium">{latestCorrelation.sample_size} tests</span>
              </p>
              <p className="flex justify-between mt-2">
                <span className="text-muted-foreground">Confidence Level:</span>
                <span className="font-medium">
                  {getConfidenceLevel(latestCorrelation.confidence_level || 0).replace('_', ' ')}
                </span>
              </p>
            </div>
            <div>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Onset Delay:</span>
                <span className="font-medium">{latestCorrelation.onset_delay_days} days</span>
              </p>
              <p className="flex justify-between mt-2">
                <span className="text-muted-foreground">Cumulative Effect Threshold:</span>
                <span className="font-medium">{latestCorrelation.cumulative_effect_threshold} days</span>
              </p>
              <p className="flex justify-between mt-2">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {format(new Date(latestCorrelation.updated_at), 'MMM d, yyyy')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderImpactCard(
    metric: string,
    metricIcon: React.ReactNode,
    impact: number | null,
    isPositiveGood: boolean
  ) {
    if (impact === null) {
      return (
        <div className="bg-background rounded-md p-4 border">
          <div className="flex items-center gap-2 mb-2">
            {metricIcon}
            <h4 className="font-medium">{metric}</h4>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Insufficient data</span>
          </div>
        </div>
      );
    }

    const significance = getImpactSignificance(impact, !isPositiveGood);
    const isPositive = isPositiveGood ? impact > 0 : impact < 0;

    return (
      <div className="bg-background rounded-md p-4 border">
        <div className="flex items-center gap-2 mb-2">
          {metricIcon}
          <h4 className="font-medium">{metric}</h4>
        </div>
        <div className="flex items-center gap-2">
          {significance !== ImpactSignificance.NEUTRAL ? (
            <>
              {isPositive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {isPositive ? '+' : ''}{impact.toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <Minus className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">No significant change</span>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderTrendsTab() {
    if (performanceData.length === 0) {
      return (
        <div className="text-center py-8">
          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Performance Data Available</h3>
          <p className="text-muted-foreground">
            Take cognitive tests while using {supplement.name} to see performance trends.
          </p>
        </div>
      );
    }

    return (
      <>
        <div>
          <h3 className="text-lg font-medium mb-4">Score Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
                />
                <YAxis
                  domain={[0, 100]}
                  label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="linear"
                  dataKey="score"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Reaction Time Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
                />
                <YAxis
                  domain={['dataMin', 'dataMax']}
                  label={{ value: 'Reaction Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="linear"
                  dataKey="reactionTime"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Accuracy Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
                />
                <YAxis
                  domain={[0, 100]}
                  label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="linear"
                  dataKey="accuracy"
                  stroke="#ffc658"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  }

  function renderStatisticsTab() {
    if (!latestAnalysis) {
      return (
        <div className="text-center py-8">
          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Statistical Analysis Available</h3>
          <p className="text-muted-foreground mb-4">
            We don't have enough data to perform a statistical analysis for {supplement.name} yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Continue taking cognitive tests to generate statistical significance data.
          </p>
        </div>
      );
    }

    const { baseline_period, comparison_period, significance_analysis } = latestAnalysis.results;

    if (!baseline_period || !comparison_period || !significance_analysis) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Analysis Error</h3>
          <p className="text-muted-foreground">
            There was an error processing the statistical analysis for this supplement.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Statistical Significance</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Comparing performance before and after taking {supplement.name}
          </p>

          <div className="space-y-4">
            {renderMetricSignificance(
              'Score',
              <Brain className="h-4 w-4 text-blue-500" />,
              baseline_period.mean_score,
              comparison_period.mean_score,
              significance_analysis.score,
              true
            )}

            {renderMetricSignificance(
              'Reaction Time',
              <Clock className="h-4 w-4 text-amber-500" />,
              baseline_period.mean_reaction_time,
              comparison_period.mean_reaction_time,
              significance_analysis.reaction_time,
              false
            )}

            {renderMetricSignificance(
              'Accuracy',
              <Target className="h-4 w-4 text-green-500" />,
              baseline_period.mean_accuracy,
              comparison_period.mean_accuracy,
              significance_analysis.accuracy,
              true
            )}
          </div>
        </div>

        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-3">Analysis Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Baseline Period</h4>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Date Range:</span>
                <span>
                  {format(new Date(baseline_period.start), 'MMM d, yyyy')} -
                  {format(new Date(baseline_period.end), 'MMM d, yyyy')}
                </span>
              </p>
              <p className="flex justify-between mt-1">
                <span className="text-muted-foreground">Sample Size:</span>
                <span>{baseline_period.sample_size} tests</span>
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Comparison Period</h4>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Date Range:</span>
                <span>
                  {format(new Date(comparison_period.start), 'MMM d, yyyy')} -
                  {format(new Date(comparison_period.end), 'MMM d, yyyy')}
                </span>
              </p>
              <p className="flex justify-between mt-1">
                <span className="text-muted-foreground">Sample Size:</span>
                <span>{comparison_period.sample_size} tests</span>
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Statistical Parameters</h4>
            <p className="flex justify-between text-sm">
              <span className="text-muted-foreground">Significance Level (α):</span>
              <span>{significance_analysis.alpha}</span>
            </p>
            <p className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Analysis Date:</span>
              <span>{format(new Date(latestAnalysis.created_at), 'MMM d, yyyy')}</span>
            </p>
          </div>
        </div>
      </>
    );
  }

  function renderMetricSignificance(
    metric: string,
    icon: React.ReactNode,
    baselineValue: number,
    comparisonValue: number,
    significance: MetricSignificance,
    isPositiveGood: boolean
  ) {
    const changePercent = significance.change_percent;
    const isPositive = isPositiveGood ? changePercent > 0 : changePercent < 0;
    const color = getSignificanceColor(significance, isPositiveGood);

    return (
      <div className="bg-background rounded-md p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{metric}</span>
          </div>
          <div className={`flex items-center gap-1 ${color}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(changePercent).toFixed(1)}%
            {significance.is_significant && (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <CheckCircle className="h-4 w-4 ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Statistically significant (p={significance.p_value.toFixed(3)})</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Before</p>
            <p className="font-medium">{baselineValue.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">After</p>
            <p className="font-medium">{comparisonValue.toFixed(1)}</p>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs text-muted-foreground">
            {getSignificanceInterpretation(significance)}
          </p>
        </div>
      </div>
    );
  }
}
