#!/usr/bin/env node

/**
 * Secret Detection Script
 *
 * This script checks files for potential hardcoded secrets or credentials.
 * It's used as a pre-commit hook to prevent accidentally committing secrets.
 */

import fs from 'fs';
import path from 'path';

// Patterns that might indicate hardcoded secrets
const secretPatterns = [
  // API keys, tokens, passwords
  /(['"])(?:api[_-]?key|secret[_-]?key|token|password|passwd|pwd|auth[_-]?token).*?\1\s*[:=]\s*(['"])[^\2]{8,}\2/i,

  // URLs with embedded credentials
  /(['"])https?:\/\/[^:]+:[^@]+@[^'"]+\1/i,

  // Supabase keys
  /(['"])eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\1/i,

  // AWS-like keys
  /(['"])[A-Z0-9]{20,}\1/i,

  // Private keys
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----/i
];

// Files to check (from git staged files)
const filesToCheck = process.argv.slice(2);

// Files and directories to ignore
const ignorePatterns = [
  /node_modules/,
  /\.env\.example/,
  /\.git\//,
  /\.husky\//,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.vercel\//,
  /dist\//,
  /\.next\//,
  /\.output\//
];

// Check if a file should be ignored
function shouldIgnore(filePath) {
  return ignorePatterns.some(pattern => pattern.test(filePath));
}

// Check if a file is a binary file
function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
    '.mp4', '.webm', '.mp3', '.wav', '.ogg',
    '.pdf', '.zip', '.tar', '.gz', '.7z',
    '.ttf', '.woff', '.woff2', '.eot', '.otf'
  ];
  return binaryExtensions.includes(ext);
}

let foundSecrets = false;

filesToCheck.forEach(file => {
  // Skip files that should be ignored
  if (shouldIgnore(file) || isBinaryFile(file)) {
    return;
  }

  try {
    const content = fs.readFileSync(file, 'utf8');

    secretPatterns.forEach(pattern => {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        console.error(`\n⚠️  Possible secret found in ${file}:`);
        matches.forEach(match => {
          // Mask the actual secret in the output
          const maskedMatch = match.replace(/(['"])[^\1]{4}.+?(?=\1)/, '$1****');
          console.error(`  ${maskedMatch}`);
        });
        foundSecrets = true;
      }
    });
  } catch (error) {
    console.error(`Error reading file ${file}: ${error.message}`);
  }
});

if (foundSecrets) {
  console.error('\n❌ Potential secrets found in commits. Please remove them and try again.');
  console.error('   If these are not actual secrets, you can modify the script or use:');
  console.error('   git commit --no-verify (use with caution!)\n');
  process.exit(1);
} else {
  console.log('✅ No secrets detected in the staged files.');
}
