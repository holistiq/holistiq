-- Migration to create user_baselines table for storing personalized cognitive baselines
-- This is part of the Baseline Calibration feature (item 2.2 from the Supplement Tracking Roadmap)

-- Create user_baselines table
CREATE TABLE IF NOT EXISTS public.user_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL, -- e.g., 'n-back-2', 'reaction-time', etc.
  
  -- Baseline metrics
  baseline_score NUMERIC,
  baseline_reaction_time NUMERIC,
  baseline_accuracy NUMERIC,
  
  -- Baseline calculation metadata
  calculation_method TEXT NOT NULL, -- e.g., 'first_n_tests', 'pre_supplement', 'manual'
  sample_size INTEGER NOT NULL, -- Number of tests used to calculate the baseline
  confidence_level NUMERIC, -- 0-1 value indicating confidence in the baseline
  variance_score NUMERIC, -- Variance in the baseline score
  variance_reaction_time NUMERIC, -- Variance in the baseline reaction time
  variance_accuracy NUMERIC, -- Variance in the baseline accuracy
  
  -- Time period for baseline calculation
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint to ensure uniqueness of user_id and test_type
  UNIQUE(user_id, test_type)
);

-- Add comment to explain the table
COMMENT ON TABLE public.user_baselines IS 'Stores personalized cognitive baselines for users, used as reference points for measuring supplement effects';

-- Enable Row Level Security
ALTER TABLE public.user_baselines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own baselines"
  ON public.user_baselines
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own baselines"
  ON public.user_baselines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own baselines"
  ON public.user_baselines
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to calculate baseline metrics
CREATE OR REPLACE FUNCTION calculate_user_baseline(
  p_user_id UUID,
  p_test_type TEXT,
  p_calculation_method TEXT DEFAULT 'first_n_tests',
  p_sample_size INTEGER DEFAULT 3,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_baseline_score NUMERIC;
  v_baseline_reaction_time NUMERIC;
  v_baseline_accuracy NUMERIC;
  v_variance_score NUMERIC;
  v_variance_reaction_time NUMERIC;
  v_variance_accuracy NUMERIC;
  v_confidence_level NUMERIC;
  v_actual_sample_size INTEGER;
  v_result_id UUID;
  v_tests_query TEXT;
  v_tests_result RECORD;
BEGIN
  -- Determine which tests to include based on calculation method
  IF p_calculation_method = 'first_n_tests' THEN
    -- Use the first N tests as baseline
    SELECT 
      AVG(score)::NUMERIC AS avg_score,
      AVG(reaction_time)::NUMERIC AS avg_reaction_time,
      AVG(accuracy)::NUMERIC AS avg_accuracy,
      VARIANCE(score)::NUMERIC AS var_score,
      VARIANCE(reaction_time)::NUMERIC AS var_reaction_time,
      VARIANCE(accuracy)::NUMERIC AS var_accuracy,
      COUNT(*) AS sample_count
    INTO v_tests_result
    FROM (
      SELECT 
        score, 
        reaction_time, 
        accuracy
      FROM public.test_results
      WHERE user_id = p_user_id
        AND test_type = p_test_type
      ORDER BY timestamp ASC
      LIMIT p_sample_size
    ) AS first_tests;
    
  ELSIF p_calculation_method = 'pre_supplement' THEN
    -- Use tests before any supplement intake
    SELECT 
      AVG(tr.score)::NUMERIC AS avg_score,
      AVG(tr.reaction_time)::NUMERIC AS avg_reaction_time,
      AVG(tr.accuracy)::NUMERIC AS avg_accuracy,
      VARIANCE(tr.score)::NUMERIC AS var_score,
      VARIANCE(tr.reaction_time)::NUMERIC AS var_reaction_time,
      VARIANCE(tr.accuracy)::NUMERIC AS var_accuracy,
      COUNT(*) AS sample_count
    INTO v_tests_result
    FROM public.test_results tr
    WHERE tr.user_id = p_user_id
      AND tr.test_type = p_test_type
      AND tr.timestamp < (
        SELECT MIN(intake_time)
        FROM public.supplements
        WHERE user_id = p_user_id
      );
      
  ELSIF p_calculation_method = 'date_range' THEN
    -- Use tests within a specific date range
    SELECT 
      AVG(score)::NUMERIC AS avg_score,
      AVG(reaction_time)::NUMERIC AS avg_reaction_time,
      AVG(accuracy)::NUMERIC AS avg_accuracy,
      VARIANCE(score)::NUMERIC AS var_score,
      VARIANCE(reaction_time)::NUMERIC AS var_reaction_time,
      VARIANCE(accuracy)::NUMERIC AS var_accuracy,
      COUNT(*) AS sample_count
    INTO v_tests_result
    FROM public.test_results
    WHERE user_id = p_user_id
      AND test_type = p_test_type
      AND (p_start_date IS NULL OR timestamp >= p_start_date)
      AND (p_end_date IS NULL OR timestamp <= p_end_date);
  END IF;

  -- Extract values from the query result
  v_baseline_score := v_tests_result.avg_score;
  v_baseline_reaction_time := v_tests_result.avg_reaction_time;
  v_baseline_accuracy := v_tests_result.avg_accuracy;
  v_variance_score := v_tests_result.var_score;
  v_variance_reaction_time := v_tests_result.var_reaction_time;
  v_variance_accuracy := v_tests_result.var_accuracy;
  v_actual_sample_size := v_tests_result.sample_count;
  
  -- Calculate confidence level based on sample size and variance
  -- Simple formula: higher sample size and lower variance = higher confidence
  IF v_actual_sample_size > 0 THEN
    -- Normalize sample size (1-10 scale)
    DECLARE
      v_normalized_sample_size NUMERIC := LEAST(v_actual_sample_size / 10.0, 1.0);
      v_normalized_variance NUMERIC;
    BEGIN
      -- Normalize variance (inverted, so lower variance = higher value)
      IF v_variance_score IS NOT NULL AND v_variance_score > 0 THEN
        v_normalized_variance := 1.0 / (1.0 + LOG(v_variance_score));
      ELSE
        v_normalized_variance := 0.5; -- Default if variance is null or zero
      END IF;
      
      -- Combine factors (70% sample size, 30% variance)
      v_confidence_level := (0.7 * v_normalized_sample_size) + (0.3 * v_normalized_variance);
    END;
  ELSE
    v_confidence_level := 0;
  END IF;
  
  -- Insert or update the baseline record
  INSERT INTO public.user_baselines (
    user_id,
    test_type,
    baseline_score,
    baseline_reaction_time,
    baseline_accuracy,
    calculation_method,
    sample_size,
    confidence_level,
    variance_score,
    variance_reaction_time,
    variance_accuracy,
    start_date,
    end_date,
    updated_at
  ) VALUES (
    p_user_id,
    p_test_type,
    v_baseline_score,
    v_baseline_reaction_time,
    v_baseline_accuracy,
    p_calculation_method,
    v_actual_sample_size,
    v_confidence_level,
    v_variance_score,
    v_variance_reaction_time,
    v_variance_accuracy,
    p_start_date,
    p_end_date,
    now()
  )
  ON CONFLICT (user_id, test_type)
  DO UPDATE SET
    baseline_score = EXCLUDED.baseline_score,
    baseline_reaction_time = EXCLUDED.baseline_reaction_time,
    baseline_accuracy = EXCLUDED.baseline_accuracy,
    calculation_method = EXCLUDED.calculation_method,
    sample_size = EXCLUDED.sample_size,
    confidence_level = EXCLUDED.confidence_level,
    variance_score = EXCLUDED.variance_score,
    variance_reaction_time = EXCLUDED.variance_reaction_time,
    variance_accuracy = EXCLUDED.variance_accuracy,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    updated_at = EXCLUDED.updated_at
  RETURNING id INTO v_result_id;
  
  -- Return the baseline data
  RETURN jsonb_build_object(
    'id', v_result_id,
    'baseline_score', v_baseline_score,
    'baseline_reaction_time', v_baseline_reaction_time,
    'baseline_accuracy', v_baseline_accuracy,
    'calculation_method', p_calculation_method,
    'sample_size', v_actual_sample_size,
    'confidence_level', v_confidence_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
