#!/usr/bin/env node

/**
 * Netlify Deployment Script for HolistiQ
 *
 * This script provides programmatic deployment capabilities using Netlify CLI
 * and can be integrated with MCP (Model Context Protocol) systems.
 */

import { spawn } from "child_process";
import { config } from "dotenv";

// Load environment variables
config();

/**
 * Execute shell command and return promise
 */
function execCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(" ")}`);

    const process = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Check if Netlify CLI is installed
 */
async function checkNetlifyCLI() {
  try {
    await execCommand("netlify", ["--version"]);
    console.log("✅ Netlify CLI is installed");
    return true;
  } catch (error) {
    console.error("❌ Netlify CLI is not installed");
    console.error("Install it with: npm install -g netlify-cli");
    console.error("Then login with: netlify login");
    return false;
  }
}

/**
 * Check if user is logged in to Netlify
 */
async function checkNetlifyAuth() {
  try {
    await execCommand("netlify", ["status"]);
    console.log("✅ Logged in to Netlify");
    return true;
  } catch (error) {
    console.error("❌ Not logged in to Netlify");
    console.error("Login with: netlify login");
    return false;
  }
}

/**
 * Deploy to Netlify
 */
async function deploy(environment = "preview") {
  console.log(`🚀 Starting deployment to Netlify (${environment})...`);

  try {
    // Check prerequisites
    const hasNetlifyCLI = await checkNetlifyCLI();
    if (!hasNetlifyCLI) {
      process.exit(1);
    }

    const isLoggedIn = await checkNetlifyAuth();
    if (!isLoggedIn) {
      process.exit(1);
    }

    // Validate environment
    console.log("🔍 Validating environment variables...");
    await execCommand("npm", ["run", "validate-env"]);

    // Run linting
    console.log("🔍 Running linting...");
    await execCommand("npm", ["run", "lint"]);

    // Run type checking
    console.log("🔍 Running type check...");
    await execCommand("npm", ["run", "type-check"]);

    // Build locally to verify
    console.log("🔨 Building application...");
    await execCommand("npm", ["run", "build"]);

    // Deploy to Netlify
    console.log(`🚀 Deploying to Netlify (${environment})...`);
    const deployArgs =
      environment === "production" ? ["deploy", "--prod"] : ["deploy"];
    await execCommand("netlify", deployArgs);

    console.log("✅ Deployment completed successfully!");

    // Get site info
    console.log("📊 Getting site info...");
    await execCommand("netlify", ["status"]);
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

/**
 * Get deployment status
 */
async function getStatus() {
  try {
    console.log("📊 Getting Netlify site status...");
    await execCommand("netlify", ["status"]);

    console.log("\n📋 Recent deployments:");
    await execCommand("netlify", ["deploy", "--help"]);
  } catch (error) {
    console.error("❌ Failed to get status:", error.message);
    process.exit(1);
  }
}

/**
 * Get deployment logs
 */
async function getLogs() {
  try {
    console.log("📋 Getting deployment logs...");
    await execCommand("netlify", ["logs"]);
  } catch (error) {
    console.error("❌ Failed to get logs:", error.message);
    process.exit(1);
  }
}

/**
 * Open site in browser
 */
async function openSite() {
  try {
    console.log("🌐 Opening site in browser...");
    await execCommand("netlify", ["open"]);
  } catch (error) {
    console.error("❌ Failed to open site:", error.message);
    process.exit(1);
  }
}

/**
 * Initialize Netlify site
 */
async function init() {
  try {
    console.log("🔧 Initializing Netlify site...");
    await execCommand("netlify", ["init"]);
  } catch (error) {
    console.error("❌ Failed to initialize:", error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "deploy":
      const environment = args[1] || "preview";
      await deploy(environment);
      break;

    case "status":
      await getStatus();
      break;

    case "logs":
      await getLogs();
      break;

    case "open":
      await openSite();
      break;

    case "init":
      await init();
      break;

    case "help":
    default:
      console.log(`
🚀 HolistiQ Netlify Deployment Script

Usage:
  node scripts/deploy-netlify.js <command> [options]

Commands:
  deploy [environment]  Deploy to Netlify (preview|production)
  status               Get site status and info
  logs                 Get deployment logs
  open                 Open site in browser
  init                 Initialize Netlify site
  help                 Show this help message

Examples:
  node scripts/deploy-netlify.js deploy preview
  node scripts/deploy-netlify.js deploy production
  node scripts/deploy-netlify.js status
  node scripts/deploy-netlify.js open

Prerequisites:
  1. Install Netlify CLI: npm install -g netlify-cli
  2. Login to Netlify: netlify login
  3. Initialize site: node scripts/deploy-netlify.js init
      `);
      break;
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error.message);
  process.exit(1);
});
