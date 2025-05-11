-- Supplements Table for tracking intake
create table if not exists public.supplements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  dosage text not null,
  intake_time timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.supplements enable row level security;

-- Create policies
create policy "Users can view their own supplements"
  on public.supplements
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own supplements"
  on public.supplements
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own supplements"
  on public.supplements
  for update
  using (auth.uid() = user_id);