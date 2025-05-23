-- Migration to create statistical_analyses table
-- This is part of the Statistical Significance Calculator feature (item 2.4 from the Supplement Tracking Roadmap)

-- Create statistical_analyses table
CREATE TABLE IF NOT EXISTS public.statistical_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Analysis parameters
  test_type TEXT NOT NULL,
  baseline_period_start TIMESTAMPTZ NOT NULL,
  baseline_period_end TIMESTAMPTZ NOT NULL,
  comparison_period_start TIMESTAMPTZ NOT NULL,
  comparison_period_end TIMESTAMPTZ NOT NULL,
  alpha NUMERIC NOT NULL DEFAULT 0.05,
  
  -- Analysis context
  context_type TEXT NOT NULL, -- 'supplement', 'confounding_factor', 'general'
  context_id UUID, -- Optional reference to a supplement or confounding factor
  context_name TEXT, -- Name of the context (e.g., supplement name)
  
  -- Analysis results
  results JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.statistical_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own statistical analyses"
  ON public.statistical_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statistical analyses"
  ON public.statistical_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statistical analyses"
  ON public.statistical_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statistical analyses"
  ON public.statistical_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX statistical_analyses_user_id_idx ON public.statistical_analyses (user_id);
CREATE INDEX statistical_analyses_context_type_idx ON public.statistical_analyses (context_type);
CREATE INDEX statistical_analyses_context_id_idx ON public.statistical_analyses (context_id);

-- Add comments
COMMENT ON TABLE public.statistical_analyses IS 'Stores statistical significance analyses of cognitive test results';
COMMENT ON COLUMN public.statistical_analyses.test_type IS 'Type of cognitive test analyzed';
COMMENT ON COLUMN public.statistical_analyses.baseline_period_start IS 'Start of baseline period';
COMMENT ON COLUMN public.statistical_analyses.baseline_period_end IS 'End of baseline period';
COMMENT ON COLUMN public.statistical_analyses.comparison_period_start IS 'Start of comparison period';
COMMENT ON COLUMN public.statistical_analyses.comparison_period_end IS 'End of comparison period';
COMMENT ON COLUMN public.statistical_analyses.alpha IS 'Significance level (default: 0.05)';
COMMENT ON COLUMN public.statistical_analyses.context_type IS 'Type of analysis context (supplement, confounding_factor, general)';
COMMENT ON COLUMN public.statistical_analyses.context_id IS 'ID of the context entity (e.g., supplement ID)';
COMMENT ON COLUMN public.statistical_analyses.context_name IS 'Name of the context (e.g., supplement name)';
COMMENT ON COLUMN public.statistical_analyses.results IS 'JSON results of the statistical analysis';

-- Create function to run and save a statistical analysis
CREATE OR REPLACE FUNCTION run_and_save_statistical_analysis(
  p_user_id UUID,
  p_test_type TEXT,
  p_baseline_period_start TIMESTAMPTZ,
  p_baseline_period_end TIMESTAMPTZ,
  p_comparison_period_start TIMESTAMPTZ,
  p_comparison_period_end TIMESTAMPTZ,
  p_alpha NUMERIC DEFAULT 0.05,
  p_context_type TEXT DEFAULT 'general',
  p_context_id UUID DEFAULT NULL,
  p_context_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_analysis_results JSONB;
  v_analysis_id UUID;
BEGIN
  -- Run the statistical analysis
  v_analysis_results := analyze_statistical_significance(
    p_user_id,
    p_test_type,
    p_baseline_period_start,
    p_baseline_period_end,
    p_comparison_period_start,
    p_comparison_period_end,
    p_alpha
  );
  
  -- Save the analysis results
  INSERT INTO public.statistical_analyses (
    user_id,
    test_type,
    baseline_period_start,
    baseline_period_end,
    comparison_period_start,
    comparison_period_end,
    alpha,
    context_type,
    context_id,
    context_name,
    results
  ) VALUES (
    p_user_id,
    p_test_type,
    p_baseline_period_start,
    p_baseline_period_end,
    p_comparison_period_start,
    p_comparison_period_end,
    p_alpha,
    p_context_type,
    p_context_id,
    p_context_name,
    v_analysis_results
  ) RETURNING id INTO v_analysis_id;
  
  RETURN v_analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get statistical analyses for a user
CREATE OR REPLACE FUNCTION get_statistical_analyses(
  p_user_id UUID,
  p_context_type TEXT DEFAULT NULL,
  p_context_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  test_type TEXT,
  baseline_period_start TIMESTAMPTZ,
  baseline_period_end TIMESTAMPTZ,
  comparison_period_start TIMESTAMPTZ,
  comparison_period_end TIMESTAMPTZ,
  alpha NUMERIC,
  context_type TEXT,
  context_id UUID,
  context_name TEXT,
  results JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.test_type,
    sa.baseline_period_start,
    sa.baseline_period_end,
    sa.comparison_period_start,
    sa.comparison_period_end,
    sa.alpha,
    sa.context_type,
    sa.context_id,
    sa.context_name,
    sa.results,
    sa.created_at
  FROM
    public.statistical_analyses sa
  WHERE
    sa.user_id = p_user_id
    AND (p_context_type IS NULL OR sa.context_type = p_context_type)
    AND (p_context_id IS NULL OR sa.context_id = p_context_id)
  ORDER BY
    sa.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION run_and_save_statistical_analysis IS 'Runs a statistical analysis and saves the results';
COMMENT ON FUNCTION get_statistical_analyses IS 'Gets statistical analyses for a user';
