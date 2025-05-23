# Netlify Deployment Guide for HolistiQ

## Overview
This guide covers the complete setup for automated deployment of the HolistiQ application to Netlify.

## Prerequisites
- [x] GitHub repository: `holistiq/holistiq`
- [x] Netlify account (free tier sufficient)
- [x] Supabase project with database setup
- [x] Environment variables from Supabase

## Step-by-Step Setup

### 1. Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with your GitHub account (recommended)
3. Verify your email address

### 2. Connect Repository
1. **From Netlify Dashboard**:
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your GitHub account
   - Select `holistiq/holistiq` repository

2. **Configure Build Settings**:
   ```
   Branch to deploy: main
   Build command: npm run build
   Publish directory: dist
   ```

3. **Advanced Settings** (Optional):
   - Node.js version: 18 (will be auto-detected)
   - Package manager: npm (default)

### 3. Environment Variables Setup

#### Required Environment Variables
Go to Site Settings → Environment Variables and add:

```
VITE_APP_NAME=HolistiQ
VITE_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NODE_ENV=production
VITE_ENABLE_DEBUG_LOGGING=false
```

#### Getting Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon/public key

### 4. Branch Deployment Configuration

#### Production Branch (main)
- **URL**: `https://your-site-name.netlify.app`
- **Environment**: Production
- **Auto-deploy**: Enabled

#### Preview Branch (develop)
- **URL**: `https://develop--your-site-name.netlify.app`
- **Environment**: Preview
- **Auto-deploy**: Enabled

#### Pull Request Previews
- **URL**: `https://deploy-preview-123--your-site-name.netlify.app`
- **Environment**: Deploy Preview
- **Auto-deploy**: Enabled

### 5. Custom Domain (Optional)
1. Go to Site Settings → Domain management
2. Add custom domain (e.g., `holistiq.com`)
3. Configure DNS records as instructed
4. Enable HTTPS (automatic with Let's Encrypt)

## Build Configuration

### Netlify.toml Features
The `netlify.toml` file provides:

- ✅ **SPA Routing**: All routes redirect to `index.html`
- ✅ **Security Headers**: XSS protection, frame options, etc.
- ✅ **Asset Caching**: Optimized cache headers for static files
- ✅ **Branch-specific Builds**: Different settings per branch
- ✅ **Build Optimization**: CSS/JS minification

### Build Commands
```bash
# Production build
npm run build

# Development build
npm run build:dev

# Environment validation
npm run validate-env
```

## Deployment Process

### Automatic Deployments
- **Push to `main`** → Production deployment
- **Push to `develop`** → Preview deployment
- **Open Pull Request** → Deploy preview
- **Update Pull Request** → Updated deploy preview

### Manual Deployments
1. **Netlify Dashboard**:
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

2. **Netlify CLI**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login
   netlify login

   # Deploy
   netlify deploy

   # Deploy to production
   netlify deploy --prod
   ```

## Environment-Specific Configuration

### Production Environment
```toml
[context.production]
  command = "npm run build"
  environment = {
    NODE_ENV = "production",
    VITE_ENABLE_DEBUG_LOGGING = "false"
  }
```

### Preview Environment
```toml
[context.deploy-preview]
  command = "npm run build"
  environment = {
    NODE_ENV = "development",
    VITE_ENABLE_DEBUG_LOGGING = "true"
  }
```

## Verification Steps

### 1. Build Verification
- [ ] Check deploy logs in Netlify dashboard
- [ ] Verify no build errors or warnings
- [ ] Confirm environment variables loaded

### 2. Application Testing
- [ ] Visit deployed URL
- [ ] Test authentication flows
- [ ] Verify Supabase connection
- [ ] Test all routes (SPA routing)
- [ ] Check mobile responsiveness

### 3. Performance Testing
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify asset loading
- [ ] Test caching headers

## Troubleshooting

### Common Build Issues

#### Environment Variables Missing
```bash
# Check in Netlify dashboard
Site Settings → Environment Variables

# Test locally
npm run validate-env
```

#### Build Command Fails
```bash
# Test build locally
npm run build

# Check Node.js version
node --version  # Should be 18+
```

#### Dependencies Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Common Runtime Issues

#### Supabase Connection Fails
- Verify `VITE_PUBLIC_SUPABASE_URL` is correct
- Check `VITE_PUBLIC_SUPABASE_ANON_KEY` format
- Ensure Supabase project is active

#### 404 on Routes
- SPA routing is configured in `netlify.toml`
- Check `[[redirects]]` section
- Verify `from = "/*"` and `to = "/index.html"`

#### Authentication Issues
- Check Supabase auth settings
- Verify redirect URLs include Netlify domain
- Test with different browsers

### Debug Commands
```bash
# Local build test
npm run build && npm run preview

# Environment validation
npm run validate-env

# Type checking
npm run type-check

# Linting
npm run lint

# Netlify CLI debugging
netlify dev  # Local development with Netlify functions
```

## Advanced Features

### Netlify Functions (Optional)
For serverless functions, create `/netlify/functions/` directory:

```javascript
// netlify/functions/hello.js
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Netlify!' })
  };
};
```

### Form Handling
Netlify provides built-in form handling:

```html
<form name="contact" method="POST" data-netlify="true">
  <input type="text" name="name" />
  <button type="submit">Send</button>
</form>
```

### Analytics
Enable Netlify Analytics in Site Settings for:
- Page views and unique visitors
- Top pages and referrers
- Bandwidth usage

## Monitoring and Maintenance

### Deploy Notifications
Set up notifications in Site Settings → Build & deploy → Deploy notifications:
- Email notifications
- Slack integration
- Webhook notifications

### Performance Monitoring
- Monitor Core Web Vitals in Netlify dashboard
- Use Netlify Analytics for traffic insights
- Set up uptime monitoring

### Security
- Regular dependency updates
- Monitor Netlify security advisories
- Rotate Supabase keys periodically
- Review and update security headers

## Cost Considerations

### Free Tier Includes:
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited personal and commercial projects
- Deploy previews
- Form submissions (100/month)

### Paid Features:
- Additional bandwidth and build minutes
- Team collaboration features
- Advanced analytics
- Priority support

## Migration from Vercel

### Configuration Mapping
| Vercel | Netlify | Status |
|--------|---------|--------|
| `vercel.json` | `netlify.toml` | ✅ Created |
| Environment Variables | Environment Variables | ✅ Transfer directly |
| Build Command | Build Command | ✅ Same (`npm run build`) |
| Output Directory | Publish Directory | ✅ Same (`dist`) |
| Redirects | Redirects | ✅ Configured |
| Headers | Headers | ✅ Configured |

### Migration Steps
1. **Environment Variables**: Copy from Vercel to Netlify dashboard
2. **Build Settings**: Already compatible
3. **Domain**: Reconfigure DNS to point to Netlify
4. **Webhooks**: Update any external integrations
5. **Team Access**: Re-invite team members in Netlify

### Key Differences
- **CLI**: `vercel` → `netlify`
- **Deploy Previews**: Similar functionality, different URLs
- **Functions**: Vercel Edge Functions → Netlify Functions
- **Analytics**: Different dashboard and metrics

## Success Criteria
- [ ] Application deploys without errors
- [ ] All features work as expected
- [ ] Performance meets requirements
- [ ] Security headers are set
- [ ] SPA routing works correctly
- [ ] Environment variables are secure
