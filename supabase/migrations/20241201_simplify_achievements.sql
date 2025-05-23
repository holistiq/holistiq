-- Migration: Simplify Achievements System
-- Date: 2024-12-01
-- Description: Simplify the achievements system to focus on core user behaviors

-- The user_achievements table structure is already compatible with our simplified system
-- No schema changes are needed, but we'll add some comments for clarity

COMMENT ON TABLE user_achievements IS 'Tracks user progress on achievements - simplified to focus on core behaviors';
COMMENT ON COLUMN user_achievements.achievement_id IS 'References achievement ID from the application data';
COMMENT ON COLUMN user_achievements.current_count IS 'Current progress count towards achievement completion';
COMMENT ON COLUMN user_achievements.completed_at IS 'Timestamp when achievement was completed (null if not completed)';

-- Optional: Clean up any old achievement metadata that's no longer needed
-- This is commented out for safety - uncomment if you want to clean up old data
-- DELETE FROM user_achievements WHERE achievement_id NOT IN (
--   'first_test', 'test_explorer', 'test_enthusiast', 'test_master',
--   'first_supplement', 'supplement_variety', 'supplement_dedication', 'supplement_master',
--   'profile_complete', 'regular_user', 'dedicated_user', 'early_adopter'
-- );

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(user_id, completed_at) WHERE completed_at IS NOT NULL;
