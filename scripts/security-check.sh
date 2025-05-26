#!/bin/bash

# HolistiQ Security Check Script
# Usage: ./scripts/security-check.sh [--fix] [--force]
# Example: ./scripts/security-check.sh --fix

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[SECURITY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SECURITY]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[SECURITY]${NC} $1"
}

print_error() {
    echo -e "${RED}[SECURITY]${NC} $1"
}

# Parse command line arguments
FIX_VULNERABILITIES=false
FORCE_FIX=false

for arg in "$@"; do
    case $arg in
        --fix)
            FIX_VULNERABILITIES=true
            shift
            ;;
        --force)
            FORCE_FIX=true
            shift
            ;;
        *)
            print_error "Unknown argument: $arg"
            print_error "Usage: $0 [--fix] [--force]"
            exit 1
            ;;
    esac
done

print_status "Running security audit for HolistiQ..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Run npm audit and capture the output
print_status "Checking for vulnerabilities..."

# Check if jq is available
if ! command -v jq &> /dev/null; then
    print_warning "jq not found, using simplified audit check"

    # Simplified check without jq
    if npm audit --audit-level=high > /dev/null 2>&1; then
        CRITICAL_HIGH_TOTAL=0
    else
        CRITICAL_HIGH_TOTAL=1
    fi

    if npm audit --audit-level=moderate > /dev/null 2>&1; then
        MODERATE_COUNT=0
    else
        MODERATE_COUNT=1
    fi

    CRITICAL_COUNT="N/A"
    HIGH_COUNT="N/A"
    LOW_COUNT="N/A"
else
    # Get audit results in JSON format
    AUDIT_JSON=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')

    # Parse vulnerability counts by severity
    CRITICAL_COUNT=$(echo "$AUDIT_JSON" | jq -r '.vulnerabilities | to_entries | map(select(.value.severity == "critical")) | length' 2>/dev/null || echo "0")
    HIGH_COUNT=$(echo "$AUDIT_JSON" | jq -r '.vulnerabilities | to_entries | map(select(.value.severity == "high")) | length' 2>/dev/null || echo "0")
    MODERATE_COUNT=$(echo "$AUDIT_JSON" | jq -r '.vulnerabilities | to_entries | map(select(.value.severity == "moderate")) | length' 2>/dev/null || echo "0")
    LOW_COUNT=$(echo "$AUDIT_JSON" | jq -r '.vulnerabilities | to_entries | map(select(.value.severity == "low")) | length' 2>/dev/null || echo "0")

    # Ensure we have valid numbers (remove any non-digits and newlines)
    CRITICAL_COUNT=$(echo "$CRITICAL_COUNT" | tr -d '\n' | grep -o '[0-9]*' | head -1)
    HIGH_COUNT=$(echo "$HIGH_COUNT" | tr -d '\n' | grep -o '[0-9]*' | head -1)
    MODERATE_COUNT=$(echo "$MODERATE_COUNT" | tr -d '\n' | grep -o '[0-9]*' | head -1)
    LOW_COUNT=$(echo "$LOW_COUNT" | tr -d '\n' | grep -o '[0-9]*' | head -1)

    # Default to 0 if empty
    CRITICAL_COUNT=${CRITICAL_COUNT:-0}
    HIGH_COUNT=${HIGH_COUNT:-0}
    MODERATE_COUNT=${MODERATE_COUNT:-0}
    LOW_COUNT=${LOW_COUNT:-0}

    CRITICAL_HIGH_TOTAL=$((CRITICAL_COUNT + HIGH_COUNT))
fi

# Display summary
echo ""
print_status "=== VULNERABILITY SUMMARY ==="
echo -e "${RED}Critical:${NC} $CRITICAL_COUNT"
echo -e "${RED}High:${NC} $HIGH_COUNT"
echo -e "${YELLOW}Moderate:${NC} $MODERATE_COUNT"
echo -e "${BLUE}Low:${NC} $LOW_COUNT"
echo ""

# Check for critical and high vulnerabilities
CRITICAL_HIGH_TOTAL=$((CRITICAL_COUNT + HIGH_COUNT))

if [ "$CRITICAL_HIGH_TOTAL" -gt 0 ]; then
    print_error "Found $CRITICAL_HIGH_TOTAL critical/high severity vulnerabilities!"

    # Show detailed audit for critical/high
    print_status "Detailed audit for critical/high vulnerabilities:"
    npm audit --audit-level=high

    if [ "$FIX_VULNERABILITIES" = true ]; then
        print_status "Attempting to fix vulnerabilities..."

        if [ "$FORCE_FIX" = true ]; then
            print_warning "Running npm audit fix --force (may introduce breaking changes)"
            npm audit fix --force
        else
            print_status "Running npm audit fix"
            npm audit fix

            # Check if critical/high vulnerabilities remain
            REMAINING_AUDIT=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
            REMAINING_CRITICAL=$(echo "$REMAINING_AUDIT" | jq -r '.vulnerabilities | to_entries | map(select(.value.severity == "critical")) | length' 2>/dev/null || echo "0")
            REMAINING_HIGH=$(echo "$REMAINING_AUDIT" | jq -r '.vulnerabilities | to_entries | map(select(.value.severity == "high")) | length' 2>/dev/null || echo "0")
            REMAINING_TOTAL=$((REMAINING_CRITICAL + REMAINING_HIGH))

            if [ "$REMAINING_TOTAL" -gt 0 ]; then
                print_warning "Some critical/high vulnerabilities remain after automatic fix"
                print_warning "You may need to run: npm audit fix --force"
                print_warning "Or manually update dependencies"
            else
                print_success "All critical/high vulnerabilities have been resolved!"
            fi
        fi
    else
        print_error "To fix these vulnerabilities, run:"
        print_error "  ./scripts/security-check.sh --fix"
        print_error "  or ./scripts/security-check.sh --fix --force (for breaking changes)"
        exit 1
    fi
elif [ "$MODERATE_COUNT" -gt 0 ]; then
    print_warning "Found $MODERATE_COUNT moderate severity vulnerabilities"

    # Show moderate vulnerabilities for awareness
    print_status "Moderate vulnerabilities (informational):"
    npm audit --audit-level=moderate

    if [ "$FIX_VULNERABILITIES" = true ]; then
        print_status "Attempting to fix moderate vulnerabilities..."
        npm audit fix
    else
        print_warning "These are moderate severity and don't block the build"
        print_warning "To fix them, run: ./scripts/security-check.sh --fix"
    fi
else
    print_success "No vulnerabilities found! 🎉"
fi

# Check for outdated packages
print_status "Checking for outdated packages..."

if command -v jq &> /dev/null; then
    OUTDATED_OUTPUT=$(npm outdated --json 2>/dev/null || echo '{}')
    OUTDATED_COUNT=$(echo "$OUTDATED_OUTPUT" | jq 'length' 2>/dev/null || echo "0")
    OUTDATED_COUNT=${OUTDATED_COUNT//[^0-9]/}
    OUTDATED_COUNT=${OUTDATED_COUNT:-0}
else
    # Simplified check without jq
    if npm outdated > /dev/null 2>&1; then
        OUTDATED_COUNT=0
    else
        OUTDATED_COUNT=1
    fi
fi

if [ "$OUTDATED_COUNT" -gt 0 ]; then
    print_warning "Found outdated packages:"
    npm outdated
    echo ""
    print_status "To update packages, run: npm update"
    print_status "For major version updates, consider: npx npm-check-updates -u"
else
    print_success "All packages are up to date!"
fi

# Final recommendations
echo ""
print_status "=== SECURITY RECOMMENDATIONS ==="
echo "1. Regularly run security audits: npm audit"
echo "2. Keep dependencies updated: npm update"
echo "3. Review dependency changes before committing"
echo "4. Use npm ci in production for reproducible builds"
echo "5. Consider using npm shrinkwrap for additional security"

# Exit with appropriate code
if [ "$CRITICAL_HIGH_TOTAL" -gt 0 ] && [ "$FIX_VULNERABILITIES" = false ]; then
    exit 1
else
    exit 0
fi
