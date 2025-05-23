/**
 * Achievement System Types
 *
 * Defines the types and interfaces for the achievement system
 */

/**
 * Achievement categories
 *
 * Simplified to focus on core user behaviors for MVP
 */
export enum AchievementCategory {
  TESTING = 'testing',
  SUPPLEMENTS = 'supplements',
  ENGAGEMENT = 'engagement'
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
  readonly metadata?: Record<string, unknown>;
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
 *
 * Comprehensive triggers for MVP core behaviors
 */
export enum AchievementTrigger {
  // Testing triggers
  TEST_COMPLETED = 'test_completed',
  TESTS_COMPLETED = 'tests_completed',
  BASELINE_COMPLETED = 'baseline_completed',
  DAILY_STREAK = 'daily_streak',
  WEEKLY_STREAK = 'weekly_streak',
  CONSISTENT_TIME_OF_DAY = 'consistent_time_of_day',
  TEST_PERFECT_SCORE = 'test_perfect_score',

  // Supplement triggers
  SUPPLEMENT_LOGGED = 'supplement_logged',
  SUPPLEMENTS_LOGGED = 'supplements_logged',
  SUPPLEMENT_LOGGED_WITH_NOTES = 'supplement_logged_with_notes',
  SUPPLEMENT_CYCLE_COMPLETED = 'supplement_cycle_completed',
  SUPPLEMENT_EVALUATION_COMPLETED = 'supplement_evaluation_completed',
  COMPLETE_SUPPLEMENT_DATA = 'complete_supplement_data',

  // Engagement triggers
  DAILY_LOGIN = 'daily_login',
  PROFILE_COMPLETED = 'profile_completed',
  ACCOUNT_CREATED = 'account_created',
  EXPLORE_APP = 'explore_app',
  LOGIN_STREAK = 'login_streak',
  CONFOUNDING_FACTORS_LOGGED = 'confounding_factors_logged',
  DETAILED_NOTES_ADDED = 'detailed_notes_added',
  FACTOR_VARIETY = 'factor_variety'
}

/**
 * Achievement trigger data interface
 */
export interface AchievementTriggerData {
  readonly trigger: AchievementTrigger;
  readonly userId: string;
  readonly metadata?: Record<string, unknown>;
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
