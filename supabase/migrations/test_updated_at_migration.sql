-- Test script for verifying the updated_at column migration
-- Run this after applying the migration to verify that everything works correctly

-- 1. Check if the updated_at column exists in the user_badges table
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'user_badges' 
  AND column_name = 'updated_at'
) AS updated_at_column_exists;

-- 2. Check if the trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgrelid = 'public.user_badges'::regclass 
  AND tgname = 'update_user_badges_updated_at'
) AS trigger_exists;

-- 3. Check if the trigger function exists
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'update_updated_at_column'
) AS trigger_function_exists;

-- 4. Check if table comments exist (sample check for user_badges table)
SELECT obj_description('public.user_badges'::regclass) AS table_comment;

-- 5. Check if column comments exist (sample check for user_badges.display_order column)
SELECT col_description('public.user_badges'::regclass, (
  SELECT ordinal_position 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'user_badges' 
  AND column_name = 'display_order'
)) AS column_comment;

-- 6. Test the trigger functionality (uncomment and modify as needed)
/*
-- First, get a sample user_badge record
SELECT id, updated_at FROM public.user_badges LIMIT 1;

-- Wait a moment to ensure timestamp difference
SELECT pg_sleep(1);

-- Update the record (this should trigger the updated_at update)
UPDATE public.user_badges 
SET display_order = display_order 
WHERE id = 'replace-with-actual-id-from-previous-query';

-- Check if updated_at changed
SELECT id, updated_at FROM public.user_badges WHERE id = 'replace-with-actual-id-from-previous-query';
*/

-- 7. Check for any issues with the migration
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'user_badges' 
ORDER BY 
  ordinal_position;
