#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * This script validates that all required environment variables are set.
 * It can be run as a pre-build step to ensure proper configuration.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Define required environment variables by category
const requiredVariables = {
  // Supabase configuration (client-side)
  supabase: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ],

  // AI features (optional as a group, but required if using AI)
  ai: [
    'ANTHROPIC_API_KEY',
    'MODEL',
    'MAX_TOKENS',
    'TEMPERATURE',
  ],

  // Core application settings
  core: [
    'NODE_ENV',
  ],
};

// Optional variables with default values
const optionalVariables = {
  'VITE_PORT': '8080',
  'DEBUG': 'false',
  'LOG_LEVEL': 'info',
  'DEFAULT_SUBTASKS': '5',
  'DEFAULT_PRIORITY': 'medium',
  'PERPLEXITY_API_KEY': null, // Truly optional
  'PERPLEXITY_MODEL': 'sonar-pro',
};

// Validation results
const missing = [];
const usingDefaults = [];

// Check required variables
Object.entries(requiredVariables).forEach(([category, vars]) => {
  const categoryMissing = vars.filter(varName => !process.env[varName]);

  if (categoryMissing.length > 0) {
    if (category === 'ai' && categoryMissing.length === vars.length) {
      // If all AI variables are missing, assume AI features are not being used
      console.warn('⚠️  AI features will be disabled (missing all AI environment variables)');
    } else {
      missing.push(...categoryMissing);
    }
  }
});

// Check optional variables and set defaults if needed
Object.entries(optionalVariables).forEach(([varName, defaultValue]) => {
  if (!process.env[varName] && defaultValue !== null) {
    process.env[varName] = defaultValue;
    usingDefaults.push(`${varName}=${defaultValue}`);
  }
});

// Report results
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these variables in your .env file or environment.');
  console.error('See .env.example for reference.');
  process.exit(1);
}

if (usingDefaults.length > 0) {
  console.warn('⚠️  Using default values for:');
  usingDefaults.forEach(defaultVar => {
    console.warn(`   - ${defaultVar}`);
  });
}

console.log('✅ Environment validation passed!');

// Additional security checks
if (process.env.NODE_ENV === 'production') {
  // Check for development-only variables in production
  const devOnlyVars = ['VITE_DEV_MODE', 'VITE_DEBUG'];
  const presentDevVars = devOnlyVars.filter(varName => process.env[varName]);

  if (presentDevVars.length > 0) {
    console.warn('⚠️  Development variables found in production environment:');
    presentDevVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
  }

  // Check for insecure settings
  if (process.env.DEBUG === 'true') {
    console.warn('⚠️  DEBUG is enabled in production environment');
  }
}

// Export for use in other scripts
export default {
  isValid: missing.length === 0,
  missing,
  usingDefaults,
};
