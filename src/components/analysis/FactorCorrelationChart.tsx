import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FactorCorrelation } from "@/types/confoundingFactor";
import {
  Moon,
  Activity,
  Coffee,
  Dumbbell,
  Smile,
  HelpCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

// Define chart data type
interface ChartDataPoint {
  factor: string;
  correlation: number;
  color: string;
  sampleSize: number;
  rawFactor: string;
}

// Custom tooltip component for the bar chart
interface CustomTooltipProps {
  readonly active?: boolean;
  readonly payload?: Array<{ payload: ChartDataPoint }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps): ReactNode => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-medium">{data.factor}</p>
        <p className="text-sm">
          Correlation:{" "}
          <span className="font-medium">
            {(data.correlation * 100).toFixed(1)}%
          </span>
        </p>
        <p className="text-sm">
          Sample Size: <span className="font-medium">{data.sampleSize}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.correlation > 0
            ? "Positive correlation: Higher values are associated with better performance"
            : "Negative correlation: Higher values are associated with worse performance"}
        </p>
      </div>
    );
  }
  return null;
};

interface FactorCorrelationChartProps {
  readonly correlations: FactorCorrelation[];
  readonly isLoading?: boolean;
}

export function FactorCorrelationChart({
  correlations,
  isLoading = false,
}: Readonly<FactorCorrelationChartProps>): JSX.Element {
  // Helper function to get icon for factor
  const getFactorIcon = (factor: string): JSX.Element => {
    switch (factor) {
      case "sleep":
        return <Moon className="h-5 w-5" />;
      case "stress":
        return <Activity className="h-5 w-5" />;
      case "exercise":
        return <Dumbbell className="h-5 w-5" />;
      case "caffeine":
        return <Coffee className="h-5 w-5" />;
      case "mood":
        return <Smile className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  // Helper function to get color for correlation
  const getCorrelationColor = (correlation: number): string => {
    if (correlation > 0.5) return "text-green-500";
    if (correlation > 0.2) return "text-green-400";
    if (correlation > 0) return "text-green-300";
    if (correlation > -0.2) return "text-red-300";
    if (correlation > -0.5) return "text-red-400";
    return "text-red-500";
  };

  // Helper function to get description for correlation
  const getCorrelationDescription = (correlation: number): string => {
    if (correlation > 0.7) return "Strong positive";
    if (correlation > 0.4) return "Moderate positive";
    if (correlation > 0.1) return "Weak positive";
    if (correlation > -0.1) return "No correlation";
    if (correlation > -0.4) return "Weak negative";
    if (correlation > -0.7) return "Moderate negative";
    return "Strong negative";
  };

  // Helper function to get factor name
  const getFactorName = (factor: string): string => {
    switch (factor) {
      case "sleep":
        return "Sleep";
      case "stress":
        return "Stress";
      case "exercise":
        return "Exercise";
      case "caffeine":
        return "Caffeine";
      case "mood":
        return "Mood";
      default:
        return factor.charAt(0).toUpperCase() + factor.slice(1);
    }
  };

  // Helper function to get correlation details
  const getCorrelationDetails = (correlation: FactorCorrelation): string[] => {
    const details: string[] = [];

    if (correlation.factor === "sleep") {
      if (correlation.quality_correlation !== undefined) {
        details.push(
          `Sleep quality: ${(correlation.quality_correlation * 100).toFixed(1)}%`,
        );
      }
      details.push(
        `Sleep duration: ${(correlation.correlation * 100).toFixed(1)}%`,
      );
    } else if (correlation.factor === "exercise") {
      if (correlation.duration_correlation !== undefined) {
        details.push(
          `Exercise duration: ${(correlation.duration_correlation * 100).toFixed(1)}%`,
        );
      }
      if (correlation.intensity_correlation !== undefined) {
        details.push(
          `Exercise intensity: ${(correlation.intensity_correlation * 100).toFixed(1)}%`,
        );
      }
    } else if (correlation.factor === "mood") {
      if (correlation.energy_correlation !== undefined) {
        details.push(
          `Energy level: ${(correlation.energy_correlation * 100).toFixed(1)}%`,
        );
      }
      details.push(`Mood: ${(correlation.correlation * 100).toFixed(1)}%`);
    } else {
      details.push(
        `${getFactorName(correlation.factor)}: ${(correlation.correlation * 100).toFixed(1)}%`,
      );
    }

    return details;
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Factor Correlations</CardTitle>
          <CardDescription>
            Analyzing how different factors affect your cognitive performance...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-secondary rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-secondary rounded mb-2"></div>
              <div className="h-4 w-48 bg-secondary rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render no data state
  if (!correlations || correlations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Factor Correlations</CardTitle>
          <CardDescription>
            Not enough data to analyze correlations yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">Insufficient Data</p>
            <p className="text-sm text-muted-foreground mb-4">
              Log more confounding factors and take more tests to see
              correlations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for the bar chart
  const chartData: ChartDataPoint[] = correlations
    .filter((correlation) => correlation.sample_size >= 3)
    .map((correlation) => ({
      factor: getFactorName(correlation.factor),
      correlation: correlation.correlation,
      color: correlation.correlation >= 0 ? "#22c55e" : "#ef4444", // green or red
      sampleSize: correlation.sample_size,
      rawFactor: correlation.factor,
    }));

  // Sort by absolute correlation value (descending)
  chartData.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // Use the chart data for rendering

  return (
    <div className="space-y-6">
      {/* Bar Chart Visualization */}
      {chartData.length > 0 && (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[-1, 1]}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                label={{
                  value: "Correlation with Cognitive Performance",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                dataKey="factor"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine x={0} stroke="#666" />
              <Bar dataKey="correlation" name="Correlation">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${entry.rawFactor}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Original Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Factor Correlations</CardTitle>
              <CardDescription>
                How different factors correlate with your cognitive performance
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Positive correlations (green) indicate factors that may
                    improve your performance. Negative correlations (red)
                    indicate factors that may reduce your performance. The
                    strength of the color indicates the strength of the
                    correlation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {correlations.map((correlation, index) => {
              // Skip correlations with very small sample sizes
              if (correlation.sample_size < 3) return null;

              // Use the main correlation value for display
              const correlationValue = correlation.correlation;
              const correlationColor = getCorrelationColor(correlationValue);
              const correlationWidth = `${Math.min(Math.abs(correlationValue * 100), 100)}%`;
              const correlationDirection =
                correlationValue >= 0 ? "right" : "left";

              return (
                <div
                  key={`${correlation.factor}-${index}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {getFactorIcon(correlation.factor)}
                      </span>
                      <span className="font-medium">
                        {getFactorName(correlation.factor)}
                      </span>
                    </div>
                    <span className={`text-sm ${correlationColor}`}>
                      {getCorrelationDescription(correlationValue)}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${correlationValue >= 0 ? "bg-green-500" : "bg-red-500"} rounded-full`}
                      style={{
                        width: correlationWidth,
                        marginLeft:
                          correlationDirection === "left"
                            ? `calc(50% - ${correlationWidth})`
                            : "50%",
                        marginRight:
                          correlationDirection === "right"
                            ? `calc(50% - ${correlationWidth})`
                            : "50%",
                      }}
                    ></div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {getCorrelationDetails(correlation).map(
                      (detail, detailIndex) => (
                        <div
                          key={`${correlation.factor}-detail-${detailIndex}`}
                        >
                          {detail}
                        </div>
                      ),
                    )}
                    <div>
                      Sample size: {correlation.sample_size} data points
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
