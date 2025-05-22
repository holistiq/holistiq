# GitHub Secrets Setup Guide

This guide explains how to set up the required GitHub secrets for the HolistiQ CI/CD pipeline.

## Required Secrets

The following secrets must be set up in your GitHub repository:

1. `VERCEL_TOKEN`: API token from Vercel for deployments
2. `VITE_PUBLIC_SUPABASE_URL`: Supabase URL for testing
3. `VITE_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key for testing

## Step 1: Generate a Vercel API Token

1. Log in to your Vercel account at https://vercel.com
2. Go to Settings > Tokens
3. Click "Create" to create a new token
4. Give it a name like "HolistiQ GitHub CI/CD"
5. Set the appropriate scope (usually "Full Account" for CI/CD)
6. Copy the generated token

## Step 2: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value:

   - Name: `VERCEL_TOKEN`
     Value: [Your Vercel API token]

   - Name: `VITE_PUBLIC_SUPABASE_URL`
     Value: https://wnqyqnkynyombyngzdcq.supabase.co

   - Name: `VITE_PUBLIC_SUPABASE_ANON_KEY`
     Value: [Your Supabase anon key]

## Step 3: Verify Secrets

1. After adding all secrets, they should appear in the "Repository secrets" list
2. The actual values will be hidden for security
3. You can update a secret by clicking on it and entering a new value

## Security Considerations

- GitHub secrets are encrypted and only exposed to GitHub Actions workflows
- They are not accessible in pull request workflows from forks
- Rotate these secrets periodically (every 90 days recommended)
- If a secret is compromised, regenerate it immediately and update it in GitHub

## Troubleshooting

If your GitHub Actions workflows fail with errors related to missing secrets:

1. Check that all required secrets are added with the correct names
2. Verify that the secret values are correct
3. Ensure that your workflow YAML files reference the secrets correctly using the `${{ secrets.SECRET_NAME }}` syntax
