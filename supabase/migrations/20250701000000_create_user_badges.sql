-- Migration to ensure user_badges table exists with proper configuration
-- This is part of the Achievement System feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints to ensure uniqueness
  UNIQUE(user_id, achievement_id),
  UNIQUE(user_id, display_order)
);

-- Add comment to explain the table
COMMENT ON TABLE public.user_badges IS 'Stores user achievement badge selections for display on user profiles';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_achievement_id ON public.user_badges(achievement_id);

-- Enable Row Level Security
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can update their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can delete their own badges" ON public.user_badges;

-- Create RLS policies
CREATE POLICY "Users can view their own badges"
  ON public.user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON public.user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
  ON public.user_badges
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges"
  ON public.user_badges
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace function for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_user_badges_updated_at ON public.user_badges;

-- Create trigger for updating the updated_at timestamp
CREATE TRIGGER update_user_badges_updated_at
BEFORE UPDATE ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;
GRANT SELECT ON public.user_badges TO anon;
