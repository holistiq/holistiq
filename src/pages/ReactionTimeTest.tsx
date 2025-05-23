/**
 * Reaction Time Test Page
 *
 * A page for taking the reaction time test
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ReactionTimeTest, ReactionTimeTestResult } from "@/components/tests/ReactionTimeTest";
import { ReactionTimeInstructions } from "@/components/tests/ReactionTimeInstructions";
import { TestFrequencyInfo } from "@/components/tests/TestFrequencyInfo";
import { TestCompletionFlow } from "@/components/tests/TestCompletionFlow";
import { saveTestResult } from "@/services/testResultService";
import { checkTestFrequency, TestFrequencyStatus } from "@/services/testFrequencyService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTestResults } from "@/hooks/useTestResults";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthenticationRequired } from "@/components/auth/AuthenticationRequired";

export default function ReactionTimeTestPage() {
  const [testState, setTestState] = useState<"intro" | "ready" | "running" | "completed">("intro");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [testResult, setTestResult] = useState<ReactionTimeTestResult | null>(null);
  const [frequencyStatus, setFrequencyStatus] = useState<TestFrequencyStatus | null>(null);
  const [isCheckingFrequency, setIsCheckingFrequency] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();

  // Try to get test results context, but handle the case where it might not be available
  let baselineResult = null;
  let refreshTestResults = () => {};

  try {
    const testResultsContext = useTestResults();
    baselineResult = testResultsContext.baselineResult;
    refreshTestResults = testResultsContext.refreshTestResults;
  } catch (error) {
    console.warn('TestResultsContext not available, using default values', error);
  }

  // Check test frequency when component mounts
  useEffect(() => {
    async function checkFrequency() {
      if (!user) return;

      setIsCheckingFrequency(true);
      try {
        const status = await checkTestFrequency(user.id);
        setFrequencyStatus(status);
      } catch (error) {
        console.error('Error checking test frequency:', error);
      } finally {
        setIsCheckingFrequency(false);
      }
    }

    checkFrequency();
  }, [user]);

  const [testId, setTestId] = useState<string | undefined>(undefined);

  const handleTestComplete = async (result: ReactionTimeTestResult) => {
    setTestResult(result);
    setTestState("completed");

    // Save the result
    const saveResponse = await saveTestResult(
      user?.id,
      'reaction-time',
      result,
      false // This is not a baseline test
    );

    if (saveResponse.success) {
      // Save the test ID for linking with confounding factors
      setTestId(saveResponse.testId);

      // Refresh test results to update the dashboard
      refreshTestResults();
    }
  };

  // Handle fullscreen request
  const handleFullScreenRequest = () => {
    setShowFullScreen(false);
    setTestState("ready");
  };

  // Handle test start
  const handleTestStart = () => {
    setTestState("running");
  };

  // Handle test cancel
  const handleTestCancel = () => {
    setTestState("intro");
  };

  // Handle return to dashboard
  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <AuthenticationRequired>
      <div className="container max-w-2xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Reaction Time Test</CardTitle>
            <CardDescription>
              Measure how quickly you can respond to visual stimuli
            </CardDescription>
          </CardHeader>

          {testState === "intro" && (
            <div className="space-y-6 px-6">
              <div className="space-y-4">
                <p>
                  This test will measure your reaction time. You'll need about 2 minutes in a quiet,
                  distraction-free environment.
                </p>
                <div className="bg-secondary p-4 rounded-md space-y-2">
                  <h3 className="font-medium">Before you begin:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Find a quiet place where you won't be interrupted</li>
                    <li>Turn off notifications on your device</li>
                    <li>Keep your finger ready on the mouse or spacebar</li>
                    <li>You'll need to focus for about 2 minutes</li>
                  </ul>
                </div>
              </div>

              {/* Test Frequency Information */}
              <TestFrequencyInfo
                onTakeTest={() => setShowFullScreen(true)}
                {...(frequencyStatus && { frequencyStatus })}
                {...(isCheckingFrequency && { loading: isCheckingFrequency })}
              />
            </div>
          )}

          {testState === "ready" && (
            <CardContent>
              <ReactionTimeInstructions
                onReady={handleTestStart}
                onCancel={handleTestCancel}
              />
            </CardContent>
          )}

          {testState === "running" && (
            <CardContent>
              <ReactionTimeTest
                testDuration={120000} // 2 minutes
                onTestComplete={handleTestComplete}
                onCancel={handleTestCancel}
              />
            </CardContent>
          )}

          {testState === "completed" && testResult && (
            <CardContent>
              <TestCompletionFlow
                testType="reaction-time"
                testResult={testResult}
                baselineResult={baselineResult}
                testId={testId}
                onReturnToDashboard={handleReturnToDashboard}
                onTakeAnotherTest={() => setTestState("intro")}
              />
            </CardContent>
          )}

          {testState !== "completed" && testState !== "intro" && (
            <CardFooter>
              <Button variant="outline" onClick={handleTestCancel}>
                Cancel Test
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Fullscreen request dialog */}
        <AlertDialog open={showFullScreen} onOpenChange={setShowFullScreen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fullscreen Recommended</AlertDialogTitle>
              <AlertDialogDescription>
                This test works best in fullscreen mode. Would you like to enable fullscreen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleFullScreenRequest()}>
                Continue Without Fullscreen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  document.documentElement.requestFullscreen().then(() => {
                    handleFullScreenRequest();
                  });
                }}
              >
                Enable Fullscreen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthenticationRequired>
  );
}
