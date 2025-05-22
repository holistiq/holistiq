import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { RefreshCw, Database, Clock, Zap } from 'lucide-react';
import { useTestResultsWithCache, useBaselineWithCache, useTestsWithoutConfoundingFactors } from '@/hooks/useTestResultsWithCache';
import { formatDistanceToNow } from 'date-fns';

/**
 * Component that demonstrates using the cached test results hooks
 */
const TestResultsWithCache: React.FC = () => {
  const [testType, setTestType] = useState<string>('n-back');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use the hooks with caching
  const {
    testResults,
    baseline,
    latestResult,
    isLoading,
    error,
    refetch,
    isFromCache
  } = useTestResultsWithCache({
    testType,
    limit: 10,
    skipCache: false,
    enabled: true
  });
  
  const {
    data: baselineData,
    isLoading: isLoadingBaseline,
    isFromCache: isBaselineFromCache
  } = useBaselineWithCache(testType);
  
  const {
    data: testsWithoutFactors,
    isLoading: isLoadingFactors,
    isFromCache: isFactorsFromCache
  } = useTestsWithoutConfoundingFactors(5);
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    setRefreshKey(prev => prev + 1);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Test Results with Caching</CardTitle>
            <CardDescription>
              Demonstrates using the cached test results hooks
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Test type selector */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Test Type:</span>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="n-back">N-Back</SelectItem>
                <SelectItem value="reaction-time">Reaction Time</SelectItem>
                <SelectItem value="all">All Tests</SelectItem>
              </SelectContent>
            </Select>
            
            {isFromCache && (
              <Badge variant="outline" className="bg-green-50">
                <Database className="h-3 w-3 mr-1" />
                From Cache
              </Badge>
            )}
            
            {!isFromCache && !isLoading && (
              <Badge variant="outline" className="bg-blue-50">
                <Zap className="h-3 w-3 mr-1" />
                From Database
              </Badge>
            )}
          </div>
          
          {/* Latest result */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Latest Result
            </h3>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : latestResult ? (
              <div className="space-y-1">
                <p><span className="font-medium">Date:</span> {formatDate(latestResult.timestamp)}</p>
                <p><span className="font-medium">Score:</span> {latestResult.score}</p>
                <p><span className="font-medium">Reaction Time:</span> {latestResult.reaction_time ?? 'N/A'} ms</p>
                <p><span className="font-medium">Accuracy:</span> {latestResult.accuracy ?? 'N/A'}%</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No results found</p>
            )}
          </div>
          
          {/* Test results list */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">Recent Test Results</h3>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : testResults.length > 0 ? (
              <div className="space-y-2">
                {testResults.map(result => (
                  <div key={result.id} className="border-b pb-2">
                    <p className="text-sm">
                      <span className="font-medium">{formatDate(result.timestamp)}</span> - 
                      Score: {result.score}, 
                      RT: {result.reaction_time ?? 'N/A'} ms, 
                      Accuracy: {result.accuracy ?? 'N/A'}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No results found</p>
            )}
          </div>
          
          {/* Cache status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Baseline Result</h3>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={isBaselineFromCache ? "outline" : "default"} className={isBaselineFromCache ? "bg-green-50" : ""}>
                  {isBaselineFromCache ? "From Cache" : "From Database"}
                </Badge>
              </div>
              
              {isLoadingBaseline ? (
                <Skeleton className="h-4 w-full" />
              ) : baselineData?.success && baselineData.data ? (
                <p className="text-sm">
                  {formatDate(baselineData.data.timestamp)} - Score: {baselineData.data.score}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No baseline found</p>
              )}
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Tests Without Factors</h3>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={isFactorsFromCache ? "outline" : "default"} className={isFactorsFromCache ? "bg-green-50" : ""}>
                  {isFactorsFromCache ? "From Cache" : "From Database"}
                </Badge>
              </div>
              
              {isLoadingFactors ? (
                <Skeleton className="h-4 w-full" />
              ) : testsWithoutFactors?.success && testsWithoutFactors.data ? (
                <p className="text-sm">
                  Found {testsWithoutFactors.data.length} tests without confounding factors
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No tests without factors</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestResultsWithCache;
