-- Migration: Simplify Achievement Categories
-- Description: Consolidates achievement categories from 9+ categories to 3 core categories for MVP
-- Dependencies: 20230801000000_create_achievement_tables.sql

-- Clear existing achievements to start fresh with simplified structure
DELETE FROM public.achievements;

-- Insert new simplified achievement structure
-- TESTING CATEGORY - All cognitive test related achievements
INSERT INTO public.achievements (title, description, category, difficulty, icon, required_count, points, trigger) VALUES
('First Steps', 'Complete your first cognitive test', 'testing', 'easy', 'brain', 1, 10, 'test_completed'),
('Test Explorer', 'Complete 5 cognitive tests', 'testing', 'easy', 'target', 5, 20, 'tests_completed'),
('Test Enthusiast', 'Complete 25 cognitive tests', 'testing', 'medium', 'lightbulb', 25, 50, 'tests_completed'),
('Test Master', 'Complete 100 cognitive tests', 'testing', 'hard', 'trophy', 100, 100, 'tests_completed'),
('Baseline Established', 'Complete your baseline cognitive assessment - essential for measuring changes', 'testing', 'easy', 'activity', 1, 15, 'baseline_completed'),
('Three-Day Streak', 'Complete tests on three consecutive days - building a reliable data pattern', 'testing', 'easy', 'calendar', 3, 30, 'daily_streak'),
('Weekly Dedication', 'Complete tests on seven consecutive days - essential for accurate supplement assessment', 'testing', 'medium', 'calendar-check', 7, 70, 'daily_streak'),
('Data Collection Master', 'Complete tests on thirty consecutive days - providing comprehensive data for analysis', 'testing', 'expert', 'calendar-range', 30, 150, 'daily_streak'),
('Consistent Tester', 'Complete tests at a similar time of day for 5 days', 'testing', 'medium', 'clock', 5, 30, 'consistent_time_of_day'),
('Perfect Score', 'Achieve a perfect score on any test', 'testing', 'hard', 'star', 1, 100, 'test_perfect_score');

-- SUPPLEMENTS CATEGORY - All supplement tracking and evaluation achievements
INSERT INTO public.achievements (title, description, category, difficulty, icon, required_count, points, trigger) VALUES
('Supplement Tracker', 'Log your first supplement - the first step in tracking effectiveness', 'supplements', 'easy', 'pill', 1, 10, 'supplement_logged'),
('Supplement Variety', 'Log 5 different supplements with complete dosage information', 'supplements', 'medium', 'list', 5, 30, 'supplements_logged'),
('Supplement Dedication', 'Log supplements for 14 consecutive days - essential for establishing patterns', 'supplements', 'hard', 'calendar-clock', 14, 80, 'supplements_logged'),
('Detailed Logger', 'Log 10 supplements with detailed notes about effects and experience', 'supplements', 'medium', 'clipboard-list', 10, 40, 'supplement_logged_with_notes'),
('Cycle Completer', 'Complete a full supplement cycle (start, consistent use, evaluation)', 'supplements', 'medium', 'refresh-cw', 1, 50, 'supplement_cycle_completed'),
('Supplement Analyst', 'Complete 3 supplement evaluations with before/after cognitive tests', 'supplements', 'hard', 'bar-chart-2', 3, 75, 'supplement_evaluation_completed'),
('Complete Data Provider', 'Log supplements with complete information (brand, dosage, timing) 15 times', 'supplements', 'hard', 'check-circle', 15, 60, 'complete_supplement_data');

-- ENGAGEMENT CATEGORY - Profile, account, and general app usage achievements
INSERT INTO public.achievements (title, description, category, difficulty, icon, required_count, points, trigger) VALUES
('Identity Established', 'Complete your user profile - helps personalize your experience', 'engagement', 'easy', 'user', 1, 15, 'profile_completed'),
('HolistiQ Beginner', 'Create your account and complete onboarding', 'engagement', 'easy', 'user', 1, 5, 'account_created'),
('HolistiQ Explorer', 'Visit all main sections of the application', 'engagement', 'easy', 'map', 1, 15, 'explore_app'),
('Regular User', 'Log in to the app for 7 consecutive days', 'engagement', 'easy', 'calendar', 7, 30, 'login_streak'),
('HolistiQ Enthusiast', 'Use the application for 30 consecutive days', 'engagement', 'hard', 'heart', 30, 100, 'login_streak'),
('Confounding Factor Tracker', 'Log confounding factors (sleep, stress, etc.) alongside 5 tests', 'engagement', 'medium', 'layers', 5, 35, 'confounding_factors_logged'),
('Holistic Approach', 'Track 3 different types of confounding factors', 'engagement', 'medium', 'layers', 3, 25, 'factor_variety'),
('Early Adopter', 'Join during the beta phase of HolistiQ - thank you for helping us improve!', 'engagement', 'easy', 'rocket', 1, 25, NULL);

-- Verify the category consolidation
SELECT
  category,
  COUNT(*) as achievement_count
FROM public.achievements
GROUP BY category
ORDER BY category;

-- Show final achievement count
SELECT COUNT(*) AS total_achievements FROM public.achievements;

-- Show sample achievements from each category
SELECT category, id, title, difficulty, points
FROM public.achievements
ORDER BY category, difficulty, points;
