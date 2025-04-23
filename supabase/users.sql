-- User Profiles Table for Supabase
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  settings jsonb,
  -- Add more profile fields as needed
  constraint email_unique unique(email)
);

-- Ensure encryption at rest via Supabase configuration (handled by platform)
-- For sensitive fields, consider using additional encryption functions if needed
