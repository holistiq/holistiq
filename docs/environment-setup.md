# Environment Setup Guide

This guide explains how to set up your local development environment for the HolistiQ application.

## Environment Files

We use environment files to configure the application for different environments:

- `.env.local`: Local development environment (not committed to Git)
- `.env.example`: Example configuration with placeholder values (committed to Git)

## Local Development Setup

1. Copy the example environment file to create your local configuration:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in the actual values:

   ```
   # Application
   VITE_APP_NAME=HolistiQ
   VITE_APP_URL=http://localhost:8080
   VITE_APP_ENV=development

   # Supabase Configuration
   VITE_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key

   # Feature Flags
   VITE_FEATURE_MFA_ENABLED=false
   VITE_FEATURE_SOCIAL_SHARING=true

   # Analytics (client-side safe)
   VITE_ANALYTICS_TRACKING_ID=your-actual-tracking-id
   ```

3. For local development, you typically don't need the server-side only variables.

## Environment Variable Naming

- Variables prefixed with `VITE_` are exposed to the client-side code
- Variables without this prefix are only available during build time or server-side
- Never expose sensitive credentials with the `VITE_` prefix

## Adding New Environment Variables

When adding new environment variables:

1. Add the variable to `.env.example` with a placeholder value
2. Add the variable to your local `.env.local` file
3. Update the validation script if it's a required variable
4. Add the variable to Vercel for each environment (if needed for deployment)
5. Document the variable in this guide

## Troubleshooting

If you encounter the error "Missing required environment variables":

1. Check that all required variables are defined in your `.env.local` file
2. Ensure there are no typos in variable names
3. Restart your development server after making changes
