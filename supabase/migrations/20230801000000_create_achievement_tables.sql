-- Migration: Create Achievement Tables
-- Description: Creates tables for the achievement system including achievements, user_achievements, user_badges, and user_achievements_metadata
-- Dependencies: None

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  required_count INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 10,
  icon TEXT,
  badge_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  trigger TEXT
);

-- Create user_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  current_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id),
  UNIQUE(user_id, display_order)
);

-- Create user_achievements_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_achievements_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  metadata_key TEXT NOT NULL,
  metadata_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id, metadata_key, metadata_value)
);

-- Create indexes for achievements table
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- Create indexes for user_achievements table
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Create indexes for user_badges table
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_achievement_id ON user_badges(achievement_id);

-- Create indexes for user_achievements_metadata table
CREATE INDEX IF NOT EXISTS idx_user_achievements_metadata_user_id ON user_achievements_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_metadata_achievement_id ON user_achievements_metadata(achievement_id);

-- Enable RLS on all tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements table
CREATE POLICY "Achievements are viewable by all authenticated users" 
  ON achievements FOR SELECT TO authenticated USING (true);

-- Create policies for user_achievements table
CREATE POLICY "Users can view their own achievements" 
  ON user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" 
  ON user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" 
  ON user_achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own achievements" 
  ON user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for user_badges table
CREATE POLICY "Users can view their own badges" 
  ON user_badges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" 
  ON user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own badges" 
  ON user_badges FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own badges" 
  ON user_badges FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for user_achievements_metadata table
CREATE POLICY "Users can view their own achievement metadata" 
  ON user_achievements_metadata FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievement metadata" 
  ON user_achievements_metadata FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievement metadata" 
  ON user_achievements_metadata FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own achievement metadata" 
  ON user_achievements_metadata FOR DELETE TO authenticated USING (auth.uid() = user_id);
