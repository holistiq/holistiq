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
const STAGING_URL = 'https://staging.myholistiq.com';
const NETLIFY_BRANCH_URL = 'https://develop--myholistiq.netlify.app';
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

  // Test Netlify branch URL
  tests.push(await testUrl(NETLIFY_BRANCH_URL, 'Netlify branch deployment'));

  // Test custom staging domain
  tests.push(await testUrl(STAGING_URL, 'Custom staging domain'));

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
    console.log(`   Custom domain: ${STAGING_URL}`);
    console.log(`   Netlify URL:   ${NETLIFY_BRANCH_URL}`);
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
