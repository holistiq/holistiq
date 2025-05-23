import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Clock, Target, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';
import { TestResult } from '@/lib/testResultUtils';
import { ComparisonMetrics } from '@/utils/comparativeAnalysisUtils';
import { ReactNode } from 'react';

// Define a type alias for metric types
type MetricType = 'score' | 'reactionTime' | 'accuracy';

// Helper function to get metric label
function getMetricLabel(metricType: MetricType): string {
  switch (metricType) {
    case 'score':
      return 'Score';
    case 'reactionTime':
      return 'Reaction Time (ms)';
    case 'accuracy':
      return 'Accuracy (%)';
  }
}

// Helper function to get metric name for bar chart
function getMetricName(metricType: MetricType): string {
  switch (metricType) {
    case 'score':
      return 'Score';
    case 'reactionTime':
      return 'Reaction Time';
    case 'accuracy':
      return 'Accuracy';
  }
}

// Helper function to get metric icon
function getMetricIcon(metricType: MetricType): ReactNode {
  switch (metricType) {
    case 'score':
      return <Brain className="h-5 w-5 text-blue-500" />;
    case 'reactionTime':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'accuracy':
      return <Target className="h-5 w-5 text-green-500" />;
  }
}

// Custom tooltip component
interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{ name: string; value: number; payload: ChartDataPoint }>;
  readonly baselineLabel: string;
  readonly baselineDataLength: number;
  readonly comparisonDataLength: number;
  readonly metricType: MetricType;
}

function CustomTooltip({
  active,
  payload,
  baselineLabel,
  baselineDataLength,
  comparisonDataLength,
  metricType
}: Readonly<CustomTooltipProps>) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const sampleSize = data.payload.name === baselineLabel ? baselineDataLength : comparisonDataLength;

  let valueLabel = '';
  if (metricType === 'score') valueLabel = `Score: ${data.value.toFixed(1)}`;
  else if (metricType === 'reactionTime') valueLabel = `Reaction Time: ${data.value.toFixed(1)}ms`;
  else valueLabel = `Accuracy: ${data.value.toFixed(1)}%`;

  return (
    <div className="bg-background border p-2 rounded-md shadow-md">
      <p className="font-medium">{data.payload.name}</p>
      <p className="text-sm">{valueLabel}</p>
      <p className="text-xs text-muted-foreground">
        Sample size: {sampleSize} tests
      </p>
    </div>
  );
}

interface ComparisonChartProps {
  readonly title: string;
  readonly description?: string;
  readonly baselineLabel: string;
  readonly comparisonLabel: string;
  readonly baselineData: TestResult[];
  readonly comparisonData: TestResult[];
  readonly metrics: ComparisonMetrics;
  readonly metricType: 'score' | 'reactionTime' | 'accuracy';
  readonly isLoading?: boolean;
  readonly higherIsBetter?: boolean;
}

export function ComparisonChart({
  title,
  description,
  baselineLabel,
  comparisonLabel,
  baselineData,
  comparisonData,
  metrics,
  metricType,
  isLoading = false,
  higherIsBetter = true
}: Readonly<ComparisonChartProps>) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate averages
  const baselineAvg = baselineData.reduce((sum, test) => sum + test[metricType], 0) / baselineData.length;
  const comparisonAvg = comparisonData.reduce((sum, test) => sum + test[metricType], 0) / comparisonData.length;

  // Prepare data for the chart
  const chartData = [
    {
      name: baselineLabel,
      value: baselineAvg,
      color: '#8884d8'
    },
    {
      name: comparisonLabel,
      value: comparisonAvg,
      color: '#82ca9d'
    }
  ];

  // Get the change value based on metric type
  let changeValue = 0;
  switch (metricType) {
    case 'score':
      changeValue = metrics.scoreChange;
      break;
    case 'reactionTime':
      changeValue = metrics.reactionTimeChange;
      break;
    case 'accuracy':
      changeValue = metrics.accuracyChange;
      break;
  }

  // Format change text and determine color/icon
  let changeText = '';
  let changeColor = '';
  let changeIcon: ReactNode = null;

  if (changeValue > 0) {
    changeText = `+${changeValue.toFixed(1)}%`;
    changeColor = higherIsBetter ? 'text-green-500' : 'text-red-500';
    changeIcon = higherIsBetter ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  } else if (changeValue < 0) {
    changeText = `${changeValue.toFixed(1)}%`;
    changeColor = higherIsBetter ? 'text-red-500' : 'text-green-500';
    changeIcon = higherIsBetter ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
  } else {
    changeText = '0%';
    changeColor = 'text-yellow-500';
    changeIcon = <Minus className="h-4 w-4" />;
  }

  // Get icon based on metric type
  const metricIcon = getMetricIcon(metricType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {metricIcon}
            <CardTitle>{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 font-medium ${changeColor}`}>
              {changeIcon}
              {changeText}
            </span>
            {metrics.isSignificant && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Significant
              </Badge>
            )}
          </div>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                domain={[
                  (dataMin: number) => Math.max(0, dataMin * 0.9),
                  (dataMax: number) => dataMax * 1.1
                ]}
                label={{
                  value: getMetricLabel(metricType),
                  angle: -90,
                  position: 'insideLeft'
                }}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    baselineLabel={baselineLabel}
                    baselineDataLength={baselineData.length}
                    comparisonDataLength={comparisonData.length}
                    metricType={metricType}
                  />
                }
              />
              <Legend />
              <Bar
                dataKey="value"
                name={getMetricName(metricType)}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Sample sizes: {baselineLabel} ({baselineData.length} tests), {comparisonLabel} ({comparisonData.length} tests)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
