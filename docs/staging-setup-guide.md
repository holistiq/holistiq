# Staging Setup Guide - Separate Netlify Sites

## Overview

Due to Netlify free tier limitations, we'll create two separate sites:

- **Production Site**: myholistiq.com (main branch)
- **Staging Site**: staging.myholistiq.com (develop branch)

## Step 1: Create Staging Site

1. **Go to Netlify Dashboard** → "Add new site"
2. **Import from Git** → Select your GitHub repo
3. **Configure build settings:**
   ```
   Repository: holistiq/holistiq
   Branch to deploy: develop
   Build command: npm run build
   Publish directory: dist
   ```

## Step 2: Configure Environment Variables

Add these environment variables to your **staging site**:

```env
VITE_APP_NAME=HolistiQ Staging
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NODE_ENV=development
VITE_ENABLE_DEBUG_LOGGING=true
```

> **Note**: Copy the actual values from your `.env` file or Netlify production site environment variables.

## Step 3: Add Custom Domain

1. **Domain Management** → Add domain: `staging.myholistiq.com`
2. **Configure DNS** (if not already done)

## Step 4: Configure Auto-Deploy

1. **Build & Deploy** → **Build hooks**
2. **Deploy contexts** → Enable for `develop` branch
3. **Deploy notifications** → Set up as needed

## Benefits of This Approach

✅ **Professional URLs**: staging.myholistiq.com
✅ **Separate configs**: Different env vars per environment
✅ **Independent deploys**: Staging won't affect production
✅ **Free tier compatible**: Uses 2 of 100 allowed sites
✅ **Easy rollbacks**: Independent deployment history

## Verification

After setup, test with:

```bash
npm run verify-staging
```

## Alternative: Branch Deploy URLs

If you prefer simpler setup, use:

- Production: https://myholistiq.com
- Staging: https://develop--myholistiq.netlify.app

Update your staging verification script to use the branch deploy URL.
