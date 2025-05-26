import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Search,
  Pill,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/components/ui/use-toast";
import { Supplement } from "@/types/supplement";
import { TestResult, SupabaseTestResult } from "@/lib/testResultUtils";
import {
  SupplementCorrelation,
  ImpactSignificance,
  getImpactSignificance,
} from "@/types/correlation";
import { StatisticalAnalysis } from "@/types/statisticalSignificance";
import { getSupplements } from "@/services/supplementService";
import { getTestResults } from "@/services/testResultService";
import { getCorrelations } from "@/services/correlationService";
import { getStatisticalAnalyses } from "@/services/statisticalSignificanceService";
import { SupplementEffectivenessReport } from "@/components/reports/SupplementEffectivenessReport";

// Sort options for supplements
enum SortOption {
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  IMPACT_HIGH = "impact_high",
  IMPACT_LOW = "impact_low",
  RECENT = "recent",
}

export default function SupplementEffectivenessReports() {
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [correlations, setCorrelations] = useState<SupplementCorrelation[]>([]);
  const [analyses, setAnalyses] = useState<StatisticalAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.RECENT);
  const [selectedSupplementId, setSelectedSupplementId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState("all");

  // Helper function to get the latest correlation
  const getLatestCorrelation = (correlations: SupplementCorrelation[]) => {
    const sortedCorrelations = [...correlations].sort(
      (x: SupplementCorrelation, y: SupplementCorrelation) =>
        new Date(y.updated_at).getTime() - new Date(x.updated_at).getTime(),
    );
    return sortedCorrelations[0];
  };

  // Helper function to get the supplements message
  const getSupplementsMessage = (query: string): string => {
    if (query) {
      return `No supplements match "${query}"`;
    }
    return "You haven't logged any supplements yet";
  };

  // Helper function to get filter explanation
  const getFilterExplanation = (tab: string): string => {
    switch (tab) {
      case "positive":
        return "Supplements appear here when they show a positive impact (>5%) on your cognitive performance. Take more tests while using your supplements to generate impact data.";
      case "neutral":
        return "Supplements appear here when they show no significant impact (-5% to +5%) on your cognitive performance.";
      case "negative":
        return "Supplements appear here when they show a negative impact (<-5%) on your cognitive performance.";
      case "no_data":
        return "Supplements appear here when there isn't enough test data to determine their impact.";
      default:
        return "Try selecting a different filter.";
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load supplements
      const supplementsResult = await getSupplements(user.id);
      if (supplementsResult.success) {
        setSupplements(supplementsResult.supplements);

        // Set the first supplement as selected if there are any
        if (supplementsResult.supplements.length > 0 && !selectedSupplementId) {
          setSelectedSupplementId(supplementsResult.supplements[0].id);
        }
      } else {
        // SupplementsResponse doesn't have an error property when success is false
        // Just show a generic error message
        toast({
          title: "Error loading supplements",
          description: "Failed to load supplements",
          variant: "destructive",
        });
        console.log("Failed to load supplements");
      }

      // Load test results
      const testResultsResult = await getTestResults(user.id);
      if (testResultsResult.success && testResultsResult.data) {
        // Convert Supabase test results to our TestResult format
        const formattedResults = testResultsResult.data.map(
          (result: SupabaseTestResult) => ({
            date: result.timestamp,
            score: result.score,
            reactionTime: result.reaction_time,
            accuracy: result.accuracy,
          }),
        );
        setTestResults(formattedResults);
      } else {
        // Only show error toast if it's not an expected error like "no rows"
        if (
          testResultsResult.error &&
          !testResultsResult.error.includes("no rows")
        ) {
          toast({
            title: "Error loading test results",
            description:
              testResultsResult.error ?? "Failed to load test results",
            variant: "destructive",
          });
        } else {
          console.log(
            "No test results found or expected error:",
            testResultsResult.error,
          );
        }
      }

      // Load correlations
      const correlationsResult = await getCorrelations(user.id);
      if (correlationsResult.success) {
        setCorrelations(correlationsResult.correlations);
      } else {
        // Only show error toast if it's not an expected error like "no rows"
        if (
          correlationsResult.error &&
          !correlationsResult.error.includes("no rows")
        ) {
          toast({
            title: "Error loading correlations",
            description:
              correlationsResult.error ?? "Failed to load correlations",
            variant: "destructive",
          });
        } else {
          console.log(
            "No correlations found or expected error:",
            correlationsResult.error,
          );
        }
      }

      // Load statistical analyses
      const analysesResult = await getStatisticalAnalyses(user.id);
      if (analysesResult.success) {
        setAnalyses(analysesResult.analyses);
      } else {
        // Only show error toast if it's not an expected error like "no rows"
        if (analysesResult.error && !analysesResult.error.includes("no rows")) {
          toast({
            title: "Error loading statistical analyses",
            description:
              analysesResult.error ?? "Failed to load statistical analyses",
            variant: "destructive",
          });
        } else {
          console.log(
            "No statistical analyses found or expected error:",
            analysesResult.error,
          );
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    selectedSupplementId,
    setIsLoading,
    setSupplements,
    setSelectedSupplementId,
    setTestResults,
    setCorrelations,
    setAnalyses,
  ]);

  // Helper function to filter supplements by tab
  const filterByTab = (
    supplement: Supplement,
    tab: string,
    correlations: SupplementCorrelation[],
  ): boolean => {
    const supplementCorrelations = correlations.filter(
      (c) => c.supplement_id === supplement.id,
    );
    if (supplementCorrelations.length === 0) {
      return tab === "no_data";
    }

    const latestCorrelation = getLatestCorrelation(supplementCorrelations);

    // Calculate overall impact (average of score and accuracy, minus reaction time)
    const scoreImpact = latestCorrelation.score_impact ?? 0;
    const reactionTimeImpact = latestCorrelation.reaction_time_impact ?? 0;
    const accuracyImpact = latestCorrelation.accuracy_impact ?? 0;

    // For reaction time, negative is good, so we invert it
    const normalizedReactionTimeImpact = -reactionTimeImpact;

    // Calculate overall impact (simple average)
    const overallImpact =
      (scoreImpact + normalizedReactionTimeImpact + accuracyImpact) / 3;

    // Determine significance
    const significance = getImpactSignificance(overallImpact);

    switch (tab) {
      case "positive":
        return (
          significance === ImpactSignificance.POSITIVE ||
          significance === ImpactSignificance.VERY_POSITIVE
        );
      case "neutral":
        return significance === ImpactSignificance.NEUTRAL;
      case "negative":
        return (
          significance === ImpactSignificance.NEGATIVE ||
          significance === ImpactSignificance.VERY_NEGATIVE
        );
      case "no_data":
        return significance === ImpactSignificance.INSUFFICIENT_DATA;
      default:
        return true;
    }
  };

  // Filter supplements based on search query and active tab
  const filteredSupplements = supplements.filter((supplement) => {
    // Filter by search query
    if (
      searchQuery &&
      !supplement.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter by tab
    if (activeTab === "all") {
      return true;
    }

    return filterByTab(supplement, activeTab, correlations);
  });

  // Sort filtered supplements
  const sortedSupplements = useMemo(() => {
    return [...filteredSupplements].sort((a, b) => {
      switch (sortOption) {
        case SortOption.NAME_ASC:
          return a.name.localeCompare(b.name);
        case SortOption.NAME_DESC:
          return b.name.localeCompare(a.name);
        case SortOption.IMPACT_HIGH:
        case SortOption.IMPACT_LOW: {
          // Get the latest correlation for each supplement
          const correlationsA = correlations.filter(
            (c) => c.supplement_id === a.id,
          );
          const correlationsB = correlations.filter(
            (c) => c.supplement_id === b.id,
          );

          if (correlationsA.length === 0 && correlationsB.length === 0)
            return 0;
          if (correlationsA.length === 0)
            return sortOption === SortOption.IMPACT_HIGH ? 1 : -1;
          if (correlationsB.length === 0)
            return sortOption === SortOption.IMPACT_HIGH ? -1 : 1;

          const latestCorrelationA = getLatestCorrelation(correlationsA);
          const latestCorrelationB = getLatestCorrelation(correlationsB);

          // Calculate overall impact for each
          const scoreImpactA = latestCorrelationA.score_impact ?? 0;
          const reactionTimeImpactA =
            latestCorrelationA.reaction_time_impact ?? 0;
          const accuracyImpactA = latestCorrelationA.accuracy_impact ?? 0;

          const scoreImpactB = latestCorrelationB.score_impact ?? 0;
          const reactionTimeImpactB =
            latestCorrelationB.reaction_time_impact ?? 0;
          const accuracyImpactB = latestCorrelationB.accuracy_impact ?? 0;

          // For reaction time, negative is good, so we invert it
          const normalizedReactionTimeImpactA = -reactionTimeImpactA;
          const normalizedReactionTimeImpactB = -reactionTimeImpactB;

          // Calculate overall impact (simple average)
          const overallImpactA =
            (scoreImpactA + normalizedReactionTimeImpactA + accuracyImpactA) /
            3;
          const overallImpactB =
            (scoreImpactB + normalizedReactionTimeImpactB + accuracyImpactB) /
            3;

          return sortOption === SortOption.IMPACT_HIGH
            ? overallImpactB - overallImpactA
            : overallImpactA - overallImpactB;
        }
        case SortOption.RECENT:
        default:
          return (
            new Date(b.intake_time).getTime() -
            new Date(a.intake_time).getTime()
          );
      }
    });
  }, [filteredSupplements, sortOption, correlations]);

  // Get the selected supplement
  const selectedSupplement = supplements.find(
    (s) => s.id === selectedSupplementId,
  );

  // Get correlations for the selected supplement
  const selectedSupplementCorrelations = selectedSupplementId
    ? correlations.filter((c) => c.supplement_id === selectedSupplementId)
    : [];

  // Get analyses for the selected supplement
  const selectedSupplementAnalyses = selectedSupplementId
    ? analyses.filter((a) => a.context_id === selectedSupplementId)
    : [];

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supplement Effectiveness Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze how different supplements affect your cognitive performance
          </p>
        </div>
        <Button className="mt-4 md:mt-0 gap-2" asChild>
          <a href="/log-supplement">
            <Plus className="h-4 w-4" />
            Log New Supplement
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Supplements</CardTitle>
              <CardDescription>
                Select a supplement to view its effectiveness report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search supplements..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9"
                      />
                    </div>
                  </div>
                  <Select
                    value={sortOption}
                    onValueChange={(value) =>
                      setSortOption(value as SortOption)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SortOption.RECENT}>
                        Most Recent
                      </SelectItem>
                      <SelectItem value={SortOption.NAME_ASC}>
                        Name (A-Z)
                      </SelectItem>
                      <SelectItem value={SortOption.NAME_DESC}>
                        Name (Z-A)
                      </SelectItem>
                      <SelectItem value={SortOption.IMPACT_HIGH}>
                        Highest Impact
                      </SelectItem>
                      <SelectItem value={SortOption.IMPACT_LOW}>
                        Lowest Impact
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="positive">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Positive</span>
                    </TabsTrigger>
                    <TabsTrigger value="neutral">
                      <Minus className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Neutral</span>
                    </TabsTrigger>
                    <TabsTrigger value="negative">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Negative</span>
                    </TabsTrigger>
                    <TabsTrigger value="no_data">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">No Data</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : sortedSupplements.length === 0 ? (
                  <div className="text-center py-8">
                    <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Supplements Found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {supplements.length > 0 && activeTab !== "all"
                        ? `No supplements match the "${activeTab}" filter. ${getFilterExplanation(activeTab)}`
                        : getSupplementsMessage(searchQuery)}
                    </p>
                    {supplements.length === 0 && (
                      <Button asChild>
                        <a href="/log-supplement">Log Your First Supplement</a>
                      </Button>
                    )}
                    {supplements.length > 0 && activeTab !== "all" && (
                      <Button onClick={() => setActiveTab("all")}>
                        Show All Supplements
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {sortedSupplements.map((supplement) => {
                      // Get the latest correlation for this supplement
                      const supplementCorrelations = correlations.filter(
                        (c) => c.supplement_id === supplement.id,
                      );
                      const hasCorrelation = supplementCorrelations.length > 0;

                      let impactBadge = null;
                      if (hasCorrelation) {
                        const latestCorrelation = getLatestCorrelation(
                          supplementCorrelations,
                        );

                        // Calculate overall impact
                        const scoreImpact = latestCorrelation.score_impact ?? 0;
                        const reactionTimeImpact =
                          latestCorrelation.reaction_time_impact ?? 0;
                        const accuracyImpact =
                          latestCorrelation.accuracy_impact ?? 0;

                        // For reaction time, negative is good, so we invert it
                        const normalizedReactionTimeImpact =
                          -reactionTimeImpact;

                        // Calculate overall impact (simple average)
                        const overallImpact =
                          (scoreImpact +
                            normalizedReactionTimeImpact +
                            accuracyImpact) /
                          3;

                        // Determine significance
                        const significance =
                          getImpactSignificance(overallImpact);

                        switch (significance) {
                          case ImpactSignificance.VERY_POSITIVE:
                          case ImpactSignificance.POSITIVE:
                            impactBadge = (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-600 border-green-200"
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Positive
                              </Badge>
                            );
                            break;
                          case ImpactSignificance.NEUTRAL:
                            impactBadge = (
                              <Badge
                                variant="outline"
                                className="bg-gray-500/10 text-gray-600 border-gray-200"
                              >
                                <Minus className="h-3 w-3 mr-1" />
                                Neutral
                              </Badge>
                            );
                            break;
                          case ImpactSignificance.NEGATIVE:
                          case ImpactSignificance.VERY_NEGATIVE:
                            impactBadge = (
                              <Badge
                                variant="outline"
                                className="bg-red-500/10 text-red-600 border-red-200"
                              >
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Negative
                              </Badge>
                            );
                            break;
                          default:
                            impactBadge = (
                              <Badge
                                variant="outline"
                                className="bg-gray-500/10 text-gray-600 border-gray-200"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                No Data
                              </Badge>
                            );
                        }
                      } else {
                        impactBadge = (
                          <Badge
                            variant="outline"
                            className="bg-gray-500/10 text-gray-600 border-gray-200"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            No Data
                          </Badge>
                        );
                      }

                      return (
                        <Button
                          key={supplement.id}
                          variant={
                            selectedSupplementId === supplement.id
                              ? "default"
                              : "outline"
                          }
                          className="w-full justify-between h-auto py-3"
                          onClick={() => setSelectedSupplementId(supplement.id)}
                        >
                          <span className="font-medium">{supplement.name}</span>
                          {impactBadge}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : !selectedSupplement ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No Supplement Selected
              </h2>
              <p className="text-muted-foreground mb-6">
                Select a supplement from the list to view its effectiveness
                report
              </p>
            </div>
          ) : (
            <SupplementEffectivenessReport
              supplement={selectedSupplement}
              correlations={selectedSupplementCorrelations}
              analyses={selectedSupplementAnalyses}
              testResults={testResults.filter(
                (result) =>
                  new Date(result.date) >=
                  new Date(selectedSupplement.intake_time),
              )}
              onExport={() => {
                toast({
                  title: "Export Feature",
                  description:
                    "Export functionality will be available in a future update.",
                });
              }}
              onShare={() => {
                toast({
                  title: "Share Feature",
                  description:
                    "Sharing functionality will be available in a future update.",
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
