# Vercel Deployment Guide

This guide explains how our HolistiQ application is deployed using Vercel.

## Deployment Overview

We use a continuous deployment approach with Vercel:

- `main` branch → Production environment (holistiq.com)
- `develop` branch → Staging environment (staging.holistiq.com)
- Pull Requests → Preview deployments (pr-123.holistiq.vercel.app)

## Setting Up Vercel (First-time Setup)

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New..." > "Project"
3. Select your GitHub repository from the list
4. Configure the project settings:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
5. Click "Deploy" to create the project

## Environment Variables in Vercel

### Adding Environment Variables

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable:
   - Name: The variable name (e.g., `SUPABASE_SERVICE_KEY`)
   - Value: The variable value
   - Environment: Select which environments should use this variable

### Required Environment Variables

The following environment variables must be configured in Vercel:

#### Production Environment Variables:
- `VITE_APP_NAME`: HolistiQ
- `VITE_APP_URL`: https://holistiq.com (or your production URL)
- `VITE_APP_ENV`: production
- `VITE_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `VITE_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_KEY`: Your Supabase service key

#### Preview Environment Variables (for develop branch and PRs):
- `VITE_APP_NAME`: HolistiQ Staging
- `VITE_APP_URL`: https://staging.holistiq.com (or your staging URL)
- `VITE_APP_ENV`: staging
- `VITE_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `VITE_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_KEY`: Your Supabase service key

#### Development Environment Variables (for local development):
- `VITE_APP_NAME`: HolistiQ Dev
- `VITE_APP_URL`: http://localhost:8080
- `VITE_APP_ENV`: development
- `VITE_PUBLIC_SUPABASE_URL`: Your Supabase URL
- `VITE_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

### Environment-Specific Variables

For variables that should have different values in different environments:

1. Add the same variable multiple times
2. For each entry, select a specific environment (Production, Preview, or Development)
3. Provide the appropriate value for each environment

## Deployment Process

### Automatic Deployments

- Pushing to `main` → Automatic production deployment
- Pushing to `develop` → Automatic staging deployment
- Opening a PR → Automatic preview deployment

### Manual Deployments

If needed, you can trigger a manual deployment:

1. Go to your project in the Vercel dashboard
2. Click "Deployments" in the top navigation
3. Click "Deploy" button in the top-right corner
4. Select the branch to deploy

## Monitoring Deployments

1. Go to your project in the Vercel dashboard
2. The "Deployments" tab shows all recent deployments
3. Click on any deployment to see details:
   - Build logs
   - Deployment status
   - Preview URL
   - Environment variables used

## Troubleshooting Deployments

### Build Failures

1. Check the build logs for error messages
2. Verify that all required environment variables are set
3. Ensure the build works locally with `npm run build`

### Runtime Issues

1. Check browser console for errors
2. Verify environment variables are correctly set
3. Check Vercel logs for server-side errors

## Custom Domains

Our custom domains are configured as follows:

- Production: holistiq.com → `main` branch
- Staging: staging.holistiq.com → `develop` branch

To add a new custom domain:

1. Go to your project in Vercel
2. Navigate to Settings > Domains
3. Add your domain and configure DNS settings as instructed
