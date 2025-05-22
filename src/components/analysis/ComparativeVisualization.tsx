import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TestResult } from '@/lib/testResultUtils';
import { Supplement } from '@/types/supplement';
import { WashoutPeriod, ActiveWashoutPeriod } from '@/types/washoutPeriod';
import { SupplementPeriodSelector } from './SupplementPeriodSelector';
import { ComparisonChart } from './ComparisonChart';
import {
  ComparisonType,
  ComparisonData,
  generateOnOffComparisonData,
  generateBetweenSupplementsComparisonData,
  generateBeforeAfterComparisonData,
  calculateComparisonMetrics
} from '@/utils/comparativeAnalysisUtils';

interface ComparativeVisualizationProps {
  testResults: TestResult[];
  supplements: Supplement[];
  washoutPeriods: (WashoutPeriod | ActiveWashoutPeriod)[];
  isLoading?: boolean;
}

export function ComparativeVisualization({
  testResults,
  supplements,
  washoutPeriods,
  isLoading = false
}: Readonly<ComparativeVisualizationProps>) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [comparisonMetrics, setComparisonMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle comparison change
  const handleComparisonChange = (
    comparisonType: ComparisonType,
    supplementId1: string,
    supplementId2?: string,
    _dateRange?: { from: Date; to: Date } // Unused for now, but kept for future implementation
  ) => {
    setError(null);

    try {
      let data: ComparisonData | null = null;

      switch (comparisonType) {
        case ComparisonType.ON_OFF:
          data = generateOnOffComparisonData(
            testResults,
            supplements,
            washoutPeriods,
            supplementId1
          );
          break;
        case ComparisonType.BETWEEN_SUPPLEMENTS:
          if (supplementId2) {
            data = generateBetweenSupplementsComparisonData(
              testResults,
              supplements,
              washoutPeriods,
              supplementId1,
              supplementId2
            );
          }
          break;
        case ComparisonType.BEFORE_AFTER:
          data = generateBeforeAfterComparisonData(
            testResults,
            supplements,
            washoutPeriods,
            supplementId1,
            30 // Default to 30 days before/after
          );
          break;
      }

      if (data) {
        const metrics = calculateComparisonMetrics(data.baselineData, data.comparisonData);
        setComparisonData(data);
        setComparisonMetrics(metrics);
      } else {
        setComparisonData(null);
        setComparisonMetrics(null);
        setError('Not enough data for comparison. Try a different supplement or comparison type.');
      }
    } catch (err) {
      console.error('Error generating comparison data:', err);
      setError('An error occurred while generating comparison data.');
    }
  };

  // Initialize with first supplement when data loads
  useEffect(() => {
    if (!isLoading && supplements.length > 0 && testResults.length > 0) {
      handleComparisonChange(ComparisonType.ON_OFF, supplements[0].id);
    }
  }, [isLoading, supplements, testResults]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  // Check if we have enough data
  if (testResults.length < 5) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparative Visualization</CardTitle>
          <CardDescription>
            Compare your performance during different supplement periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">Not Enough Data</p>
            <p className="text-sm text-muted-foreground mb-4">
              Take at least 5 cognitive tests to enable comparative visualization
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have supplements
  if (supplements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparative Visualization</CardTitle>
          <CardDescription>
            Compare your performance during different supplement periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">No Supplements Logged</p>
            <p className="text-sm text-muted-foreground mb-4">
              Log supplements to compare how they affect your cognitive performance
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SupplementPeriodSelector
        supplements={supplements}
        isLoading={isLoading}
        onComparisonChange={handleComparisonChange}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {comparisonData && comparisonMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComparisonChart
            title="Score Comparison"
            description="Overall cognitive performance score"
            baselineLabel={comparisonData.baselineLabel}
            comparisonLabel={comparisonData.comparisonLabel}
            baselineData={comparisonData.baselineData}
            comparisonData={comparisonData.comparisonData}
            metrics={comparisonMetrics}
            metricType="score"
            higherIsBetter={true}
          />

          <ComparisonChart
            title="Reaction Time Comparison"
            description="How quickly you respond to stimuli"
            baselineLabel={comparisonData.baselineLabel}
            comparisonLabel={comparisonData.comparisonLabel}
            baselineData={comparisonData.baselineData}
            comparisonData={comparisonData.comparisonData}
            metrics={comparisonMetrics}
            metricType="reactionTime"
            higherIsBetter={false}
          />

          <ComparisonChart
            title="Accuracy Comparison"
            description="How accurately you respond to test stimuli"
            baselineLabel={comparisonData.baselineLabel}
            comparisonLabel={comparisonData.comparisonLabel}
            baselineData={comparisonData.baselineData}
            comparisonData={comparisonData.comparisonData}
            metrics={comparisonMetrics}
            metricType="accuracy"
            higherIsBetter={true}
          />
        </div>
      )}
    </div>
  );
}
