-- Add display_name and avatar_url columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS avatar_url text;