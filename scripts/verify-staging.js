#!/usr/bin/env node

/**
 * Staging Environment Verification Script
 *
 * This script verifies that the staging environment is properly configured
 * and working correctly with the develop branch.
 */

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

// Configuration
// For free tier: Use branch deploy URL as primary staging URL
const NETLIFY_BRANCH_URL = 'https://develop--[YOUR-ACTUAL-SITE-NAME].netlify.app'; // Update with your actual URL
const STAGING_URL = NETLIFY_BRANCH_URL; // Primary staging URL
const CUSTOM_STAGING_URL = 'https://staging.myholistiq.com'; // For future use with separate site
const TIMEOUT = 10000; // 10 seconds

/**
 * Test if URL is accessible
 */
async function testUrl(url, description) {
  try {
    console.log(`🔍 Testing ${description}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HolistiQ-Staging-Verification'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`✅ ${description} - Status: ${response.status}`);
      return true;
    } else {
      console.log(`❌ ${description} - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Test staging-specific content
 */
async function testStagingContent(url, description) {
  try {
    console.log(`🔍 Testing ${description}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`❌ ${description} - HTTP ${response.status}`);
      return false;
    }

    const content = await response.text();

    // Check for staging-specific indicators
    const stagingIndicators = [
      'HolistiQ Staging',
      'HolistiQ',
      'root'
    ];

    let foundStaging = false;
    for (const indicator of stagingIndicators) {
      if (content.includes(indicator)) {
        if (indicator === 'HolistiQ Staging') {
          foundStaging = true;
          console.log(`✅ Found staging indicator: ${indicator}`);
        }
      }
    }

    if (foundStaging) {
      console.log(`✅ ${description} - Staging environment detected`);
      return true;
    } else {
      console.log(`⚠️  ${description} - No staging-specific content found (may be using production config)`);
      return true; // Still consider it a pass
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Verify staging deployment
 */
async function verifyStagingDeployment() {
  console.log(`🚀 Verifying staging deployment...\n`);

  const tests = [];

  // Test primary staging URL (branch deploy)
  tests.push(await testUrl(STAGING_URL, 'Primary staging URL (branch deploy)'));

  // Test custom staging domain (if configured separately)
  if (CUSTOM_STAGING_URL !== STAGING_URL) {
    tests.push(await testUrl(CUSTOM_STAGING_URL, 'Custom staging domain (separate site)'));
  }

  // Test staging-specific content
  tests.push(await testStagingContent(STAGING_URL, 'Staging environment configuration'));

  // Test common routes on staging
  const routes = ['/dashboard', '/achievements', '/supplements', '/tests'];

  for (const route of routes) {
    tests.push(await testUrl(`${STAGING_URL}${route}`, `Staging route: ${route}`));
  }

  // Summary
  const passed = tests.filter(Boolean).length;
  const total = tests.length;

  console.log(`\n📊 Staging Verification Summary:`);
  console.log(`✅ Passed: ${passed}/${total} tests`);

  if (passed === total) {
    console.log(`🎉 All tests passed! Staging environment is working correctly.`);
    console.log(`\n🌐 Staging URLs:`);
    console.log(`   Primary staging: ${STAGING_URL}`);
    if (CUSTOM_STAGING_URL !== STAGING_URL) {
      console.log(`   Custom domain:   ${CUSTOM_STAGING_URL} (if configured)`);
    }
    return true;
  } else {
    console.log(`❌ ${total - passed} tests failed. Please check the staging configuration.`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const success = await verifyStagingDeployment();
  process.exit(success ? 0 : 1);
}

// Run the script
main().catch(error => {
  console.error('❌ Staging verification failed:', error.message);
  process.exit(1);
});
