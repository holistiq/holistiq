import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Brain,
  Info,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useTestResults } from "@/contexts/TestResultsContext";
import {
  UserBaseline,
  BaselineCalculationMethod,
  BaselineQuality,
  getBaselineQuality,
  getBaselineQualityDescription,
  getCalculationMethodDescription,
  getBaselineRecommendations,
} from "@/types/baseline";

interface BaselineCalibrationProps {
  onBaselineCalculated?: (baseline: UserBaseline) => void;
}

export function BaselineCalibration({
  onBaselineCalculated,
}: Readonly<BaselineCalibrationProps>) {
  const navigate = useNavigate();
  const {
    testHistory,
    userBaseline,
    isCalculatingBaseline,
    calculateUserBaseline,
  } = useTestResults();

  const [calculationMethod, setCalculationMethod] =
    useState<BaselineCalculationMethod>("first_n_tests");
  const [sampleSize, setSampleSize] = useState(3);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get baseline quality if available
  const baselineQuality = userBaseline
    ? getBaselineQuality(userBaseline)
    : BaselineQuality.INSUFFICIENT;

  // Get quality color
  const getQualityColor = (quality: BaselineQuality) => {
    switch (quality) {
      case BaselineQuality.EXCELLENT:
        return "bg-green-500";
      case BaselineQuality.GOOD:
        return "bg-blue-500";
      case BaselineQuality.MODERATE:
        return "bg-yellow-500";
      case BaselineQuality.POOR:
        return "bg-orange-500";
      case BaselineQuality.INSUFFICIENT:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  /**
   * Renders the baseline data display
   */
  const renderBaselineData = () => {
    if (isCalculatingBaseline) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      );
    }

    if (userBaseline) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Baseline Score</p>
              <p className="text-lg font-semibold">
                {userBaseline.baselineScore?.toFixed(1) || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reaction Time</p>
              <p className="text-lg font-semibold">
                {userBaseline.baselineReactionTime?.toFixed(1) || "N/A"} ms
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-lg font-semibold">
                {userBaseline.baselineAccuracy?.toFixed(1) || "N/A"}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sample Size</p>
              <p className="text-lg font-semibold">
                {userBaseline.sampleSize} tests
              </p>
            </div>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">
              {getCalculationMethodDescription(userBaseline.calculationMethod)}
            </p>
            {userBaseline.startDate && userBaseline.endDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Period:{" "}
                {format(new Date(userBaseline.startDate), "MMM d, yyyy")} -
                {format(new Date(userBaseline.endDate), "MMM d, yyyy")}
              </p>
            )}
          </div>

          <Alert
            variant={
              baselineQuality === BaselineQuality.INSUFFICIENT ||
              baselineQuality === BaselineQuality.POOR
                ? "destructive"
                : "default"
            }
          >
            <AlertTitle className="flex items-center gap-2">
              {baselineQuality === BaselineQuality.EXCELLENT ||
              baselineQuality === BaselineQuality.GOOD ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Baseline Quality: {baselineQuality}
            </AlertTitle>
            <AlertDescription>
              {getBaselineQualityDescription(baselineQuality)}
            </AlertDescription>
          </Alert>

          {/* Recommendations */}
          {getBaselineRecommendations(userBaseline).length > 0 && (
            <div className="text-sm space-y-1">
              <p className="font-medium">Recommendations:</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {getBaselineRecommendations(userBaseline).map((rec) => (
                  <li key={`recommendation-${rec.substring(0, 20)}`}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No baseline established yet</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={handleTakeBaselineTest}
        >
          Take Baseline Test
        </Button>
      </div>
    );
  };

  // Handle baseline calculation
  const handleCalculateBaseline = async () => {
    const options = {
      calculationMethod,
      sampleSize,
      startDate: calculationMethod === "date_range" ? startDate : null,
      endDate: calculationMethod === "date_range" ? endDate : null,
    };

    const baseline = await calculateUserBaseline(options);

    if (baseline && onBaselineCalculated) {
      onBaselineCalculated(baseline);
    }
  };

  // Handle taking a baseline test
  const handleTakeBaselineTest = () => {
    navigate("/baseline-test");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Baseline Calibration
        </CardTitle>
        <CardDescription>
          Establish your cognitive baseline to accurately measure supplement
          effects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Baseline Status */}
        <div className="bg-secondary/10 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Current Baseline Status</h3>
            {userBaseline && (
              <Badge
                variant="outline"
                className={`${getQualityColor(baselineQuality)} text-white`}
              >
                {baselineQuality}
              </Badge>
            )}
          </div>

          {renderBaselineData()}
        </div>

        {/* Baseline Calculation Options */}
        {testHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-4">
              Baseline Calculation Options
            </h3>

            <Tabs
              defaultValue="first_n_tests"
              onValueChange={(value) =>
                setCalculationMethod(value as BaselineCalculationMethod)
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="first_n_tests">First N Tests</TabsTrigger>
                <TabsTrigger value="pre_supplement">Pre-Supplement</TabsTrigger>
                <TabsTrigger value="date_range">Date Range</TabsTrigger>
              </TabsList>

              <TabsContent value="first_n_tests" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="sample-size">
                      Sample Size: {sampleSize} tests
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {testHistory.length} tests available
                    </span>
                  </div>
                  <Slider
                    id="sample-size"
                    min={1}
                    max={Math.min(10, testHistory.length)}
                    step={1}
                    value={[sampleSize]}
                    onValueChange={(value) => setSampleSize(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Uses your first {sampleSize} tests as baseline. More tests
                    generally provide a more reliable baseline.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="pre_supplement" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <p className="text-sm">
                    This method uses all tests taken before you started any
                    supplements as your baseline.
                  </p>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Pre-Supplement Analysis</AlertTitle>
                    <AlertDescription>
                      This provides the most accurate baseline for measuring
                      supplement effects, as it establishes your cognitive
                      performance before any interventions.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="date_range" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uses tests taken within the specified date range as your
                  baseline. Useful for establishing a baseline during a specific
                  period.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleTakeBaselineTest}>
          Take New Baseline Test
        </Button>

        <Button
          onClick={handleCalculateBaseline}
          disabled={isCalculatingBaseline || testHistory.length === 0}
        >
          {isCalculatingBaseline ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              Calculate Baseline
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
