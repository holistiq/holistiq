/**
 * Test Selection Page
 *
 * A central hub for users to select which cognitive test they want to take
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestFrequencyInfo } from "@/components/tests/TestFrequencyInfo";
import { checkTestFrequency, TestFrequencyStatus } from "@/services/testFrequencyService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTestResults } from "@/hooks/useTestResults";

import { AuthenticationRequired } from "@/components/auth/AuthenticationRequired";
import { Brain, Zap, ArrowRight, Info } from "lucide-react";
import { NBackGrid } from "@/components/tests/NBackGrid";
import { motion } from "framer-motion";

export default function TestSelection() {
  const [frequencyStatus, setFrequencyStatus] = useState<TestFrequencyStatus | null>(null);
  const [isCheckingFrequency, setIsCheckingFrequency] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();

  // Get test results context
  const testResultsContext = useTestResults();
  const hasBaselineTest = !!testResultsContext?.baselineResult;

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

  // Handle test selection
  const handleSelectTest = (testPath: string) => {
    navigate(testPath);
  };

  // Lightweight loading indicator for fast initial render
  const renderLoadingSkeleton = () => (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading tests...</p>
        </div>
      </div>
    </div>
  );

  // Main content
  const renderContent = () => (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle>Cognitive Tests</CardTitle>
          </div>
          <CardDescription>
            Select a test to measure your cognitive performance
          </CardDescription>
        </CardHeader>

          <CardContent className="space-y-6">
            {!hasBaselineTest && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-300">Baseline Test Recommended</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      We recommend taking a baseline test first to establish your cognitive baseline.
                      This will allow you to track changes in your performance over time.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-100 dark:border-amber-700"
                      onClick={() => handleSelectTest('/baseline-test')}
                    >
                      Take Baseline Test
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <TestFrequencyInfo
              compact
              {...(frequencyStatus && { frequencyStatus })}
              {...(isCheckingFrequency && { loading: isCheckingFrequency })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* N-Back Test Card */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">N-Back Test</CardTitle>
                      <CardDescription>Working memory and attention</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-normal">
                      3 min
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="aspect-video bg-muted/30 rounded-md flex items-center justify-center mb-4 overflow-hidden">
                    <div className="scale-75">
                      <NBackGrid
                        size="sm"
                        highlightedPosition={4}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    The N-Back test measures your working memory and attention. You'll need to remember
                    positions in a sequence and identify matches.
                  </p>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSelectTest('/take-test')}
                    disabled={!frequencyStatus?.canTakeTest}
                  >
                    Take N-Back Test
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Reaction Time Test Card */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Reaction Time Test</CardTitle>
                      <CardDescription>Processing speed and reflexes</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-normal">
                      2 min
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="aspect-video bg-muted/30 rounded-md flex items-center justify-center mb-4 overflow-hidden">
                    <motion.div
                      className="w-20 h-20 rounded-full bg-primary flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        repeatType: "loop"
                      }}
                    >
                      <Zap className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    The Reaction Time test measures how quickly you can respond to visual stimuli.
                    It tests your processing speed and reflexes.
                  </p>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleSelectTest('/reaction-time-test')}
                    disabled={!frequencyStatus?.canTakeTest}
                  >
                    Take Reaction Time Test
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
  );

  // Show loading skeleton while auth is loading
  if (loading) {
    return renderLoadingSkeleton();
  }

  // Wrap content in AuthenticationRequired
  return (
    <AuthenticationRequired>
      {renderContent()}
    </AuthenticationRequired>
  );
}
