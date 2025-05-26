import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Brain } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Supplement } from "@/types/supplement";
import { TestResult } from "@/lib/testResultUtils";
import {
  SupplementCorrelation,
  CorrelationAnalysisOptions,
} from "@/types/correlation";
import {
  calculateCorrelation,
  getCorrelations,
} from "@/services/correlationService";
import { getSupplements } from "@/services/supplementService";
import { getTestResults } from "@/services/testResultService";
import { CorrelationCard } from "./CorrelationCard";

interface CorrelationAnalysisProps {
  readonly userId: string;
}

export function CorrelationAnalysis({
  userId,
}: Readonly<CorrelationAnalysisProps>): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  // We store test results but don't directly use them in the UI
  const [, setTestResults] = useState<TestResult[]>([]);
  const [correlations, setCorrelations] = useState<SupplementCorrelation[]>([]);
  const [selectedSupplementId, setSelectedSupplementId] = useState<string>("");
  const [selectedCorrelation, setSelectedCorrelation] =
    useState<SupplementCorrelation | null>(null);

  // Analysis parameters
  const [onsetDelayDays, setOnsetDelayDays] = useState(7);
  const [cumulativeEffectThreshold, setCumulativeEffectThreshold] =
    useState(14);
  const [analysisStartDate, setAnalysisStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [analysisEndDate, setAnalysisEndDate] = useState<Date | undefined>(
    undefined,
  );

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load supplements
        const supplementsResponse = await getSupplements(userId);
        if (supplementsResponse.success) {
          setSupplements(supplementsResponse.supplements);

          // Set default selected supplement if available
          if (
            supplementsResponse.supplements.length > 0 &&
            !selectedSupplementId
          ) {
            setSelectedSupplementId(supplementsResponse.supplements[0].id);
          }
        }

        // Load test results
        const testResultsResponse = await getTestResults(userId);
        if (testResultsResponse.success && testResultsResponse.data) {
          const formattedResults = testResultsResponse.data.map(
            (result: {
              timestamp: string;
              score: number;
              reaction_time: number;
              accuracy: number;
            }) => ({
              date: result.timestamp,
              score: result.score,
              reactionTime: result.reaction_time,
              accuracy: result.accuracy,
            }),
          );
          setTestResults(formattedResults);
        }

        // Load correlations
        const correlationsResponse = await getCorrelations(userId);
        if (correlationsResponse.success) {
          setCorrelations(correlationsResponse.correlations);

          // Set selected correlation if available and matches selected supplement
          if (
            correlationsResponse.correlations.length > 0 &&
            selectedSupplementId
          ) {
            const matchingCorrelation = correlationsResponse.correlations.find(
              (c) => c.supplement_id === selectedSupplementId,
            );
            if (matchingCorrelation) {
              setSelectedCorrelation(matchingCorrelation);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId, selectedSupplementId]);

  // Update selected correlation when supplement changes
  useEffect(() => {
    if (selectedSupplementId && correlations.length > 0) {
      const matchingCorrelation = correlations.find(
        (c) => c.supplement_id === selectedSupplementId,
      );
      setSelectedCorrelation(matchingCorrelation || null);
    } else {
      setSelectedCorrelation(null);
    }
  }, [selectedSupplementId, correlations]);

  // Run correlation analysis
  const runAnalysis = async () => {
    if (!selectedSupplementId) {
      toast({
        title: "Error",
        description: "Please select a supplement to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const options: CorrelationAnalysisOptions = {
        supplementId: selectedSupplementId,
        testType: "n-back-2", // Default test type
        onsetDelayDays,
        cumulativeEffectThreshold,
        analysisStartDate: analysisStartDate
          ? format(analysisStartDate, "yyyy-MM-dd")
          : undefined,
        analysisEndDate: analysisEndDate
          ? format(analysisEndDate, "yyyy-MM-dd")
          : undefined,
      };

      const result = await calculateCorrelation(userId, options);

      if (result.success && result.correlation) {
        // Update correlations list
        setCorrelations((prev) => {
          const existing = prev.findIndex(
            (c) => c.id === result.correlation!.id,
          );
          if (existing >= 0) {
            return [
              ...prev.slice(0, existing),
              result.correlation!,
              ...prev.slice(existing + 1),
            ];
          } else {
            return [result.correlation!, ...prev];
          }
        });

        setSelectedCorrelation(result.correlation);

        toast({
          title: "Analysis Complete",
          description:
            "Supplement correlation analysis has been completed successfully.",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description:
            result.error || "Failed to analyze correlation. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error running analysis:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get the selected supplement
  const getSelectedSupplement = (): Supplement | undefined => {
    return supplements.find((s) => s.id === selectedSupplementId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Supplement-Cognitive Performance Analysis
        </CardTitle>
        <CardDescription>
          Analyze how supplements affect your cognitive performance over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplement-select">Select Supplement</Label>
                <Select
                  value={selectedSupplementId}
                  onValueChange={setSelectedSupplementId}
                >
                  <SelectTrigger id="supplement-select">
                    <SelectValue placeholder="Select a supplement" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplements.map((supplement) => (
                      <SelectItem key={supplement.id} value={supplement.id}>
                        {supplement.name} ({supplement.dosage})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={runAnalysis}
                  disabled={isAnalyzing || !selectedSupplementId}
                  className="w-full"
                >
                  {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                </Button>
              </div>
            </div>

            <div className="bg-secondary/10 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-medium">Analysis Parameters</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="onset-delay">Onset Delay (days)</Label>
                    <span className="text-sm text-muted-foreground">
                      {onsetDelayDays} days
                    </span>
                  </div>
                  <Slider
                    id="onset-delay"
                    min={0}
                    max={30}
                    step={1}
                    value={[onsetDelayDays]}
                    onValueChange={(value) => setOnsetDelayDays(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected days until the supplement starts showing effects
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="cumulative-effect">
                      Cumulative Effect (days)
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {cumulativeEffectThreshold} days
                    </span>
                  </div>
                  <Slider
                    id="cumulative-effect"
                    min={1}
                    max={60}
                    step={1}
                    value={[cumulativeEffectThreshold]}
                    onValueChange={(value) =>
                      setCumulativeEffectThreshold(value[0])
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Days of consistent use needed for full effect
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Analysis Start Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {analysisStartDate ? (
                          format(analysisStartDate, "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={analysisStartDate}
                        onSelect={setAnalysisStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Analysis End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {analysisEndDate ? (
                          format(analysisEndDate, "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={analysisEndDate}
                        onSelect={setAnalysisEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {selectedCorrelation ? (
              <div className="space-y-6">
                <CorrelationCard
                  correlation={selectedCorrelation}
                  supplementName={getSelectedSupplement()?.name}
                />

                {/* Additional analysis details would go here */}
              </div>
            ) : (
              <div className="text-center py-8 bg-secondary/10 rounded-lg">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Analysis Results Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Select a supplement and run the analysis to see how it affects
                  your cognitive performance.
                </p>
                <Button
                  onClick={runAnalysis}
                  disabled={isAnalyzing || !selectedSupplementId}
                >
                  {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
