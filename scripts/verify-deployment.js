#!/usr/bin/env node

/**
 * Deployment Verification Script
 *
 * This script verifies that a deployment is working correctly
 * by testing various endpoints and functionality.
 */

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

// Configuration
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
        'User-Agent': 'HolistiQ-Deployment-Verification'
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
 * Test if content contains expected elements
 */
async function testContent(url, expectedContent, description) {
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

    for (const expected of expectedContent) {
      if (!content.includes(expected)) {
        console.log(`❌ ${description} - Missing: ${expected}`);
        return false;
      }
    }

    console.log(`✅ ${description} - All content found`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Verify deployment
 */
async function verifyDeployment(baseUrl) {
  console.log(`🚀 Verifying deployment at: ${baseUrl}\n`);

  const tests = [];

  // Test main page
  tests.push(await testUrl(baseUrl, 'Main page accessibility'));

  // Test that it's a React app
  tests.push(await testContent(baseUrl, [
    'Holistiq',
    'root',
    'script'
  ], 'React app structure'));

  // Test common routes (SPA routing)
  const routes = [
    '/dashboard',
    '/achievements',
    '/supplements',
    '/tests'
  ];

  for (const route of routes) {
    tests.push(await testUrl(`${baseUrl}${route}`, `Route: ${route}`));
  }

  // Test static assets
  tests.push(await testUrl(`${baseUrl}/assets/favicon/favicon.svg`, 'Favicon'));

  // Summary
  const passed = tests.filter(Boolean).length;
  const total = tests.length;

  console.log(`\n📊 Verification Summary:`);
  console.log(`✅ Passed: ${passed}/${total} tests`);

  if (passed === total) {
    console.log(`🎉 All tests passed! Deployment is working correctly.`);
    return true;
  } else {
    console.log(`❌ ${total - passed} tests failed. Please check the deployment.`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.log(`
🔍 HolistiQ Deployment Verification

Usage:
  node scripts/verify-deployment.js <deployment-url>

Examples:
  node scripts/verify-deployment.js https://myholistiq.netlify.app
  node scripts/verify-deployment.js https://develop--myholistiq.netlify.app
    `);
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    console.error('❌ Invalid URL format:', error.message);
    process.exit(1);
  }

  const success = await verifyDeployment(url);
  process.exit(success ? 0 : 1);
}

// Run the script
main().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
