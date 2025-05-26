-- Migration: Create Social Shares Table (Safe Version)
-- Description: Creates a table to track when users share their test results on social media
-- Dependencies: None

-- Create social_shares table to track when users share their results
CREATE TABLE IF NOT EXISTS public.social_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id UUID REFERENCES public.test_results(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add share_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'social_shares'
        AND column_name = 'share_url'
    ) THEN
        ALTER TABLE public.social_shares ADD COLUMN share_url TEXT;
    END IF;
END $$;

-- Add comments to explain the table (only for existing columns)
COMMENT ON TABLE public.social_shares IS 'Tracks social media shares of test results';

-- Add comments safely
DO $$
BEGIN
    -- Only add comments for columns that exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_shares' AND column_name = 'id') THEN
        COMMENT ON COLUMN public.social_shares.id IS 'Unique identifier for the share record';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_shares' AND column_name = 'user_id') THEN
        COMMENT ON COLUMN public.social_shares.user_id IS 'Reference to the user who shared';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_shares' AND column_name = 'test_id') THEN
        COMMENT ON COLUMN public.social_shares.test_id IS 'Reference to the test result that was shared';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_shares' AND column_name = 'platform') THEN
        COMMENT ON COLUMN public.social_shares.platform IS 'Social media platform where content was shared';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_shares' AND column_name = 'share_url') THEN
        COMMENT ON COLUMN public.social_shares.share_url IS 'URL of the shared content';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_shares' AND column_name = 'shared_at') THEN
        COMMENT ON COLUMN public.social_shares.shared_at IS 'When the content was shared';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_shares' AND column_name = 'created_at') THEN
        COMMENT ON COLUMN public.social_shares.created_at IS 'When the share record was created';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON public.social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_test_id ON public.social_shares(test_id);

-- Enable Row Level Security
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe approach)
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can insert their own social shares" ON public.social_shares;
    DROP POLICY IF EXISTS "Users can view their own social shares" ON public.social_shares;
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, continue
        NULL;
END $$;

-- Create RLS policies
CREATE POLICY "Users can insert their own social shares"
    ON public.social_shares
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own social shares"
    ON public.social_shares
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create achievements for social sharing (safe insert with proper UUIDs)
-- First, check if achievements table exists and what its structure is
DO $$
BEGIN
    -- Only insert achievements if the table exists and doesn't already have these achievements
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
        -- Insert achievements with generated UUIDs, but only if they don't already exist
        INSERT INTO public.achievements (title, description, category, difficulty, required_count, points, icon, badge_url, trigger)
        SELECT * FROM (VALUES
            ('Social Butterfly', 'Share your test results on social media', 'data_quality', 'easy', 1, 10, 'share', 'https://api.dicebear.com/7.x/shapes/svg?seed=social-butterfly', 'social_share'),
            ('Influencer', 'Share your test results on 5 different occasions', 'data_quality', 'medium', 5, 25, 'share', 'https://api.dicebear.com/7.x/shapes/svg?seed=influencer', 'social_share'),
            ('Thought Leader', 'Share your test results on 20 different occasions', 'data_quality', 'hard', 20, 50, 'share', 'https://api.dicebear.com/7.x/shapes/svg?seed=thought-leader', 'social_share')
        ) AS new_achievements(title, description, category, difficulty, required_count, points, icon, badge_url, trigger)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.achievements
            WHERE achievements.title = new_achievements.title
            AND achievements.trigger = new_achievements.trigger
        );
    END IF;
END $$;
