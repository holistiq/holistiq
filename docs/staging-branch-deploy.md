# Staging Environment - Branch Deploy Setup

## Overview

Using Netlify's free tier branch deploy feature for staging environment.

## URLs

- **Production**: https://myholistiq.com (main branch)
- **Staging**: https://develop--[SITE-NAME].netlify.app (develop branch)

## How It Works

### Automatic Deployments

- **Push to `main`** → Deploys to production (myholistiq.com)
- **Push to `develop`** → Deploys to staging (branch deploy URL)

### Environment Variables

Both environments use the same environment variables from Netlify site settings.

For staging-specific config, you can:

1. Use branch-specific environment variables in Netlify
2. Or detect environment in code using the URL

## Finding Your Branch Deploy URL

1. **Netlify Dashboard** → Your site → **Deploys tab**
2. **Look for deployments** from `develop` branch
3. **Click on a develop deployment** → Copy the URL
4. **Format**: `https://develop--[YOUR-SITE-NAME].netlify.app`

## Testing Staging

```bash
# Verify staging deployment
npm run verify-staging

# Manual test
curl -s -o /dev/null -w "%{http_code}" https://develop--[SITE-NAME].netlify.app
```

## Updating the Verification Script

Update `scripts/verify-staging.js` with your actual branch deploy URL:

```javascript
const NETLIFY_BRANCH_URL =
  "https://develop--[YOUR-ACTUAL-SITE-NAME].netlify.app";
```

## Benefits of This Approach

✅ **Free tier compatible**
✅ **Automatic deployments**
✅ **No additional sites needed**
✅ **Same codebase, different branches**

## Limitations

❌ **URL not as professional** (contains --develop--)
❌ **Shared environment variables** (unless configured per branch)
❌ **No custom domain** for staging

## Future Upgrade Path

When ready for professional staging:

1. **Create separate Netlify site** for staging
2. **Use custom domain**: staging.myholistiq.com
3. **Separate environment variables**

## Team Usage

**For Development:**

- Work on feature branches
- Merge to `develop` for staging testing
- Merge to `main` for production deployment

**For Testing:**

- Use staging URL for testing new features
- Verify changes before production deployment
- Share staging URL with stakeholders for review
