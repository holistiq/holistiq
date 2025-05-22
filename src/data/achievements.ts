/**
 * Achievement Definitions
 *
 * Contains all the achievements available in the application
 */
import {
  Achievement,
  AchievementCategory,
  AchievementDifficulty,
  AchievementTrigger
} from '@/types/achievement';

/**
 * All achievements in the application
 */
export const achievements: Achievement[] = [
  // Test Completion Achievements
  {
    id: 'first_test',
    title: 'First Steps',
    description: 'Complete your first cognitive test',
    category: AchievementCategory.TEST_COMPLETION,
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
    category: AchievementCategory.TEST_COMPLETION,
    difficulty: AchievementDifficulty.EASY,
    icon: 'target',
    requiredCount: 5,
    points: 20,
    trigger: AchievementTrigger.TEST_COMPLETED
  },
  {
    id: 'test_enthusiast',
    title: 'Test Enthusiast',
    description: 'Complete 25 cognitive tests',
    category: AchievementCategory.TEST_COMPLETION,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'lightbulb',
    requiredCount: 25,
    points: 50,
    trigger: AchievementTrigger.TEST_COMPLETED
  },
  {
    id: 'test_master',
    title: 'Test Master',
    description: 'Complete 100 cognitive tests',
    category: AchievementCategory.TEST_COMPLETION,
    difficulty: AchievementDifficulty.HARD,
    icon: 'trophy',
    requiredCount: 100,
    points: 100,
    trigger: AchievementTrigger.TEST_COMPLETED
  },

  // Test Consistency Achievements
  {
    id: 'baseline_established',
    title: 'Baseline Established',
    description: 'Complete your baseline cognitive assessment - essential for measuring changes',
    category: AchievementCategory.TEST_CONSISTENCY,
    difficulty: AchievementDifficulty.EASY,
    icon: 'activity',
    requiredCount: 1,
    points: 15,
    trigger: AchievementTrigger.BASELINE_COMPLETED
  },
  {
    id: 'consistent_tester',
    title: 'Consistent Tester',
    description: 'Complete tests at a similar time of day for 5 days',
    category: AchievementCategory.TEST_CONSISTENCY,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'clock',
    requiredCount: 5,
    points: 30,
    trigger: AchievementTrigger.CONSISTENT_TIME_OF_DAY
  },
  {
    id: 'data_scientist',
    title: 'Data Scientist',
    description: 'Complete 10 tests while taking a specific supplement',
    category: AchievementCategory.TEST_CONSISTENCY,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'bar-chart',
    requiredCount: 10,
    points: 40,
    trigger: AchievementTrigger.TEST_COMPLETED,
    metadata: { withSupplement: true }
  },
  {
    id: 'controlled_experiment',
    title: 'Controlled Experiment',
    description: 'Complete tests both with and without a supplement (5 each)',
    category: AchievementCategory.TEST_CONSISTENCY,
    difficulty: AchievementDifficulty.HARD,
    icon: 'microscope',
    requiredCount: 10,
    points: 50,
    trigger: AchievementTrigger.TEST_COMPLETED,
    metadata: { controlGroup: true }
  },

  // Test Consistency Achievements (Streaks)
  {
    id: 'three_day_streak',
    title: 'Three-Day Streak',
    description: 'Complete tests on three consecutive days - building a reliable data pattern',
    category: AchievementCategory.TEST_CONSISTENCY,
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
    category: AchievementCategory.TEST_CONSISTENCY,
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
    category: AchievementCategory.TEST_CONSISTENCY,
    difficulty: AchievementDifficulty.EXPERT,
    icon: 'calendar-range',
    requiredCount: 30,
    points: 150,
    trigger: AchievementTrigger.DAILY_STREAK
  },
  {
    id: 'long_term_tracker',
    title: 'Long-Term Tracker',
    description: 'Complete at least one test every week for 4 weeks - ideal for tracking gradual supplement effects',
    category: AchievementCategory.TEST_CONSISTENCY,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'repeat',
    requiredCount: 4,
    points: 50,
    trigger: AchievementTrigger.WEEKLY_STREAK
  },

  // Supplement Tracking Achievements
  {
    id: 'first_supplement',
    title: 'Supplement Tracker',
    description: 'Log your first supplement - the first step in tracking effectiveness',
    category: AchievementCategory.SUPPLEMENT_TRACKING,
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
    category: AchievementCategory.SUPPLEMENT_TRACKING,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'list',
    requiredCount: 5,
    points: 30,
    trigger: AchievementTrigger.SUPPLEMENT_LOGGED,
    metadata: { uniqueOnly: true, completeDosage: true }
  },
  {
    id: 'supplement_dedication',
    title: 'Supplement Dedication',
    description: 'Log supplements for 14 consecutive days - essential for establishing patterns',
    category: AchievementCategory.SUPPLEMENT_TRACKING,
    difficulty: AchievementDifficulty.HARD,
    icon: 'calendar-clock',
    requiredCount: 14,
    points: 80,
    trigger: AchievementTrigger.SUPPLEMENT_LOGGED,
    metadata: { consecutiveDays: true }
  },
  {
    id: 'detailed_logger',
    title: 'Detailed Logger',
    description: 'Log 10 supplements with detailed notes about effects and experience',
    category: AchievementCategory.SUPPLEMENT_TRACKING,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'clipboard-list',
    requiredCount: 10,
    points: 40,
    trigger: AchievementTrigger.SUPPLEMENT_LOGGED_WITH_NOTES
  },

  // Supplement Evaluation Achievements
  {
    id: 'cycle_completer',
    title: 'Cycle Completer',
    description: 'Complete a full supplement cycle (start, consistent use, evaluation)',
    category: AchievementCategory.SUPPLEMENT_EVALUATION,
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
    category: AchievementCategory.SUPPLEMENT_EVALUATION,
    difficulty: AchievementDifficulty.HARD,
    icon: 'bar-chart-2',
    requiredCount: 3,
    points: 75,
    trigger: AchievementTrigger.SUPPLEMENT_EVALUATION_COMPLETED
  },

  // Data Quality Achievements
  {
    id: 'confounding_tracker',
    title: 'Confounding Factor Tracker',
    description: 'Log confounding factors (sleep, stress, etc.) alongside 5 tests',
    category: AchievementCategory.DATA_QUALITY,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'layers',
    requiredCount: 5,
    points: 35,
    trigger: AchievementTrigger.CONFOUNDING_FACTORS_LOGGED
  },
  {
    id: 'detailed_notes_master',
    title: 'Detailed Notes Master',
    description: 'Add comprehensive notes to 10 supplement entries',
    category: AchievementCategory.DATA_QUALITY,
    difficulty: AchievementDifficulty.MEDIUM,
    icon: 'file-text',
    requiredCount: 10,
    points: 40,
    trigger: AchievementTrigger.DETAILED_NOTES_ADDED
  },
  {
    id: 'complete_data_provider',
    title: 'Complete Data Provider',
    description: 'Log supplements with complete information (brand, dosage, timing) 15 times',
    category: AchievementCategory.DATA_QUALITY,
    difficulty: AchievementDifficulty.HARD,
    icon: 'check-circle',
    requiredCount: 15,
    points: 60,
    trigger: AchievementTrigger.COMPLETE_SUPPLEMENT_DATA
  },

  // Account Achievements
  {
    id: 'profile_complete',
    title: 'Identity Established',
    description: 'Complete your user profile - helps personalize your experience',
    category: AchievementCategory.ACCOUNT,
    difficulty: AchievementDifficulty.EASY,
    icon: 'user',
    requiredCount: 1,
    points: 15,
    trigger: AchievementTrigger.PROFILE_COMPLETED
  },
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'Join during the beta phase of Holistiq - thank you for helping us improve!',
    category: AchievementCategory.ACCOUNT,
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
