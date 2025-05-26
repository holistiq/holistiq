/**
 * Performance Metrics Tab Component
 *
 * Displays performance metrics charts for score, reaction time, and accuracy
 */
import { useEffect, memo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TestResult } from "@/lib/testResultUtils";
import { StablePerformanceChart } from "../../charts/StablePerformanceChart";
import { useLoadingState, LoadingStatus } from "@/hooks/useLoadingState";
import { PartialLoadingContainer } from "@/components/ui/partial-loading-container";
import { createLogger } from "@/lib/logger";
import { RenderProfiler } from "@/components/debug/RenderProfiler";

// Create a logger for the PerformanceMetricsTab component
const logger = createLogger({ namespace: "PerformanceMetricsTab" });

/**
 * Props for the PerformanceMetricsTab component
 */
interface PerformanceMetricsTabProps {
  readonly testResults: TestResult[];
  readonly baselineResult?: TestResult | null;
  readonly isLoading?: boolean;
  readonly onLoadingStateChange?: (status: LoadingStatus) => void;
}

/**
 * Component for rendering the performance metrics tab
 * Shows charts for score, reaction time, and accuracy
 */
export const PerformanceMetricsTab = memo(function PerformanceMetricsTab({
  testResults,
  baselineResult = null,
  isLoading = false,
  onLoadingStateChange,
}: Readonly<PerformanceMetricsTabProps>): JSX.Element {
  // Use our new loading state hook
  const scoreLoadingState = useLoadingState<TestResult[]>({
    id: "performance-metrics-score",
  });

  const reactionTimeLoadingState = useLoadingState<TestResult[]>({
    id: "performance-metrics-reaction-time",
  });

  const accuracyLoadingState = useLoadingState<TestResult[]>({
    id: "performance-metrics-accuracy",
  });

  // Set loading states immediately without artificial delays
  useEffect(() => {
    if (isLoading) {
      // Set all charts to loading state
      scoreLoadingState.setMessage("Loading score data...");
      reactionTimeLoadingState.setMessage("Loading reaction time data...");
      accuracyLoadingState.setMessage("Loading accuracy data...");

      // Set all charts to success state immediately
      // This eliminates the staggered loading effect that causes flickering
      scoreLoadingState.setSuccess(testResults, "Score data loaded");
      reactionTimeLoadingState.setSuccess(
        testResults,
        "Reaction time data loaded",
      );
      accuracyLoadingState.setSuccess(testResults, "Accuracy data loaded");
    } else {
      // If not loading, set all charts to success state with the data
      scoreLoadingState.setSuccess(testResults);
      reactionTimeLoadingState.setSuccess(testResults);
      accuracyLoadingState.setSuccess(testResults);
    }
  }, [
    isLoading,
    testResults,
    scoreLoadingState,
    reactionTimeLoadingState,
    accuracyLoadingState,
  ]);

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingStateChange) {
      // Determine overall loading status
      if (
        scoreLoadingState.isLoading ||
        reactionTimeLoadingState.isLoading ||
        accuracyLoadingState.isLoading
      ) {
        onLoadingStateChange(LoadingStatus.LOADING);
      } else if (
        scoreLoadingState.isError ||
        reactionTimeLoadingState.isError ||
        accuracyLoadingState.isError
      ) {
        onLoadingStateChange(LoadingStatus.ERROR);
      } else if (
        scoreLoadingState.isSuccess &&
        reactionTimeLoadingState.isSuccess &&
        accuracyLoadingState.isSuccess
      ) {
        onLoadingStateChange(LoadingStatus.SUCCESS);
      }
    }
  }, [
    scoreLoadingState.status,
    reactionTimeLoadingState.status,
    accuracyLoadingState.status,
    scoreLoadingState.isLoading,
    scoreLoadingState.isError,
    scoreLoadingState.isSuccess,
    reactionTimeLoadingState.isLoading,
    reactionTimeLoadingState.isError,
    reactionTimeLoadingState.isSuccess,
    accuracyLoadingState.isLoading,
    accuracyLoadingState.isError,
    accuracyLoadingState.isSuccess,
    onLoadingStateChange,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cognitive Performance</CardTitle>
        <CardDescription>
          Your performance trend compared to baseline and supplement intake
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Score Chart with partial loading */}
          <PartialLoadingContainer
            status={scoreLoadingState.status}
            hasData={Boolean(scoreLoadingState.data?.length)}
            loadingMessage={scoreLoadingState.message}
            errorMessage="Failed to load score data"
            error={scoreLoadingState.error}
            height={300}
            onRetry={() => scoreLoadingState.setSuccess(testResults)}
          >
            <RenderProfiler id="score-chart">
              <StablePerformanceChart
                testResults={scoreLoadingState.data || []}
                baselineResult={baselineResult}
                mode="single"
                dataKey="score"
                title="Score Trend"
                height={300}
                showMA={false}
              />
            </RenderProfiler>
          </PartialLoadingContainer>

          {/* Reaction Time Chart with partial loading */}
          <PartialLoadingContainer
            status={reactionTimeLoadingState.status}
            hasData={Boolean(reactionTimeLoadingState.data?.length)}
            loadingMessage={reactionTimeLoadingState.message}
            errorMessage="Failed to load reaction time data"
            error={reactionTimeLoadingState.error}
            height={300}
            onRetry={() => reactionTimeLoadingState.setSuccess(testResults)}
          >
            <RenderProfiler id="reaction-time-chart">
              <StablePerformanceChart
                testResults={reactionTimeLoadingState.data || []}
                baselineResult={baselineResult}
                mode="single"
                dataKey="reactionTime"
                title="Reaction Time Trend"
                height={300}
                showMA={false}
              />
            </RenderProfiler>
          </PartialLoadingContainer>

          {/* Accuracy Chart with partial loading */}
          <PartialLoadingContainer
            status={accuracyLoadingState.status}
            hasData={Boolean(accuracyLoadingState.data?.length)}
            loadingMessage={accuracyLoadingState.message}
            errorMessage="Failed to load accuracy data"
            error={accuracyLoadingState.error}
            height={300}
            onRetry={() => accuracyLoadingState.setSuccess(testResults)}
          >
            <RenderProfiler id="accuracy-chart">
              <StablePerformanceChart
                testResults={accuracyLoadingState.data || []}
                baselineResult={baselineResult}
                mode="single"
                dataKey="accuracy"
                title="Accuracy Trend"
                height={300}
                showMA={false}
              />
            </RenderProfiler>
          </PartialLoadingContainer>
        </div>
      </CardContent>
    </Card>
  );
});
