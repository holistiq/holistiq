# Branch Protection Setup Guide

## Overview
This guide provides instructions for setting up branch protection rules to enforce the established Git workflow and prevent accidental changes to critical branches.

## Current Repository State
✅ **Cleaned up branches:**
- Deleted merged feature/hotfix branches: `feat/task_003`, `feature/update-readme`, `hotfix/fix-session-restored-dialog`, `hotfix/fix-session-timeout-dialog-dismissal`
- Removed corresponding remote branches
- Pruned stale remote tracking branches

✅ **Active branches:**
- `main` - Production branch
- `develop` - Staging/development branch

## Required Branch Protection Rules

### 1. Protect `develop` Branch

**Navigate to:** GitHub → Settings → Branches → Add rule

**Branch name pattern:** `develop`

**Protection settings:**
- ✅ **Require a pull request before merging**
  - Required approving reviews: `1`
  - ✅ Dismiss stale PR reviews when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
- ✅ **Require conversation resolution before merging**
- ✅ **Restrict pushes that create files**
- ❌ Include administrators (allows admins to bypass rules for emergencies)
- ✅ **Allow force pushes** - DISABLED
- ✅ **Allow deletions** - DISABLED

### 2. Protect `main` Branch

**Navigate to:** GitHub → Settings → Branches → Add rule

**Branch name pattern:** `main`

**Protection settings:**
- ✅ **Require a pull request before merging**
  - Required approving reviews: `1`
  - ✅ Dismiss stale PR reviews when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
- ✅ **Require conversation resolution before merging**
- ✅ **Restrict pushes that create files**
- ❌ Include administrators (allows admins to bypass rules for emergencies)
- ✅ **Allow force pushes** - DISABLED
- ✅ **Allow deletions** - DISABLED

### 3. Restrict Pull Requests to Main

**Additional Rule for `main` branch:**
- ✅ **Restrict pushes that create files**
- **Restrict who can push to matching branches:**
  - Add restriction: Only allow pushes from `develop` branch
  - This ensures only develop → main merges are allowed

## Workflow Enforcement

### Allowed Workflows:
1. **Feature Development:**
   ```
   feature/branch → develop (via PR)
   ```

2. **Hotfix Development:**
   ```
   hotfix/branch → develop (via PR)
   ```

3. **Production Deployment:**
   ```
   develop → main (via PR)
   ```

### Blocked Workflows:
- ❌ Direct pushes to `develop` or `main`
- ❌ Feature branches directly to `main`
- ❌ Hotfix branches directly to `main`
- ❌ Force pushes to protected branches
- ❌ Branch deletion of protected branches

## Manual Setup Steps

### Step 1: Access Branch Protection Settings
1. Go to https://github.com/holistiq/holistiq
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** button

### Step 2: Configure Develop Branch Protection
1. **Branch name pattern:** `develop`
2. Enable all protection settings as listed above
3. Click **Create** to save the rule

### Step 3: Configure Main Branch Protection
1. Click **Add rule** again
2. **Branch name pattern:** `main`
3. Enable all protection settings as listed above
4. Click **Create** to save the rule

### Step 4: Verify Protection Rules
1. Check that both rules appear in the branch protection list
2. Test by attempting to push directly to develop (should be blocked)
3. Verify that only PRs can be used to merge changes

## Benefits of This Setup

### Security Benefits:
- ✅ Prevents accidental direct pushes to critical branches
- ✅ Ensures all changes go through code review
- ✅ Maintains audit trail of all changes
- ✅ Prevents force pushes that could rewrite history

### Workflow Benefits:
- ✅ Enforces feature → develop → main workflow
- ✅ Ensures staging testing before production
- ✅ Requires conversation resolution for better collaboration
- ✅ Maintains clean Git history

### Quality Benefits:
- ✅ Mandatory code review process
- ✅ Status checks ensure CI/CD pipeline success
- ✅ Up-to-date branch requirements prevent merge conflicts

## Emergency Procedures

### For Critical Hotfixes:
1. Create hotfix branch from `main`
2. Make necessary changes
3. Create PR to `develop` first
4. Test in staging environment
5. Create PR from `develop` to `main`
6. Deploy to production

### For Admin Override (Emergency Only):
- Admins can temporarily disable protection rules if needed
- **Important:** Re-enable protection immediately after emergency fix
- Document the reason for override in commit message

## Monitoring and Maintenance

### Regular Tasks:
- ✅ Review and clean up merged branches monthly
- ✅ Monitor for any protection rule bypasses
- ✅ Update protection rules as team grows
- ✅ Review and update this documentation

### Alerts to Set Up:
- Email notifications for protection rule changes
- Slack notifications for failed status checks
- Monitoring for force push attempts

## Next Steps

1. **Immediate:** Set up branch protection rules manually using this guide
2. **Short-term:** Create CODEOWNERS file for automatic review assignments
3. **Long-term:** Set up automated status checks (CI/CD pipeline)
4. **Ongoing:** Regular branch cleanup and rule review
