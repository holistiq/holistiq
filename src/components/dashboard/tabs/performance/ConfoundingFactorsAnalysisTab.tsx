/**
 * Confounding Factors Analysis Tab Component
 *
 * Displays analysis of how confounding factors affect cognitive performance
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  BarChart2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TestResult } from '@/lib/testResultUtils';
import { ConfoundingFactor, FactorCorrelation } from '@/types/confoundingFactor';
import { DateRange } from '@/hooks/useDashboardFilters';
import { FactorTimeline } from '../../factors/FactorTimeline';
import { FactorCorrelationChart } from '@/components/analysis/FactorCorrelationChart';
import { analyzeConfoundingFactors } from '@/services/confoundingFactorService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { subMonths } from 'date-fns';
import { executeWithTimeout } from '@/utils/apiUtils';

/**
 * Props for the ConfoundingFactorsAnalysisTab component
 */
interface ConfoundingFactorsAnalysisTabProps {
  readonly testResults: TestResult[];
  readonly factors: ConfoundingFactor[];
  readonly dateRange: DateRange;
  readonly isLoading?: boolean;
}

/**
 * Component for rendering the confounding factors analysis tab
 * Shows timeline visualization and correlation analysis for confounding factors
 */
export function ConfoundingFactorsAnalysisTab({
  testResults,
  factors,
  dateRange,
  isLoading = false
}: Readonly<ConfoundingFactorsAnalysisTabProps>): JSX.Element {
  // State for the inner tab navigation
  const [activeInnerTab, setActiveInnerTab] = useState('timeline');

  // State for factor correlations
  const [factorCorrelations, setFactorCorrelations] = useState<FactorCorrelation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user from auth context
  const { user } = useSupabaseAuth();

  // Define factor types for visualization
  const factorTypes = useMemo(() => [
    { type: 'sleep', name: 'Sleep' },
    { type: 'stress', name: 'Stress' },
    { type: 'exercise', name: 'Exercise' },
    { type: 'caffeine', name: 'Caffeine' },
    { type: 'alcohol', name: 'Alcohol' },
    { type: 'mood', name: 'Mood' },
    { type: 'energy', name: 'Energy' }
  ], []);

  // Analyze factors when tab is active
  useEffect(() => {
    if (activeInnerTab === 'correlation' && factorCorrelations.length === 0 && !isAnalyzing && factors.length > 0) {
      analyzeFactors();
    }
  }, [activeInnerTab, factors.length, factorCorrelations.length, isAnalyzing]);

  // Function to analyze factors
  const analyzeFactors = async () => {
    if (!user || factors.length === 0 || testResults.length === 0) {
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Get date range for analysis (last 30 days or use provided date range)
      const endDate = dateRange.to ? dateRange.to.toISOString() : new Date().toISOString();
      const startDate = dateRange.from ? dateRange.from.toISOString() : subMonths(new Date(), 1).toISOString();

      // Execute with timeout to prevent long-running operations
      const result = await executeWithTimeout(
        async () => {
          // Get the test type from the first test result or use default
          const testType = "n-back-2"; // Default test type

          return await analyzeConfoundingFactors(
            user.id,
            testType,
            startDate,
            endDate
          );
        },
        10000 // 10 second timeout
      );

      if (result.success && result.analysis) {
        setFactorCorrelations(result.analysis.correlations || []);
      } else {
        setError(result.error || "Failed to analyze confounding factors");
      }
    } catch (error) {
      console.error("Error analyzing factors:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze confounding factors. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confounding Factors Analysis</CardTitle>
        <CardDescription>
          Analyze how lifestyle factors affect your cognitive performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {factors.length > 0 ? (
          <div className="space-y-6">
            {/* Inner tab navigation */}
            <Tabs value={activeInnerTab} onValueChange={setActiveInnerTab} className="w-full">
              <TabsList className="w-full max-w-md mb-6">
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Factor Timeline
                </TabsTrigger>
                <TabsTrigger value="correlation" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Correlation Analysis
                </TabsTrigger>
              </TabsList>

              {/* Timeline Tab Content */}
              <TabsContent value="timeline" className="space-y-6">
                <div className="space-y-4">
                  {factorTypes.map((factor) => (
                    <FactorTimeline
                      key={factor.type}
                      factorType={factor.type}
                      factorName={factor.name}
                      factors={factors}
                      dateRange={dateRange}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Correlation Tab Content */}
              <TabsContent value="correlation" className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Render appropriate content based on state */}
                {(() => {
                  if (isAnalyzing) {
                    return (
                      <div className="space-y-4">
                        <Skeleton className="h-[300px] w-full" />
                        <div className="flex justify-center">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">Analyzing your data...</p>
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                          </div>
                        </div>
                      </div>
                    );
                  } else if (factorCorrelations.length > 0) {
                    return <FactorCorrelationChart correlations={factorCorrelations} />;
                  } else {
                    return (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No correlation data available</h3>
                        <p className="text-muted-foreground mb-6">
                          Log more confounding factors and take more tests to see correlations.
                        </p>
                        <Button onClick={analyzeFactors} className="gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Analyze Factors
                        </Button>
                      </div>
                    );
                  }
                })()}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No confounding factor data available.</p>
            <p>Log confounding factors to track their impact on your cognitive performance.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link to="/confounding-factors">
          <Button variant="outline" className="gap-2">
            <Activity className="h-4 w-4" />
            View All Factors
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
