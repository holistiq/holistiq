#!/usr/bin/env node

/**
 * Script to find potentially unused files in the src directory
 * 
 * This script analyzes imports across the codebase to identify files that aren't imported anywhere.
 * It's a heuristic approach and may have false positives, especially for files that are:
 * - Dynamically imported
 * - Referenced in ways other than imports (e.g., through webpack requires)
 * - Entry points like pages that are referenced in router configurations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_PATTERNS = [
  /\.d\.ts$/,  // Type declaration files
  /\.test\./,  // Test files
  /\.spec\./,  // Spec files
  /\/tests\//,  // Files in test directories
  /\/__tests__\//,  // Files in __tests__ directories
  /\/node_modules\//,  // Files in node_modules
  /index\.(ts|tsx|js|jsx)$/,  // Index files (often just re-export)
  /vite-env\.d\.ts$/,  // Vite environment types
];

// Special files that are entry points or used in ways other than imports
const SPECIAL_FILES = [
  'main.tsx',  // Main entry point
  'App.tsx',   // Main App component
  'vite-env.d.ts',  // Vite environment types
];

// Files that are referenced in App.tsx routes
const ROUTE_COMPONENTS = [
  'Index',
  'OAuthCallbackHandler',
  'NotFound',
  'EnhancedSignIn',
  'HowItWorks',
  'FaqPage',
  'Onboarding',
  'BaselineTest',
  'BaselineAnalysis',
  'Dashboard',
  'EnhancedProfile',
  'TakeTest',
  'ReactionTimeTestPage',
  'TestSelection',
  'TestRouter',
  'Achievements',
  'LogSupplement',
  'EditSupplement',
  'Supplements',
  'SupplementEffectivenessReports',
  'LogWashoutPeriod',
  'WashoutPeriods',
  'WashoutPeriodGuide',
  'LogConfoundingFactor',
  'ConfoundingFactors',
  'StatisticalSignificance',
  'TemporalAnalysis',
  'ComparativeVisualization',
  'Terms',
  'Privacy',
  'Disclaimer',
  'AboutUs',
  'Contact',
  'LineChartTest',
];

// Get all files in the src directory
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fileList = getAllFiles(filePath, fileList);
    } else if (EXTENSIONS.includes(path.extname(file)) && !IGNORE_PATTERNS.some(pattern => pattern.test(filePath))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract imports from a file
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  
  // Match ES6 imports
  const es6ImportRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^,]+|[^,{}\s*]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = es6ImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Match dynamic imports
  const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Resolve import path to file path
function resolveImportPath(importPath, currentFilePath) {
  // Handle absolute imports with @ alias
  if (importPath.startsWith('@/')) {
    return path.join(SRC_DIR, importPath.substring(2));
  }
  
  // Handle relative imports
  if (importPath.startsWith('.')) {
    return path.join(path.dirname(currentFilePath), importPath);
  }
  
  // External package imports are ignored
  return null;
}

// Normalize file path for comparison
function normalizePath(filePath) {
  // Remove extension
  let normalized = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
  
  // Handle index files
  if (normalized.endsWith('/index')) {
    normalized = normalized.substring(0, normalized.length - 6);
  }
  
  return normalized;
}

// Main function
function findUnusedFiles() {
  // Get all files
  const allFiles = getAllFiles(SRC_DIR);
  
  // Map of file paths to their normalized paths
  const filePathMap = {};
  
  // Set of all imported files
  const importedFiles = new Set();
  
  // Process each file to build the map and extract imports
  allFiles.forEach(filePath => {
    const normalizedPath = normalizePath(filePath);
    filePathMap[normalizedPath] = filePath;
    
    // Extract imports
    const imports = extractImports(filePath);
    
    // Resolve import paths
    imports.forEach(importPath => {
      const resolvedPath = resolveImportPath(importPath, filePath);
      
      if (resolvedPath) {
        const normalizedImport = normalizePath(resolvedPath);
        importedFiles.add(normalizedImport);
      }
    });
  });
  
  // Find files that aren't imported
  const unusedFiles = [];
  
  Object.entries(filePathMap).forEach(([normalizedPath, filePath]) => {
    const relativePath = path.relative(SRC_DIR, filePath);
    
    // Skip special files
    if (SPECIAL_FILES.some(specialFile => relativePath.endsWith(specialFile))) {
      return;
    }
    
    // Skip route components
    const fileName = path.basename(filePath, path.extname(filePath));
    if (ROUTE_COMPONENTS.includes(fileName)) {
      return;
    }
    
    // Check if the file is imported
    if (!importedFiles.has(normalizedPath)) {
      unusedFiles.push(relativePath);
    }
  });
  
  return unusedFiles;
}

// Run the script
const unusedFiles = findUnusedFiles();

console.log('Potentially unused files:');
unusedFiles.forEach(file => {
  console.log(`- ${file}`);
});
console.log(`\nFound ${unusedFiles.length} potentially unused files.`);
console.log('Note: This is a heuristic approach and may have false positives.');
