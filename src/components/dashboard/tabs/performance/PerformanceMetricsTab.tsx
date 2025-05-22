/**
 * Performance Metrics Tab Component
 *
 * Displays performance metrics charts for score, reaction time, and accuracy
 */
import { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { TestResult } from '@/lib/testResultUtils';
import { PerformanceChart } from '../../charts';
import { useLoadingState, LoadingStatus } from '@/hooks/useLoadingState';
import { PartialLoadingContainer } from '@/components/ui/partial-loading-container';

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
export function PerformanceMetricsTab({
  testResults,
  baselineResult = null,
  isLoading = false,
  onLoadingStateChange
}: Readonly<PerformanceMetricsTabProps>): JSX.Element {
  // Use our new loading state hook
  const scoreLoadingState = useLoadingState<TestResult[]>({
    id: 'performance-metrics-score'
  });

  const reactionTimeLoadingState = useLoadingState<TestResult[]>({
    id: 'performance-metrics-reaction-time'
  });

  const accuracyLoadingState = useLoadingState<TestResult[]>({
    id: 'performance-metrics-accuracy'
  });

  // Simulate loading states for demonstration purposes
  // In a real implementation, these would be actual data fetching operations
  useEffect(() => {
    if (isLoading) {
      // Set all charts to loading state
      scoreLoadingState.setMessage('Loading score data...');
      reactionTimeLoadingState.setMessage('Loading reaction time data...');
      accuracyLoadingState.setMessage('Loading accuracy data...');

      // Simulate staggered loading of different metrics
      const loadScore = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          scoreLoadingState.setSuccess(testResults, 'Score data loaded');
        } catch (error) {
          scoreLoadingState.setError(error instanceof Error ? error : new Error('Failed to load score data'));
        }
      };

      const loadReactionTime = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1200));
          reactionTimeLoadingState.setSuccess(testResults, 'Reaction time data loaded');
        } catch (error) {
          reactionTimeLoadingState.setError(error instanceof Error ? error : new Error('Failed to load reaction time data'));
        }
      };

      const loadAccuracy = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          accuracyLoadingState.setSuccess(testResults, 'Accuracy data loaded');
        } catch (error) {
          accuracyLoadingState.setError(error instanceof Error ? error : new Error('Failed to load accuracy data'));
        }
      };

      // Start loading all metrics
      loadScore();
      loadReactionTime();
      loadAccuracy();
    } else {
      // If not loading, set all charts to success state with the data
      scoreLoadingState.setSuccess(testResults);
      reactionTimeLoadingState.setSuccess(testResults);
      accuracyLoadingState.setSuccess(testResults);
    }
  }, [isLoading, testResults, scoreLoadingState, reactionTimeLoadingState, accuracyLoadingState]);

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
    onLoadingStateChange
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
            <PerformanceChart
              testResults={scoreLoadingState.data || []}
              baselineResult={baselineResult}
              mode="single"
              dataKey="score"
              title="Score Trend"
              height={300}
              showMovingAverage={false}
              isLoading={false} // We're handling loading state with PartialLoadingContainer
            />
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
            <PerformanceChart
              testResults={reactionTimeLoadingState.data || []}
              baselineResult={baselineResult}
              mode="single"
              dataKey="reactionTime"
              title="Reaction Time Trend"
              height={300}
              showMovingAverage={false}
              isLoading={false} // We're handling loading state with PartialLoadingContainer
            />
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
            <PerformanceChart
              testResults={accuracyLoadingState.data || []}
              baselineResult={baselineResult}
              mode="single"
              dataKey="accuracy"
              title="Accuracy Trend"
              height={300}
              showMovingAverage={false}
              isLoading={false} // We're handling loading state with PartialLoadingContainer
            />
          </PartialLoadingContainer>
        </div>
      </CardContent>
    </Card>
  );
}
