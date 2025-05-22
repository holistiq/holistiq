-- Diagnostic Script: Check Achievement Schema
-- Description: Checks if the achievements-related tables have the correct schema
-- Usage: Run this script to diagnose schema issues without modifying the database

-- Check if the achievements table has the correct schema
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'achievements'
ORDER BY 
    ordinal_position;

-- Check if the user_achievements table has the correct schema
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'user_achievements'
ORDER BY 
    ordinal_position;

-- Check if the user_badges table exists and has the correct schema
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

-- Check if there's a data type mismatch in the achievement_id column
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND column_name = 'achievement_id'
    AND table_name IN ('user_achievements', 'user_badges', 'user_achievements_metadata');

-- Check if the achievements table has a TEXT or UUID primary key
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND column_name = 'id'
    AND table_name = 'achievements';

-- Check for the presence of the 'secret' column in the achievements table
SELECT 
    EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'achievements'
        AND column_name = 'secret'
    ) AS has_secret_column;

-- Check if all required tables exist
SELECT 
    table_name,
    EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' 
        AND table_name = 'achievements'
    ) AS achievements_exists,
    EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' 
        AND table_name = 'user_achievements'
    ) AS user_achievements_exists,
    EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' 
        AND table_name = 'user_achievements_metadata'
    ) AS user_achievements_metadata_exists,
    EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' 
        AND table_name = 'user_badges'
    ) AS user_badges_exists
FROM (
    SELECT 'Schema Check' AS table_name
) AS t;

-- Check if RLS is enabled for all tables
SELECT
    tablename,
    rowsecurity
FROM
    pg_tables
WHERE
    schemaname = 'public'
    AND tablename IN ('achievements', 'user_achievements', 'user_achievements_metadata', 'user_badges');

-- Check RLS policies for all tables
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename IN ('achievements', 'user_achievements', 'user_achievements_metadata', 'user_badges')
ORDER BY
    tablename, cmd;
