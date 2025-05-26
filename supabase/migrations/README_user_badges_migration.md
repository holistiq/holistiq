# User Badges Migration

This document provides instructions on how to apply the user_badges table migration to your Supabase project.

## Migration Script

The migration script `20250701000000_create_user_badges.sql` creates the `user_badges` table with appropriate columns, constraints, indexes, and Row Level Security (RLS) policies.

## Table Structure

The `user_badges` table has the following structure:

| Column         | Type                     | Description                         |
| -------------- | ------------------------ | ----------------------------------- |
| id             | UUID                     | Primary key                         |
| user_id        | UUID                     | Foreign key to auth.users(id)       |
| achievement_id | TEXT                     | Foreign key to achievements(id)     |
| display_order  | INTEGER                  | Order in which badges are displayed |
| created_at     | TIMESTAMP WITH TIME ZONE | Creation timestamp                  |
| updated_at     | TIMESTAMP WITH TIME ZONE | Last update timestamp               |

## Constraints

- Primary key on `id`
- Foreign key from `user_id` to `auth.users(id)` with CASCADE on delete
- Foreign key from `achievement_id` to `public.achievements(id)` with CASCADE on delete
- Unique constraint on `(user_id, achievement_id)` to prevent duplicate badges
- Unique constraint on `(user_id, display_order)` to ensure display order is unique per user

## Indexes

- Index on `user_id` for faster queries filtering by user
- Index on `achievement_id` for faster queries filtering by achievement

## Row Level Security (RLS) Policies

The table has the following RLS policies:

1. Users can view their own badges
2. Users can insert their own badges
3. Users can update their own badges
4. Users can delete their own badges

## Applying the Migration

### Option 1: Using Supabase CLI

If you're using the Supabase CLI, you can apply the migration with:

```bash
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the migration file
5. Run the query

### Option 3: Using Supabase Management API

You can also apply the migration using the Supabase Management API:

```bash
curl -X POST 'https://api.supabase.com/v1/projects/{project_id}/database/query' \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "query": "-- Contents of the migration file here"
  }'
```

## Verification

After applying the migration, you can verify that the table was created correctly by:

1. Checking the table structure in the Supabase dashboard
2. Running a test query to insert and select data from the table
3. Verifying that the RLS policies are working as expected

## Troubleshooting

If you encounter any issues:

1. Check if the table already exists
2. Verify that the `achievements` table exists and has the correct structure
3. Ensure that the UUID extension is enabled
4. Check for any error messages in the Supabase logs

## Related Tables

The `user_badges` table is related to:

- `auth.users`: Contains user authentication information
- `public.achievements`: Contains achievement definitions
- `public.user_achievements`: Tracks user progress towards achievements
