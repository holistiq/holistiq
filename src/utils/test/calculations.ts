/**
 * Test Calculation Utilities
 * 
 * This file contains utility functions for calculating test results from raw test data.
 */

import { NBackTestResult } from '@/components/tests/NBackTest';
import { ReactionTimeTestResult } from '@/components/tests/ReactionTimeTest';

interface ResponseData {
  stimulusIndex: number;
  isTarget: boolean;
  responded: boolean;
  correct: boolean;
  reactionTime: number | null;
}

interface EnvironmentalFactors {
  windowSwitches: number;
  browserInfo: string;
  screenSize: string;
  deviceType: string;
}

/**
 * Calculate test results from raw test data
 * 
 * @param nBackLevel The n-back level of the test
 * @param stimuliSequence The sequence of stimuli presented
 * @param responses The user's responses to each stimulus
 * @param environmentalFactors Environmental factors that may affect test results
 * @returns Calculated test results
 */
export function calculateTestResults(
  nBackLevel: number,
  stimuliSequence: number[],
  responses: ResponseData[],
  environmentalFactors: EnvironmentalFactors
): NBackTestResult {
  // Filter out the first n responses (they can't be targets)
  const validResponses = responses.slice(nBackLevel);

  // Calculate accuracy
  const targets = validResponses.filter(r => r.isTarget);
  const nonTargets = validResponses.filter(r => !r.isTarget);

  // True positives: correctly identified targets
  const truePositives = targets.filter(r => r.responded).length;

  // False positives: incorrectly responded to non-targets
  const falsePositives = nonTargets.filter(r => r.responded).length;

  // False negatives: missed targets
  const falseNegatives = targets.filter(r => !r.responded).length;

  // True negatives: correctly didn't respond to non-targets
  const trueNegatives = nonTargets.filter(r => !r.responded).length;

  // Calculate hit rate and false alarm rate
  const hitRate = targets.length > 0 ? truePositives / targets.length : 0;
  const falseAlarmRate = nonTargets.length > 0 ? falsePositives / nonTargets.length : 0;

  // Calculate d-prime (sensitivity index)
  // Using a simplified calculation that avoids infinite values
  const dPrime = calculateDPrime(hitRate, falseAlarmRate);

  // Calculate overall accuracy as percentage
  const totalCorrect = truePositives + trueNegatives;
  const totalTrials = validResponses.length;
  const accuracyPercentage = Math.round((totalCorrect / totalTrials) * 100);

  // Calculate average reaction time (only for correct responses)
  const correctResponses = validResponses.filter(r =>
    (r.isTarget && r.responded) || (!r.isTarget && !r.responded)
  );

  const responsesWithReactionTime = correctResponses.filter(r =>
    r.responded && r.reactionTime !== null
  ) as (ResponseData & { reactionTime: number })[];

  const avgReactionTime = responsesWithReactionTime.length > 0
    ? Math.round(
        responsesWithReactionTime.reduce((sum, r) => sum + r.reactionTime, 0) /
        responsesWithReactionTime.length
      )
    : 0;

  // Calculate final score (0-100)
  // Weight: 70% accuracy, 30% reaction time
  const maxReactionTime = 1000; // 1 second is considered slow
  const minReactionTime = 200;  // 200ms is considered very fast

  const normalizedReactionTime = avgReactionTime > 0
    ? Math.max(0, Math.min(100,
        100 - ((avgReactionTime - minReactionTime) / (maxReactionTime - minReactionTime)) * 100
      ))
    : 0;

  // Adjust score based on d-prime (sensitivity)
  // d-prime of 4 is considered excellent, 0 is chance level
  const normalizedDPrime = Math.max(0, Math.min(100, (dPrime / 4) * 100));

  // Calculate final score
  const finalScore = Math.round(
    (accuracyPercentage * 0.5) +
    (normalizedReactionTime * 0.2) +
    (normalizedDPrime * 0.3)
  );

  // Apply validity penalty if there were window switches
  const validityFactor = Math.max(0.7, 1 - (environmentalFactors.windowSwitches * 0.05));
  const adjustedScore = Math.round(finalScore * validityFactor);

  return {
    score: adjustedScore,
    accuracy: accuracyPercentage,
    reactionTime: avgReactionTime,
    rawData: {
      stimuliSequence,
      responses,
      environmentalFactors
    }
  };
}

/**
 * Calculate d-prime (sensitivity index) from hit rate and false alarm rate
 * 
 * @param hitRate The hit rate (proportion of targets correctly identified)
 * @param falseAlarmRate The false alarm rate (proportion of non-targets incorrectly identified as targets)
 * @returns The d-prime value
 */
function calculateDPrime(hitRate: number, falseAlarmRate: number): number {
  // Adjust rates to avoid infinite values
  const adjustedHitRate = hitRate === 1 ? 0.99 : hitRate === 0 ? 0.01 : hitRate;
  const adjustedFalseAlarmRate = falseAlarmRate === 1 ? 0.99 : falseAlarmRate === 0 ? 0.01 : falseAlarmRate;

  // Convert to z-scores
  const zHit = inverseNormalCDF(adjustedHitRate);
  const zFA = inverseNormalCDF(adjustedFalseAlarmRate);

  // Calculate d-prime
  return zHit - zFA;
}

/**
 * Approximation of the inverse normal CDF
 * 
 * @param p The probability value (0-1)
 * @returns The z-score corresponding to the probability
 */
function inverseNormalCDF(p: number): number {
  // Using Abramowitz and Stegun approximation
  if (p <= 0 || p >= 1) {
    return 0;
  }

  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 = 2.506628277459239e+00;

  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;

  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 = 4.374664141464968e+00;
  const c6 = 2.938163982698783e+00;

  const d1 = 7.784695709041462e-03;
  const d2 = 3.224671290700398e-01;
  const d3 = 2.445134137142996e+00;
  const d4 = 3.754408661907416e+00;

  // Define break-points
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let z: number;

  // Rational approximation for lower region
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    z = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  // Rational approximation for central region
  else if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    z = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  }
  // Rational approximation for upper region
  else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    z = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
         ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  return z;
}
