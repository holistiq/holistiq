/**
 * Utilities for comparative analysis of cognitive performance between different periods
 */
import { TestResult } from '@/lib/testResultUtils';
import { Supplement } from '@/types/supplement';
import {
  PeriodType,
  determineTestPeriodType,
  generatePeriods
} from '@/utils/performanceCorrelationUtils';
import { WashoutPeriod, ActiveWashoutPeriod } from '@/types/washoutPeriod';

/**
 * Comparison types for the comparative visualization
 */
export enum ComparisonType {
  ON_OFF = 'on_off',
  BETWEEN_SUPPLEMENTS = 'between_supplements',
  BEFORE_AFTER = 'before_after'
}

/**
 * Interface for comparison data
 */
export interface ComparisonData {
  baselineData: TestResult[];
  comparisonData: TestResult[];
  baselinePeriodType: PeriodType;
  comparisonPeriodType: PeriodType;
  baselineLabel: string;
  comparisonLabel: string;
  baselineSupplementId?: string;
  comparisonSupplementId?: string;
  baselineSupplementName?: string;
  comparisonSupplementName?: string;
}

/**
 * Interface for comparison metrics
 */
export interface ComparisonMetrics {
  scoreChange: number;
  reactionTimeChange: number;
  accuracyChange: number;
  sampleSizeBaseline: number;
  sampleSizeComparison: number;
  isSignificant: boolean;
}

/**
 * Generate comparison data for on/off periods of a specific supplement
 */
export function generateOnOffComparisonData(
  testResults: TestResult[],
  supplements: Supplement[],
  washoutPeriods: (WashoutPeriod | ActiveWashoutPeriod)[],
  supplementId: string
): ComparisonData | null {
  // Generate periods
  const periods = generatePeriods(supplements, washoutPeriods);

  // Find the supplement
  const supplement = supplements.find(s => s.id === supplementId);
  if (!supplement) return null;

  // Categorize test results
  const onPeriodTests: TestResult[] = [];
  const offPeriodTests: TestResult[] = [];

  testResults.forEach(test => {
    const { periodType, supplementId: testSupplementId } = determineTestPeriodType(test, periods);

    if (periodType === PeriodType.SUPPLEMENT && testSupplementId === supplementId) {
      onPeriodTests.push(test);
    } else if (periodType === PeriodType.BASELINE || periodType === PeriodType.WASHOUT) {
      offPeriodTests.push(test);
    }
  });

  // Ensure we have enough data for comparison
  if (onPeriodTests.length < 2 || offPeriodTests.length < 2) return null;

  return {
    baselineData: offPeriodTests,
    comparisonData: onPeriodTests,
    baselinePeriodType: PeriodType.BASELINE,
    comparisonPeriodType: PeriodType.SUPPLEMENT,
    baselineLabel: 'Off Period',
    comparisonLabel: `On ${supplement.name}`,
    comparisonSupplementId: supplementId,
    comparisonSupplementName: supplement.name
  };
}

/**
 * Generate comparison data between two different supplements
 */
export function generateBetweenSupplementsComparisonData(
  testResults: TestResult[],
  supplements: Supplement[],
  washoutPeriods: (WashoutPeriod | ActiveWashoutPeriod)[],
  supplementId1: string,
  supplementId2: string
): ComparisonData | null {
  // Generate periods
  const periods = generatePeriods(supplements, washoutPeriods);

  // Find the supplements
  const supplement1 = supplements.find(s => s.id === supplementId1);
  const supplement2 = supplements.find(s => s.id === supplementId2);
  if (!supplement1 || !supplement2) return null;

  // Categorize test results
  const supplement1Tests: TestResult[] = [];
  const supplement2Tests: TestResult[] = [];

  testResults.forEach(test => {
    const { periodType, supplementId: testSupplementId } = determineTestPeriodType(test, periods);

    if (periodType === PeriodType.SUPPLEMENT) {
      if (testSupplementId === supplementId1) {
        supplement1Tests.push(test);
      } else if (testSupplementId === supplementId2) {
        supplement2Tests.push(test);
      }
    }
  });

  // Ensure we have enough data for comparison
  if (supplement1Tests.length < 2 || supplement2Tests.length < 2) return null;

  return {
    baselineData: supplement1Tests,
    comparisonData: supplement2Tests,
    baselinePeriodType: PeriodType.SUPPLEMENT,
    comparisonPeriodType: PeriodType.SUPPLEMENT,
    baselineLabel: supplement1.name,
    comparisonLabel: supplement2.name,
    baselineSupplementId: supplementId1,
    comparisonSupplementId: supplementId2,
    baselineSupplementName: supplement1.name,
    comparisonSupplementName: supplement2.name
  };
}

/**
 * Generate comparison data for before/after periods of a specific supplement
 */
export function generateBeforeAfterComparisonData(
  testResults: TestResult[],
  supplements: Supplement[],
  washoutPeriods: (WashoutPeriod | ActiveWashoutPeriod)[],
  supplementId: string,
  daysBeforeAfter: number = 30
): ComparisonData | null {
  // Find the supplement
  const supplement = supplements.find(s => s.id === supplementId);
  if (!supplement) return null;

  // Get the first intake date of the supplement
  const firstIntakeDate = new Date(supplement.intake_time);

  // Categorize test results
  const beforeTests: TestResult[] = [];
  const afterTests: TestResult[] = [];

  testResults.forEach(test => {
    const testDate = new Date(test.date);
    const daysDifference = (testDate.getTime() - firstIntakeDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDifference < 0 && daysDifference >= -daysBeforeAfter) {
      beforeTests.push(test);
    } else if (daysDifference >= 0 && daysDifference <= daysBeforeAfter) {
      afterTests.push(test);
    }
  });

  // Ensure we have enough data for comparison
  if (beforeTests.length < 2 || afterTests.length < 2) return null;

  return {
    baselineData: beforeTests,
    comparisonData: afterTests,
    baselinePeriodType: PeriodType.BASELINE,
    comparisonPeriodType: PeriodType.SUPPLEMENT,
    baselineLabel: `Before ${supplement.name}`,
    comparisonLabel: `After ${supplement.name}`,
    comparisonSupplementId: supplementId,
    comparisonSupplementName: supplement.name
  };
}

/**
 * Calculate comparison metrics between two sets of test results
 */
export function calculateComparisonMetrics(
  baselineData: TestResult[],
  comparisonData: TestResult[]
): ComparisonMetrics {
  // Calculate averages for baseline data
  const baselineScoreAvg = baselineData.reduce((sum, test) => sum + test.score, 0) / baselineData.length;
  const baselineReactionTimeAvg = baselineData.reduce((sum, test) => sum + test.reactionTime, 0) / baselineData.length;
  const baselineAccuracyAvg = baselineData.reduce((sum, test) => sum + test.accuracy, 0) / baselineData.length;

  // Calculate averages for comparison data
  const comparisonScoreAvg = comparisonData.reduce((sum, test) => sum + test.score, 0) / comparisonData.length;
  const comparisonReactionTimeAvg = comparisonData.reduce((sum, test) => sum + test.reactionTime, 0) / comparisonData.length;
  const comparisonAccuracyAvg = comparisonData.reduce((sum, test) => sum + test.accuracy, 0) / comparisonData.length;

  // Calculate percentage changes
  const scoreChange = ((comparisonScoreAvg - baselineScoreAvg) / baselineScoreAvg) * 100;
  const reactionTimeChange = ((baselineReactionTimeAvg - comparisonReactionTimeAvg) / baselineReactionTimeAvg) * 100; // Inverted for reaction time (lower is better)
  const accuracyChange = ((comparisonAccuracyAvg - baselineAccuracyAvg) / baselineAccuracyAvg) * 100;

  // Simple significance check (more sophisticated statistical tests would be better)
  // For now, we'll consider it significant if the sample size is >= 5 for both and the change is > 10%
  const isSignificant =
    baselineData.length >= 5 &&
    comparisonData.length >= 5 &&
    (Math.abs(scoreChange) > 10 || Math.abs(reactionTimeChange) > 10 || Math.abs(accuracyChange) > 10);

  return {
    scoreChange,
    reactionTimeChange,
    accuracyChange,
    sampleSizeBaseline: baselineData.length,
    sampleSizeComparison: comparisonData.length,
    isSignificant
  };
}
