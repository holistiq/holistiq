-- Migration to create functions for analyzing correlations between confounding factors and test results
-- This is part of the Confounding Factor Tracking feature (item 2.3 from the Supplement Tracking Roadmap)

-- Create a function to analyze correlations between confounding factors and test results
CREATE OR REPLACE FUNCTION analyze_confounding_factors(
  p_user_id UUID,
  p_test_type TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_sleep_correlation JSONB;
  v_stress_correlation JSONB;
  v_exercise_correlation JSONB;
  v_caffeine_correlation JSONB;
  v_mood_correlation JSONB;
BEGIN
  -- Analyze sleep correlation
  SELECT 
    jsonb_build_object(
      'factor', 'sleep',
      'correlation', COALESCE(CORR(tr.score, cf.sleep_duration), 0),
      'quality_correlation', COALESCE(CORR(tr.score, cf.sleep_quality), 0),
      'sample_size', COUNT(*)
    ) INTO v_sleep_correlation
  FROM public.test_results tr
  JOIN public.confounding_factors cf 
    ON tr.user_id = cf.user_id 
    AND DATE_TRUNC('day', tr.timestamp) = DATE_TRUNC('day', cf.recorded_at)
  WHERE tr.user_id = p_user_id
    AND tr.test_type = p_test_type
    AND tr.timestamp BETWEEN p_start_date AND p_end_date;

  -- Analyze stress correlation
  SELECT 
    jsonb_build_object(
      'factor', 'stress',
      'correlation', COALESCE(CORR(tr.score, cf.stress_level), 0),
      'sample_size', COUNT(*)
    ) INTO v_stress_correlation
  FROM public.test_results tr
  JOIN public.confounding_factors cf 
    ON tr.user_id = cf.user_id 
    AND DATE_TRUNC('day', tr.timestamp) = DATE_TRUNC('day', cf.recorded_at)
  WHERE tr.user_id = p_user_id
    AND tr.test_type = p_test_type
    AND tr.timestamp BETWEEN p_start_date AND p_end_date;

  -- Analyze exercise correlation
  SELECT 
    jsonb_build_object(
      'factor', 'exercise',
      'duration_correlation', COALESCE(CORR(tr.score, cf.exercise_duration), 0),
      'intensity_correlation', COALESCE(CORR(tr.score, cf.exercise_intensity), 0),
      'sample_size', COUNT(*)
    ) INTO v_exercise_correlation
  FROM public.test_results tr
  JOIN public.confounding_factors cf 
    ON tr.user_id = cf.user_id 
    AND DATE_TRUNC('day', tr.timestamp) = DATE_TRUNC('day', cf.recorded_at)
  WHERE tr.user_id = p_user_id
    AND tr.test_type = p_test_type
    AND tr.timestamp BETWEEN p_start_date AND p_end_date;

  -- Analyze caffeine correlation
  SELECT 
    jsonb_build_object(
      'factor', 'caffeine',
      'correlation', COALESCE(CORR(tr.score, cf.caffeine_intake), 0),
      'sample_size', COUNT(*)
    ) INTO v_caffeine_correlation
  FROM public.test_results tr
  JOIN public.confounding_factors cf 
    ON tr.user_id = cf.user_id 
    AND DATE_TRUNC('day', tr.timestamp) = DATE_TRUNC('day', cf.recorded_at)
  WHERE tr.user_id = p_user_id
    AND tr.test_type = p_test_type
    AND tr.timestamp BETWEEN p_start_date AND p_end_date;

  -- Analyze mood correlation
  SELECT 
    jsonb_build_object(
      'factor', 'mood',
      'correlation', COALESCE(CORR(tr.score, cf.mood), 0),
      'energy_correlation', COALESCE(CORR(tr.score, cf.energy_level), 0),
      'sample_size', COUNT(*)
    ) INTO v_mood_correlation
  FROM public.test_results tr
  JOIN public.confounding_factors cf 
    ON tr.user_id = cf.user_id 
    AND DATE_TRUNC('day', tr.timestamp) = DATE_TRUNC('day', cf.recorded_at)
  WHERE tr.user_id = p_user_id
    AND tr.test_type = p_test_type
    AND tr.timestamp BETWEEN p_start_date AND p_end_date;

  -- Combine all correlations
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'test_type', p_test_type,
    'period_start', p_start_date,
    'period_end', p_end_date,
    'correlations', jsonb_build_array(
      v_sleep_correlation,
      v_stress_correlation,
      v_exercise_correlation,
      v_caffeine_correlation,
      v_mood_correlation
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get confounding factors for a specific test result
CREATE OR REPLACE FUNCTION get_test_confounding_factors(
  p_user_id UUID,
  p_test_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_test_timestamp TIMESTAMPTZ;
  v_factors JSONB;
BEGIN
  -- Get the test timestamp
  SELECT timestamp INTO v_test_timestamp
  FROM public.test_results
  WHERE id = p_test_id AND user_id = p_user_id;
  
  IF v_test_timestamp IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the confounding factors from the same day
  SELECT to_jsonb(cf) INTO v_factors
  FROM public.confounding_factors cf
  WHERE cf.user_id = p_user_id
    AND DATE_TRUNC('day', cf.recorded_at) = DATE_TRUNC('day', v_test_timestamp)
  ORDER BY ABS(EXTRACT(EPOCH FROM (cf.recorded_at - v_test_timestamp)))
  LIMIT 1;
  
  RETURN v_factors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION analyze_confounding_factors IS 'Analyzes correlations between confounding factors and test results';
COMMENT ON FUNCTION get_test_confounding_factors IS 'Gets confounding factors for a specific test result';
