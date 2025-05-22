# Environment Variables Guide

This document provides guidelines for securely managing environment variables in the Holistiq project.

## Overview

Environment variables are used to store configuration settings and sensitive credentials that should not be hardcoded in the source code. This includes:

- API keys and secrets
- Database connection strings
- Service endpoints
- Feature flags
- Environment-specific configuration

## Security Best Practices

### 1. Never Commit Sensitive Values to Version Control

- **DO NOT** commit `.env` files containing real credentials to Git
- Always use `.env.example` files with placeholder values
- Add `.env*` to `.gitignore` (except for `.env.example`)

### 2. Client-Side vs. Server-Side Variables

#### Client-Side Variables (Vite/Frontend)

In Vite applications, only variables prefixed with `VITE_` are exposed to the client-side code:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- Only expose what's necessary to the client
- The Supabase anon key is designed to be public and has limited permissions via Row Level Security (RLS)

#### Server-Side Variables

Variables without the `VITE_` prefix are only available during build time and server-side operations:

```
SUPABASE_SERVICE_KEY=your-service-key-here  # Never expose to client
```

### 3. Environment-Specific Configuration

Use different environment files for different environments:

- `.env.development` - Development environment
- `.env.test` - Testing environment
- `.env.production` - Production environment

### 4. Secrets Management for Production

For production deployments, use the hosting platform's secrets management:

- **Vercel**: Use the Environment Variables section in project settings
- **Netlify**: Use the Environment Variables section in site settings
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **GitHub Actions**: Use GitHub Secrets for CI/CD workflows

### 5. Validation and Error Handling

Always validate that required environment variables are set:

```typescript
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL is not set');
  // Handle gracefully
}
```

## Required Environment Variables

| Variable | Purpose | Required | Client-Exposed | Example |
|----------|---------|----------|---------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | Yes | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | For AI features | No | `sk-ant-api03-...` |
| `PERPLEXITY_API_KEY` | Perplexity API key | For research | No | `pplx-abcde` |
| `NODE_ENV` | Environment name | Yes | No | `development`, `production` |

## Setting Up Environment Variables

### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the values in `.env` with your actual credentials

3. Restart the development server if it's running

### CI/CD and Deployment

For GitHub Actions, add secrets in the repository settings:

1. Go to Settings > Secrets and variables > Actions
2. Add each environment variable as a secret
3. Reference them in your workflow files:
   ```yaml
   env:
     VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
     VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
   ```

## Rotating Credentials

Regularly rotate sensitive credentials:

1. Generate new credentials in the service provider's dashboard
2. Update the credentials in all environment configurations
3. Deploy the changes
4. Verify functionality
5. Revoke the old credentials

## Troubleshooting

If you encounter issues with environment variables:

1. Verify that the `.env` file exists and contains the required variables
2. Check that variables are properly formatted (no spaces around `=`)
3. Restart the development server to pick up changes
4. For Vite, ensure client-side variables have the `VITE_` prefix
5. Check for typos in variable names

## Additional Resources

- [Vite.js Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Environment Variables](https://supabase.com/docs/guides/auth/env-variables)
- [Twelve-Factor App: Config](https://12factor.net/config)
