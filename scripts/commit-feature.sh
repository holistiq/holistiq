#!/bin/bash

# HolistiQ Feature Commit Script
# Usage: ./scripts/commit-feature.sh "feature-name" "Feature description"
# Example: ./scripts/commit-feature.sh "public-test-sharing" "Add secure public sharing for test results"

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required arguments are provided
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <feature-name> <feature-description>"
    print_error "Example: $0 public-test-sharing 'Add secure public sharing for test results'"
    exit 1
fi

FEATURE_NAME="$1"
FEATURE_DESCRIPTION="$2"
BRANCH_NAME="feature/${FEATURE_NAME}"

# Validate feature name (no spaces, special chars except hyphens)
if [[ ! "$FEATURE_NAME" =~ ^[a-zA-Z0-9-]+$ ]]; then
    print_error "Feature name should only contain letters, numbers, and hyphens"
    exit 1
fi

print_status "Starting feature commit workflow for: $FEATURE_NAME"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet; then
    print_warning "No changes detected. Nothing to commit."
    exit 0
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check if we're already on the feature branch
if [ "$CURRENT_BRANCH" = "$BRANCH_NAME" ]; then
    print_status "Already on feature branch: $BRANCH_NAME"
else
    # Check if feature branch already exists
    if git show-ref --verify --quiet refs/heads/"$BRANCH_NAME"; then
        print_status "Feature branch $BRANCH_NAME already exists. Switching to it..."
        git checkout "$BRANCH_NAME"
    else
        print_status "Creating new feature branch: $BRANCH_NAME"
        git checkout -b "$BRANCH_NAME"
    fi
fi

# Show status before committing
print_status "Git status before commit:"
git status --short

# Stage all changes
print_status "Staging all changes..."
git add .

# Create commit message following conventional commits format
COMMIT_MESSAGE="feat: ${FEATURE_DESCRIPTION}

- Implemented ${FEATURE_NAME} feature
- Added necessary database migrations
- Updated frontend components and services
- Included proper error handling and validation
- Added security measures and RLS policies"

# Show what will be committed
print_status "Files to be committed:"
git diff --cached --name-only

# Commit the changes
print_status "Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Get commit hash for reference
COMMIT_HASH=$(git rev-parse --short HEAD)
print_success "Committed changes with hash: $COMMIT_HASH"

# Push to remote
print_status "Pushing branch to remote repository..."
if git push -u origin "$BRANCH_NAME"; then
    print_success "Successfully pushed $BRANCH_NAME to remote"
else
    print_error "Failed to push to remote. You may need to push manually."
    exit 1
fi

# Summary
echo ""
print_success "=== FEATURE COMMIT SUMMARY ==="
echo -e "${GREEN}Feature:${NC} $FEATURE_NAME"
echo -e "${GREEN}Branch:${NC} $BRANCH_NAME"
echo -e "${GREEN}Commit:${NC} $COMMIT_HASH"
echo -e "${GREEN}Description:${NC} $FEATURE_DESCRIPTION"
echo ""
print_status "Next steps:"
echo "  1. Create a Pull Request from $BRANCH_NAME to develop"
echo "  2. Review and test the changes"
echo "  3. Merge after approval"
echo "  4. Clean up the feature branch after merge"
echo ""
print_status "To create a PR, visit:"
echo "  https://github.com/holistiq/holistiq/compare/develop...$BRANCH_NAME"
