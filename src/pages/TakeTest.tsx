import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NBackTest, NBackTestResult } from "@/components/tests/NBackTest";
import { NBackInstructions } from "@/components/tests/NBackInstructions";
import { TestFrequencyInfo } from "@/components/tests/TestFrequencyInfo";
import { TestCompletionFlow } from "@/components/tests/TestCompletionFlow";
import { saveTestResult } from "@/services/testResultService";
import {
  checkTestFrequency,
  TestFrequencyStatus,
} from "@/services/testFrequencyService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTestResults } from "@/hooks/useTestResults";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementTrigger } from "@/types/achievement";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthenticationRequired } from "@/components/auth/AuthenticationRequired";

export default function TakeTest() {
  const [testState, setTestState] = useState<
    "intro" | "ready" | "running" | "completed"
  >("intro");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [testResult, setTestResult] = useState<NBackTestResult | null>(null);
  const [frequencyStatus, setFrequencyStatus] =
    useState<TestFrequencyStatus | null>(null);
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
    console.warn(
      "TestResultsContext not available, using default values",
      error,
    );
  }

  // Get achievements hook
  const { triggerAchievement } = useAchievements();

  // Check test frequency when component mounts
  useEffect(() => {
    async function checkFrequency() {
      if (!user) return;

      setIsCheckingFrequency(true);
      try {
        const status = await checkTestFrequency(user.id);
        setFrequencyStatus(status);
      } catch (error) {
        console.error("Error checking test frequency:", error);
      } finally {
        setIsCheckingFrequency(false);
      }
    }

    checkFrequency();
  }, [user]);

  const [testId, setTestId] = useState<string | undefined>(undefined);

  const handleTestComplete = async (result: NBackTestResult) => {
    setTestResult(result);
    setTestState("completed");

    // Save the result
    const saveResponse = await saveTestResult(
      user?.id,
      "n-back-2",
      result,
      false, // This is not a baseline test
    );

    if (saveResponse.success) {
      // Save the test ID for linking with confounding factors
      setTestId(saveResponse.testId);

      // Refresh test results to update the dashboard
      refreshTestResults();

      // Trigger achievements
      if (user) {
        // Test completion achievement
        triggerAchievement(AchievementTrigger.TEST_COMPLETED);

        // Perfect score achievement (if applicable)
        if (result.accuracy === 100) {
          triggerAchievement(AchievementTrigger.TEST_COMPLETED, {
            perfectScore: true,
          });
        }

        // High score achievement (if applicable)
        if (baselineResult && result.score > baselineResult.score) {
          triggerAchievement(AchievementTrigger.TEST_COMPLETED, {
            improvedScore: true,
          });
        }

        // Fast reaction time achievement (if applicable)
        if (result.reactionTime < 300) {
          triggerAchievement(AchievementTrigger.TEST_COMPLETED, {
            reactionTime: result.reactionTime,
          });
        }
      }
    }
  };

  const handleFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setShowFullScreen(false);
          setTestState("ready");
        })
        .catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
          // Allow proceeding anyway
          setTestState("ready");
        });
    } else {
      // Fullscreen not supported, proceed anyway
      setTestState("ready");
    }
  };

  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting full-screen mode:", err);
      });
    }
  };

  useEffect(() => {
    // Clean up fullscreen when component unmounts
    return () => {
      if (document.fullscreenElement) {
        exitFullScreen();
      }
    };
  }, []);

  const goToDashboard = () => {
    if (document.fullscreenElement) {
      exitFullScreen();
    }
    navigate("/dashboard");
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container max-w-2xl py-12">
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not authenticated, show authentication required component
  if (!user) {
    return (
      <AuthenticationRequired message="You need to be logged in to take cognitive tests and track your performance over time." />
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cognitive Assessment</CardTitle>
          <CardDescription>
            {testState === "intro" &&
              "Take the n-back test to measure your current cognitive performance."}
            {testState === "ready" && "Get ready to start the test."}
            {testState === "running" && "Test in progress..."}
            {testState === "completed" && "Assessment completed!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testState === "intro" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p>
                  This test will measure your current cognitive performance. The
                  results will be compared to your baseline to track changes
                  over time.
                </p>
                <div className="bg-secondary p-4 rounded-md space-y-2">
                  <h3 className="font-medium">Before you begin:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Find a quiet place where you won't be interrupted</li>
                    <li>Turn off notifications on your device</li>
                    <li>The test works best in fullscreen mode</li>
                    <li>You'll need to focus for about 3 minutes</li>
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
            <NBackInstructions
              nBackLevel={2}
              onReady={() => setTestState("running")}
              onCancel={() => navigate("/dashboard")}
            />
          )}

          {testState === "running" && (
            <NBackTest
              nBackLevel={2}
              testDuration={180000} // 3 minutes in milliseconds
              onTestComplete={handleTestComplete}
              onCancel={() => {
                if (
                  confirm(
                    "Are you sure you want to cancel the test? Your progress will be lost.",
                  )
                ) {
                  setTestState("intro");
                }
              }}
            />
          )}

          {testState === "completed" && testResult && (
            <TestCompletionFlow
              testType="n-back-2"
              testResult={testResult}
              baselineResult={baselineResult}
              testId={testId}
              onReturnToDashboard={goToDashboard}
              onTakeAnotherTest={() => setTestState("intro")}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showFullScreen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Fullscreen Mode</AlertDialogTitle>
            <AlertDialogDescription>
              For the best testing experience, we recommend running the test in
              fullscreen mode. This helps minimize distractions and ensures
              accurate results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowFullScreen(false);
                setTestState("ready");
              }}
            >
              Skip
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFullScreen}>
              Enter Fullscreen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
