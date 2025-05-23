-- Migration to add updated_at timestamp to user_badges table and improve table documentation
-- This ensures consistent timestamp tracking across all tables and improves database documentation

-- 1. Add updated_at column to user_badges if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_badges'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.user_badges
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

        RAISE NOTICE 'Added updated_at column to user_badges table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in user_badges table';
    END IF;
END $$;

-- 2. Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for user_badges table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'update_user_badges_updated_at'
        AND tgrelid = 'public.user_badges'::regclass
    ) THEN
        CREATE TRIGGER update_user_badges_updated_at
        BEFORE UPDATE ON public.user_badges
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Created update_user_badges_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_user_badges_updated_at trigger already exists';
    END IF;
END $$;

-- 4. Add descriptive comments to tables for better documentation

-- Function to safely add column comments (only if column exists)
CREATE OR REPLACE FUNCTION safe_comment_on_column(
    p_table_name text,
    p_column_name text,
    p_comment text
) RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = p_table_name
        AND column_name = p_column_name
    ) THEN
        EXECUTE format('COMMENT ON COLUMN public.%I.%I IS %L',
                      p_table_name, p_column_name, p_comment);
    ELSE
        RAISE NOTICE 'Column %.% does not exist, skipping comment', p_table_name, p_column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- User badges table
COMMENT ON TABLE public.user_badges IS 'Stores user achievement badge selections for display on user profiles';
SELECT safe_comment_on_column('user_badges', 'id', 'Unique identifier for the badge selection');
SELECT safe_comment_on_column('user_badges', 'user_id', 'Reference to the user who selected this badge');
SELECT safe_comment_on_column('user_badges', 'achievement_id', 'Reference to the achievement this badge represents');
SELECT safe_comment_on_column('user_badges', 'display_order', 'Order in which badges are displayed on the user profile');
SELECT safe_comment_on_column('user_badges', 'created_at', 'Timestamp when the badge was added to the user profile');
SELECT safe_comment_on_column('user_badges', 'updated_at', 'Timestamp when the badge selection was last updated');

-- Users table
COMMENT ON TABLE public.users IS 'Core user profiles table storing basic user information';
SELECT safe_comment_on_column('users', 'id', 'Unique identifier for the user, linked to auth.users');
SELECT safe_comment_on_column('users', 'email', 'User email address');
SELECT safe_comment_on_column('users', 'created_at', 'Timestamp when the user account was created');
SELECT safe_comment_on_column('users', 'settings', 'JSON object containing user settings and preferences');

-- Test results table
COMMENT ON TABLE public.test_results IS 'Stores cognitive assessment test results for users';
SELECT safe_comment_on_column('test_results', 'id', 'Unique identifier for the test result');
SELECT safe_comment_on_column('test_results', 'user_id', 'Reference to the user who took the test');
SELECT safe_comment_on_column('test_results', 'test_type', 'Type of cognitive test (e.g., n-back, reaction-time)');
SELECT safe_comment_on_column('test_results', 'timestamp', 'When the test was taken');
SELECT safe_comment_on_column('test_results', 'score', 'Overall score achieved in the test');
SELECT safe_comment_on_column('test_results', 'reaction_time', 'Average reaction time in milliseconds');
SELECT safe_comment_on_column('test_results', 'accuracy', 'Accuracy percentage in the test');
SELECT safe_comment_on_column('test_results', 'raw_data', 'Detailed test data in JSON format');
SELECT safe_comment_on_column('test_results', 'environmental_factors', 'Environmental context when the test was taken');
SELECT safe_comment_on_column('test_results', 'confounding_factor_id', 'Reference to associated confounding factors');

-- Supplements table
COMMENT ON TABLE public.supplements IS 'Tracks supplement intake by users';
SELECT safe_comment_on_column('supplements', 'id', 'Unique identifier for the supplement record');
SELECT safe_comment_on_column('supplements', 'user_id', 'Reference to the user taking the supplement');
SELECT safe_comment_on_column('supplements', 'name', 'Name of the supplement');
SELECT safe_comment_on_column('supplements', 'dosage', 'Dosage information as text');
SELECT safe_comment_on_column('supplements', 'intake_time', 'When the supplement was taken');
SELECT safe_comment_on_column('supplements', 'notes', 'Additional notes about the supplement intake');
SELECT safe_comment_on_column('supplements', 'created_at', 'When the supplement record was created');
SELECT safe_comment_on_column('supplements', 'amount', 'Numeric amount of the supplement');
SELECT safe_comment_on_column('supplements', 'unit', 'Unit of measurement for the supplement');
SELECT safe_comment_on_column('supplements', 'frequency', 'How often the supplement is taken');
SELECT safe_comment_on_column('supplements', 'manufacturer', 'Company that manufactures the supplement');
SELECT safe_comment_on_column('supplements', 'brand', 'Brand name of the supplement');

-- User baselines table
COMMENT ON TABLE public.user_baselines IS 'Stores personalized cognitive baselines for users';
SELECT safe_comment_on_column('user_baselines', 'id', 'Unique identifier for the baseline');
SELECT safe_comment_on_column('user_baselines', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('user_baselines', 'test_type', 'Type of cognitive test this baseline is for');
SELECT safe_comment_on_column('user_baselines', 'baseline_score', 'Baseline score for the user in this test type');
SELECT safe_comment_on_column('user_baselines', 'baseline_reaction_time', 'Baseline reaction time for the user');
SELECT safe_comment_on_column('user_baselines', 'baseline_accuracy', 'Baseline accuracy for the user');

-- Confounding factors table
COMMENT ON TABLE public.confounding_factors IS 'Tracks variables that might affect cognitive performance';
SELECT safe_comment_on_column('confounding_factors', 'id', 'Unique identifier for the confounding factor record');
SELECT safe_comment_on_column('confounding_factors', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('confounding_factors', 'recorded_at', 'When these factors were recorded');
SELECT safe_comment_on_column('confounding_factors', 'sleep_duration', 'Sleep duration in minutes');
SELECT safe_comment_on_column('confounding_factors', 'sleep_quality', 'Subjective sleep quality on a 1-10 scale');
SELECT safe_comment_on_column('confounding_factors', 'stress_level', 'Subjective stress level on a 1-10 scale');
SELECT safe_comment_on_column('confounding_factors', 'exercise_duration', 'Exercise duration in minutes');
SELECT safe_comment_on_column('confounding_factors', 'exercise_intensity', 'Exercise intensity on a 1-10 scale');
SELECT safe_comment_on_column('confounding_factors', 'exercise_type', 'Type of exercise performed');
SELECT safe_comment_on_column('confounding_factors', 'mood', 'Subjective mood on a 1-10 scale');
SELECT safe_comment_on_column('confounding_factors', 'energy_level', 'Subjective energy level on a 1-10 scale');

-- Washout periods table
COMMENT ON TABLE public.washout_periods IS 'Tracks periods when users stop taking supplements to clear effects';
SELECT safe_comment_on_column('washout_periods', 'id', 'Unique identifier for the washout period');
SELECT safe_comment_on_column('washout_periods', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('washout_periods', 'supplement_id', 'Reference to the supplement being washed out');
SELECT safe_comment_on_column('washout_periods', 'supplement_name', 'Name of the supplement being washed out');
SELECT safe_comment_on_column('washout_periods', 'start_date', 'When the washout period started');
SELECT safe_comment_on_column('washout_periods', 'end_date', 'When the washout period ended (if completed)');
SELECT safe_comment_on_column('washout_periods', 'expected_duration_days', 'Expected duration of the washout period in days');
SELECT safe_comment_on_column('washout_periods', 'status', 'Current status of the washout period (active, completed, cancelled)');
SELECT safe_comment_on_column('washout_periods', 'reason', 'Reason for starting the washout period');

-- Supplement correlations table
COMMENT ON TABLE public.supplement_correlations IS 'Stores analyzed correlations between supplements and cognitive performance';
SELECT safe_comment_on_column('supplement_correlations', 'id', 'Unique identifier for the correlation record');
SELECT safe_comment_on_column('supplement_correlations', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('supplement_correlations', 'supplement_id', 'Reference to the supplement being analyzed');
SELECT safe_comment_on_column('supplement_correlations', 'test_type', 'Type of cognitive test being analyzed');
SELECT safe_comment_on_column('supplement_correlations', 'analysis_period_start', 'Start of the analysis period');
SELECT safe_comment_on_column('supplement_correlations', 'analysis_period_end', 'End of the analysis period');
SELECT safe_comment_on_column('supplement_correlations', 'score_impact', 'Calculated impact on test score');
SELECT safe_comment_on_column('supplement_correlations', 'reaction_time_impact', 'Calculated impact on reaction time');
SELECT safe_comment_on_column('supplement_correlations', 'accuracy_impact', 'Calculated impact on accuracy');
SELECT safe_comment_on_column('supplement_correlations', 'confidence_level', 'Statistical confidence level of the correlation');
SELECT safe_comment_on_column('supplement_correlations', 'washout_period_id', 'Reference to associated washout period');

-- Statistical analyses table
COMMENT ON TABLE public.statistical_analyses IS 'Stores statistical analyses of cognitive performance data';
SELECT safe_comment_on_column('statistical_analyses', 'id', 'Unique identifier for the analysis');
SELECT safe_comment_on_column('statistical_analyses', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('statistical_analyses', 'test_type', 'Type of cognitive test being analyzed');
SELECT safe_comment_on_column('statistical_analyses', 'baseline_period_start', 'Start of the baseline period');
SELECT safe_comment_on_column('statistical_analyses', 'baseline_period_end', 'End of the baseline period');
SELECT safe_comment_on_column('statistical_analyses', 'comparison_period_start', 'Start of the comparison period');
SELECT safe_comment_on_column('statistical_analyses', 'comparison_period_end', 'End of the comparison period');
SELECT safe_comment_on_column('statistical_analyses', 'alpha', 'Alpha value used for statistical significance');
SELECT safe_comment_on_column('statistical_analyses', 'context_type', 'Type of context for the analysis (e.g., supplement, confounding factor)');
SELECT safe_comment_on_column('statistical_analyses', 'context_id', 'ID of the context object being analyzed');
SELECT safe_comment_on_column('statistical_analyses', 'results', 'JSON object containing analysis results');

-- Achievements table
COMMENT ON TABLE public.achievements IS 'Stores achievement definitions for the gamification system';
SELECT safe_comment_on_column('achievements', 'id', 'Unique identifier for the achievement');
SELECT safe_comment_on_column('achievements', 'title', 'Display title of the achievement');
SELECT safe_comment_on_column('achievements', 'description', 'Detailed description of how to earn the achievement');
SELECT safe_comment_on_column('achievements', 'category', 'Category the achievement belongs to');
SELECT safe_comment_on_column('achievements', 'difficulty', 'Difficulty level of the achievement');
SELECT safe_comment_on_column('achievements', 'icon', 'Icon identifier for the achievement');
SELECT safe_comment_on_column('achievements', 'required_count', 'Number of times the action must be performed');
SELECT safe_comment_on_column('achievements', 'points', 'Points awarded for earning this achievement');
SELECT safe_comment_on_column('achievements', 'badge_url', 'URL to the achievement badge image');
SELECT safe_comment_on_column('achievements', 'trigger', 'Event that triggers this achievement');
SELECT safe_comment_on_column('achievements', 'created_at', 'When the achievement was created');
SELECT safe_comment_on_column('achievements', 'updated_at', 'When the achievement was last updated');

-- User achievements table
COMMENT ON TABLE public.user_achievements IS 'Tracks user progress towards achievements';
SELECT safe_comment_on_column('user_achievements', 'id', 'Unique identifier for the user achievement record');
SELECT safe_comment_on_column('user_achievements', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('user_achievements', 'achievement_id', 'Reference to the achievement');
SELECT safe_comment_on_column('user_achievements', 'current_count', 'Current progress count towards the achievement');
SELECT safe_comment_on_column('user_achievements', 'completed_at', 'When the achievement was completed');

-- User achievements metadata table
COMMENT ON TABLE public.user_achievements_metadata IS 'Stores additional metadata for user achievements';
SELECT safe_comment_on_column('user_achievements_metadata', 'id', 'Unique identifier for the metadata record');
SELECT safe_comment_on_column('user_achievements_metadata', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('user_achievements_metadata', 'achievement_id', 'Reference to the achievement');
SELECT safe_comment_on_column('user_achievements_metadata', 'metadata_key', 'Key for the metadata entry');
SELECT safe_comment_on_column('user_achievements_metadata', 'metadata_value', 'Value for the metadata entry');

-- User preferences table
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences for the application';
SELECT safe_comment_on_column('user_preferences', 'id', 'Unique identifier for the preferences record');
SELECT safe_comment_on_column('user_preferences', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('user_preferences', 'test_preferences', 'JSON object containing test-related preferences');
SELECT safe_comment_on_column('user_preferences', 'ui_preferences', 'JSON object containing UI-related preferences');
SELECT safe_comment_on_column('user_preferences', 'notification_preferences', 'JSON object containing notification preferences');

-- Social shares table
COMMENT ON TABLE public.social_shares IS 'Tracks social media shares of test results';
SELECT safe_comment_on_column('social_shares', 'id', 'Unique identifier for the share record');
SELECT safe_comment_on_column('social_shares', 'user_id', 'Reference to the user who shared');
SELECT safe_comment_on_column('social_shares', 'test_id', 'Reference to the test result that was shared');
SELECT safe_comment_on_column('social_shares', 'platform', 'Social media platform where content was shared');
SELECT safe_comment_on_column('social_shares', 'share_url', 'URL of the shared content');
SELECT safe_comment_on_column('social_shares', 'shared_at', 'When the content was shared');

-- Analytics table
COMMENT ON TABLE public.analytics IS 'Stores aggregated analytics data for cognitive performance';
SELECT safe_comment_on_column('analytics', 'id', 'Unique identifier for the analytics record');
SELECT safe_comment_on_column('analytics', 'user_id', 'Reference to the user');
SELECT safe_comment_on_column('analytics', 'baseline_test_id', 'Reference to the baseline test');
SELECT safe_comment_on_column('analytics', 'test_type', 'Type of cognitive test being analyzed');
SELECT safe_comment_on_column('analytics', 'period_start', 'Start of the analysis period');
SELECT safe_comment_on_column('analytics', 'period_end', 'End of the analysis period');
SELECT safe_comment_on_column('analytics', 'avg_score', 'Average score during the period');
SELECT safe_comment_on_column('analytics', 'avg_reaction_time', 'Average reaction time during the period');
SELECT safe_comment_on_column('analytics', 'avg_accuracy', 'Average accuracy during the period');
SELECT safe_comment_on_column('analytics', 'score_delta', 'Change in score compared to baseline');
SELECT safe_comment_on_column('analytics', 'reaction_time_delta', 'Change in reaction time compared to baseline');
SELECT safe_comment_on_column('analytics', 'accuracy_delta', 'Change in accuracy compared to baseline');

-- Drop the helper function when done
DROP FUNCTION IF EXISTS safe_comment_on_column;
