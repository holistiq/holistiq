import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { NBackTestResult } from "@/components/tests/NBackTest";
import { ReactionTimeTestResult } from "@/components/tests/ReactionTimeTest";
import { ConfoundingFactorsPrompt } from "@/components/confoundingFactors/ConfoundingFactorsPrompt";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { processAchievementTrigger } from "@/services/achievementService";
import { AchievementTrigger } from "@/types/achievement";
import { linkTestWithConfoundingFactors } from "@/services/testResultService";
import { trackSocialShare } from "@/services/socialShareService";
import { EnhancedSocialShare } from "@/components/social/EnhancedSocialShare";

interface TestCompletionFlowProps {
  readonly testType: string;
  readonly testResult: NBackTestResult | ReactionTimeTestResult;
  readonly isBaseline?: boolean;
  readonly baselineResult?: NBackTestResult | ReactionTimeTestResult | null;
  readonly testId?: string;
  readonly onReturnToDashboard: () => void;
  readonly onTakeAnotherTest: () => void;
}

export function TestCompletionFlow({
  testType,
  testResult,
  isBaseline = false,
  baselineResult,
  testId,
  onReturnToDashboard,
  onTakeAnotherTest
}: TestCompletionFlowProps) {
  const { user } = useSupabaseAuth();
  const [step, setStep] = useState<"results" | "confounding_factors">("results");

  // Generate share text based on test results
  const getShareText = (): string => {
    // Base message with score
    const baseMessage = `I just completed a cognitive test on Holistiq with a score of ${testResult.score.toFixed(0)}`;

    // Different endings based on test context
    if (isBaseline) {
      return `${baseMessage} as my baseline. Excited to track my cognitive performance over time!`;
    }

    if (!baselineResult) {
      return `${baseMessage}. Tracking my cognitive performance with objective measurements!`;
    }

    // Check for improvements
    const hasImprovedScore = testResult.score > baselineResult.score;
    const hasImprovedReaction = testResult.reactionTime < baselineResult.reactionTime;
    const hasImprovedAccuracy = testResult.accuracy > baselineResult.accuracy;
    const hasAnyImprovement = hasImprovedScore || hasImprovedReaction || hasImprovedAccuracy;

    if (!hasAnyImprovement) {
      return `${baseMessage}. I'm working on improving my cognitive performance.`;
    }

    // Create improvement message
    return `${baseMessage} which is an improvement from my baseline! ${
      hasImprovedScore ? `Score: +${(testResult.score - baselineResult.score).toFixed(0)} ` : ''
    }${
      hasImprovedReaction ? `Reaction: -${(baselineResult.reactionTime - testResult.reactionTime).toFixed(0)}ms ` : ''
    }${
      hasImprovedAccuracy ? `Accuracy: +${(testResult.accuracy - baselineResult.accuracy).toFixed(0)}% ` : ''
    }`;
  };

  // Handle completion of confounding factors logging
  const handleConfoundingFactorsComplete = (factorId: string) => {

    // Link the test result with the confounding factor
    if (user && testId && factorId) {
      // Link the test with the confounding factor
      linkTestWithConfoundingFactors(testId, factorId)
        .then((result) => {
          if (result.success) {
            console.log('Successfully linked test with confounding factor');

            // Trigger achievement for logging confounding factors
            processAchievementTrigger({
              trigger: AchievementTrigger.TEST_COMPLETED,
              userId: user.id
            });
          } else {
            console.error('Error linking test with confounding factor:', result.error);
          }
        });
    } else if (user) {
      // Just trigger the achievement if we don't have a test ID
      processAchievementTrigger({
        trigger: AchievementTrigger.TEST_COMPLETED,
        userId: user.id
      });
    }

    // Return to results view
    setStep("results");
  };

  // Handle skipping confounding factors logging
  const handleSkipConfoundingFactors = () => {
    setStep("results");
  };

  // Handle the "Log Confounding Factors" button click
  const handleLogFactorsClick = () => {
    setStep("confounding_factors");
  };

  // Handle social sharing
  const handleSocialShare = (platform: string) => {
    if (user) {
      trackSocialShare(user.id, testId, platform)
        .then((result) => {
          if (!result.success) {
            console.error('Error tracking social share:', result.error);
          }
        })
        .catch((error) => {
          console.error('Unexpected error tracking social share:', error);
        });
    }
  };

  // Render the confounding factors prompt
  if (step === "confounding_factors" && user) {
    return (
      <ConfoundingFactorsPrompt
        userId={user.id}
        testId={testId}
        onComplete={handleConfoundingFactorsComplete}
        onSkip={handleSkipConfoundingFactors}
      />
    );
  }

  // Render the test results
  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle className="text-2xl">Test Completed</CardTitle>
        <CardDescription>
          {isBaseline
            ? "You've completed your baseline test. This will be used as a reference point for future tests."
            : "You've completed your cognitive test. Here are your results."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Score</p>
            <p className="text-3xl font-bold">{testResult.score}</p>
            {!isBaseline && baselineResult && (
              <p className={`text-sm ${testResult.score > baselineResult.score ? 'text-green-500' : 'text-red-500'}`}>
                {testResult.score > baselineResult.score
                  ? `+${(testResult.score - baselineResult.score).toFixed(0)} from baseline`
                  : `${(testResult.score - baselineResult.score).toFixed(0)} from baseline`}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Reaction Time</p>
            <p className="text-3xl font-bold">{testResult.reactionTime.toFixed(0)} ms</p>
            {!isBaseline && baselineResult && (
              <p className={`text-sm ${testResult.reactionTime < baselineResult.reactionTime ? 'text-green-500' : 'text-red-500'}`}>
                {testResult.reactionTime < baselineResult.reactionTime
                  ? `-${(baselineResult.reactionTime - testResult.reactionTime).toFixed(0)} ms from baseline`
                  : `+${(testResult.reactionTime - baselineResult.reactionTime).toFixed(0)} ms from baseline`}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
            <p className="text-3xl font-bold">{testResult.accuracy.toFixed(0)}%</p>
            {!isBaseline && baselineResult && (
              <p className={`text-sm ${testResult.accuracy > baselineResult.accuracy ? 'text-green-500' : 'text-red-500'}`}>
                {testResult.accuracy > baselineResult.accuracy
                  ? `+${(testResult.accuracy - baselineResult.accuracy).toFixed(0)}% from baseline`
                  : `${(testResult.accuracy - baselineResult.accuracy).toFixed(0)}% from baseline`}
              </p>
            )}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Track Confounding Factors</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Factors like sleep, stress, and caffeine can affect your cognitive performance.
            Log these factors to get more accurate insights about your supplement effectiveness.
          </p>
          <Button onClick={handleLogFactorsClick} variant="outline" className="w-full">
            Log Confounding Factors
          </Button>
        </div>
      </CardContent>

      <CardContent className="pt-0">
        <div className="bg-primary/5 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Share Your Results</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Share your cognitive performance results with friends and followers.
          </p>
          {testId && (
            <EnhancedSocialShare
              testId={testId}
              testType={testType}
              score={testResult.score}
              title="My Holistiq Cognitive Test Results"
              text={getShareText()}
              hashtags={["Holistiq", "CognitivePerformance", "BrainHealth"]}
              onShare={handleSocialShare}
            />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
        <Button
          variant="outline"
          onClick={onReturnToDashboard}
          className="w-full sm:w-auto"
        >
          Return to Dashboard
        </Button>
        <Button
          onClick={onTakeAnotherTest}
          className="w-full sm:w-auto"
        >
          Take Another Test
        </Button>
      </CardFooter>
    </Card>
  );
}
