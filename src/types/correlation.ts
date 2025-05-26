/**
 * Types related to supplement-test correlations
 */

export interface SupplementCorrelation {
  id: string;
  user_id: string;
  supplement_id: string;
  test_type: string;
  analysis_period_start: string;
  analysis_period_end: string;
  onset_delay_days: number;
  cumulative_effect_threshold: number;

  // Performance impacts
  score_impact: number | null;
  reaction_time_impact: number | null;
  accuracy_impact: number | null;

  // Statistical significance
  confidence_level: number | null;
  sample_size: number;

  // Washout period information
  considers_washout_period: boolean;
  washout_period_id: string | null;

  // Metadata
  analysis_parameters: AnalysisParameters;
  created_at: string;
  updated_at: string;
}

export interface AnalysisParameters {
  baseline_score: number | null;
  baseline_reaction_time: number | null;
  baseline_accuracy: number | null;
  avg_score_before: number | null;
  avg_reaction_time_before: number | null;
  avg_accuracy_before: number | null;
  avg_score_after: number | null;
  avg_reaction_time_after: number | null;
  avg_accuracy_after: number | null;
  sample_size_before: number;
  sample_size_after: number;
  effective_date: string;
}

export interface CorrelationAnalysisOptions {
  supplementId: string;
  testType: string;
  onsetDelayDays: number;
  cumulativeEffectThreshold: number;
  analysisStartDate?: string;
  analysisEndDate?: string;
  considersWashoutPeriod?: boolean;
  washoutPeriodId?: string;
}

export interface CorrelationResponse {
  success: boolean;
  correlation?: SupplementCorrelation;
  error?: string;
}

export interface CorrelationsResponse {
  success: boolean;
  correlations: SupplementCorrelation[];
  error?: string;
}

// Enum for impact significance levels
export enum ImpactSignificance {
  VERY_NEGATIVE = "very_negative",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
  POSITIVE = "positive",
  VERY_POSITIVE = "very_positive",
  INSUFFICIENT_DATA = "insufficient_data",
}

// Enum for confidence levels
export enum ConfidenceLevel {
  VERY_LOW = "very_low", // 0-0.2
  LOW = "low", // 0.2-0.4
  MODERATE = "moderate", // 0.4-0.6
  HIGH = "high", // 0.6-0.8
  VERY_HIGH = "very_high", // 0.8-1.0
}

/**
 * Determine the significance level of an impact value
 * @param impact The impact value to evaluate
 * @param isInverted Whether lower values are better (e.g., for reaction time)
 * @param threshold The threshold for significance (default: 5%)
 * @returns The significance level
 */
export function getImpactSignificance(
  impact: number | null,
  isInverted: boolean = false,
  threshold: number = 5,
): ImpactSignificance {
  if (impact === null) return ImpactSignificance.INSUFFICIENT_DATA;

  // For reaction time, negative impact is good (faster)
  // For score and accuracy, positive impact is good
  const normalizedImpact = isInverted ? -impact : impact;

  if (normalizedImpact > threshold * 2) return ImpactSignificance.VERY_POSITIVE;
  if (normalizedImpact > threshold) return ImpactSignificance.POSITIVE;
  if (normalizedImpact < -threshold * 2)
    return ImpactSignificance.VERY_NEGATIVE;
  if (normalizedImpact < -threshold) return ImpactSignificance.NEGATIVE;
  return ImpactSignificance.NEUTRAL;
}

/**
 * Get the confidence level category based on a numeric confidence value
 * @param confidence Numeric confidence value (0-1)
 * @returns Confidence level category
 */
export function getConfidenceLevel(confidence: number | null): ConfidenceLevel {
  if (confidence === null) return ConfidenceLevel.VERY_LOW;

  if (confidence >= 0.8) return ConfidenceLevel.VERY_HIGH;
  if (confidence >= 0.6) return ConfidenceLevel.HIGH;
  if (confidence >= 0.4) return ConfidenceLevel.MODERATE;
  if (confidence >= 0.2) return ConfidenceLevel.LOW;
  return ConfidenceLevel.VERY_LOW;
}

/**
 * Get a human-readable description of the impact
 * @param impact The impact value
 * @param metric The metric name (score, reaction time, accuracy)
 * @param isInverted Whether lower values are better (e.g., for reaction time)
 * @returns A human-readable description
 */
export function getImpactDescription(
  impact: number | null,
  metric: "score" | "reaction_time" | "accuracy",
  isInverted: boolean = metric === "reaction_time",
): string {
  if (impact === null) return "Insufficient data";

  const significance = getImpactSignificance(impact, isInverted);
  const absImpact = Math.abs(impact);
  const direction =
    (isInverted ? -impact : impact) > 0 ? "improved" : "decreased";

  switch (significance) {
    case ImpactSignificance.VERY_POSITIVE:
      return `Significantly ${direction} ${metric.replace("_", " ")} by ${absImpact.toFixed(1)}%`;
    case ImpactSignificance.POSITIVE:
      return `Moderately ${direction} ${metric.replace("_", " ")} by ${absImpact.toFixed(1)}%`;
    case ImpactSignificance.NEUTRAL:
      return `No significant change in ${metric.replace("_", " ")}`;
    case ImpactSignificance.NEGATIVE:
      return `Moderately ${direction} ${metric.replace("_", " ")} by ${absImpact.toFixed(1)}%`;
    case ImpactSignificance.VERY_NEGATIVE:
      return `Significantly ${direction} ${metric.replace("_", " ")} by ${absImpact.toFixed(1)}%`;
    default:
      return "Insufficient data";
  }
}
