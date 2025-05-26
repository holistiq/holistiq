# HolistiQ Branching Strategy

## Branch Structure

- `main`: Production code only. Deployed automatically to production environment.
- `develop`: Integration branch for features. Deployed automatically to staging environment.
- `feature/*`: Individual feature development (e.g., `feature/user-achievements`).
- `bugfix/*`: Bug fixes for issues found in development.
- `hotfix/*`: Emergency fixes for production issues.

## Workflow

### Feature Development

1. Create a feature branch from `develop`:

   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Develop and test your feature locally.

3. Commit changes with meaningful commit messages:

   ```bash
   git add .
   git commit -m "feat: add user achievements display"
   ```

4. Push your branch to GitHub:

   ```bash
   git push -u origin feature/your-feature-name
   ```

5. Create a Pull Request to merge into `develop`.

6. After code review and approval, merge the PR into `develop`.

7. The changes will be automatically deployed to the staging environment.

### Production Deployment

1. Create a Pull Request from `develop` to `main`.

2. After thorough testing in staging and PR approval, merge to `main`.

3. The changes will be automatically deployed to production.

### Hotfixes

1. For urgent production fixes, create a hotfix branch from `main`:

   ```bash
   git checkout main
   git pull
   git checkout -b hotfix/critical-issue
   ```

2. Fix the issue and test thoroughly.

3. Create a PR to merge into `main`.

4. After approval, merge to `main` for immediate production deployment.

5. Create another PR to merge the same hotfix into `develop`.

## Best Practices

- Keep feature branches short-lived (1-2 weeks maximum)
- Regularly pull changes from `develop` into your feature branch
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Always run tests before creating a PR
- Delete feature branches after merging
