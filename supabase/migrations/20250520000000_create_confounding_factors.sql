-- Migration to create confounding_factors table for tracking variables that might affect cognitive performance
-- This is part of the Confounding Factor Tracking feature (item 2.3 from the Supplement Tracking Roadmap)

-- Create confounding_factors table
CREATE TABLE IF NOT EXISTS public.confounding_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Timestamp for when this factor was recorded
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Sleep-related factors
  sleep_duration INTEGER, -- in minutes
  sleep_quality SMALLINT, -- 1-10 scale
  
  -- Stress-related factors
  stress_level SMALLINT, -- 1-10 scale
  
  -- Exercise-related factors
  exercise_duration INTEGER, -- in minutes
  exercise_intensity SMALLINT, -- 1-10 scale
  exercise_type TEXT, -- e.g., 'cardio', 'strength', 'yoga'
  
  -- Diet-related factors
  meal_timing JSONB, -- array of meal timestamps
  caffeine_intake INTEGER, -- in mg
  alcohol_intake INTEGER, -- in standard drinks
  water_intake INTEGER, -- in ml
  
  -- Environmental factors
  location TEXT, -- e.g., 'home', 'office', 'cafe'
  noise_level SMALLINT, -- 1-10 scale
  temperature SMALLINT, -- in celsius
  
  -- Health factors
  mood SMALLINT, -- 1-10 scale
  energy_level SMALLINT, -- 1-10 scale
  illness BOOLEAN, -- whether the user is feeling ill
  illness_details TEXT, -- description of illness if any
  
  -- Additional factors
  notes TEXT, -- any additional notes
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.confounding_factors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own confounding factors"
  ON public.confounding_factors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own confounding factors"
  ON public.confounding_factors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own confounding factors"
  ON public.confounding_factors
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own confounding factors"
  ON public.confounding_factors
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX confounding_factors_user_id_idx ON public.confounding_factors (user_id);
CREATE INDEX confounding_factors_recorded_at_idx ON public.confounding_factors (recorded_at);

-- Add comments
COMMENT ON TABLE public.confounding_factors IS 'Stores confounding factors that might affect cognitive performance';
COMMENT ON COLUMN public.confounding_factors.sleep_duration IS 'Sleep duration in minutes';
COMMENT ON COLUMN public.confounding_factors.sleep_quality IS 'Subjective sleep quality on a scale of 1-10';
COMMENT ON COLUMN public.confounding_factors.stress_level IS 'Subjective stress level on a scale of 1-10';
COMMENT ON COLUMN public.confounding_factors.exercise_duration IS 'Exercise duration in minutes';
COMMENT ON COLUMN public.confounding_factors.exercise_intensity IS 'Subjective exercise intensity on a scale of 1-10';
COMMENT ON COLUMN public.confounding_factors.exercise_type IS 'Type of exercise performed';
COMMENT ON COLUMN public.confounding_factors.meal_timing IS 'JSON array of meal timestamps';
COMMENT ON COLUMN public.confounding_factors.caffeine_intake IS 'Caffeine intake in milligrams';
COMMENT ON COLUMN public.confounding_factors.alcohol_intake IS 'Alcohol intake in standard drinks';
COMMENT ON COLUMN public.confounding_factors.water_intake IS 'Water intake in milliliters';
COMMENT ON COLUMN public.confounding_factors.location IS 'Location where the user spent most of their time';
COMMENT ON COLUMN public.confounding_factors.noise_level IS 'Subjective noise level on a scale of 1-10';
COMMENT ON COLUMN public.confounding_factors.temperature IS 'Ambient temperature in celsius';
COMMENT ON COLUMN public.confounding_factors.mood IS 'Subjective mood on a scale of 1-10';
COMMENT ON COLUMN public.confounding_factors.energy_level IS 'Subjective energy level on a scale of 1-10';
COMMENT ON COLUMN public.confounding_factors.illness IS 'Whether the user is feeling ill';
COMMENT ON COLUMN public.confounding_factors.illness_details IS 'Description of illness if any';
