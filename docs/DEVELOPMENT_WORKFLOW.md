# HolistiQ Development Workflow

This document outlines the development workflow for the HolistiQ project, including linting, type checking, and Git practices.

## 🔧 Development Setup

### Prerequisites

- Node.js 18.x or 20.x
- npm (comes with Node.js)
- Git
- VS Code (recommended)

### Initial Setup

```bash
# Clone the repository
git clone git@github.com:holistiq/holistiq.git
cd holistiq

# Install dependencies
npm install

# Install recommended VS Code extensions
# (VS Code will prompt you automatically)
```

## 🧹 Code Quality Tools

### Available Scripts

```bash
# Type checking and linting
npm run type-check          # Check TypeScript types
npm run lint                # Run ESLint
npm run lint:fix            # Run ESLint with auto-fix
npm run format              # Format code with Prettier
npm run format:check        # Check if code is formatted

# Security and dependency management
./scripts/security-check.sh # Run security audit
./scripts/security-check.sh --fix # Fix vulnerabilities automatically
./scripts/security-check.sh --fix --force # Fix with breaking changes
npm audit                   # Basic security audit
npm update                  # Update dependencies
```

### Pre-commit Hooks

The project uses Husky to run pre-commit hooks that automatically:

- ✅ Check TypeScript types
- ✅ Run ESLint on staged files
- ✅ Auto-format code with Prettier
- ✅ Stage formatting changes

#### Bypassing Pre-commit Hooks

In emergency situations, you can bypass the hooks:

```bash
# Method 1: Use --no-verify flag
git commit --no-verify -m "Emergency fix"

# Method 2: Set environment variable
SKIP_LINT=true git commit -m "Emergency fix"

# Method 3: Set NO_VERIFY environment variable
NO_VERIFY=true git commit -m "Emergency fix"
```

## 🚀 Feature Development Workflow

### 1. Creating a New Feature

```bash
# Use the automated script
./scripts/commit-feature.sh "feature-name" "Feature description"

# Example
./scripts/commit-feature.sh "user-notifications" "Add real-time user notifications"

# With lint bypass (emergency only)
./scripts/commit-feature.sh "hotfix-urgent" "Fix critical bug" --skip-lint
```

### 2. Manual Git Workflow

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Stage and commit (pre-commit hooks will run automatically)
git add .
git commit -m "feat: Add your feature description"

# Push to remote
git push -u origin feature/your-feature-name
```

### 3. Branch Naming Conventions

- **Features**: `feature/feature-name`
- **Hotfixes**: `hotfix/fix-description`
- **Bug fixes**: `bugfix/bug-description`
- **Chores**: `chore/task-description`

## 🔍 Linting and Type Checking

### ESLint Configuration

The project uses ESLint with TypeScript support:

- ✅ TypeScript-specific rules
- ✅ React hooks rules
- ✅ React refresh rules
- ✅ No `any` types allowed
- ✅ Consistent code style

### Common Linting Issues and Fixes

#### 1. TypeScript `any` Type Error

```typescript
// ❌ Bad
function getData(): any {
  return data;
}

// ✅ Good
interface DataResponse {
  id: string;
  name: string;
}

function getData(): DataResponse {
  return data;
}
```

#### 2. Missing Dependencies in useEffect

```typescript
// ❌ Bad
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency

// ✅ Good
useEffect(() => {
  fetchData(userId);
}, [userId]); // Include all dependencies
```

#### 3. Unused Imports

```typescript
// ❌ Bad
import { useState, useEffect } from "react"; // useEffect not used

// ✅ Good
import { useState } from "react";
```

### Auto-fixing Issues

```bash
# Fix ESLint issues automatically
npm run lint:fix

# Format code automatically
npm run format

# Both will run automatically on commit via pre-commit hooks
```

## 🔒 Security and Dependency Management

### Security Audit Script

The project includes a comprehensive security audit script:

```bash
# Run security audit
./scripts/security-check.sh

# Fix vulnerabilities automatically
./scripts/security-check.sh --fix

# Fix vulnerabilities with breaking changes (use carefully)
./scripts/security-check.sh --fix --force
```

### Security Levels

- **Critical/High**: Block builds and require immediate fixes
- **Moderate**: Show warnings but don't block builds (development dependencies)
- **Low**: Informational only

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update to latest compatible versions
npm update

# Update to latest versions (including major)
npx npm-check-updates -u && npm install
```

### Security Best Practices

1. **Regular Audits**: Run security checks weekly
2. **Dependency Updates**: Keep dependencies current
3. **Review Changes**: Check what's being updated
4. **Test After Updates**: Ensure functionality after updates
5. **Monitor Alerts**: Watch for security advisories

## 🏗️ CI/CD Integration

### GitHub Actions

The project includes automated checks on:

- ✅ All pushes to `main` and `develop`
- ✅ All pull requests
- ✅ Multiple Node.js versions (18.x, 20.x)

### Checks Performed

1. **TypeScript Type Checking**
2. **ESLint Linting**
3. **Prettier Formatting Check**
4. **Build Verification**
5. **Security Audit**

### Viewing CI Results

- Check the "Actions" tab in GitHub
- All checks must pass before merging PRs
- Failed checks will block merging

## 🛠️ IDE Integration (VS Code)

### Recommended Extensions

The project includes VS Code extension recommendations:

- ESLint
- Prettier
- TypeScript support
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

### Real-time Feedback

With proper setup, you'll see:

- ✅ TypeScript errors highlighted in red
- ✅ ESLint warnings/errors with squiggly lines
- ✅ Auto-formatting on save
- ✅ Import organization on save

### VS Code Settings

The project includes optimized VS Code settings for:

- Auto-formatting on save
- ESLint auto-fix on save
- Import organization
- Tailwind CSS support

## 🚨 Troubleshooting

### Common Issues

#### 1. Pre-commit Hook Fails

```bash
# Check what's failing
git status

# Fix linting issues
npm run lint:fix

# Fix formatting
npm run format

# Try commit again
git commit -m "Your message"
```

#### 2. TypeScript Errors

```bash
# Run type checking to see all errors
npm run type-check

# Fix the reported type errors
# Then try committing again
```

#### 3. Husky Not Working

```bash
# Reinstall Husky hooks
npm run prepare

# Make sure hooks are executable
chmod +x .husky/pre-commit
```

#### 4. Emergency Bypass

If you need to commit urgently despite linting errors:

```bash
# Use --no-verify (use sparingly!)
git commit --no-verify -m "Emergency fix"

# Or use environment variable
SKIP_LINT=true git commit -m "Emergency fix"
```

## 📋 Best Practices

### 1. Commit Frequently

- Make small, focused commits
- Use descriptive commit messages
- Follow conventional commit format

### 2. Fix Issues Early

- Address linting errors as they appear
- Don't accumulate technical debt
- Use IDE integration for real-time feedback

### 3. Code Reviews

- All code should be reviewed via PRs
- Check that CI passes before reviewing
- Focus on logic, not style (automated tools handle style)

### 4. Testing

- Write tests for new features
- Ensure tests pass before committing
- Use the test script: `npm test`

## 🔄 Workflow Summary

1. **Start Feature**: `./scripts/commit-feature.sh "name" "description"`
2. **Develop**: Write code with real-time linting feedback
3. **Commit**: Pre-commit hooks ensure quality
4. **Push**: `git push origin feature/name`
5. **PR**: Create pull request for review
6. **CI**: Automated checks run
7. **Review**: Code review and approval
8. **Merge**: Merge to develop/main
9. **Deploy**: Automatic deployment triggers

This workflow ensures consistent code quality and reduces bugs in production! 🚀

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
