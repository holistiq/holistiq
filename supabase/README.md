# Supabase Database Scripts

This directory contains SQL scripts for managing the HolistiQ database schema in Supabase.

## Directory Structure

- `/migrations`: Contains database migration scripts that define the schema structure
- `/seed`: Contains scripts to populate the database with initial data
- `/functions`: Contains PostgreSQL functions and triggers
- `/diagnostics`: Contains diagnostic scripts for checking schema integrity

## Migration Scripts

Migration scripts should be run in order based on their timestamp prefixes. Each script is designed to be idempotent (can be run multiple times without causing issues).

### Naming Convention

Migration scripts follow this naming pattern:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

For example: `20230801000000_create_achievement_tables.sql`

### Available Migrations

| Script | Description | Dependencies |
|--------|-------------|--------------|
| `20230801000000_create_achievement_tables.sql` | Creates tables for the achievement system | None |
| `20230801000200_create_social_shares_table.sql` | Creates table for tracking social media shares | None |
| `20250514142026_supplement_schema_update.sql` | Updates the supplement schema | None |
| `20250701000000_create_user_badges.sql` | Creates the user_badges table | None |
| `20250702000000_add_updated_at_to_user_badges.sql` | Adds updated_at column to user_badges | `20250701000000_create_user_badges.sql` |

## Seed Scripts

Seed scripts populate the database with initial data. They should be run after the corresponding migration scripts.

### Available Seed Scripts

| Script | Description | Dependencies |
|--------|-------------|--------------|
| `20230801000100_seed_achievements.sql` | Populates the achievements table with initial data | `20230801000000_create_achievement_tables.sql` |

## Diagnostic Scripts

Diagnostic scripts are used to check the integrity of the database schema without modifying any data.

### Available Diagnostic Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `check_achievement_schema.sql` | Checks if the achievements-related tables have the correct schema | Run to diagnose schema issues |

## Running Scripts

### Using Supabase CLI

If you're using the Supabase CLI, migrations will be applied automatically when you run:

```bash
supabase db reset
```

### Manual Execution

To run scripts manually:

1. Connect to your Supabase PostgreSQL database
2. Execute the scripts in order using a SQL client

```bash
psql -h <host> -p <port> -d <database> -U <user> -f <script_path>
```

## Row Level Security (RLS) Policies

The migration scripts include Row Level Security policies to ensure data security. Here's a summary of the RLS policies:

### achievements Table

- SELECT: Authenticated users can view all achievements

### user_achievements Table

- SELECT: Users can only view their own achievements
- INSERT: Users can only insert their own achievements
- UPDATE: Users can only update their own achievements
- DELETE: Users can only delete their own achievements

### user_badges Table

- SELECT: Users can only view their own badges
- INSERT: Users can only insert their own badges
- UPDATE: Users can only update their own badges
- DELETE: Users can only delete their own badges

### user_achievements_metadata Table

- SELECT: Users can only view their own achievement metadata
- INSERT: Users can only insert their own achievement metadata
- UPDATE: Users can only update their own achievement metadata
- DELETE: Users can only delete their own achievement metadata

## Schema Documentation

### achievements Table

Stores the definitions of all achievements that users can earn in the application.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Title of the achievement |
| description | TEXT | Detailed description of the achievement |
| category | TEXT | Category of the achievement (e.g., "Test", "Supplement") |
| difficulty | TEXT | Difficulty level of the achievement |
| required_count | INTEGER | Number of times the action must be performed |
| points | INTEGER | Points awarded for earning the achievement |
| icon | TEXT | Icon identifier for the achievement |
| badge_url | TEXT | URL to the badge image |
| created_at | TIMESTAMPTZ | When the achievement was created |
| updated_at | TIMESTAMPTZ | When the achievement was last updated |
| trigger | TEXT | Identifier for the event that triggers this achievement |

### user_achievements Table

Tracks the progress of users toward earning achievements.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to the user |
| achievement_id | UUID | Reference to the achievement |
| current_count | INTEGER | Current progress toward the required count |
| completed_at | TIMESTAMPTZ | When the achievement was completed |
| created_at | TIMESTAMPTZ | When the record was created |
| updated_at | TIMESTAMPTZ | When the record was last updated |

### user_badges Table

Tracks which achievements users have chosen to display as badges on their profile.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to the user |
| achievement_id | UUID | Reference to the achievement being displayed |
| display_order | INTEGER | Order in which to display the badge |
| created_at | TIMESTAMPTZ | When the record was created |
| updated_at | TIMESTAMPTZ | When the record was last updated |

### user_achievements_metadata Table

Stores additional metadata related to user achievements.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to the user |
| achievement_id | UUID | Reference to the achievement |
| metadata_key | TEXT | Key for the metadata |
| metadata_value | TEXT | Value for the metadata |
| created_at | TIMESTAMPTZ | When the record was created |
