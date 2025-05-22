/**
 * Test Frequency Info Component
 *
 * Displays information about test frequency, cooldown periods, and recommendations
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Calendar, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { checkTestFrequency, TestFrequencyStatus, TEST_FREQUENCY } from '@/services/testFrequencyService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDistanceToNow, format, addHours } from 'date-fns';

interface TestFrequencyInfoProps {
  onTakeTest?: () => void;
  compact?: boolean;
  frequencyStatus?: TestFrequencyStatus | null;
  loading?: boolean;
}

/**
 * Component that displays information about test frequency and cooldown periods
 * Optimized to reduce unnecessary re-renders
 */
function TestFrequencyInfoComponent({
  onTakeTest,
  compact = false,
  frequencyStatus: externalStatus = null,
  loading: externalLoading = false
}: Readonly<TestFrequencyInfoProps>) {
  const { user } = useSupabaseAuth();
  const [internalFrequencyStatus, setInternalFrequencyStatus] = useState<TestFrequencyStatus | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Use external status if provided, otherwise use internal
  const frequencyStatus = externalStatus || internalFrequencyStatus;
  const loading = externalLoading || internalLoading;

  // Helper function to calculate time remaining
  const calculateTimeRemaining = useCallback((status: TestFrequencyStatus) => {
    if (!status?.lastTestTime) return 'Unknown';

    const cooldownEnd = addHours(
      status.lastTestTime,
      TEST_FREQUENCY.MIN_HOURS_BETWEEN_TESTS
    );

    const now = new Date();
    if (now >= cooldownEnd) {
      return 'Ready now';
    }

    return formatDistanceToNow(cooldownEnd, { addSuffix: true });
  }, []);

  // Combined effect for fetching status and updating time remaining
  useEffect(() => {
    // Skip fetching if external status is provided
    if (externalStatus) {
      setInternalLoading(false);
    } else if (user) {
      // Define the fetch function
      async function fetchFrequencyStatus() {
        try {
          const status = await checkTestFrequency(user.id);
          setInternalFrequencyStatus(status);

          // Update time remaining if needed
          if (status?.lastTestTime && !status.canTakeTest) {
            setTimeRemaining(calculateTimeRemaining(status));
          }
        } catch (error) {
          console.error('Error fetching test frequency status:', error);
        } finally {
          setInternalLoading(false);
        }
      }

      // Initial fetch
      fetchFrequencyStatus();

      // Set up interval for both fetching and updating time
      const interval = setInterval(fetchFrequencyStatus, 60000);
      return () => clearInterval(interval);
    } else {
      // No user, so just clear loading state
      setInternalLoading(false);
    }
  }, [user, externalStatus, calculateTimeRemaining]);

  // Update time remaining when external status changes
  useEffect(() => {
    if (externalStatus?.lastTestTime && !externalStatus.canTakeTest) {
      setTimeRemaining(calculateTimeRemaining(externalStatus));
    }
  }, [externalStatus, calculateTimeRemaining]);

  // Memoized loading state component
  const loadingComponent = useMemo(() => (
    <Card className={compact ? "p-4" : ""}>
      <CardContent className="pt-4 pb-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>
        </div>
      </CardContent>
    </Card>
  ), [compact]);

  // Memoized unauthenticated state component
  const unauthenticatedComponent = useMemo(() => (
    <Card className={compact ? "p-4" : ""}>
      <CardContent className="pt-4 pb-2">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Sign in to track your test frequency</p>
        </div>
      </CardContent>
    </Card>
  ), [compact]);

  // Memoized compact version component
  const compactComponent = useMemo(() => {
    if (!frequencyStatus) return null;

    return (
      <Card>
        <CardContent className="pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {frequencyStatus.canTakeTest ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500" />
              )}
              <p className="text-sm font-medium">
                {frequencyStatus.canTakeTest
                  ? "Ready to test"
                  : `Next test ${timeRemaining}`}
              </p>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Test frequency info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{frequencyStatus.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {frequencyStatus.testsRemainingToday} of {TEST_FREQUENCY.MAX_TESTS_PER_DAY} tests remaining today
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }, [frequencyStatus, timeRemaining]);

  // Memoized full version component
  const fullComponent = useMemo(() => {
    if (!frequencyStatus) return null;

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Test Availability</CardTitle>
              <CardDescription>Tracking optimal test frequency</CardDescription>
            </div>
            <Badge
              variant={frequencyStatus.canTakeTest ? "default" : "outline"}
              className={frequencyStatus.canTakeTest ? "bg-green-500 hover:bg-green-600" : "text-amber-500 border-amber-500"}
            >
              {frequencyStatus.canTakeTest ? "Available Now" : "Cooldown Active"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cooldown Status</span>
                <span className="font-medium">
                  {frequencyStatus.canTakeTest
                    ? "Ready to test"
                    : `Available ${timeRemaining}`}
                </span>
              </div>

              {!frequencyStatus.canTakeTest && (
                <Progress
                  value={100 - (frequencyStatus.cooldownRemaining / (TEST_FREQUENCY.MIN_HOURS_BETWEEN_TESTS * 60) * 100)}
                  className="h-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Today</span>
                </div>
                <p className="text-2xl font-bold">
                  {frequencyStatus.testsRemainingToday}/{TEST_FREQUENCY.MAX_TESTS_PER_DAY}
                </p>
                <p className="text-xs text-muted-foreground">tests remaining</p>
              </div>

              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">This Week</span>
                </div>
                <p className="text-2xl font-bold">
                  {frequencyStatus.testsRemainingThisWeek}/{TEST_FREQUENCY.MAX_TESTS_PER_WEEK}
                </p>
                <p className="text-xs text-muted-foreground">tests remaining</p>
              </div>
            </div>

            {frequencyStatus.lastTestTime && (
              <div className="text-sm">
                <span className="text-muted-foreground">Last test: </span>
                <span className="font-medium">
                  {format(frequencyStatus.lastTestTime, 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            )}

            <div className="bg-muted/20 p-3 rounded-md border border-border/50">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {frequencyStatus.message}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {onTakeTest && (
          <CardFooter className="pt-2">
            <Button
              onClick={onTakeTest}
              disabled={!frequencyStatus.canTakeTest}
              className="w-full"
            >
              {frequencyStatus.canTakeTest ? "Take Test Now" : "Test in Cooldown"}
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }, [frequencyStatus, timeRemaining, onTakeTest]);

  // Return the appropriate component based on state
  if (loading) {
    return loadingComponent;
  }

  if (!user) {
    return unauthenticatedComponent;
  }

  if (!frequencyStatus) {
    return null;
  }

  if (compact) {
    return compactComponent;
  }

  // Return the full component
  return fullComponent;
}

// Export the memoized component
export const TestFrequencyInfo = React.memo(TestFrequencyInfoComponent);
