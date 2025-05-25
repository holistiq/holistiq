#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * This script validates that all required environment variables are set
 * before starting the development server or building the application.
 */

// Try to load dotenv, but don't fail if it's not available (e.g., in production)
try {
  const { config } = await import('dotenv');
  config();
} catch (error) {
  // dotenv not available, which is fine in production environments like Netlify
  console.log('ℹ️  dotenv not available, using environment variables directly');
  // In production environments, environment variables are set by the platform
}

// Required environment variables
const requiredEnvVars = [
  'VITE_APP_NAME',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

// Optional environment variables with defaults
const optionalEnvVars = {
  'NODE_ENV': 'development',
  'VITE_ENABLE_DEBUG_LOGGING': 'false'
};

let hasErrors = false;

console.log('🔍 Validating environment variables...\n');

// Check required variables
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  }
});

// Check optional variables and set defaults
Object.entries(optionalEnvVars).forEach(([varName, defaultValue]) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`ℹ️  ${varName}: using default value "${defaultValue}"`);
    process.env[varName] = defaultValue;
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

if (hasErrors) {
  console.error('\n❌ Environment validation failed. Please check your .env file.');
  console.error('Make sure all required environment variables are set.');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
}