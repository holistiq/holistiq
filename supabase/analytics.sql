-- Analytics Table for tracking performance metrics and baselines
create table if not exists public.analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  baseline_test_id uuid references public.test_results(id),
  test_type text not null, -- e.g., 'n-back', 'reaction-time', etc.
  period_start timestamptz not null,
  period_end timestamptz not null,
  avg_score numeric,
  avg_reaction_time numeric,
  avg_accuracy numeric,
  score_delta numeric, -- difference from baseline
  reaction_time_delta numeric, -- difference from baseline
  accuracy_delta numeric, -- difference from baseline
  score_percent_change numeric, -- percentage change from baseline
  reaction_time_percent_change numeric, -- percentage change from baseline
  accuracy_percent_change numeric, -- percentage change from baseline
  sample_size integer not null default 1, -- number of tests included in this analysis
  metadata jsonb, -- additional analysis data
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for performance
create index if not exists analytics_user_id_idx on public.analytics(user_id);
create index if not exists analytics_test_type_idx on public.analytics(test_type);
create index if not exists analytics_period_idx on public.analytics(period_start, period_end);

-- Add unique constraint to prevent duplicate entries
alter table public.analytics add constraint analytics_user_test_period_unique
  unique (user_id, test_type, period_start, period_end);

-- Enable RLS
alter table public.analytics enable row level security;

-- Create policies
create policy "Users can view their own analytics"
  on public.analytics
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analytics"
  on public.analytics
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own analytics"
  on public.analytics
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own analytics"
  on public.analytics
  for delete
  using (auth.uid() = user_id);

-- Function to update the updated_at timestamp
create or replace function public.update_analytics_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update the updated_at timestamp
create trigger update_analytics_updated_at
  before update on public.analytics
  for each row execute procedure public.update_analytics_updated_at();

-- Function to calculate baseline and deltas
create or replace function public.calculate_analytics(
  p_user_id uuid,
  p_test_type text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns uuid as $$
declare
  v_baseline_test_id uuid;
  v_baseline_score numeric;
  v_baseline_reaction_time numeric;
  v_baseline_accuracy numeric;
  v_avg_score numeric;
  v_avg_reaction_time numeric;
  v_avg_accuracy numeric;
  v_score_delta numeric;
  v_reaction_time_delta numeric;
  v_accuracy_delta numeric;
  v_score_percent_change numeric;
  v_reaction_time_percent_change numeric;
  v_accuracy_percent_change numeric;
  v_sample_size integer;
  v_analytics_id uuid;
begin
  -- Get the baseline test (first test of this type for the user)
  select id, score, reaction_time, accuracy
  into v_baseline_test_id, v_baseline_score, v_baseline_reaction_time, v_baseline_accuracy
  from public.test_results
  where user_id = p_user_id and test_type = p_test_type
  order by timestamp asc
  limit 1;

  -- If no baseline test exists, return null
  if v_baseline_test_id is null then
    return null;
  end if;

  -- Calculate averages for the period
  select
    avg(score),
    avg(reaction_time),
    avg(accuracy),
    count(*)
  into
    v_avg_score,
    v_avg_reaction_time,
    v_avg_accuracy,
    v_sample_size
  from public.test_results
  where
    user_id = p_user_id
    and test_type = p_test_type
    and timestamp between p_period_start and p_period_end;

  -- If no tests in the period, return null
  if v_sample_size = 0 then
    return null;
  end if;

  -- Calculate deltas
  v_score_delta := v_avg_score - v_baseline_score;
  v_reaction_time_delta := v_avg_reaction_time - v_baseline_reaction_time;
  v_accuracy_delta := v_avg_accuracy - v_baseline_accuracy;

  -- Calculate percent changes
  if v_baseline_score != 0 then
    v_score_percent_change := (v_score_delta / v_baseline_score) * 100;
  end if;

  if v_baseline_reaction_time != 0 then
    v_reaction_time_percent_change := (v_reaction_time_delta / v_baseline_reaction_time) * 100;
  end if;

  if v_baseline_accuracy != 0 then
    v_accuracy_percent_change := (v_accuracy_delta / v_baseline_accuracy) * 100;
  end if;

  -- Insert or update analytics record
  insert into public.analytics (
    user_id,
    baseline_test_id,
    test_type,
    period_start,
    period_end,
    avg_score,
    avg_reaction_time,
    avg_accuracy,
    score_delta,
    reaction_time_delta,
    accuracy_delta,
    score_percent_change,
    reaction_time_percent_change,
    accuracy_percent_change,
    sample_size
  ) values (
    p_user_id,
    v_baseline_test_id,
    p_test_type,
    p_period_start,
    p_period_end,
    v_avg_score,
    v_avg_reaction_time,
    v_avg_accuracy,
    v_score_delta,
    v_reaction_time_delta,
    v_accuracy_delta,
    v_score_percent_change,
    v_reaction_time_percent_change,
    v_accuracy_percent_change,
    v_sample_size
  )
  on conflict (user_id, test_type, period_start, period_end)
  do update set
    avg_score = v_avg_score,
    avg_reaction_time = v_avg_reaction_time,
    avg_accuracy = v_avg_accuracy,
    score_delta = v_score_delta,
    reaction_time_delta = v_reaction_time_delta,
    accuracy_delta = v_accuracy_delta,
    score_percent_change = v_score_percent_change,
    reaction_time_percent_change = v_reaction_time_percent_change,
    accuracy_percent_change = v_accuracy_percent_change,
    sample_size = v_sample_size,
    updated_at = now()
  returning id into v_analytics_id;

  return v_analytics_id;
end;
$$ language plpgsql security definer;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all privileges on public.analytics to authenticated;
grant execute on function public.calculate_analytics to authenticated;
