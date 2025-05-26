/**
 * Test Result Animation Component
 *
 * Displays an engaging animation of test results with comparisons to baseline
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TestResult } from "@/lib/testResultUtils";
import {
  Brain,
  Target,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TestResultAnimationProps {
  result: TestResult;
  baselineResult?: TestResult | null;
  onAnimationComplete?: () => void;
}

export function TestResultAnimation({
  result,
  baselineResult = null,
  onAnimationComplete,
}: TestResultAnimationProps) {
  const [stage, setStage] = useState<
    "initial" | "score" | "metrics" | "comparison" | "complete"
  >("initial");
  const [showScoreValue, setShowScoreValue] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Calculate comparison with baseline
  const scoreDiff = baselineResult ? result.score - baselineResult.score : 0;
  const reactionTimeDiff = baselineResult
    ? baselineResult.reactionTime - result.reactionTime
    : 0;
  const accuracyDiff = baselineResult
    ? result.accuracy - baselineResult.accuracy
    : 0;

  // Determine if this result is better than baseline
  const isBetterScore = scoreDiff > 0;
  const isBetterReactionTime = reactionTimeDiff > 0; // Lower reaction time is better
  const isBetterAccuracy = accuracyDiff > 0;

  // Overall improvement status
  const isOverallImprovement =
    (isBetterScore ? 1 : -1) +
      (isBetterReactionTime ? 1 : -1) +
      (isBetterAccuracy ? 1 : -1) >
    0;

  // Animation sequence
  useEffect(() => {
    // Initial delay before starting animation
    const initialTimer = setTimeout(() => {
      setStage("score");
      setShowScoreValue(true);
    }, 500);

    // Show metrics after score
    const metricsTimer = setTimeout(() => {
      setStage("metrics");
      setShowMetrics(true);
    }, 2000);

    // Show comparison if baseline exists
    const comparisonTimer = setTimeout(() => {
      if (baselineResult) {
        setStage("comparison");
        setShowComparison(true);
      } else {
        setStage("complete");
        if (onAnimationComplete) onAnimationComplete();
      }
    }, 3500);

    // Complete animation
    const completeTimer = setTimeout(
      () => {
        setStage("complete");
        if (onAnimationComplete) onAnimationComplete();
      },
      baselineResult ? 5000 : 3500,
    );

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(metricsTimer);
      clearTimeout(comparisonTimer);
      clearTimeout(completeTimer);
    };
  }, [baselineResult, onAnimationComplete]);

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-6 relative">
        {/* Header with brain icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-full bg-primary/10 p-4"
          >
            <Brain className="h-12 w-12 text-primary" />
          </motion.div>
        </div>

        {/* Score section */}
        <div className="text-center mb-8">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-medium mb-2"
          >
            Your Cognitive Performance
          </motion.h3>

          <div className="relative h-24 flex items-center justify-center">
            <AnimatePresence>
              {showScoreValue && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    duration: 0.8,
                  }}
                  className="flex flex-col items-center"
                >
                  <div className="text-5xl font-bold text-primary mb-1">
                    {result.score}
                  </div>
                  <Badge variant="outline" className="font-normal">
                    Overall Score
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Metrics section */}
        <AnimatePresence>
          {showMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-muted/30 p-4 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Reaction Time</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {result.reactionTime}ms
                </div>
                <Progress
                  value={Math.min(100, 100 - result.reactionTime / 10)}
                  className="h-1.5"
                />
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-muted/30 p-4 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Accuracy</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {result.accuracy}%
                </div>
                <Progress value={result.accuracy} className="h-1.5" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison section */}
        <AnimatePresence>
          {showComparison && baselineResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <div className="text-center mb-4">
                <Badge
                  variant={isOverallImprovement ? "default" : "outline"}
                  className={cn(
                    "font-normal text-sm",
                    isOverallImprovement && "bg-green-500",
                  )}
                >
                  {isOverallImprovement ? (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Improvement from Baseline
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Compared to Baseline
                    </span>
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div
                  className={cn(
                    "p-2 rounded-md",
                    isBetterScore
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600",
                  )}
                >
                  <div className="text-xs uppercase font-medium mb-1">
                    Score
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {isBetterScore ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-bold">{Math.abs(scoreDiff)}</span>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-2 rounded-md",
                    isBetterReactionTime
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600",
                  )}
                >
                  <div className="text-xs uppercase font-medium mb-1">
                    Reaction
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {isBetterReactionTime ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-bold">
                      {Math.abs(reactionTimeDiff)}ms
                    </span>
                  </div>
                </div>

                <div
                  className={cn(
                    "p-2 rounded-md",
                    isBetterAccuracy
                      ? "bg-green-500/10 text-green-600"
                      : "bg-red-500/10 text-red-600",
                  )}
                >
                  <div className="text-xs uppercase font-medium mb-1">
                    Accuracy
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {isBetterAccuracy ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-bold">{Math.abs(accuracyDiff)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion indicator */}
        {stage === "complete" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-4 right-4"
          >
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
