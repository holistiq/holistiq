/**
 * Types related to statistical significance analysis
 */

export interface StatisticalAnalysis {
  id: string;
  user_id: string;
  test_type: string;
  baseline_period_start: string;
  baseline_period_end: string;
  comparison_period_start: string;
  comparison_period_end: string;
  alpha: number;
  context_type: string;
  context_id: string | null;
  context_name: string | null;
  results: StatisticalAnalysisResults;
  created_at: string;
  updated_at: string;
}

export interface StatisticalAnalysisResults {
  success: boolean;
  error?: string;
  baseline_period?: PeriodStats;
  comparison_period?: PeriodStats;
  significance_analysis?: SignificanceAnalysis;
}

export interface PeriodStats {
  start: string;
  end: string;
  sample_size: number;
  mean_score: number;
  mean_reaction_time: number;
  mean_accuracy: number;
  std_dev_score: number;
  std_dev_reaction_time: number;
  std_dev_accuracy: number;
}

export interface SignificanceAnalysis {
  score: MetricSignificance;
  reaction_time: MetricSignificance;
  accuracy: MetricSignificance;
  alpha: number;
}

export interface MetricSignificance {
  t_statistic: number;
  p_value: number;
  is_significant: boolean;
  effect_size: number;
  effect_size_interpretation: EffectSizeInterpretation;
  change_percent: number;
}

export enum EffectSizeInterpretation {
  NEGLIGIBLE = 'Negligible',
  SMALL = 'Small',
  MEDIUM = 'Medium',
  LARGE = 'Large',
  UNKNOWN = 'Unknown'
}

export enum ContextType {
  GENERAL = 'general',
  SUPPLEMENT = 'supplement',
  CONFOUNDING_FACTOR = 'confounding_factor'
}

export interface StatisticalAnalysisOptions {
  testType: string;
  baselinePeriodStart: string;
  baselinePeriodEnd: string;
  comparisonPeriodStart: string;
  comparisonPeriodEnd: string;
  alpha?: number;
  contextType?: ContextType;
  contextId?: string;
  contextName?: string;
}

export interface StatisticalAnalysisResponse {
  success: boolean;
  analysis?: StatisticalAnalysis;
  error?: string;
}

export interface StatisticalAnalysesResponse {
  success: boolean;
  analyses: StatisticalAnalysis[];
  error?: string;
}

/**
 * Get a human-readable interpretation of the statistical significance
 * @param significance The metric significance object
 * @returns A human-readable interpretation
 */
export function getSignificanceInterpretation(significance: MetricSignificance): string {
  if (!significance.is_significant) {
    return 'Not statistically significant';
  }
  
  const direction = significance.change_percent > 0 ? 'increase' : 'decrease';
  const magnitude = Math.abs(significance.change_percent).toFixed(1);
  const effectSize = significance.effect_size_interpretation.toLowerCase();
  
  return `Statistically significant ${direction} of ${magnitude}% (${effectSize} effect)`;
}

/**
 * Get a color for the significance result
 * @param significance The metric significance object
 * @param isPositiveGood Whether a positive change is good for this metric
 * @returns A color string (e.g., 'text-green-500')
 */
export function getSignificanceColor(
  significance: MetricSignificance, 
  isPositiveGood: boolean = true
): string {
  if (!significance.is_significant) {
    return 'text-gray-500';
  }
  
  const isPositiveChange = significance.change_percent > 0;
  const isGoodChange = isPositiveGood ? isPositiveChange : !isPositiveChange;
  
  if (isGoodChange) {
    // Good change
    if (significance.effect_size >= 0.8) return 'text-green-600';
    if (significance.effect_size >= 0.5) return 'text-green-500';
    return 'text-green-400';
  } else {
    // Bad change
    if (significance.effect_size >= 0.8) return 'text-red-600';
    if (significance.effect_size >= 0.5) return 'text-red-500';
    return 'text-red-400';
  }
}

/**
 * Get a recommendation based on the significance analysis
 * @param analysis The significance analysis
 * @returns A recommendation string
 */
export function getRecommendation(analysis: SignificanceAnalysis): string {
  const scoreSignificant = analysis.score.is_significant;
  const reactionTimeSignificant = analysis.reaction_time.is_significant;
  const accuracySignificant = analysis.accuracy.is_significant;
  
  const scorePositive = analysis.score.change_percent > 0;
  const reactionTimePositive = analysis.reaction_time.change_percent < 0; // Negative is good for reaction time
  const accuracyPositive = analysis.accuracy.change_percent > 0;
  
  // Count positive significant changes
  let positiveChanges = 0;
  if (scoreSignificant && scorePositive) positiveChanges++;
  if (reactionTimeSignificant && reactionTimePositive) positiveChanges++;
  if (accuracySignificant && accuracyPositive) positiveChanges++;
  
  // Count negative significant changes
  let negativeChanges = 0;
  if (scoreSignificant && !scorePositive) negativeChanges++;
  if (reactionTimeSignificant && !reactionTimePositive) negativeChanges++;
  if (accuracySignificant && !accuracyPositive) negativeChanges++;
  
  if (positiveChanges > 0 && negativeChanges === 0) {
    return 'The changes show a positive impact on cognitive performance. Consider continuing with the current approach.';
  } else if (negativeChanges > 0 && positiveChanges === 0) {
    return 'The changes show a negative impact on cognitive performance. Consider adjusting your approach.';
  } else if (positiveChanges > 0 && negativeChanges > 0) {
    return 'The changes show mixed effects on cognitive performance. Consider focusing on specific aspects that showed improvement.';
  } else {
    return 'No statistically significant changes were detected. Consider collecting more data or trying different approaches.';
  }
}
