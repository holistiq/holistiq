-- Migration to create a link between test results and confounding factors
-- This is part of the Confounding Factor Integration feature

-- Add a confounding_factor_id column to the test_results table
ALTER TABLE public.test_results
ADD COLUMN confounding_factor_id UUID REFERENCES public.confounding_factors(id);

-- Add an index for better query performance
CREATE INDEX test_results_confounding_factor_id_idx ON public.test_results (confounding_factor_id);

-- Add a comment
COMMENT ON COLUMN public.test_results.confounding_factor_id IS 'Reference to confounding factors logged for this test';

-- Create a function to link a test result with confounding factors
CREATE OR REPLACE FUNCTION link_test_confounding_factor(
  p_test_id UUID,
  p_confounding_factor_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  UPDATE public.test_results
  SET confounding_factor_id = p_confounding_factor_id
  WHERE id = p_test_id;
  
  GET DIAGNOSTICS v_success = ROW_COUNT;
  
  RETURN v_success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment
COMMENT ON FUNCTION link_test_confounding_factor IS 'Links a test result with confounding factors';

-- Create a function to get tests without confounding factors
CREATE OR REPLACE FUNCTION get_tests_without_confounding_factors(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(t)
  INTO v_result
  FROM (
    SELECT *
    FROM public.test_results
    WHERE user_id = p_user_id
    AND confounding_factor_id IS NULL
    ORDER BY timestamp DESC
    LIMIT p_limit
  ) t;
  
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment
COMMENT ON FUNCTION get_tests_without_confounding_factors IS 'Gets test results without linked confounding factors';
