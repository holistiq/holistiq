/**
 * Types related to washout periods
 */

/**
 * Status of a washout period
 */
export enum WashoutPeriodStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Washout period interface
 */
export interface WashoutPeriod {
  id: string;
  user_id: string;
  supplement_id: string | null;
  supplement_name: string;
  start_date: string;
  end_date: string | null;
  expected_duration_days: number | null;
  actual_duration_days: number | null;
  status: WashoutPeriodStatus;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Active washout period (simplified view for UI)
 */
export interface ActiveWashoutPeriod {
  id: string;
  supplement_id: string | null;
  supplement_name: string;
  start_date: string;
  expected_duration_days: number | null;
  days_elapsed: number;
  status: WashoutPeriodStatus;
  reason: string | null;
  progress_percentage: number; // Calculated field: (days_elapsed / expected_duration_days) * 100
}

/**
 * Washout period creation parameters
 */
export interface CreateWashoutPeriodParams {
  supplement_id: string | null;
  supplement_name: string;
  start_date: string;
  expected_duration_days: number | null;
  reason: string | null;
  notes: string | null;
}

/**
 * Washout period update parameters
 */
export interface UpdateWashoutPeriodParams {
  end_date?: string;
  status?: WashoutPeriodStatus;
  notes?: string;
}

/**
 * Response from washout period operations
 */
export interface WashoutPeriodResponse {
  success: boolean;
  washoutPeriod?: WashoutPeriod;
  error?: string;
}

/**
 * Response from getting multiple washout periods
 */
export interface WashoutPeriodsResponse {
  success: boolean;
  washoutPeriods: WashoutPeriod[];
  activeWashoutPeriods: ActiveWashoutPeriod[];
  error?: string;
}
