-- Test Results Table for cognitive assessments
create table if not exists public.test_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  test_type text not null, -- e.g., 'n-back', 'reaction-time', etc.
  timestamp timestamptz not null default now(),
  score integer not null,
  reaction_time integer, -- in milliseconds
  accuracy integer, -- percentage
  raw_data jsonb, -- store detailed test data
  environmental_factors jsonb -- optional context data
);

-- Enable RLS
alter table public.test_results enable row level security;

-- Create policies
create policy "Users can view their own test results"
  on public.test_results
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own test results"
  on public.test_results
  for insert
  with check (auth.uid() = user_id);