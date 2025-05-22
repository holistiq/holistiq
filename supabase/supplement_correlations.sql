-- Supplement Correlations Table for tracking relationships between supplements and cognitive performance
create table if not exists public.supplement_correlations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  test_type text not null, -- e.g., 'n-back', 'reaction-time', etc.
  analysis_period_start timestamptz not null,
  analysis_period_end timestamptz not null,
  onset_delay_days integer not null default 0, -- expected days until supplement takes effect
  cumulative_effect_threshold integer not null default 7, -- days of consistent use needed for full effect
  
  -- Performance metrics
  score_impact numeric, -- positive means improvement, negative means decline
  reaction_time_impact numeric, -- negative means improvement (faster), positive means decline
  accuracy_impact numeric, -- positive means improvement, negative means decline
  
  -- Statistical significance
  confidence_level numeric, -- 0-1 value representing statistical confidence
  sample_size integer not null default 0, -- number of tests included in analysis
  
  -- Metadata
  analysis_parameters jsonb, -- stores additional analysis parameters
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists supplement_correlations_user_id_idx on public.supplement_correlations(user_id);
create index if not exists supplement_correlations_supplement_id_idx on public.supplement_correlations(supplement_id);
create index if not exists supplement_correlations_period_idx on public.supplement_correlations(analysis_period_start, analysis_period_end);

-- Enable RLS
alter table public.supplement_correlations enable row level security;

-- Create policies
create policy "Users can view their own supplement correlations"
  on public.supplement_correlations
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own supplement correlations"
  on public.supplement_correlations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own supplement correlations"
  on public.supplement_correlations
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own supplement correlations"
  on public.supplement_correlations
  for delete
  using (auth.uid() = user_id);

-- Function to calculate supplement correlation
create or replace function public.calculate_supplement_correlation(
  p_user_id uuid,
  p_supplement_id uuid,
  p_test_type text,
  p_onset_delay_days integer default 0,
  p_cumulative_effect_threshold integer default 7,
  p_analysis_period_start timestamptz default null,
  p_analysis_period_end timestamptz default null
)
returns uuid as $$
declare
  v_supplement_name text;
  v_supplement_intake_time timestamptz;
  v_analysis_period_start timestamptz;
  v_analysis_period_end timestamptz;
  v_baseline_score numeric;
  v_baseline_reaction_time numeric;
  v_baseline_accuracy numeric;
  v_avg_score_before numeric;
  v_avg_reaction_time_before numeric;
  v_avg_accuracy_before numeric;
  v_avg_score_after numeric;
  v_avg_reaction_time_after numeric;
  v_avg_accuracy_after numeric;
  v_score_impact numeric;
  v_reaction_time_impact numeric;
  v_accuracy_impact numeric;
  v_confidence_level numeric;
  v_sample_size_before integer;
  v_sample_size_after integer;
  v_correlation_id uuid;
begin
  -- Get supplement details
  select name, intake_time
  into v_supplement_name, v_supplement_intake_time
  from public.supplements
  where id = p_supplement_id and user_id = p_user_id;
  
  if v_supplement_name is null then
    raise exception 'Supplement not found';
  end if;
  
  -- Set analysis period if not provided
  if p_analysis_period_start is null then
    v_analysis_period_start := v_supplement_intake_time - interval '30 days';
  else
    v_analysis_period_start := p_analysis_period_start;
  end if;
  
  if p_analysis_period_end is null then
    v_analysis_period_end := v_supplement_intake_time + interval '30 days';
  else
    v_analysis_period_end := p_analysis_period_end;
  end if;
  
  -- Calculate the effective date when the supplement should start showing effects
  -- based on the onset delay
  declare
    v_effective_date timestamptz := v_supplement_intake_time + (p_onset_delay_days || ' days')::interval;
  begin
    -- Get baseline metrics (first test of this type for the user)
    select avg(score), avg(reaction_time), avg(accuracy)
    into v_baseline_score, v_baseline_reaction_time, v_baseline_accuracy
    from public.test_results
    where user_id = p_user_id and test_type = p_test_type
    order by timestamp asc
    limit 1;
    
    -- Get average metrics before supplement intake (adjusted for onset delay)
    select avg(score), avg(reaction_time), avg(accuracy), count(*)
    into v_avg_score_before, v_avg_reaction_time_before, v_avg_accuracy_before, v_sample_size_before
    from public.test_results
    where user_id = p_user_id 
      and test_type = p_test_type
      and timestamp >= v_analysis_period_start
      and timestamp < v_effective_date;
    
    -- Get average metrics after supplement intake (adjusted for onset delay)
    select avg(score), avg(reaction_time), avg(accuracy), count(*)
    into v_avg_score_after, v_avg_reaction_time_after, v_avg_accuracy_after, v_sample_size_after
    from public.test_results
    where user_id = p_user_id 
      and test_type = p_test_type
      and timestamp >= v_effective_date
      and timestamp <= v_analysis_period_end;
    
    -- Calculate impact (change from before to after)
    -- For score and accuracy, positive is better
    -- For reaction time, negative is better (faster)
    v_score_impact := coalesce(v_avg_score_after, 0) - coalesce(v_avg_score_before, 0);
    v_reaction_time_impact := coalesce(v_avg_reaction_time_after, 0) - coalesce(v_avg_reaction_time_before, 0);
    v_accuracy_impact := coalesce(v_avg_accuracy_after, 0) - coalesce(v_avg_accuracy_before, 0);
    
    -- Simple confidence calculation based on sample size
    -- In a real implementation, this would use proper statistical methods
    v_confidence_level := least(1.0, (v_sample_size_before + v_sample_size_after) / 10.0);
    
    -- Insert or update correlation record
    insert into public.supplement_correlations (
      user_id,
      supplement_id,
      test_type,
      analysis_period_start,
      analysis_period_end,
      onset_delay_days,
      cumulative_effect_threshold,
      score_impact,
      reaction_time_impact,
      accuracy_impact,
      confidence_level,
      sample_size,
      analysis_parameters
    ) values (
      p_user_id,
      p_supplement_id,
      p_test_type,
      v_analysis_period_start,
      v_analysis_period_end,
      p_onset_delay_days,
      p_cumulative_effect_threshold,
      v_score_impact,
      v_reaction_time_impact,
      v_accuracy_impact,
      v_confidence_level,
      v_sample_size_before + v_sample_size_after,
      jsonb_build_object(
        'baseline_score', v_baseline_score,
        'baseline_reaction_time', v_baseline_reaction_time,
        'baseline_accuracy', v_baseline_accuracy,
        'avg_score_before', v_avg_score_before,
        'avg_reaction_time_before', v_avg_reaction_time_before,
        'avg_accuracy_before', v_avg_accuracy_before,
        'avg_score_after', v_avg_score_after,
        'avg_reaction_time_after', v_avg_reaction_time_after,
        'avg_accuracy_after', v_avg_accuracy_after,
        'sample_size_before', v_sample_size_before,
        'sample_size_after', v_sample_size_after,
        'effective_date', v_effective_date
      )
    )
    on conflict (user_id, supplement_id, test_type, analysis_period_start, analysis_period_end)
    do update set
      onset_delay_days = p_onset_delay_days,
      cumulative_effect_threshold = p_cumulative_effect_threshold,
      score_impact = v_score_impact,
      reaction_time_impact = v_reaction_time_impact,
      accuracy_impact = v_accuracy_impact,
      confidence_level = v_confidence_level,
      sample_size = v_sample_size_before + v_sample_size_after,
      analysis_parameters = jsonb_build_object(
        'baseline_score', v_baseline_score,
        'baseline_reaction_time', v_baseline_reaction_time,
        'baseline_accuracy', v_baseline_accuracy,
        'avg_score_before', v_avg_score_before,
        'avg_reaction_time_before', v_avg_reaction_time_before,
        'avg_accuracy_before', v_avg_accuracy_before,
        'avg_score_after', v_avg_score_after,
        'avg_reaction_time_after', v_avg_reaction_time_after,
        'avg_accuracy_after', v_avg_accuracy_after,
        'sample_size_before', v_sample_size_before,
        'sample_size_after', v_sample_size_after,
        'effective_date', v_effective_date
      ),
      updated_at = now()
    returning id into v_correlation_id;
    
    return v_correlation_id;
  end;
end;
$$ language plpgsql security definer;

-- Add unique constraint to prevent duplicate entries
alter table public.supplement_correlations add constraint supplement_correlations_unique
  unique (user_id, supplement_id, test_type, analysis_period_start, analysis_period_end);

comment on table public.supplement_correlations is 'Stores correlation analysis between supplements and cognitive test performance';
