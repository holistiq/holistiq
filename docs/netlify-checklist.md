# Netlify Deployment Checklist for HolistiQ

## Pre-Deployment Setup

### 1. Netlify Account Setup
- [ ] Create account at [netlify.com](https://netlify.com)
- [ ] Connect GitHub account
- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Login to CLI: `netlify login`

### 2. Repository Connection
- [ ] Go to Netlify Dashboard → "Add new site"
- [ ] Choose "Import an existing project" → "Deploy with GitHub"
- [ ] Select `holistiq/holistiq` repository
- [ ] Verify build settings:
  - Branch: `main`
  - Build command: `npm run build`
  - Publish directory: `dist`

### 3. Environment Variables Setup
Get Supabase credentials:
- [ ] Go to Supabase project → Settings → API
- [ ] Copy Project URL and anon/public key

Add to Netlify (Site Settings → Environment Variables):
- [ ] `VITE_APP_NAME` = `HolistiQ`
- [ ] `VITE_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
- [ ] `VITE_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIs...`
- [ ] `NODE_ENV` = `production`
- [ ] `VITE_ENABLE_DEBUG_LOGGING` = `false`

### 4. Branch Configuration
- [ ] Production: `main` branch → `https://your-site.netlify.app`
- [ ] Preview: `develop` branch → `https://develop--your-site.netlify.app`
- [ ] PR Previews: Automatic → `https://deploy-preview-123--your-site.netlify.app`

## Deployment Process

### Automatic Deployment (Recommended)
- [ ] Push to `develop` → Preview deployment
- [ ] Push to `main` → Production deployment
- [ ] Open PR → Deploy preview

### Manual Deployment Options

#### Option 1: Netlify Dashboard
- [ ] Go to Deploys tab
- [ ] Click "Trigger deploy" → "Deploy site"

#### Option 2: Netlify CLI
```bash
# Initialize site (first time only)
npm run deploy:init

# Deploy to preview
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Open site in browser
npm run deploy:open
```

#### Option 3: Direct CLI
```bash
# Install and login
npm install -g netlify-cli
netlify login

# Deploy
netlify deploy              # Preview
netlify deploy --prod       # Production
```

## Verification Steps

### 1. Build Verification
- [ ] Check deploy logs in Netlify dashboard
- [ ] Verify build completed without errors
- [ ] Confirm environment variables loaded
- [ ] Check build time (should be < 5 minutes)

### 2. Application Testing
- [ ] Visit deployed URL
- [ ] Test authentication flows:
  - [ ] Sign up
  - [ ] Sign in
  - [ ] Sign out
- [ ] Verify Supabase connection:
  - [ ] Database queries work
  - [ ] Real-time updates function
  - [ ] File uploads (if applicable)
- [ ] Test core features:
  - [ ] Dashboard loads
  - [ ] Cognitive tests work
  - [ ] Supplement logging
  - [ ] Achievement system
  - [ ] Data persistence

### 3. Performance Testing
- [ ] Run Lighthouse audit (target: >90)
- [ ] Check Core Web Vitals:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Test on different devices:
  - [ ] Desktop
  - [ ] Mobile
  - [ ] Tablet
- [ ] Verify asset caching

### 4. Security Testing
- [ ] HTTPS enabled (automatic)
- [ ] Security headers present
- [ ] No sensitive data in client code
- [ ] Authentication works correctly

### 5. SPA Routing Testing
- [ ] Direct URL access works for all routes:
  - [ ] `/dashboard`
  - [ ] `/achievements`
  - [ ] `/supplements`
  - [ ] `/tests`
- [ ] Browser back/forward buttons work
- [ ] Refresh on any route works

## Troubleshooting

### Build Issues

#### Environment Variables Missing
```bash
# Check in Netlify dashboard
Site Settings → Environment Variables

# Test locally
npm run validate-env
```

#### Build Command Fails
```bash
# Test locally
npm run build

# Check Node.js version
node --version  # Should be 18+

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

#### Dependencies Issues
```bash
# Check package.json
# Ensure all dependencies are in "dependencies" not "devDependencies"
# if they're needed for build
```

### Runtime Issues

#### Supabase Connection Fails
- [ ] Verify `VITE_PUBLIC_SUPABASE_URL` format
- [ ] Check `VITE_PUBLIC_SUPABASE_ANON_KEY` is complete
- [ ] Ensure Supabase project is active
- [ ] Test connection locally

#### 404 on Routes
- [ ] Check `netlify.toml` exists
- [ ] Verify redirect rule: `from = "/*"` to `to = "/index.html"`
- [ ] Test SPA routing locally

#### Authentication Issues
- [ ] Add Netlify domain to Supabase auth settings
- [ ] Check redirect URLs in Supabase
- [ ] Verify auth flow in different browsers

### Performance Issues
- [ ] Check bundle size: `npm run build` and check `dist/` size
- [ ] Optimize images and assets
- [ ] Review dependencies for unused packages

## Debug Commands

```bash
# Local testing
npm run build && npm run preview

# Environment validation
npm run validate-env

# Type checking
npm run type-check

# Linting
npm run lint

# Netlify CLI debugging
netlify dev                 # Local development
netlify status             # Site status
netlify logs               # Deployment logs
netlify open               # Open site
```

## Post-Deployment

### 1. Domain Configuration (Optional)
- [ ] Go to Site Settings → Domain management
- [ ] Add custom domain
- [ ] Configure DNS records
- [ ] Verify SSL certificate

### 2. Monitoring Setup
- [ ] Enable Netlify Analytics
- [ ] Set up deploy notifications:
  - [ ] Email notifications
  - [ ] Slack integration (if applicable)
- [ ] Configure uptime monitoring

### 3. Team Access
- [ ] Add team members to Netlify site
- [ ] Set appropriate permissions
- [ ] Share site URLs

## Maintenance

### Regular Tasks
- [ ] Monitor deploy success rate
- [ ] Review performance metrics
- [ ] Update dependencies monthly
- [ ] Rotate Supabase keys quarterly

### Emergency Procedures
- [ ] Know how to rollback: Deploys → Previous deploy → "Publish deploy"
- [ ] Have local development environment ready
- [ ] Document incident response process

## Success Criteria

### Technical
- [ ] Build completes in < 5 minutes
- [ ] Site loads in < 3 seconds
- [ ] All routes accessible
- [ ] No console errors
- [ ] Mobile responsive

### Functional
- [ ] Authentication works
- [ ] Database operations succeed
- [ ] All features functional
- [ ] Data persists correctly
- [ ] Real-time updates work

### Performance
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals pass
- [ ] Assets cached properly
- [ ] Bundle size optimized

## Quick Reference

### URLs
- Production: `https://your-site.netlify.app`
- Develop: `https://develop--your-site.netlify.app`
- PR Preview: `https://deploy-preview-[number]--your-site.netlify.app`

### Key Commands
```bash
npm run deploy:staging      # Deploy to preview
npm run deploy:production   # Deploy to production
npm run deployment:status   # Check status
npm run deploy:open         # Open site
```

### Important Files
- `netlify.toml` - Netlify configuration
- `dist/` - Build output directory
- Environment variables in Netlify dashboard
