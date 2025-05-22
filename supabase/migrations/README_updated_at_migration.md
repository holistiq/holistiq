# User Badges Updated_at Migration

This document provides instructions on how to apply the migration that adds the `updated_at` timestamp column to the `user_badges` table and improves database documentation.

## Migration Script

The migration script `20250702000000_add_updated_at_to_user_badges.sql` performs the following actions:

1. Adds an `updated_at` timestamp column to the `user_badges` table if it doesn't already exist
2. Creates or replaces a function to update the timestamp automatically
3. Creates a trigger to call this function whenever a record is updated
4. Creates a helper function to safely add comments only to columns that exist
5. Adds descriptive comments to all tables and columns for better documentation

## Checking Table Schema

Before applying comments to database tables, it's important to verify the actual schema. Here are ways to check the schema:

### Using Supabase CLI

```bash
# Check the schema of a specific table
supabase db execute "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'achievements' ORDER BY ordinal_position;"
```

### Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the Table Editor
3. Select the table you want to inspect
4. Click on "Schema" to view the table structure

### Using Supabase Management API

```bash
curl -X POST 'https://api.supabase.com/v1/projects/{project_id}/database/query' \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "query": "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '\''public'\'' AND table_name = '\''achievements'\'' ORDER BY ordinal_position;"
  }'
```

## Benefits

This migration provides several benefits:

1. **Consistent Timestamp Tracking**: Ensures the `user_badges` table has the same timestamp tracking as other tables
2. **Automatic Updates**: The trigger automatically updates the timestamp whenever a record is modified
3. **Improved Documentation**: Comprehensive comments make the database schema more understandable
4. **Better Maintainability**: Well-documented schemas are easier to maintain and extend

## Applying the Migration

### Option 1: Using Supabase CLI

If you're using the Supabase CLI, you can apply the migration with:

```bash
supabase db push --include-all
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

## Safely Re-running the Migration

This migration script is designed to be idempotent, meaning it can be safely run multiple times without causing errors or duplicate data. The script:

1. Checks if the `updated_at` column already exists before adding it
2. Uses `CREATE OR REPLACE FUNCTION` for the trigger function
3. Checks if the trigger already exists before creating it
4. Uses a helper function `safe_comment_on_column` that only adds comments to columns that exist

If you need to re-run the migration after fixing an issue:

### Using Supabase CLI

```bash
# First, check the migration status
supabase db reset

# Then apply the migration again
supabase db push --include-all
```

### Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the fixed migration file
5. Run the query

### Handling Partial Migrations

If a migration partially completed before encountering an error:

1. The `updated_at` column may already be added to the `user_badges` table
2. Some table comments may already be applied
3. The trigger function and trigger may already be created

This is not a problem, as the script checks for existing objects before creating them.

## Verification

After applying the migration, you can verify that it was successful by:

1. Checking if the `updated_at` column exists in the `user_badges` table:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name = 'user_badges'
   AND column_name = 'updated_at';
   ```

2. Verifying that the trigger exists:
   ```sql
   SELECT tgname
   FROM pg_trigger
   WHERE tgrelid = 'public.user_badges'::regclass
   AND tgname = 'update_user_badges_updated_at';
   ```

3. Testing that the trigger works by updating a record and checking if the `updated_at` timestamp changes:
   ```sql
   -- First, note the current updated_at value
   SELECT id, updated_at FROM public.user_badges LIMIT 1;

   -- Update a record
   UPDATE public.user_badges
   SET display_order = display_order
   WHERE id = 'the-id-from-previous-query';

   -- Check if updated_at changed
   SELECT id, updated_at FROM public.user_badges WHERE id = 'the-id-from-previous-query';
   ```

## Troubleshooting

If you encounter any issues:

1. Check if the `updated_at` column already exists
2. Verify that you have the necessary permissions to modify the table
3. Check for any error messages in the Supabase logs
4. Ensure that the trigger function `update_updated_at_column` is created successfully

## Related Tables

The `user_badges` table is related to:

- `auth.users`: Contains user authentication information
- `public.achievements`: Contains achievement definitions
