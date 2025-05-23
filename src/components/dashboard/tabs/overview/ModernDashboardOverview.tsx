import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Clock,
  Target,
  Pill,
  Activity,
  Calendar,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestResult } from '@/lib/testResultUtils';
import { Supplement } from '@/types/supplement';
import { ConfoundingFactor } from '@/types/confoundingFactor';
import { ActiveWashoutPeriod } from '@/types/washoutPeriod';
import { PerformanceChart } from '@/components/dashboard/charts';
import {
  DashboardCard,
  DashboardGrid,
  DashboardGridItem,
  DashboardMetricsRow
} from '@/components/dashboard/layout';

interface ModernDashboardOverviewProps {
  readonly baselineResult: TestResult | null;
  readonly latestResult: TestResult | null;
  readonly recentSupplements: Supplement[];
  readonly recentFactors: ConfoundingFactor[];
  readonly activeWashoutPeriods: ActiveWashoutPeriod[];
  readonly testHistory: TestResult[];
  readonly isLoadingTests: boolean;
  readonly isLoadingSupplements: boolean;
  readonly isLoadingFactors: boolean;
  readonly isLoadingWashoutPeriods: boolean;
}

export function ModernDashboardOverview({
  baselineResult,
  latestResult,
  recentSupplements,
  recentFactors,
  activeWashoutPeriods,
  testHistory,
  isLoadingTests,
  isLoadingSupplements,
  isLoadingFactors,
  isLoadingWashoutPeriods
}: ModernDashboardOverviewProps) {
  // State for Moving Average toggle
  const [showMovingAverage, setShowMovingAverage] = useState(false);

  // Prepare metrics for the metrics row
  const metrics = [
    {
      title: 'Overall Score',
      value: latestResult?.score || 0,
      icon: <Target className="h-4 w-4" />,
      description: 'Overall cognitive performance score compared to your baseline. Higher is better.',
      change: latestResult && baselineResult ? {
        value: ((latestResult.score - baselineResult.score) / baselineResult.score) * 100,
        isPositive: latestResult.score > baselineResult.score,
        label: 'vs. baseline'
      } : undefined,
      isLoading: isLoadingTests
    },
    {
      title: 'Reaction Time',
      value: `${latestResult?.reactionTime || 0}ms`,
      icon: <Clock className="h-4 w-4" />,
      description: 'How quickly you respond to stimuli compared to your baseline. Lower is better.',
      change: latestResult && baselineResult ? {
        value: ((baselineResult.reactionTime - latestResult.reactionTime) / baselineResult.reactionTime) * 100,
        isPositive: latestResult.reactionTime < baselineResult.reactionTime,
        isInverted: true,
        label: 'faster'
      } : undefined,
      isLoading: isLoadingTests
    },
    {
      title: 'Accuracy',
      value: `${latestResult?.accuracy || 0}%`,
      icon: <Target className="h-4 w-4" />,
      description: 'How accurately you respond to test stimuli compared to your baseline. Higher is better.',
      change: latestResult && baselineResult ? {
        value: ((latestResult.accuracy - baselineResult.accuracy) / baselineResult.accuracy) * 100,
        isPositive: latestResult.accuracy > baselineResult.accuracy,
        label: 'vs. baseline'
      } : undefined,
      isLoading: isLoadingTests
    },
    {
      title: 'Active Supplements',
      value: recentSupplements.length,
      icon: <Pill className="h-4 w-4" />,
      description: 'Number of supplements you are currently taking.',
      isLoading: isLoadingSupplements
    }
  ];

  // Render the performance trend chart
  const renderPerformanceTrend = () => {
    if (testHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Performance Data Yet</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Take a test to see your performance data and track your cognitive enhancement journey.
          </p>
          <Link to="/test">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Take a Test
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="h-[450px]">
        {/* Increased height to prevent truncation */}
        <PerformanceChart
          testResults={testHistory}
          baselineResult={baselineResult}
          isLoading={isLoadingTests}
          height="100%"
          showMovingAverage={showMovingAverage}
          onMovingAverageChange={setShowMovingAverage}
          showInteractiveLegend={true}
          showTimeRangeSelector={true}
          mode="comprehensive"
          hideTitle={true}
        />
      </div>
    );
  };

  // Render recent supplements
  const renderRecentSupplements = () => {
    if (recentSupplements.length === 0) {
      return (
        <div className="text-center py-6 h-full flex flex-col justify-center">
          <Pill className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">No Active Supplements</h3>
          <p className="text-muted-foreground mb-4">
            Log supplements to track their effects on your cognitive performance.
          </p>
          <div className="mt-auto pt-2">
            <Link to="/log-supplement">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Log Supplement
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex-grow overflow-auto">
          {recentSupplements.slice(0, 3).map((supplement) => (
            <div key={supplement.id} className="flex items-center justify-between p-3 border rounded-md mb-4">
              <div>
                <div className="font-medium">{supplement.name}</div>
                <div className="text-sm text-muted-foreground">{supplement.dosage}</div>
              </div>
              <div className="text-sm text-muted-foreground">{supplement.frequency}</div>
            </div>
          ))}
        </div>
        {recentSupplements.length > 3 && (
          <div className="mt-auto pt-2">
            <Link to="/supplements" className="text-sm text-primary hover:underline block text-center">
              View all {recentSupplements.length} supplements
            </Link>
          </div>
        )}
      </div>
    );
  };

  // Render confounding factors
  const renderConfoundingFactors = () => {
    if (recentFactors.length === 0) {
      return (
        <div className="text-center py-6 h-full flex flex-col justify-center">
          <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">No Factors Logged</h3>
          <p className="text-muted-foreground mb-4">
            Track factors like sleep, stress, and exercise that may affect your cognitive performance.
          </p>
          <div className="mt-auto pt-2">
            <Link to="/confounding-factors">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Log Factor
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex-grow overflow-auto">
          {recentFactors.slice(0, 3).map((factor) => (
            <div key={factor.id} className="flex items-center justify-between p-3 border rounded-md mb-4">
              <div>
                <div className="font-medium">{factor.factor_type}</div>
                <div className="text-sm text-muted-foreground">{factor.value}</div>
              </div>
              <div className="text-sm text-muted-foreground">{new Date(factor.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
        {recentFactors.length > 3 && (
          <div className="mt-auto pt-2">
            <Link to="/confounding-factors" className="text-sm text-primary hover:underline block text-center">
              View all {recentFactors.length} factors
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <DashboardMetricsRow metrics={metrics} />

      {/* Main Dashboard Grid */}
      <DashboardGrid>
        {/* Performance Trend Card - Full Width */}
        <DashboardGridItem colSpan={{ default: 1, md: 2, lg: 3 }}>
          <DashboardCard
            title="Performance Trend"
            description="Track your cognitive metrics over time"
            icon={<BarChart className="h-5 w-5" />}
            actionText="View Full Analysis"
            actionLink="/analysis"
            isLoading={isLoadingTests}
            heightClass="min-h-[500px]" // Increased minimum height to accommodate the chart
          >
            {renderPerformanceTrend()}
          </DashboardCard>
        </DashboardGridItem>

        {/* Active Supplements Card */}
        <DashboardGridItem>
          <DashboardCard
            title="Active Supplements"
            description="Currently active supplements"
            icon={<Pill className="h-5 w-5" />}
            actionText="View All"
            actionLink="/supplements"
            isLoading={isLoadingSupplements}
            fixedHeight="h-[350px] sm:h-[380px] md:h-[400px]"
          >
            {renderRecentSupplements()}
          </DashboardCard>
        </DashboardGridItem>

        {/* Confounding Factors Card */}
        <DashboardGridItem>
          <DashboardCard
            title="Confounding Factors"
            description="Factors affecting your performance"
            icon={<Activity className="h-5 w-5" />}
            actionText="View All"
            actionLink="/confounding-factors"
            isLoading={isLoadingFactors}
            fixedHeight="h-[350px] sm:h-[380px] md:h-[400px]"
          >
            {renderConfoundingFactors()}
          </DashboardCard>
        </DashboardGridItem>

        {/* Washout Periods Card */}
        <DashboardGridItem>
          <DashboardCard
            title="Washout Periods"
            description="Active supplement washout periods"
            icon={<Calendar className="h-5 w-5" />}
            actionText="Manage"
            actionLink="/washout-periods"
            isLoading={isLoadingWashoutPeriods}
            fixedHeight="h-[350px] sm:h-[380px] md:h-[400px]"
          >
            {activeWashoutPeriods.length === 0 ? (
              <div className="text-center py-6 h-full flex flex-col justify-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">No Active Washouts</h3>
                <p className="text-muted-foreground mb-4">
                  Track periods when you're not taking supplements to establish baseline performance.
                </p>
                <div className="mt-auto pt-2">
                  <Link to="/washout-periods">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Start Washout
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex-grow overflow-auto">
                  {activeWashoutPeriods.map((period) => (
                    <div key={period.id} className="flex items-center justify-between p-3 border rounded-md mb-4">
                      <div>
                        <div className="font-medium">{period.supplement_name}</div>
                        <div className="text-sm text-muted-foreground">Started: {new Date(period.start_date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm font-medium">
                        {period.days_remaining} days left
                      </div>
                    </div>
                  ))}
                </div>
                {activeWashoutPeriods.length > 3 && (
                  <div className="mt-auto pt-2">
                    <Link to="/washout-periods" className="text-sm text-primary hover:underline block text-center">
                      View all washout periods
                    </Link>
                  </div>
                )}
              </div>
            )}
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>
    </div>
  );
}
