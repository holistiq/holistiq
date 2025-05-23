/**
 * Reaction Time Test Calculation Utilities
 *
 * This file contains utility functions for calculating reaction time test results.
 */

import { ReactionTimeTestResult } from '@/components/tests/ReactionTimeTest';

interface EnvironmentalFactors {
  windowSwitches: number;
  browserInfo: string;
  screenSize: string;
  deviceType: string;
}

/**
 * Calculate reaction time test results from raw test data
 *
 * @param trials The trial data from the reaction time test
 * @param environmentalFactors Environmental factors that may affect test results
 * @returns Calculated test results
 */
export function calculateReactionTestResults(
  trials: {
    reactionTime: number | null;
    correct: boolean;
    tooEarly: boolean;
  }[],
  environmentalFactors: EnvironmentalFactors
): ReactionTimeTestResult {
  // Filter valid trials (where user correctly responded)
  const validTrials = trials.filter(t => t.correct && t.reactionTime !== null);
  const validReactionTimes = validTrials.map(t => t.reactionTime!);

  // Calculate accuracy percentage
  const totalTrials = trials.length;
  const correctTrials = trials.filter(t => t.correct).length;
  const accuracyPercentage = Math.round((correctTrials / totalTrials) * 100);

  // Calculate average reaction time
  const avgReactionTime = validReactionTimes.length > 0
    ? Math.round(
        validReactionTimes.reduce((sum, time) => sum + time, 0) /
        validReactionTimes.length
      )
    : 0;

  // Calculate score based on reaction time and accuracy
  // Benchmark reaction times (in milliseconds)
  const excellentTime = 200;  // Excellent reaction time
  const goodTime = 300;       // Good reaction time
  const averageTime = 400;    // Average reaction time
  const slowTime = 600;       // Slow reaction time

  // Calculate reaction time score (0-100)
  let reactionTimeScore = 0;

  if (avgReactionTime <= excellentTime) {
    reactionTimeScore = 100;
  } else if (avgReactionTime <= goodTime) {
    reactionTimeScore = 90 - ((avgReactionTime - excellentTime) / (goodTime - excellentTime)) * 20;
  } else if (avgReactionTime <= averageTime) {
    reactionTimeScore = 70 - ((avgReactionTime - goodTime) / (averageTime - goodTime)) * 20;
  } else if (avgReactionTime <= slowTime) {
    reactionTimeScore = 50 - ((avgReactionTime - averageTime) / (slowTime - averageTime)) * 30;
  } else {
    reactionTimeScore = Math.max(10, 20 - ((avgReactionTime - slowTime) / 100) * 2);
  }

  // Penalize for too early responses
  const tooEarlyResponses = trials.filter(t => t.tooEarly).length;
  const tooEarlyPenalty = (tooEarlyResponses / totalTrials) * 30; // Up to 30% penalty

  // Calculate final score
  // 60% reaction time, 40% accuracy
  const finalScore = Math.round(
    (reactionTimeScore * 0.6) +
    (accuracyPercentage * 0.4) -
    tooEarlyPenalty
  );

  // Apply validity penalty if there were window switches
  const validityFactor = Math.max(0.7, 1 - (environmentalFactors.windowSwitches * 0.05));
  const adjustedScore = Math.round(finalScore * validityFactor);

  // Ensure score is within 0-100 range
  const clampedScore = Math.max(0, Math.min(100, adjustedScore));

  return {
    score: clampedScore,
    accuracy: accuracyPercentage,
    reactionTime: avgReactionTime,
    rawData: {
      trials,
      environmentalFactors
    }
  };
}
