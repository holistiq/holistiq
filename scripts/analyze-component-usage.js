#!/usr/bin/env node

/**
 * Component Usage Analyzer
 * 
 * This script analyzes the codebase to determine if a specific component file 
 * is being imported or used anywhere in the project.
 * 
 * Usage:
 *   node analyze-component-usage.js [componentPath] [options]
 * 
 * Arguments:
 *   componentPath - Path to the component file to analyze (relative to project root)
 * 
 * Options:
 *   --verbose     - Show detailed information about each reference
 *   --help        - Show help information
 * 
 * Example:
 *   node analyze-component-usage.js src/components/dashboard/charts/components/MAInfoPopover.tsx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Parse command line arguments
const args = process.argv.slice(2);
let componentPath = '';
let verbose = false;

for (const arg of args) {
  if (arg === '--verbose') {
    verbose = true;
  } else if (arg === '--help') {
    showHelp();
    process.exit(0);
  } else if (!arg.startsWith('--')) {
    componentPath = arg;
  }
}

if (!componentPath) {
  console.error(`${colors.red}Error: Component path is required${colors.reset}`);
  showHelp();
  process.exit(1);
}

// Ensure the component path is absolute
const absoluteComponentPath = path.isAbsolute(componentPath) 
  ? componentPath 
  : path.resolve(projectRoot, componentPath);

// Check if the component file exists
if (!fs.existsSync(absoluteComponentPath)) {
  console.error(`${colors.red}Error: Component file not found: ${absoluteComponentPath}${colors.reset}`);
  process.exit(1);
}

// Extract component name from the file path
const componentFileName = path.basename(absoluteComponentPath);
const componentName = componentFileName.replace(/\.(tsx|jsx|js|ts)$/, '');

console.log(`${colors.bright}Analyzing usage of component: ${colors.cyan}${componentName}${colors.reset} (${componentPath})\n`);

// Directories to exclude from the search
const excludeDirs = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  'out',
];

// File extensions to include in the search
const includeExtensions = ['.ts', '.tsx', '.js', '.jsx'];

// Results storage
const references = [];
const imports = [];
let totalFiles = 0;

// Start the search
searchDirectory(projectRoot);

// Display results
displayResults();

/**
 * Recursively search a directory for files that reference the component
 * @param {string} dir - Directory to search
 */
function searchDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip excluded directories
    if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
      searchDirectory(fullPath);
      continue;
    }
    
    // Skip non-matching file extensions
    if (entry.isFile() && includeExtensions.includes(path.extname(entry.name))) {
      // Skip the component file itself
      if (fullPath === absoluteComponentPath) {
        continue;
      }
      
      totalFiles++;
      analyzeFile(fullPath);
    }
  }
}

/**
 * Analyze a file for references to the component
 * @param {string} filePath - Path to the file to analyze
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativeFilePath = path.relative(projectRoot, filePath);
    
    // Check for import statements
    const importRegex = new RegExp(`import\\s+{[^}]*\\b${componentName}\\b[^}]*}\\s+from|import\\s+${componentName}\\s+from`);
    const namedImportRegex = new RegExp(`import\\s+{[^}]*\\b${componentName}\\b[^}]*}\\s+from`);
    const defaultImportRegex = new RegExp(`import\\s+${componentName}\\s+from`);
    
    // Check for JSX usage
    const jsxRegex = new RegExp(`<${componentName}\\s|<${componentName}>|<${componentName}\\s*\\/>`);
    
    // Check for references to the component name in the file
    const referenceRegex = new RegExp(`\\b${componentName}\\b`);
    
    let hasImport = false;
    let hasJsxUsage = false;
    let hasReference = false;
    let importLines = [];
    let usageLines = [];
    
    lines.forEach((line, index) => {
      if (namedImportRegex.test(line) || defaultImportRegex.test(line)) {
        hasImport = true;
        importLines.push({ lineNumber: index + 1, content: line.trim() });
      } else if (jsxRegex.test(line)) {
        hasJsxUsage = true;
        usageLines.push({ lineNumber: index + 1, content: line.trim() });
      } else if (referenceRegex.test(line)) {
        hasReference = true;
        usageLines.push({ lineNumber: index + 1, content: line.trim() });
      }
    });
    
    if (hasImport) {
      imports.push({
        filePath: relativeFilePath,
        importLines,
        hasJsxUsage,
        usageLines,
      });
    } else if (hasReference) {
      references.push({
        filePath: relativeFilePath,
        usageLines,
      });
    }
  } catch (error) {
    console.error(`${colors.red}Error analyzing file ${filePath}: ${error.message}${colors.reset}`);
  }
}

/**
 * Display the analysis results
 */
function displayResults() {
  console.log(`${colors.bright}Files analyzed: ${colors.reset}${totalFiles}`);
  
  if (imports.length === 0 && references.length === 0) {
    console.log(`\n${colors.yellow}No references found to ${componentName}${colors.reset}`);
    console.log(`\n${colors.red}${colors.bright}RESULT: ${colors.reset}${colors.red}This component appears to be dead code and can likely be removed.${colors.reset}`);
    return;
  }
  
  // Display import results
  console.log(`\n${colors.bright}Files that import ${componentName}: ${colors.reset}${imports.length}`);
  
  if (imports.length > 0) {
    imports.forEach((item, index) => {
      console.log(`\n${colors.bright}${index + 1}. ${colors.green}${item.filePath}${colors.reset}`);
      
      if (verbose) {
        item.importLines.forEach(line => {
          console.log(`   ${colors.dim}Line ${line.lineNumber}:${colors.reset} ${line.content}`);
        });
      }
      
      if (item.hasJsxUsage) {
        console.log(`   ${colors.green}✓ Component is used in JSX${colors.reset}`);
        
        if (verbose) {
          item.usageLines.forEach(line => {
            console.log(`   ${colors.dim}Line ${line.lineNumber}:${colors.reset} ${line.content}`);
          });
        }
      } else {
        console.log(`   ${colors.yellow}⚠ Component is imported but no JSX usage found${colors.reset}`);
      }
    });
  }
  
  // Display reference results
  if (references.length > 0) {
    console.log(`\n${colors.bright}Files that reference ${componentName} without importing: ${colors.reset}${references.length}`);
    
    references.forEach((item, index) => {
      console.log(`\n${colors.bright}${index + 1}. ${colors.blue}${item.filePath}${colors.reset}`);
      
      if (verbose) {
        item.usageLines.forEach(line => {
          console.log(`   ${colors.dim}Line ${line.lineNumber}:${colors.reset} ${line.content}`);
        });
      }
    });
  }
  
  // Determine if the component is actively used
  const activelyUsed = imports.some(item => item.hasJsxUsage);
  
  if (activelyUsed) {
    console.log(`\n${colors.green}${colors.bright}RESULT: ${colors.reset}${colors.green}This component is actively used in the project.${colors.reset}`);
  } else if (imports.length > 0) {
    console.log(`\n${colors.yellow}${colors.bright}RESULT: ${colors.reset}${colors.yellow}This component is imported but might not be actively used.${colors.reset}`);
    console.log(`${colors.yellow}Consider checking the import locations to verify usage.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}RESULT: ${colors.reset}${colors.yellow}This component is referenced but not imported directly.${colors.reset}`);
    console.log(`${colors.yellow}It might be used through dynamic imports or string references.${colors.reset}`);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.bright}Component Usage Analyzer${colors.reset}

This script analyzes the codebase to determine if a specific component file 
is being imported or used anywhere in the project.

${colors.bright}Usage:${colors.reset}
  node analyze-component-usage.js [componentPath] [options]

${colors.bright}Arguments:${colors.reset}
  componentPath - Path to the component file to analyze (relative to project root)

${colors.bright}Options:${colors.reset}
  --verbose     - Show detailed information about each reference
  --help        - Show this help information

${colors.bright}Example:${colors.reset}
  node analyze-component-usage.js src/components/dashboard/charts/components/MAInfoPopover.tsx
  `);
}
