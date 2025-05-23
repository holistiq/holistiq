-- Seed: Initial Achievements
-- Description: Populates the achievements table with initial achievement definitions
-- Dependencies: 20230801000000_create_achievement_tables.sql

-- First, check if there are any existing achievements
DO $$
DECLARE
    achievement_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO achievement_count FROM public.achievements;
    RAISE NOTICE 'Current achievement count: %', achievement_count;
END $$;

-- Insert achievements with explicit IDs
INSERT INTO public.achievements (
    id,
    title,
    description,
    category,
    difficulty,
    icon,
    required_count,
    points,
    trigger,
    badge_url
)
VALUES
    -- Test Completion Achievements
    ('first_test', 'First Steps', 'Complete your first cognitive test', 'test_completion', 'easy', 'brain', 1, 10, 'test_completed', NULL),
    ('test_explorer', 'Test Explorer', 'Complete 5 cognitive tests', 'test_completion', 'easy', 'target', 5, 20, 'test_completed', NULL),
    ('test_enthusiast', 'Test Enthusiast', 'Complete 25 cognitive tests', 'test_completion', 'medium', 'lightbulb', 25, 50, 'test_completed', NULL),
    ('test_master', 'Test Master', 'Complete 100 cognitive tests', 'test_completion', 'hard', 'trophy', 100, 100, 'test_completed', NULL),

    -- Test Consistency Achievements
    ('baseline_established', 'Baseline Established', 'Complete your baseline cognitive assessment - essential for measuring changes', 'test_consistency', 'easy', 'activity', 1, 15, 'baseline_completed', NULL),
    ('consistent_tester', 'Consistent Tester', 'Complete tests at a similar time of day for 5 days', 'test_consistency', 'medium', 'clock', 5, 30, 'consistent_time_of_day', NULL),
    ('data_scientist', 'Data Scientist', 'Complete 10 tests while taking a specific supplement', 'test_consistency', 'medium', 'bar-chart', 10, 40, 'test_completed', NULL),
    ('controlled_experiment', 'Controlled Experiment', 'Complete tests both with and without a supplement (5 each)', 'test_consistency', 'hard', 'microscope', 10, 50, 'test_completed', NULL),

    -- Test Consistency Achievements (Streaks)
    ('three_day_streak', 'Three-Day Streak', 'Complete tests on three consecutive days - building a reliable data pattern', 'test_consistency', 'easy', 'calendar', 3, 30, 'daily_streak', NULL),
    ('weekly_dedication', 'Weekly Dedication', 'Complete tests on seven consecutive days - essential for accurate supplement assessment', 'test_consistency', 'medium', 'calendar-check', 7, 70, 'daily_streak', NULL),
    ('data_collection_master', 'Data Collection Master', 'Complete tests on thirty consecutive days - providing comprehensive data for analysis', 'test_consistency', 'expert', 'calendar-range', 30, 150, 'daily_streak', NULL),
    ('long_term_tracker', 'Long-Term Tracker', 'Complete at least one test every week for 4 weeks - ideal for tracking gradual supplement effects', 'test_consistency', 'medium', 'repeat', 4, 50, 'weekly_streak', NULL),

    -- Supplement Tracking Achievements
    ('first_supplement', 'Supplement Tracker', 'Log your first supplement - the first step in tracking effectiveness', 'supplement_tracking', 'easy', 'pill', 1, 10, 'supplement_logged', NULL),
    ('supplement_variety', 'Supplement Variety', 'Log 5 different supplements with complete dosage information', 'supplement_tracking', 'medium', 'list', 5, 30, 'supplement_logged', NULL),
    ('supplement_dedication', 'Supplement Dedication', 'Log supplements for 14 consecutive days - essential for establishing patterns', 'supplement_tracking', 'hard', 'calendar-clock', 14, 80, 'supplement_logged', NULL),
    ('detailed_logger', 'Detailed Logger', 'Log 10 supplements with detailed notes about effects and experience', 'supplement_tracking', 'medium', 'clipboard-list', 10, 40, 'supplement_logged_with_notes', NULL),

    -- Supplement Evaluation Achievements
    ('cycle_completer', 'Cycle Completer', 'Complete a full supplement cycle (start, consistent use, evaluation)', 'supplement_evaluation', 'medium', 'refresh-cw', 1, 50, 'supplement_cycle_completed', NULL),
    ('supplement_analyst', 'Supplement Analyst', 'Complete 3 supplement evaluations with before/after cognitive tests', 'supplement_evaluation', 'hard', 'bar-chart-2', 3, 75, 'supplement_evaluation_completed', NULL),

    -- Data Quality Achievements
    ('confounding_tracker', 'Confounding Factor Tracker', 'Log confounding factors (sleep, stress, etc.) alongside 5 tests', 'data_quality', 'medium', 'layers', 5, 35, 'confounding_factors_logged', NULL),
    ('detailed_notes_master', 'Detailed Notes Master', 'Add comprehensive notes to 10 supplement entries', 'data_quality', 'medium', 'file-text', 10, 40, 'detailed_notes_added', NULL),
    ('complete_data_provider', 'Complete Data Provider', 'Log supplements with complete information (brand, dosage, timing) 15 times', 'data_quality', 'hard', 'check-circle', 15, 60, 'complete_supplement_data', NULL),

    -- Account Achievements
    ('profile_complete', 'Identity Established', 'Complete your user profile - helps personalize your experience', 'account', 'easy', 'user', 1, 15, 'profile_completed', NULL),
    ('early_adopter', 'Early Adopter', 'Join during the beta phase of Holistiq - thank you for helping us improve!', 'account', 'easy', 'rocket', 1, 25, NULL, NULL),

    -- Additional achievements from original seed script
    ('perfect_score', 'Perfect Score', 'Achieve a perfect score on any test', 'Test', 'Hard', 'star', 1, 100, 'test_perfect_score', NULL),
    ('consistency_champion', 'Consistency Champion', 'Complete tests on 7 consecutive days', 'Test', 'Medium', 'calendar', 7, 75, 'test_streak', NULL),
    ('holistic_approach', 'Holistic Approach', 'Track 3 different types of confounding factors', 'Factor', 'Medium', 'layers', 3, 25, 'factor_variety', NULL),
    ('holistiq_beginner', 'HolistiQ Beginner', 'Create your account and complete onboarding', 'Engagement', 'Easy', 'user', 1, 5, 'account_created', NULL),
    ('holistiq_explorer', 'HolistiQ Explorer', 'Visit all main sections of the application', 'Engagement', 'Easy', 'map', 1, 15, 'explore_app', NULL),
    ('holistiq_enthusiast', 'HolistiQ Enthusiast', 'Use the application for 30 consecutive days', 'Engagement', 'Hard', 'heart', 30, 100, 'login_streak', NULL)
ON CONFLICT (id) DO NOTHING;

-- Count achievements after insertion
SELECT COUNT(*) AS achievement_count FROM public.achievements;
