-- Achievement System Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for storing achievement definitions
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  icon TEXT NOT NULL,
  required_count INTEGER NOT NULL,
  points INTEGER NOT NULL,
  trigger TEXT,
  metadata JSONB,
  secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing user achievement progress
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Table for storing achievement metadata (for complex achievements)
CREATE TABLE IF NOT EXISTS user_achievements_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  metadata_key TEXT NOT NULL,
  metadata_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id, metadata_key, metadata_value)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_metadata_user_id ON user_achievements_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_metadata_achievement_id ON user_achievements_metadata(achievement_id);

-- RLS Policies for achievements table
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY achievements_select_policy ON achievements
  FOR SELECT USING (true);

CREATE POLICY achievements_insert_policy ON achievements
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY achievements_update_policy ON achievements
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY achievements_delete_policy ON achievements
  FOR DELETE USING (auth.role() = 'service_role');

-- RLS Policies for user_achievements table
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_achievements_select_policy ON user_achievements
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_achievements_insert_policy ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_achievements_update_policy ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_achievements_delete_policy ON user_achievements
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- RLS Policies for user_achievements_metadata table
ALTER TABLE user_achievements_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_achievements_metadata_select_policy ON user_achievements_metadata
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_achievements_metadata_insert_policy ON user_achievements_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_achievements_metadata_update_policy ON user_achievements_metadata
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_achievements_metadata_delete_policy ON user_achievements_metadata
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at timestamp for user_achievements
CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update the updated_at timestamp for achievements
CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON achievements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Table for storing user badge selections
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id),
  UNIQUE(user_id, display_order)
);

-- RLS Policies for user_badges table
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_badges_select_policy ON user_badges
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_badges_insert_policy ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_badges_update_policy ON user_badges
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY user_badges_delete_policy ON user_badges
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_achievement_id ON user_badges(achievement_id);
