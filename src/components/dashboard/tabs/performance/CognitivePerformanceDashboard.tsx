import { useState, useCallback, memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Pill, Activity } from "lucide-react";
import { TestResult } from "@/lib/testResultUtils";
import { Supplement } from "@/types/supplement";
import { ConfoundingFactor } from "@/types/confoundingFactor";
import { WashoutPeriod, ActiveWashoutPeriod } from "@/types/washoutPeriod";
import { DashboardFilters } from "@/components/dashboard/common/DashboardFilters";
import {
  DashboardLoadingState,
  DashboardEmptyState,
} from "@/components/dashboard/common/DashboardStates";
import { PerformanceMetricsTab } from "./PerformanceMetricsTab";
import { SupplementAnalysisTab } from "./SupplementAnalysisTab";
import { ConfoundingFactorsAnalysisTab } from "./ConfoundingFactorsAnalysisTab";
import { usePerformanceData } from "@/hooks/usePerformanceData";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { LoadingStatus } from "@/hooks/useLoadingState";
import { createLogger } from "@/lib/logger";
import { RenderProfiler } from "@/components/debug/RenderProfiler";

// Create a logger for the CognitivePerformanceDashboard component
const logger = createLogger({ namespace: "CognitivePerformanceDashboard" });

/**
 * Props for the CognitivePerformanceDashboard component
 */
interface CognitivePerformanceDashboardProps {
  readonly testResults: TestResult[];
  readonly supplements: Supplement[];
  readonly factors: ConfoundingFactor[];
  readonly washoutPeriods: WashoutPeriod[] | ActiveWashoutPeriod[];
  readonly baselineResult?: TestResult | null;
  readonly isLoading?: boolean;
  readonly isLoadingFactors?: boolean;
}

/**
 * Main dashboard component for visualizing cognitive performance data
 * Shows performance metrics, supplement analysis, and confounding factors analysis
 */
export const CognitivePerformanceDashboard = memo(
  function CognitivePerformanceDashboard({
    testResults,
    supplements,
    factors,
    washoutPeriods,
    baselineResult = null,
    isLoading = false,
    isLoadingFactors = false,
  }: Readonly<CognitivePerformanceDashboardProps>): JSX.Element {
    // Use the dashboard filters hook
    const {
      dateRange,
      selectedSupplement,
      setDateRange,
      setSelectedSupplement,
    } = useDashboardFilters();

    // State for active tab
    const [activeTab, setActiveTab] = useState("metrics");

    // State for tracking loading states of each tab
    const [metricsLoadingStatus, setMetricsLoadingStatus] =
      useState<LoadingStatus>(LoadingStatus.IDLE);
    const [supplementsLoadingStatus, setSupplementsLoadingStatus] =
      useState<LoadingStatus>(LoadingStatus.IDLE);
    const [factorsLoadingStatus, setFactorsLoadingStatus] =
      useState<LoadingStatus>(LoadingStatus.IDLE);

    // Use our custom hook to process performance data
    const { periods, uniqueSupplements } = usePerformanceData(
      testResults,
      supplements,
      washoutPeriods,
      dateRange,
      selectedSupplement,
    );

    // Callbacks for handling loading state changes from child components
    const handleMetricsLoadingChange = useCallback((status: LoadingStatus) => {
      setMetricsLoadingStatus(status);
    }, []);

    const handleSupplementsLoadingChange = useCallback(
      (status: LoadingStatus) => {
        setSupplementsLoadingStatus(status);
      },
      [],
    );

    const handleFactorsLoadingChange = useCallback((status: LoadingStatus) => {
      setFactorsLoadingStatus(status);
    }, []);

    // Determine if any tab is in loading state
    const isAnyTabLoading =
      metricsLoadingStatus === LoadingStatus.LOADING ||
      supplementsLoadingStatus === LoadingStatus.LOADING ||
      factorsLoadingStatus === LoadingStatus.LOADING;

    // Determine if any tab is in error state
    const isAnyTabError =
      metricsLoadingStatus === LoadingStatus.ERROR ||
      supplementsLoadingStatus === LoadingStatus.ERROR ||
      factorsLoadingStatus === LoadingStatus.ERROR;

    // Render loading state only for initial load
    if (isLoading && testResults.length === 0) {
      return (
        <DashboardLoadingState
          title="Cognitive Performance Dashboard"
          description="Loading your performance data..."
        />
      );
    }

    // Render empty state
    if (testResults.length === 0) {
      return (
        <DashboardEmptyState
          title="Cognitive Performance Dashboard"
          description="Track how supplements affect your cognitive performance"
          message="No test results available to display performance trends."
          actionText="Take a Cognitive Test"
          actionLink="/test"
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            Cognitive Performance Dashboard
          </h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="metrics">
                <BarChart className="h-4 w-4 mr-2" />
                Performance Metrics
              </TabsTrigger>
              <TabsTrigger value="supplements">
                <Pill className="h-4 w-4 mr-2" />
                Supplement Analysis
              </TabsTrigger>
              <TabsTrigger value="factors">
                <Activity className="h-4 w-4 mr-2" />
                Confounding Factors
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 md:mt-0">
              <DashboardFilters
                dateRange={dateRange}
                setDateRange={setDateRange}
                selectedSupplement={selectedSupplement}
                setSelectedSupplement={setSelectedSupplement}
                supplementOptions={uniqueSupplements}
              />
            </div>
          </div>

          {/* Loading indicator for active tabs */}
          {isAnyTabLoading &&
            (() => {
              // Extract the tab name logic to avoid nested ternary
              let tabName = "Performance Metrics";
              if (activeTab === "supplements") {
                tabName = "Supplement Analysis";
              } else if (activeTab === "factors") {
                tabName = "Confounding Factors";
              }

              return (
                <div className="mb-4 p-2 bg-muted/20 rounded-md border border-muted">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span>Loading data for {tabName}...</span>
                  </div>
                </div>
              );
            })()}

          {/* Performance Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <RenderProfiler id="metrics-tab-content">
              <PerformanceMetricsTab
                testResults={testResults}
                baselineResult={baselineResult}
                isLoading={isLoading}
                onLoadingStateChange={handleMetricsLoadingChange}
              />
            </RenderProfiler>
          </TabsContent>

          {/* Supplement Analysis Tab */}
          <TabsContent value="supplements" className="space-y-4">
            <RenderProfiler id="supplements-tab-content">
              <SupplementAnalysisTab
                testResults={testResults}
                supplements={supplements}
                washoutPeriods={washoutPeriods}
                periods={periods}
                dateRange={dateRange}
                uniqueSupplements={uniqueSupplements}
                isLoading={isLoading}
              />
            </RenderProfiler>
          </TabsContent>

          {/* Confounding Factors Analysis Tab */}
          <TabsContent value="factors" className="space-y-4">
            <RenderProfiler id="factors-tab-content">
              <ConfoundingFactorsAnalysisTab
                testResults={testResults}
                factors={factors}
                dateRange={dateRange}
                isLoading={isLoadingFactors}
              />
            </RenderProfiler>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);
