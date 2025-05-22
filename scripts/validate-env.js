#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * This script validates that all required environment variables are present
 * for the current environment (development, production, etc.)
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

// Define required variables for different environments
const requiredVars = {
  // Variables required in all environments
  base: [
    'VITE_APP_NAME',
    'VITE_PUBLIC_SUPABASE_URL',
    'VITE_PUBLIC_SUPABASE_ANON_KEY',
  ],

  // Additional variables required in production
  production: [
    'SUPABASE_SERVICE_KEY',
    'VITE_APP_URL',
  ],

  // Additional variables required in development
  development: [],

  // Additional variables required in test environment
  test: []
};

// Determine current environment
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`Validating environment variables for ${NODE_ENV} environment...`);

// Get required variables for current environment
const varsToCheck = [
  ...requiredVars.base,
  ...(requiredVars[NODE_ENV] || [])
];

// Check for missing variables
const missing = varsToCheck.filter(varName => {
  const value = process.env[varName];
  return value === undefined || value === '';
});

// Report results
if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missing.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease check your .env file and try again.');
  process.exit(1);
}

console.log('✅ Environment validation passed!');
