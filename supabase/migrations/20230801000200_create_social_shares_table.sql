-- Migration: Create Social Shares Table
-- Description: Creates a table to track when users share their test results on social media
-- Dependencies: None

-- Create social_shares table to track when users share their results
CREATE TABLE IF NOT EXISTS public.social_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id UUID REFERENCES public.test_results(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    share_url TEXT,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to explain the table
COMMENT ON TABLE public.social_shares IS 'Tracks social media shares of test results';
COMMENT ON COLUMN public.social_shares.id IS 'Unique identifier for the share record';
COMMENT ON COLUMN public.social_shares.user_id IS 'Reference to the user who shared';
COMMENT ON COLUMN public.social_shares.test_id IS 'Reference to the test result that was shared';
COMMENT ON COLUMN public.social_shares.platform IS 'Social media platform where content was shared';
COMMENT ON COLUMN public.social_shares.share_url IS 'URL of the shared content';
COMMENT ON COLUMN public.social_shares.shared_at IS 'When the content was shared';
COMMENT ON COLUMN public.social_shares.created_at IS 'When the share record was created';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON public.social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_test_id ON public.social_shares(test_id);

-- Enable Row Level Security
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;

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

-- Create achievements for social sharing
INSERT INTO public.achievements (id, title, description, category, difficulty, required_count, points, icon, badge_url, trigger)
VALUES 
    ('social_butterfly', 'Social Butterfly', 'Share your test results on social media', 'data_quality', 'easy', 1, 10, 'share', 'https://api.dicebear.com/7.x/shapes/svg?seed=social-butterfly', 'social_share'),
    ('influencer', 'Influencer', 'Share your test results on 5 different occasions', 'data_quality', 'medium', 5, 25, 'share', 'https://api.dicebear.com/7.x/shapes/svg?seed=influencer', 'social_share'),
    ('thought_leader', 'Thought Leader', 'Share your test results on 20 different occasions', 'data_quality', 'hard', 20, 50, 'share', 'https://api.dicebear.com/7.x/shapes/svg?seed=thought-leader', 'social_share')
ON CONFLICT (id) DO NOTHING;
