#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script checks for required tables in the Supabase database and creates them if they don't exist.
 * It can be run as a setup step to ensure proper database structure.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config();

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to check if tables exist
async function checkTables() {
  try {
    console.log("Checking if required tables exist...");

    // Use a raw SQL query to check if tables exist
    const { data, error } = await supabase.rpc("check_tables", {
      table_names: ["achievements", "user_achievements", "user_badges"],
    });

    // If RPC fails, try a direct query
    if (error) {
      console.log("RPC function not available, trying direct query...");

      // Try a simpler approach - just check if we can query the achievements table
      const { error: achievementsError } = await supabase
        .from("achievements")
        .select("id")
        .limit(1);

      if (achievementsError && achievementsError.code === "42P01") {
        // Table doesn't exist
        return {
          achievements: false,
          user_achievements: false,
          user_badges: false,
        };
      } else if (achievementsError) {
        console.error("Error checking achievements table:", achievementsError);
        return null;
      }

      // Check user_achievements table
      const { error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("id")
        .limit(1);

      // Check user_badges table
      const { error: userBadgesError } = await supabase
        .from("user_badges")
        .select("id")
        .limit(1);

      return {
        achievements: !achievementsError,
        user_achievements:
          !userAchievementsError || userAchievementsError.code !== "42P01",
        user_badges: !userBadgesError || userBadgesError.code !== "42P01",
      };
    }

    if (error) {
      console.error("Error checking tables:", error);
      return null;
    }

    const existingTables = data.map((row) => row.table_name);
    console.log("Existing tables:", existingTables);

    return {
      achievements: existingTables.includes("achievements"),
      user_achievements: existingTables.includes("user_achievements"),
      user_badges: existingTables.includes("user_badges"),
    };
  } catch (err) {
    console.error("Unexpected error checking tables:", err);
    return null;
  }
}

// Function to create missing tables
async function createMissingTables(existingTables) {
  try {
    console.log("Creating missing tables...");

    // Create achievements table if it doesn't exist
    if (!existingTables.achievements) {
      console.log("Creating achievements table...");

      const { error: achievementsError } = await supabase.rpc(
        "create_achievements_table",
      );

      if (achievementsError) {
        console.error("Error creating achievements table:", achievementsError);

        // Fallback to direct SQL if RPC fails
        const { error: sqlError } = await supabase.sql(`
          CREATE TABLE IF NOT EXISTS public.achievements (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            icon TEXT NOT NULL,
            required_count INTEGER NOT NULL,
            points INTEGER NOT NULL,
            trigger TEXT,
            metadata JSONB,
            secret BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);

        if (sqlError) {
          console.error(
            "Error creating achievements table with SQL:",
            sqlError,
          );
        } else {
          console.log("Successfully created achievements table with SQL");
        }
      } else {
        console.log("Successfully created achievements table with RPC");
      }
    }

    // Create user_achievements table if it doesn't exist
    if (!existingTables.user_achievements) {
      console.log("Creating user_achievements table...");

      const { error: userAchievementsError } = await supabase.rpc(
        "create_user_achievements_table",
      );

      if (userAchievementsError) {
        console.error(
          "Error creating user_achievements table:",
          userAchievementsError,
        );

        // Fallback to direct SQL if RPC fails
        const { error: sqlError } = await supabase.sql(`
          CREATE TABLE IF NOT EXISTS public.user_achievements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
            current_count INTEGER NOT NULL DEFAULT 0,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, achievement_id)
          );
        `);

        if (sqlError) {
          console.error(
            "Error creating user_achievements table with SQL:",
            sqlError,
          );
        } else {
          console.log("Successfully created user_achievements table with SQL");
        }
      } else {
        console.log("Successfully created user_achievements table with RPC");
      }
    }

    // Create user_badges table if it doesn't exist
    if (!existingTables.user_badges) {
      console.log("Creating user_badges table...");

      const { error: userBadgesError } = await supabase.rpc(
        "create_user_badges_table",
      );

      if (userBadgesError) {
        console.error("Error creating user_badges table:", userBadgesError);

        // Fallback to direct SQL if RPC fails
        const { error: sqlError } = await supabase.sql(`
          CREATE TABLE IF NOT EXISTS public.user_badges (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
            display_order INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, achievement_id),
            UNIQUE(user_id, display_order)
          );
        `);

        if (sqlError) {
          console.error("Error creating user_badges table with SQL:", sqlError);
        } else {
          console.log("Successfully created user_badges table with SQL");
        }
      } else {
        console.log("Successfully created user_badges table with RPC");
      }
    }

    console.log("Table creation completed");
  } catch (err) {
    console.error("Unexpected error creating tables:", err);
  }
}

// Main function
async function main() {
  try {
    console.log("Starting database check and setup...");

    // Check if tables exist
    const existingTables = await checkTables();

    if (!existingTables) {
      console.error("Failed to check tables, exiting");
      process.exit(1);
    }

    // Create missing tables
    await createMissingTables(existingTables);

    // Verify tables after creation
    const updatedTables = await checkTables();

    if (!updatedTables) {
      console.error("Failed to verify tables after creation, exiting");
      process.exit(1);
    }

    console.log("Database setup completed");
    console.log("Final table status:", updatedTables);

    process.exit(0);
  } catch (err) {
    console.error("Unexpected error in main function:", err);
    process.exit(1);
  }
}

// Run the main function
main();
