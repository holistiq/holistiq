#!/usr/bin/env node

/**
 * Authentication Flow Testing Script
 *
 * This script helps diagnose authentication issues and test the logout intent system.
 * Run this script to check if all authentication components are properly configured.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🔍 Authentication Flow Diagnostic\n");

// Check if required files exist
const requiredFiles = [
  "src/services/sessionManager.ts",
  "src/hooks/useSupabaseAuth.ts",
  "src/hooks/useAuthNavigation.ts",
  "src/pages/auth/EnhancedSignIn.tsx",
  "src/utils/auth/logoutIntentUtils.ts",
  "src/utils/auth/index.ts",
  "src/services/directGoogleAuth.ts",
];

console.log("📁 Checking required files...");
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = join(projectRoot, file);
  const exists = existsSync(filePath);
  console.log(`${exists ? "✅" : "❌"} ${file}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.log("\n❌ Some required files are missing!");
  process.exit(1);
}

console.log("\n📋 Checking imports and exports...");

// Check if logout intent utilities are properly exported
try {
  const authIndexPath = join(projectRoot, "src/utils/auth/index.ts");
  const authIndexContent = readFileSync(authIndexPath, "utf8");

  if (authIndexContent.includes('export * from "./logoutIntentUtils"')) {
    console.log("✅ Auth utilities properly exported");
  } else {
    console.log("❌ Auth utilities export missing");
  }
} catch (error) {
  console.log("❌ Error checking auth utilities export:", error.message);
}

// Check if EnhancedSignIn has the required imports
try {
  const signInPath = join(projectRoot, "src/pages/auth/EnhancedSignIn.tsx");
  const signInContent = readFileSync(signInPath, "utf8");

  const hasLogoutIntentImport =
    signInContent.includes("shouldShowSignedOutWarning") &&
    signInContent.includes("clearLogoutIntent") &&
    signInContent.includes('from "@/utils/auth"');

  if (hasLogoutIntentImport) {
    console.log("✅ EnhancedSignIn has required imports");
  } else {
    console.log("❌ EnhancedSignIn missing logout intent imports");
  }

  const hasUsage =
    signInContent.includes("shouldShowSignedOutWarning()") &&
    signInContent.includes("clearLogoutIntent()");

  if (hasUsage) {
    console.log("✅ EnhancedSignIn uses logout intent functions");
  } else {
    console.log("❌ EnhancedSignIn not using logout intent functions");
  }
} catch (error) {
  console.log("❌ Error checking EnhancedSignIn:", error.message);
}

// Check sessionManager signOut method signature
try {
  const sessionManagerPath = join(
    projectRoot,
    "src/services/sessionManager.ts",
  );
  const sessionManagerContent = readFileSync(sessionManagerPath, "utf8");

  if (sessionManagerContent.includes("signOut(isManual: boolean = true)")) {
    console.log("✅ SessionManager has enhanced signOut method");
  } else {
    console.log("❌ SessionManager signOut method not updated");
  }

  if (sessionManagerContent.includes("MANUAL_LOGOUT")) {
    console.log("✅ SessionManager has MANUAL_LOGOUT action");
  } else {
    console.log("❌ SessionManager missing MANUAL_LOGOUT action");
  }
} catch (error) {
  console.log("❌ Error checking SessionManager:", error.message);
}

// Check useSupabaseAuth signOut call
try {
  const useSupabaseAuthPath = join(projectRoot, "src/hooks/useSupabaseAuth.ts");
  const useSupabaseAuthContent = readFileSync(useSupabaseAuthPath, "utf8");

  if (useSupabaseAuthContent.includes("sessionManager.signOut(true)")) {
    console.log("✅ useSupabaseAuth calls signOut with manual flag");
  } else {
    console.log("❌ useSupabaseAuth not updated for manual logout");
  }
} catch (error) {
  console.log("❌ Error checking useSupabaseAuth:", error.message);
}

// Check useAuthNavigation
try {
  const useAuthNavigationPath = join(
    projectRoot,
    "src/hooks/useAuthNavigation.ts",
  );
  const useAuthNavigationContent = readFileSync(useAuthNavigationPath, "utf8");

  if (
    useAuthNavigationContent.includes("sessionManager") &&
    useAuthNavigationContent.includes("getLogoutIntent")
  ) {
    console.log("✅ useAuthNavigation has logout intent logic");
  } else {
    console.log("❌ useAuthNavigation missing logout intent logic");
  }
} catch (error) {
  console.log("❌ Error checking useAuthNavigation:", error.message);
}

console.log("\n🔧 Environment Check...");

// Check environment variables
const requiredEnvVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} is set`);
  } else {
    console.log(`❌ ${envVar} is missing`);
  }
}

console.log("\n🧪 Testing Recommendations...");
console.log("1. Open browser to http://localhost:8080/signin");
console.log("2. Open browser console (F12) and check for errors");
console.log("3. Try signing in with Google");
console.log("4. Check console for authentication flow messages");
console.log("5. Test logout and page refresh behavior");

console.log("\n📝 Manual Test Scenarios:");
console.log("• Manual logout + page refresh (should NOT show warning)");
console.log("• Session expiration (should show warning)");
console.log("• Cross-tab logout behavior");
console.log("• Storage persistence across page refreshes");

console.log("\n✅ Diagnostic complete!");
console.log(
  "If sign-in is still not working, check the browser console for specific error messages.",
);
