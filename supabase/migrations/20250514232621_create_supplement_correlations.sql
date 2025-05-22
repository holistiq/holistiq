-- Migration to create supplement_correlations table
-- This table is needed for the washout_periods migration

-- Supplement Correlations Table for tracking relationships between supplements and cognitive performance
CREATE TABLE IF NOT EXISTS public.supplement_correlations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES public.supplements(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL, -- e.g., 'n-back', 'reaction-time', etc.
  analysis_period_start TIMESTAMPTZ NOT NULL,
  analysis_period_end TIMESTAMPTZ NOT NULL,
  onset_delay_days INTEGER NOT NULL DEFAULT 0, -- expected days until supplement takes effect
  cumulative_effect_threshold INTEGER NOT NULL DEFAULT 7, -- days of consistent use needed for full effect

  -- Performance metrics
  score_impact NUMERIC, -- positive means improvement, negative means decline
  reaction_time_impact NUMERIC, -- negative means improvement (faster), positive means decline
  accuracy_impact NUMERIC, -- positive means improvement, negative means decline

  -- Statistical significance
  confidence_level NUMERIC, -- 0-1 value representing statistical confidence
  sample_size INTEGER NOT NULL DEFAULT 0, -- number of tests included in analysis

  -- Metadata
  analysis_parameters JSONB, -- stores additional analysis parameters
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS supplement_correlations_user_id_idx ON public.supplement_correlations(user_id);
CREATE INDEX IF NOT EXISTS supplement_correlations_supplement_id_idx ON public.supplement_correlations(supplement_id);
CREATE INDEX IF NOT EXISTS supplement_correlations_period_idx ON public.supplement_correlations(analysis_period_start, analysis_period_end);

-- Enable RLS
ALTER TABLE public.supplement_correlations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own supplement correlations"
  ON public.supplement_correlations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplement correlations"
  ON public.supplement_correlations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplement correlations"
  ON public.supplement_correlations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplement correlations"
  ON public.supplement_correlations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate entries
ALTER TABLE public.supplement_correlations ADD CONSTRAINT supplement_correlations_unique
  UNIQUE (user_id, supplement_id, test_type, analysis_period_start, analysis_period_end);

COMMENT ON TABLE public.supplement_correlations IS 'Stores correlation analysis between supplements and cognitive test performance';