/**
 * Achievement System Types
 *
 * Defines the types and interfaces for the achievement system
 */

/**
 * Achievement categories
 */
export enum AchievementCategory {
  TEST_COMPLETION = 'test_completion',
  TEST_CONSISTENCY = 'test_consistency',
  SUPPLEMENT_TRACKING = 'supplement_tracking',
  SUPPLEMENT_EVALUATION = 'supplement_evaluation',
  DATA_QUALITY = 'data_quality',
  ACCOUNT = 'account'
}

/**
 * Achievement difficulty levels
 */
export enum AchievementDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

/**
 * Achievement status
 */
export enum AchievementStatus {
  LOCKED = 'locked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

/**
 * Achievement definition interface
 */
export interface Achievement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: AchievementCategory;
  readonly difficulty: AchievementDifficulty;
  readonly icon: string;
  readonly requiredCount: number;
  readonly points: number;
  readonly trigger: AchievementTrigger;
  readonly metadata?: Record<string, any>;
  readonly secret?: boolean;
}

/**
 * User achievement progress interface
 */
export interface UserAchievement {
  readonly id: string;
  readonly userId: string;
  readonly achievementId: string;
  readonly currentCount: number;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Achievement with user progress
 */
export interface AchievementWithProgress extends Achievement {
  readonly currentCount: number;
  readonly completedAt: string | null;
  readonly status: AchievementStatus;
  readonly percentComplete: number;
}

/**
 * Achievement notification interface
 */
export interface AchievementNotification {
  readonly achievement: Achievement;
  readonly isNew: boolean;
}

/**
 * Achievement service response interface
 */
export interface AchievementResponse {
  readonly success: boolean;
  readonly achievements?: AchievementWithProgress[];
  readonly newAchievements?: Achievement[];
  readonly error?: string;
}

/**
 * Achievement progress update interface
 */
export interface AchievementProgressUpdate {
  readonly achievementId: string;
  readonly increment: number;
}

/**
 * Achievement trigger types
 */
export enum AchievementTrigger {
  // Test related triggers
  TEST_COMPLETED = 'test_completed',
  BASELINE_COMPLETED = 'baseline_completed',
  DAILY_STREAK = 'daily_streak',
  WEEKLY_STREAK = 'weekly_streak',
  CONSISTENT_TIME_OF_DAY = 'consistent_time_of_day',

  // Supplement related triggers
  SUPPLEMENT_LOGGED = 'supplement_logged',
  SUPPLEMENT_LOGGED_WITH_NOTES = 'supplement_logged_with_notes',
  SUPPLEMENT_CYCLE_COMPLETED = 'supplement_cycle_completed',
  SUPPLEMENT_EVALUATION_COMPLETED = 'supplement_evaluation_completed',

  // Data quality triggers
  DETAILED_NOTES_ADDED = 'detailed_notes_added',
  CONFOUNDING_FACTORS_LOGGED = 'confounding_factors_logged',
  COMPLETE_SUPPLEMENT_DATA = 'complete_supplement_data',

  // Social sharing triggers
  RESULT_SHARED = 'result_shared',

  // Account related triggers
  PROFILE_COMPLETED = 'profile_completed'
}

/**
 * Achievement trigger data interface
 */
export interface AchievementTriggerData {
  readonly trigger: AchievementTrigger;
  readonly userId: string;
  readonly metadata?: Record<string, any>;
}

/**
 * User badge interface
 */
export interface UserBadge {
  readonly id: string;
  readonly userId: string;
  readonly achievementId: string;
  readonly displayOrder: number;
  readonly createdAt: string;
}

/**
 * User badge with achievement details
 */
export interface UserBadgeWithDetails extends UserBadge {
  readonly achievement: Achievement;
}

/**
 * Maximum number of badges a user can display
 */
export const MAX_DISPLAYED_BADGES = 5;
