# CI/CD Pipeline Documentation

This document explains our Continuous Integration and Continuous Deployment (CI/CD) pipeline for the HolistiQ application.

## Overview

Our CI/CD pipeline consists of:

1. **Continuous Integration (CI)**: Automated testing and validation on every push and pull request
2. **Continuous Deployment (CD)**: Automated deployment to staging and production environments

## CI Pipeline

Our CI pipeline runs on GitHub Actions and performs the following checks:

### On Pull Requests and Pushes to main/develop

1. **Linting**: Ensures code follows our style guidelines
2. **Type Checking**: Verifies TypeScript types are correct
3. **Unit Tests**: Runs all unit tests
4. **Secret Detection**: Checks for accidentally committed credentials
5. **Security Scanning**: Scans dependencies for vulnerabilities

### CI Workflow

1. Developer pushes code or creates a pull request
2. GitHub Actions automatically runs the CI pipeline
3. Results are reported on the PR or commit
4. Merging is blocked if any checks fail

## CD Pipeline

Our CD pipeline automatically deploys code to our environments:

### Environments

- **Production**: Live application at holistiq.com (deployed from `main` branch)
- **Staging**: Testing environment at staging.holistiq.com (deployed from `develop` branch)
- **Preview**: Temporary environments for pull requests (deploy-preview-123--holistiq.netlify.app)

### Deployment Process

1. Code is merged to `develop` or `main`
2. GitHub Actions triggers the deployment workflow
3. Netlify builds and deploys the application
4. Deployment URL is posted as a comment on the PR

## Setting Up GitHub Secrets

For the CI/CD pipeline to work, the following secrets must be set in GitHub:

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `NETLIFY_AUTH_TOKEN`: API token from Netlify (if using CLI deployments)
   - `VITE_PUBLIC_SUPABASE_URL`: Supabase URL for testing
   - `VITE_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key for testing

## Troubleshooting

### Failed CI Checks

1. Click on the failed check in GitHub
2. Review the logs to identify the issue
3. Fix the issue locally and push again

### Failed Deployments

1. Check the Netlify deployment logs
2. Verify environment variables are correctly set
3. Ensure the build process works locally
4. Check for any Netlify-specific configuration issues
