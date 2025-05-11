-- User Profiles Table for Supabase
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  settings jsonb,
  constraint email_unique unique(email)
);

-- Create a trigger to automatically create a user profile when a new auth user is created
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies
-- Allow users to view their own data
create policy "Users can view their own data"
  on public.users
  for select
  using (auth.uid() = id);

-- Allow users to update their own data
create policy "Users can update their own data"
  on public.users
  for update
  using (auth.uid() = id);

-- Allow authenticated users to see the count of users
create policy "Authenticated users can see count of users"
  on public.users
  for select
  using (auth.role() = 'authenticated');

-- Allow anonymous users to see count of users (for testing)
create policy "Anonymous users can see count of users"
  on public.users
  for select
  using (auth.role() = 'anon');
