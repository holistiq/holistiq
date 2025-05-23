-- Migration to add statistical significance calculation functions
-- This is part of the Statistical Significance Calculator feature (item 2.4 from the Supplement Tracking Roadmap)

-- Function to calculate t-statistic for paired samples
CREATE OR REPLACE FUNCTION calculate_t_statistic(
  sample1 NUMERIC[],
  sample2 NUMERIC[]
) RETURNS NUMERIC AS $$
DECLARE
  n INTEGER;
  mean_diff NUMERIC;
  std_dev_diff NUMERIC;
  t_stat NUMERIC;
  diff NUMERIC[];
  sum_diff NUMERIC := 0;
  sum_diff_squared NUMERIC := 0;
BEGIN
  -- Check if arrays have the same length
  IF array_length(sample1, 1) != array_length(sample2, 1) THEN
    RAISE EXCEPTION 'Samples must have the same length';
  END IF;
  
  n := array_length(sample1, 1);
  
  -- Calculate differences
  FOR i IN 1..n LOOP
    diff := array_append(diff, sample1[i] - sample2[i]);
  END LOOP;
  
  -- Calculate mean of differences
  FOR i IN 1..n LOOP
    sum_diff := sum_diff + diff[i];
  END LOOP;
  mean_diff := sum_diff / n;
  
  -- Calculate standard deviation of differences
  FOR i IN 1..n LOOP
    sum_diff_squared := sum_diff_squared + POWER(diff[i] - mean_diff, 2);
  END LOOP;
  std_dev_diff := SQRT(sum_diff_squared / (n - 1));
  
  -- Calculate t-statistic
  IF std_dev_diff = 0 THEN
    RETURN NULL; -- Cannot calculate t-statistic if std_dev is 0
  END IF;
  
  t_stat := mean_diff / (std_dev_diff / SQRT(n));
  
  RETURN t_stat;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate p-value from t-statistic
-- This is an approximation of the p-value calculation
CREATE OR REPLACE FUNCTION calculate_p_value(
  t_stat NUMERIC,
  degrees_of_freedom INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  p_value NUMERIC;
  x NUMERIC;
  a1 NUMERIC := 0.254829592;
  a2 NUMERIC := -0.284496736;
  a3 NUMERIC := 1.421413741;
  a4 NUMERIC := -1.453152027;
  a5 NUMERIC := 1.061405429;
  p NUMERIC := 0.3275911;
BEGIN
  -- Absolute value of t-statistic
  x := ABS(t_stat);
  
  -- Approximation of the cumulative distribution function
  -- This is a reasonable approximation for large degrees of freedom
  p_value := 1.0 / (1.0 + p * x * (a1 + x * (a2 + x * (a3 + x * (a4 + x * a5)))));
  p_value := p_value * EXP(-x * x / 2.0);
  
  -- Two-tailed p-value
  p_value := 2.0 * p_value;
  
  RETURN p_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine if a change is statistically significant
CREATE OR REPLACE FUNCTION is_statistically_significant(
  p_value NUMERIC,
  alpha NUMERIC DEFAULT 0.05
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_value <= alpha;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate effect size (Cohen's d)
CREATE OR REPLACE FUNCTION calculate_effect_size(
  mean1 NUMERIC,
  mean2 NUMERIC,
  std_dev1 NUMERIC,
  std_dev2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  pooled_std_dev NUMERIC;
  effect_size NUMERIC;
BEGIN
  -- Calculate pooled standard deviation
  pooled_std_dev := SQRT((POWER(std_dev1, 2) + POWER(std_dev2, 2)) / 2);
  
  -- Calculate effect size
  IF pooled_std_dev = 0 THEN
    RETURN NULL; -- Cannot calculate effect size if pooled_std_dev is 0
  END IF;
  
  effect_size := ABS(mean1 - mean2) / pooled_std_dev;
  
  RETURN effect_size;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to interpret effect size
CREATE OR REPLACE FUNCTION interpret_effect_size(
  effect_size NUMERIC
) RETURNS TEXT AS $$
BEGIN
  IF effect_size IS NULL THEN
    RETURN 'Unknown';
  ELSIF effect_size < 0.2 THEN
    RETURN 'Negligible';
  ELSIF effect_size < 0.5 THEN
    RETURN 'Small';
  ELSIF effect_size < 0.8 THEN
    RETURN 'Medium';
  ELSE
    RETURN 'Large';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to analyze statistical significance of test results
CREATE OR REPLACE FUNCTION analyze_statistical_significance(
  p_user_id UUID,
  p_test_type TEXT,
  p_baseline_period_start TIMESTAMPTZ,
  p_baseline_period_end TIMESTAMPTZ,
  p_comparison_period_start TIMESTAMPTZ,
  p_comparison_period_end TIMESTAMPTZ,
  p_alpha NUMERIC DEFAULT 0.05
) RETURNS JSONB AS $$
DECLARE
  v_baseline_scores NUMERIC[] := '{}';
  v_baseline_reaction_times NUMERIC[] := '{}';
  v_baseline_accuracies NUMERIC[] := '{}';
  v_comparison_scores NUMERIC[] := '{}';
  v_comparison_reaction_times NUMERIC[] := '{}';
  v_comparison_accuracies NUMERIC[] := '{}';
  v_baseline_mean_score NUMERIC;
  v_baseline_mean_reaction_time NUMERIC;
  v_baseline_mean_accuracy NUMERIC;
  v_comparison_mean_score NUMERIC;
  v_comparison_mean_reaction_time NUMERIC;
  v_comparison_mean_accuracy NUMERIC;
  v_baseline_std_dev_score NUMERIC;
  v_baseline_std_dev_reaction_time NUMERIC;
  v_baseline_std_dev_accuracy NUMERIC;
  v_comparison_std_dev_score NUMERIC;
  v_comparison_std_dev_reaction_time NUMERIC;
  v_comparison_std_dev_accuracy NUMERIC;
  v_t_stat_score NUMERIC;
  v_t_stat_reaction_time NUMERIC;
  v_t_stat_accuracy NUMERIC;
  v_p_value_score NUMERIC;
  v_p_value_reaction_time NUMERIC;
  v_p_value_accuracy NUMERIC;
  v_effect_size_score NUMERIC;
  v_effect_size_reaction_time NUMERIC;
  v_effect_size_accuracy NUMERIC;
  v_is_significant_score BOOLEAN;
  v_is_significant_reaction_time BOOLEAN;
  v_is_significant_accuracy BOOLEAN;
  v_baseline_sample_size INTEGER;
  v_comparison_sample_size INTEGER;
  v_result JSONB;
  v_test_record RECORD;
BEGIN
  -- Get baseline period test results
  FOR v_test_record IN 
    SELECT score, reaction_time, accuracy
    FROM public.test_results
    WHERE user_id = p_user_id
      AND test_type = p_test_type
      AND timestamp BETWEEN p_baseline_period_start AND p_baseline_period_end
    ORDER BY timestamp
  LOOP
    v_baseline_scores := array_append(v_baseline_scores, v_test_record.score);
    v_baseline_reaction_times := array_append(v_baseline_reaction_times, v_test_record.reaction_time);
    v_baseline_accuracies := array_append(v_baseline_accuracies, v_test_record.accuracy);
  END LOOP;
  
  -- Get comparison period test results
  FOR v_test_record IN 
    SELECT score, reaction_time, accuracy
    FROM public.test_results
    WHERE user_id = p_user_id
      AND test_type = p_test_type
      AND timestamp BETWEEN p_comparison_period_start AND p_comparison_period_end
    ORDER BY timestamp
  LOOP
    v_comparison_scores := array_append(v_comparison_scores, v_test_record.score);
    v_comparison_reaction_times := array_append(v_comparison_reaction_times, v_test_record.reaction_time);
    v_comparison_accuracies := array_append(v_comparison_accuracies, v_test_record.accuracy);
  END LOOP;
  
  -- Calculate sample sizes
  v_baseline_sample_size := array_length(v_baseline_scores, 1);
  v_comparison_sample_size := array_length(v_comparison_scores, 1);
  
  -- Check if we have enough data
  IF v_baseline_sample_size < 3 OR v_comparison_sample_size < 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient data for statistical analysis. Need at least 3 data points in each period.',
      'baseline_sample_size', v_baseline_sample_size,
      'comparison_sample_size', v_comparison_sample_size
    );
  END IF;
  
  -- Calculate means
  SELECT AVG(score), AVG(reaction_time), AVG(accuracy),
         STDDEV(score), STDDEV(reaction_time), STDDEV(accuracy)
  INTO v_baseline_mean_score, v_baseline_mean_reaction_time, v_baseline_mean_accuracy,
       v_baseline_std_dev_score, v_baseline_std_dev_reaction_time, v_baseline_std_dev_accuracy
  FROM unnest(v_baseline_scores, v_baseline_reaction_times, v_baseline_accuracies) AS t(score, reaction_time, accuracy);
  
  SELECT AVG(score), AVG(reaction_time), AVG(accuracy),
         STDDEV(score), STDDEV(reaction_time), STDDEV(accuracy)
  INTO v_comparison_mean_score, v_comparison_mean_reaction_time, v_comparison_mean_accuracy,
       v_comparison_std_dev_score, v_comparison_std_dev_reaction_time, v_comparison_std_dev_accuracy
  FROM unnest(v_comparison_scores, v_comparison_reaction_times, v_comparison_accuracies) AS t(score, reaction_time, accuracy);
  
  -- Calculate effect sizes
  v_effect_size_score := calculate_effect_size(
    v_baseline_mean_score, v_comparison_mean_score,
    v_baseline_std_dev_score, v_comparison_std_dev_score
  );
  
  v_effect_size_reaction_time := calculate_effect_size(
    v_baseline_mean_reaction_time, v_comparison_mean_reaction_time,
    v_baseline_std_dev_reaction_time, v_comparison_std_dev_reaction_time
  );
  
  v_effect_size_accuracy := calculate_effect_size(
    v_baseline_mean_accuracy, v_comparison_mean_accuracy,
    v_baseline_std_dev_accuracy, v_comparison_std_dev_accuracy
  );
  
  -- For independent samples t-test, we would need to implement a different approach
  -- This is a simplified version that assumes independent samples
  -- In a real-world scenario, we would use a proper statistical library
  
  -- Calculate degrees of freedom (simplified)
  DECLARE
    v_df INTEGER := v_baseline_sample_size + v_comparison_sample_size - 2;
  BEGIN
    -- Calculate t-statistics (simplified)
    v_t_stat_score := (v_comparison_mean_score - v_baseline_mean_score) / 
                      SQRT((POWER(v_baseline_std_dev_score, 2) / v_baseline_sample_size) + 
                           (POWER(v_comparison_std_dev_score, 2) / v_comparison_sample_size));
    
    v_t_stat_reaction_time := (v_comparison_mean_reaction_time - v_baseline_mean_reaction_time) / 
                              SQRT((POWER(v_baseline_std_dev_reaction_time, 2) / v_baseline_sample_size) + 
                                   (POWER(v_comparison_std_dev_reaction_time, 2) / v_comparison_sample_size));
    
    v_t_stat_accuracy := (v_comparison_mean_accuracy - v_baseline_mean_accuracy) / 
                         SQRT((POWER(v_baseline_std_dev_accuracy, 2) / v_baseline_sample_size) + 
                              (POWER(v_comparison_std_dev_accuracy, 2) / v_comparison_sample_size));
    
    -- Calculate p-values
    v_p_value_score := calculate_p_value(v_t_stat_score, v_df);
    v_p_value_reaction_time := calculate_p_value(v_t_stat_reaction_time, v_df);
    v_p_value_accuracy := calculate_p_value(v_t_stat_accuracy, v_df);
    
    -- Determine statistical significance
    v_is_significant_score := is_statistically_significant(v_p_value_score, p_alpha);
    v_is_significant_reaction_time := is_statistically_significant(v_p_value_reaction_time, p_alpha);
    v_is_significant_accuracy := is_statistically_significant(v_p_value_accuracy, p_alpha);
  END;
  
  -- Build result object
  v_result := jsonb_build_object(
    'success', true,
    'baseline_period', jsonb_build_object(
      'start', p_baseline_period_start,
      'end', p_baseline_period_end,
      'sample_size', v_baseline_sample_size,
      'mean_score', v_baseline_mean_score,
      'mean_reaction_time', v_baseline_mean_reaction_time,
      'mean_accuracy', v_baseline_mean_accuracy,
      'std_dev_score', v_baseline_std_dev_score,
      'std_dev_reaction_time', v_baseline_std_dev_reaction_time,
      'std_dev_accuracy', v_baseline_std_dev_accuracy
    ),
    'comparison_period', jsonb_build_object(
      'start', p_comparison_period_start,
      'end', p_comparison_period_end,
      'sample_size', v_comparison_sample_size,
      'mean_score', v_comparison_mean_score,
      'mean_reaction_time', v_comparison_mean_reaction_time,
      'mean_accuracy', v_comparison_mean_accuracy,
      'std_dev_score', v_comparison_std_dev_score,
      'std_dev_reaction_time', v_comparison_std_dev_reaction_time,
      'std_dev_accuracy', v_comparison_std_dev_accuracy
    ),
    'significance_analysis', jsonb_build_object(
      'score', jsonb_build_object(
        't_statistic', v_t_stat_score,
        'p_value', v_p_value_score,
        'is_significant', v_is_significant_score,
        'effect_size', v_effect_size_score,
        'effect_size_interpretation', interpret_effect_size(v_effect_size_score),
        'change_percent', ((v_comparison_mean_score - v_baseline_mean_score) / NULLIF(v_baseline_mean_score, 0)) * 100
      ),
      'reaction_time', jsonb_build_object(
        't_statistic', v_t_stat_reaction_time,
        'p_value', v_p_value_reaction_time,
        'is_significant', v_is_significant_reaction_time,
        'effect_size', v_effect_size_reaction_time,
        'effect_size_interpretation', interpret_effect_size(v_effect_size_reaction_time),
        'change_percent', ((v_comparison_mean_reaction_time - v_baseline_mean_reaction_time) / NULLIF(v_baseline_mean_reaction_time, 0)) * 100
      ),
      'accuracy', jsonb_build_object(
        't_statistic', v_t_stat_accuracy,
        'p_value', v_p_value_accuracy,
        'is_significant', v_is_significant_accuracy,
        'effect_size', v_effect_size_accuracy,
        'effect_size_interpretation', interpret_effect_size(v_effect_size_accuracy),
        'change_percent', ((v_comparison_mean_accuracy - v_baseline_mean_accuracy) / NULLIF(v_baseline_mean_accuracy, 0)) * 100
      ),
      'alpha', p_alpha
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION calculate_t_statistic IS 'Calculates t-statistic for paired samples';
COMMENT ON FUNCTION calculate_p_value IS 'Calculates p-value from t-statistic (approximation)';
COMMENT ON FUNCTION is_statistically_significant IS 'Determines if a p-value indicates statistical significance';
COMMENT ON FUNCTION calculate_effect_size IS 'Calculates effect size (Cohen''s d)';
COMMENT ON FUNCTION interpret_effect_size IS 'Interprets effect size magnitude';
COMMENT ON FUNCTION analyze_statistical_significance IS 'Analyzes statistical significance of cognitive test results';
