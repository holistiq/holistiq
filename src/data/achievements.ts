/**
 * Achievement Definitions
 *
 * Contains all the achievements available in the application
 * Simplified to 3 core categories for MVP: Testing, Supplements, Engagement
 */
import {
  Achievement,
  AchievementCategory,
  AchievementDifficulty,
  AchievementTrigger
} from '@/types/achievement';

/**
 * All achievements in the application
 * Organized by the 3 core categories for MVP
 */
export const achievements: Achievement[] = [
  // TESTING CATEGORY - All cognitive test related achievements
  {
    id: 'first_test',
    title: 'First Steps',
    description: 'Complete your first cognitive test',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.EASY,
    icon: 'brain',
    requiredCount: 1,
    points: 10,
    trigger: AchievementTrigger.TEST_COMPLETED
  },
  {
    id: 'test_explorer',
    title: 'Test Explorer',
    description: 'Complete 5 cognitive tests',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.EASY,
    icon: 'target',
    requiredCount: 5,
    points: 20,
    trigger: AchievementTrigger.TESTS_COMPLETED
  },
  {
    id: 'test_enthusiast',
    title: 'Test Enthusiast',
    description: 'Complete 25 cognitive tests',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'lightbulb',
    requiredCount: 25,
    points: 50,
    trigger: AchievementTrigger.TESTS_COMPLETED
  },
  {
    id: 'test_master',
    title: 'Test Master',
    description: 'Complete 100 cognitive tests',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.HARD,
    icon: 'trophy',
    requiredCount: 100,
    points: 100,
    trigger: AchievementTrigger.TESTS_COMPLETED
  },
  {
    id: 'baseline_established',
    title: 'Baseline Established',
    description: 'Complete your baseline cognitive assessment - essential for measuring changes',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.EASY,
    icon: 'activity',
    requiredCount: 1,
    points: 15,
    trigger: AchievementTrigger.BASELINE_COMPLETED
  },
  {
    id: 'three_day_streak',
    title: 'Three-Day Streak',
    description: 'Complete tests on three consecutive days - building a reliable data pattern',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.EASY,
    icon: 'calendar',
    requiredCount: 3,
    points: 30,
    trigger: AchievementTrigger.DAILY_STREAK
  },
  {
    id: 'weekly_dedication',
    title: 'Weekly Dedication',
    description: 'Complete tests on seven consecutive days - essential for accurate supplement assessment',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'calendar-check',
    requiredCount: 7,
    points: 70,
    trigger: AchievementTrigger.DAILY_STREAK
  },
  {
    id: 'data_collection_master',
    title: 'Data Collection Master',
    description: 'Complete tests on thirty consecutive days - providing comprehensive data for analysis',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.EXPERT,
    icon: 'calendar-range',
    requiredCount: 30,
    points: 150,
    trigger: AchievementTrigger.DAILY_STREAK
  },
  {
    id: 'consistent_tester',
    title: 'Consistent Tester',
    description: 'Complete tests at a similar time of day for 5 days',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'clock',
    requiredCount: 5,
    points: 30,
    trigger: AchievementTrigger.CONSISTENT_TIME_OF_DAY
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score',
    description: 'Achieve a perfect score on any test',
    category: AchievementCategory.TESTING,
    difficulty: AchievementDifficulty.HARD,
    icon: 'star',
    requiredCount: 1,
    points: 100,
    trigger: AchievementTrigger.TEST_PERFECT_SCORE
  },

  // SUPPLEMENTS CATEGORY - All supplement tracking and evaluation achievements
  {
    id: 'first_supplement',
    title: 'Supplement Tracker',
    description: 'Log your first supplement - the first step in tracking effectiveness',
    category: AchievementCategory.SUPPLEMENTS,
    difficulty: AchievementDifficulty.EASY,
    icon: 'pill',
    requiredCount: 1,
    points: 10,
    trigger: AchievementTrigger.SUPPLEMENT_LOGGED
  },
  {
    id: 'supplement_variety',
    title: 'Supplement Variety',
    description: 'Log 5 different supplements with complete dosage information',
    category: AchievementCategory.SUPPLEMENTS,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'list',
    requiredCount: 5,
    points: 30,
    trigger: AchievementTrigger.SUPPLEMENTS_LOGGED
  },
  {
    id: 'supplement_dedication',
    title: 'Supplement Dedication',
    description: 'Log supplements for 14 consecutive days - essential for establishing patterns',
    category: AchievementCategory.SUPPLEMENTS,
    difficulty: AchievementDifficulty.HARD,
    icon: 'calendar-clock',
    requiredCount: 14,
    points: 80,
    trigger: AchievementTrigger.SUPPLEMENTS_LOGGED
  },
  {
    id: 'detailed_logger',
    title: 'Detailed Logger',
    description: 'Log 10 supplements with detailed notes about effects and experience',
    category: AchievementCategory.SUPPLEMENTS,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'clipboard-list',
    requiredCount: 10,
    points: 40,
    trigger: AchievementTrigger.SUPPLEMENT_LOGGED_WITH_NOTES
  },
  {
    id: 'cycle_completer',
    title: 'Cycle Completer',
    description: 'Complete a full supplement cycle (start, consistent use, evaluation)',
    category: AchievementCategory.SUPPLEMENTS,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'refresh-cw',
    requiredCount: 1,
    points: 50,
    trigger: AchievementTrigger.SUPPLEMENT_CYCLE_COMPLETED
  },
  {
    id: 'supplement_analyst',
    title: 'Supplement Analyst',
    description: 'Complete 3 supplement evaluations with before/after cognitive tests',
    category: AchievementCategory.SUPPLEMENTS,
    difficulty: AchievementDifficulty.HARD,
    icon: 'bar-chart-2',
    requiredCount: 3,
    points: 75,
    trigger: AchievementTrigger.SUPPLEMENT_EVALUATION_COMPLETED
  },
  {
    id: 'complete_data_provider',
    title: 'Complete Data Provider',
    description: 'Log supplements with complete information (brand, dosage, timing) 15 times',
    category: AchievementCategory.SUPPLEMENTS,
    difficulty: AchievementDifficulty.HARD,
    icon: 'check-circle',
    requiredCount: 15,
    points: 60,
    trigger: AchievementTrigger.COMPLETE_SUPPLEMENT_DATA
  },

  // ENGAGEMENT CATEGORY - Profile, account, and general app usage achievements
  {
    id: 'profile_complete',
    title: 'Identity Established',
    description: 'Complete your user profile - helps personalize your experience',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.EASY,
    icon: 'user',
    requiredCount: 1,
    points: 15,
    trigger: AchievementTrigger.PROFILE_COMPLETED
  },
  {
    id: 'holistiq_beginner',
    title: 'HolistiQ Beginner',
    description: 'Create your account and complete onboarding',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.EASY,
    icon: 'user',
    requiredCount: 1,
    points: 5,
    trigger: AchievementTrigger.ACCOUNT_CREATED
  },
  {
    id: 'holistiq_explorer',
    title: 'HolistiQ Explorer',
    description: 'Visit all main sections of the application',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.EASY,
    icon: 'map',
    requiredCount: 1,
    points: 15,
    trigger: AchievementTrigger.EXPLORE_APP
  },
  {
    id: 'regular_user',
    title: 'Regular User',
    description: 'Log in to the app for 7 consecutive days',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.EASY,
    icon: 'calendar',
    requiredCount: 7,
    points: 30,
    trigger: AchievementTrigger.LOGIN_STREAK
  },
  {
    id: 'holistiq_enthusiast',
    title: 'HolistiQ Enthusiast',
    description: 'Use the application for 30 consecutive days',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.HARD,
    icon: 'heart',
    requiredCount: 30,
    points: 100,
    trigger: AchievementTrigger.LOGIN_STREAK
  },
  {
    id: 'confounding_tracker',
    title: 'Confounding Factor Tracker',
    description: 'Log confounding factors (sleep, stress, etc.) alongside 5 tests',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'layers',
    requiredCount: 5,
    points: 35,
    trigger: AchievementTrigger.CONFOUNDING_FACTORS_LOGGED
  },
  {
    id: 'holistic_approach',
    title: 'Holistic Approach',
    description: 'Track 3 different types of confounding factors',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'layers',
    requiredCount: 3,
    points: 25,
    trigger: AchievementTrigger.FACTOR_VARIETY
  },
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'Join during the beta phase of HolistiQ - thank you for helping us improve!',
    category: AchievementCategory.ENGAGEMENT,
    difficulty: AchievementDifficulty.EASY,
    icon: 'rocket',
    requiredCount: 1,
    points: 25,
    secret: true
  }
];

/**
 * Get an achievement by ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find(achievement => achievement.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return achievements.filter(achievement => achievement.category === category);
}

/**
 * Get achievements by trigger
 */
export function getAchievementsByTrigger(trigger: AchievementTrigger): Achievement[] {
  return achievements.filter(achievement => achievement.trigger === trigger);
}
