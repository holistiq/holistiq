-- Test script for user_badges table
-- Run this after applying the migration to verify that everything works correctly

-- 1. Check if the table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_badges'
);

-- 2. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'user_badges'
ORDER BY 
  ordinal_position;

-- 3. Check constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM 
  pg_constraint c
  JOIN pg_namespace n ON n.oid = c.connamespace
  JOIN pg_class cl ON cl.oid = c.conrelid
WHERE 
  n.nspname = 'public'
  AND cl.relname = 'user_badges';

-- 4. Check indexes
SELECT 
  indexname,
  indexdef
FROM 
  pg_indexes
WHERE 
  schemaname = 'public'
  AND tablename = 'user_badges';

-- 5. Check RLS policies
SELECT 
  polname,
  polcmd,
  polpermissive,
  polroles,
  polqual,
  polwithcheck
FROM 
  pg_policy
  JOIN pg_class ON pg_class.oid = pg_policy.polrelid
WHERE 
  pg_class.relname = 'user_badges'
  AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 6. Test inserting a record (uncomment and modify as needed)
/*
-- First, make sure you have a test user and achievement
INSERT INTO public.achievements (id, title, description, category, difficulty, icon, required_count, points)
VALUES ('test_achievement', 'Test Achievement', 'For testing purposes', 'test', 'easy', 'trophy', 1, 10)
ON CONFLICT (id) DO NOTHING;

-- Then insert a badge for a test user (replace 'your-test-user-id' with an actual user ID)
INSERT INTO public.user_badges (user_id, achievement_id, display_order)
VALUES ('your-test-user-id', 'test_achievement', 1)
RETURNING *;

-- Test selecting the badge
SELECT * FROM public.user_badges WHERE achievement_id = 'test_achievement';

-- Test updating the badge
UPDATE public.user_badges 
SET display_order = 2
WHERE achievement_id = 'test_achievement'
RETURNING *;

-- Test deleting the badge
DELETE FROM public.user_badges 
WHERE achievement_id = 'test_achievement'
RETURNING *;

-- Clean up test data
DELETE FROM public.achievements WHERE id = 'test_achievement';
*/
