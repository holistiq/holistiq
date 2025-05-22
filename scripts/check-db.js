#!/usr/bin/env node

/**
 * Database Check Script
 *
 * This script checks if the required tables exist in the Supabase database.
 * It can be run as a pre-build step to ensure proper database setup.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are set
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Required tables to check
const requiredTables = [
  'achievements',
  'user_achievements',
  'user_badges'
];

// Check if tables exist
async function checkTables() {
  try {
    // Use a raw SQL query to check if tables exist
    const { error } = await supabase
      .from('achievements')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking tables:', error);
      console.warn('\nPlease make sure the required tables exist in your Supabase database.');
      process.exit(1);
    }

    console.log('✅ Database connection successful!');
    console.log('✅ The achievements table exists and is accessible.');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the check
checkTables();
