/**
 * Types related to confounding factors that might affect cognitive performance
 */

export interface ConfoundingFactor {
  id: string;
  user_id: string;
  recorded_at: string;

  // Sleep-related factors
  sleep_duration?: number; // in minutes
  sleep_quality?: number; // 1-10 scale

  // Stress-related factors
  stress_level?: number; // 1-10 scale

  // Exercise-related factors
  exercise_duration?: number; // in minutes
  exercise_intensity?: number; // 1-10 scale
  exercise_type?: string; // e.g., 'cardio', 'strength', 'yoga'

  // Diet-related factors
  meal_timing?: { time: string; type: string }[]; // array of meal timestamps and types
  caffeine_intake?: number; // in mg
  alcohol_intake?: number; // in standard drinks
  water_intake?: number; // in ml

  // Environmental factors
  location?: string; // e.g., 'home', 'office', 'cafe'
  noise_level?: number; // 1-10 scale
  temperature?: number; // in celsius

  // Health factors
  mood?: number; // 1-10 scale
  energy_level?: number; // 1-10 scale
  illness?: boolean; // whether the user is feeling ill
  illness_details?: string; // description of illness if any

  // Additional factors
  notes?: string; // any additional notes

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ConfoundingFactorInput {
  recorded_at?: string;
  sleep_duration?: number;
  sleep_quality?: number;
  stress_level?: number;
  exercise_duration?: number;
  exercise_intensity?: number;
  exercise_type?: string;
  meal_timing?: { time: string; type: string }[];
  caffeine_intake?: number;
  alcohol_intake?: number;
  water_intake?: number;
  location?: string;
  noise_level?: number;
  temperature?: number;
  mood?: number;
  energy_level?: number;
  illness?: boolean;
  illness_details?: string;
  notes?: string;
}

export interface FactorCorrelation {
  factor: string;
  correlation: number;
  sample_size: number;
  [key: string]: number | string | boolean | null; // For additional correlation metrics specific to each factor
}

export interface FactorAnalysisResult {
  user_id: string;
  test_type: string;
  period_start: string;
  period_end: string;
  correlations: FactorCorrelation[];
}

export interface ConfoundingFactorsResponse {
  success: boolean;
  factors: ConfoundingFactor[];
  error?: string;
}

export interface FactorAnalysisResponse {
  success: boolean;
  analysis: FactorAnalysisResult | null;
  error?: string;
}

// Predefined options for UI dropdowns
export const exerciseTypes = [
  { value: "cardio", label: "Cardio" },
  { value: "strength", label: "Strength Training" },
  { value: "yoga", label: "Yoga/Stretching" },
  { value: "hiit", label: "HIIT" },
  { value: "walking", label: "Walking" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

export const locationOptions = [
  { value: "home", label: "Home" },
  { value: "office", label: "Office/Work" },
  { value: "cafe", label: "Café" },
  { value: "library", label: "Library" },
  { value: "outdoors", label: "Outdoors" },
  { value: "traveling", label: "Traveling" },
  { value: "other", label: "Other" },
];

export const mealTypes = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];
