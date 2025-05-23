/**
 * Supplement Analysis Tab Component
 *
 * Consolidated component that combines supplement timeline visualization
 * with comparative analysis functionality
 */
import { useState } from 'react';
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
import { Pill, BarChart2, Activity } from 'lucide-react';
import { TestResult } from '@/lib/testResultUtils';
import { Supplement } from '@/types/supplement';
import { WashoutPeriod, ActiveWashoutPeriod } from '@/types/washoutPeriod';
import { SupplementTimeline, WashoutPeriodCard } from '../../supplements';
import { ComparativeVisualization } from '@/components/analysis/ComparativeVisualization';
import { DateRange } from '@/hooks/useDashboardFilters';
import { PeriodType } from '@/utils/performanceCorrelationUtils';

/**
 * Props for the SupplementAnalysisTab component
 */
interface SupplementAnalysisTabProps {
  readonly testResults: TestResult[];
  readonly supplements: Supplement[];
  readonly washoutPeriods: WashoutPeriod[] | ActiveWashoutPeriod[];
  readonly periods: Array<{
    startDate: Date;
    endDate?: Date;
    type: PeriodType;
    supplementId?: string;
    supplementName?: string;
  }>;
  readonly dateRange: DateRange;
  readonly uniqueSupplements: Array<{
    id: string;
    name: string;
  }>;
  readonly isLoading?: boolean;
}

/**
 * Component for rendering the consolidated supplement analysis tab
 * Combines supplement timeline visualization with comparative analysis
 */
export function SupplementAnalysisTab({
  testResults,
  supplements,
  washoutPeriods,
  periods,
  dateRange,
  uniqueSupplements,
  isLoading = false
}: Readonly<SupplementAnalysisTabProps>): JSX.Element {
  // State for the inner tab navigation
  const [activeInnerTab, setActiveInnerTab] = useState('timeline');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplement Analysis</CardTitle>
        <CardDescription>
          Analyze how different supplements affect your cognitive performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {supplements.length > 0 ? (
          <div className="space-y-6">
            {/* Inner tab navigation */}
            <Tabs value={activeInnerTab} onValueChange={setActiveInnerTab} className="w-full">
              <TabsList className="w-full max-w-md mb-6">
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Supplement Timeline
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Comparative Analysis
                </TabsTrigger>
              </TabsList>

              {/* Timeline Tab Content */}
              <TabsContent value="timeline" className="space-y-6">
                <div className="space-y-4">
                  {uniqueSupplements.map((supplement) => (
                    <SupplementTimeline
                      key={supplement.id}
                      supplementName={supplement.name}
                      supplementId={supplement.id}
                      periods={periods}
                      dateRange={dateRange}
                    />
                  ))}
                </div>

                {/* Washout Periods */}
                {washoutPeriods.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Washout Periods</h3>
                    <div className="space-y-4">
                      {washoutPeriods.map((period: WashoutPeriod | ActiveWashoutPeriod) => (
                        <WashoutPeriodCard key={period.id} period={period} />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Comparison Tab Content */}
              <TabsContent value="comparison" className="space-y-6">
                <ComparativeVisualization
                  testResults={testResults}
                  supplements={supplements}
                  washoutPeriods={washoutPeriods}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No supplement data available.</p>
            <p>Log supplements to track their impact on your cognitive performance.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link to="/comparative-visualization">
          <Button variant="outline" className="gap-2">
            <Activity className="h-4 w-4" />
            View Full Analysis
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
