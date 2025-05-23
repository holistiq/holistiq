/**
 * Types related to supplements
 */

/**
 * Supplement cycle status enum
 */
export enum SupplementCycleStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

/**
 * Supplement schedule interface
 */
export interface SupplementSchedule {
  days?: string[]; // e.g., ["monday", "wednesday", "friday"]
  weeks?: number; // e.g., every 2 weeks
  custom?: string; // Free text description of custom schedule
}

export interface Supplement {
  id: string;
  name: string;
  dosage: string; // Keep for backward compatibility
  intake_time: string;
  notes: string;
  color: string; // Required in the UI
  user_id?: string; // Optional as it might not be needed in UI components

  // New structured dosage fields
  amount?: number;
  unit?: string;

  // New timing and frequency fields
  frequency?: string;
  time_of_day?: string;
  with_food?: boolean;
  schedule?: SupplementSchedule;
  specific_time?: string; // Optional specific time in HH:MM format

  // New brand and formulation fields
  manufacturer?: string;           // Company that manufactures the supplement
  brand?: string;                  // Brand name of the supplement
  brand_reputation?: number;       // Rating of brand reputation (1-5)
  formulation_type?: string;       // Type of formulation (e.g., "extended-release", "liposomal")
  batch_number?: string;           // Batch or lot number from the supplement container
  expiration_date?: string;        // Expiration date of the supplement (ISO string)
  third_party_tested?: boolean;    // Whether the supplement has been third-party tested
  certification?: string;          // Certification standards met (e.g., "USP", "NSF", "GMP")

  // Evaluation cycle fields
  cycle_status?: SupplementCycleStatus;
  cycle_started_at?: string;
  cycle_completed_at?: string;
}

export interface SupplementsResponse {
  success: boolean;
  supplements: Supplement[];
  recentSupplements: Supplement[];
}
