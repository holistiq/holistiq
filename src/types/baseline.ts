/**
 * Types related to cognitive baselines
 */

// Enum for baseline calculation methods
export type BaselineCalculationMethod = 
  | 'first_n_tests'    // Use the first N tests as baseline
  | 'pre_supplement'   // Use tests before any supplement intake
  | 'date_range'       // Use tests within a specific date range
  | 'manual';          // Manually set baseline values

// Enum for baseline quality levels
export enum BaselineQuality {
  INSUFFICIENT = 'insufficient',  // Not enough data for reliable baseline
  POOR = 'poor',                  // Low confidence in baseline (high variance or small sample)
  MODERATE = 'moderate',          // Moderate confidence in baseline
  GOOD = 'good',                  // Good confidence in baseline
  EXCELLENT = 'excellent'         // High confidence in baseline (low variance, large sample)
}

// Interface for user baseline data
export interface UserBaseline {
  id: string;
  userId: string;
  testType: string;
  
  // Baseline metrics
  baselineScore: number | null;
  baselineReactionTime: number | null;
  baselineAccuracy: number | null;
  
  // Baseline calculation metadata
  calculationMethod: BaselineCalculationMethod;
  sampleSize: number;
  confidenceLevel: number | null;
  
  // Optional additional metadata
  varianceScore?: number | null;
  varianceReactionTime?: number | null;
  varianceAccuracy?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for baseline calculation options
export interface BaselineCalculationOptions {
  calculationMethod?: BaselineCalculationMethod;
  sampleSize?: number;
  startDate?: string | null;
  endDate?: string | null;
}

// Interface for baseline API responses
export interface BaselineResponse {
  success: boolean;
  baseline?: UserBaseline | null;
  error?: string;
}

/**
 * Determine the quality level of a baseline based on confidence level and sample size
 * @param baseline The baseline to evaluate
 * @returns The quality level
 */
export function getBaselineQuality(baseline: UserBaseline | null): BaselineQuality {
  if (!baseline || baseline.sampleSize < 1 || !baseline.confidenceLevel) {
    return BaselineQuality.INSUFFICIENT;
  }
  
  // Combine confidence level and sample size to determine quality
  const confidenceLevel = baseline.confidenceLevel;
  const sampleSize = baseline.sampleSize;
  
  if (confidenceLevel >= 0.8 && sampleSize >= 5) {
    return BaselineQuality.EXCELLENT;
  } else if (confidenceLevel >= 0.6 && sampleSize >= 3) {
    return BaselineQuality.GOOD;
  } else if (confidenceLevel >= 0.4 && sampleSize >= 2) {
    return BaselineQuality.MODERATE;
  } else {
    return BaselineQuality.POOR;
  }
}

/**
 * Get a human-readable description of the baseline quality
 * @param quality The baseline quality level
 * @returns A human-readable description
 */
export function getBaselineQualityDescription(quality: BaselineQuality): string {
  switch (quality) {
    case BaselineQuality.EXCELLENT:
      return 'Excellent baseline with high confidence based on sufficient data';
    case BaselineQuality.GOOD:
      return 'Good baseline with reasonable confidence based on adequate data';
    case BaselineQuality.MODERATE:
      return 'Moderate baseline with some uncertainty due to limited data';
    case BaselineQuality.POOR:
      return 'Poor baseline with low confidence due to insufficient or inconsistent data';
    case BaselineQuality.INSUFFICIENT:
      return 'Insufficient data to establish a reliable baseline';
    default:
      return 'Unknown baseline quality';
  }
}

/**
 * Get a human-readable description of the baseline calculation method
 * @param method The calculation method
 * @returns A human-readable description
 */
export function getCalculationMethodDescription(method: BaselineCalculationMethod): string {
  switch (method) {
    case 'first_n_tests':
      return 'Based on your first few cognitive tests';
    case 'pre_supplement':
      return 'Based on tests taken before starting any supplements';
    case 'date_range':
      return 'Based on tests taken during a specific time period';
    case 'manual':
      return 'Manually configured baseline';
    default:
      return 'Unknown calculation method';
  }
}

/**
 * Get recommendations for improving baseline quality
 * @param baseline The current baseline
 * @returns Array of recommendation strings
 */
export function getBaselineRecommendations(baseline: UserBaseline | null): string[] {
  if (!baseline) {
    return ['Take at least 3 cognitive tests to establish a baseline'];
  }
  
  const quality = getBaselineQuality(baseline);
  const recommendations: string[] = [];
  
  if (quality === BaselineQuality.INSUFFICIENT || quality === BaselineQuality.POOR) {
    recommendations.push('Take more cognitive tests to improve baseline accuracy');
    
    if (baseline.sampleSize < 3) {
      recommendations.push('At least 3 tests are recommended for a reliable baseline');
    }
    
    if (baseline.varianceScore && baseline.varianceScore > 100) {
      recommendations.push('Try to maintain consistent testing conditions to reduce variance');
    }
  }
  
  if (quality === BaselineQuality.MODERATE && baseline.sampleSize < 5) {
    recommendations.push('Take a few more tests to further improve baseline accuracy');
  }
  
  return recommendations;
}
