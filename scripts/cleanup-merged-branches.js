#!/usr/bin/env node

/**
 * Git Branch Cleanup Script
 * 
 * This script helps clean up merged branches safely by:
 * 1. Identifying branches that have been merged to main
 * 2. Excluding protected branches (main, develop)
 * 3. Providing a dry-run option to preview changes
 * 4. Cleaning up both local and remote branches
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

// Configuration
const PROTECTED_BRANCHES = ['main', 'develop', 'master'];
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-n');

console.log(chalk.blue.bold('🧹 Git Branch Cleanup Script'));
console.log(chalk.gray('Cleaning up merged branches...'));

if (DRY_RUN) {
  console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made'));
}

console.log('');

/**
 * Execute a git command and return the output
 */
function gitCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(chalk.red(`Error executing: ${command}`));
    console.error(chalk.red(error.message));
    return '';
  }
}

/**
 * Get list of branches merged into main
 */
function getMergedBranches() {
  const output = gitCommand('git branch --merged main');
  return output
    .split('\n')
    .map(branch => branch.trim().replace(/^\*\s*/, ''))
    .filter(branch => branch && !PROTECTED_BRANCHES.includes(branch));
}

/**
 * Get list of remote branches
 */
function getRemoteBranches() {
  const output = gitCommand('git ls-remote --heads origin');
  return output
    .split('\n')
    .map(line => {
      const match = line.match(/refs\/heads\/(.+)$/);
      return match ? match[1] : null;
    })
    .filter(branch => branch && !PROTECTED_BRANCHES.includes(branch));
}

/**
 * Delete local branches
 */
function deleteLocalBranches(branches) {
  if (branches.length === 0) {
    console.log(chalk.green('✅ No local branches to delete'));
    return;
  }

  console.log(chalk.blue('🗑️  Local branches to delete:'));
  branches.forEach(branch => {
    console.log(chalk.gray(`  - ${branch}`));
  });

  if (!DRY_RUN) {
    try {
      const command = `git branch -d ${branches.join(' ')}`;
      const result = gitCommand(command);
      console.log(chalk.green('✅ Local branches deleted successfully'));
      if (result) {
        console.log(chalk.gray(result));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error deleting local branches'));
    }
  }
}

/**
 * Delete remote branches
 */
function deleteRemoteBranches(branches) {
  const remoteBranches = getRemoteBranches();
  const branchesToDelete = branches.filter(branch => remoteBranches.includes(branch));

  if (branchesToDelete.length === 0) {
    console.log(chalk.green('✅ No remote branches to delete'));
    return;
  }

  console.log(chalk.blue('🌐 Remote branches to delete:'));
  branchesToDelete.forEach(branch => {
    console.log(chalk.gray(`  - origin/${branch}`));
  });

  if (!DRY_RUN) {
    try {
      const command = `git push origin --delete ${branchesToDelete.join(' ')}`;
      const result = gitCommand(command);
      console.log(chalk.green('✅ Remote branches deleted successfully'));
      if (result) {
        console.log(chalk.gray(result));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error deleting remote branches'));
    }
  }
}

/**
 * Prune remote tracking branches
 */
function pruneRemoteTrackingBranches() {
  console.log(chalk.blue('🔄 Pruning remote tracking branches...'));
  
  if (!DRY_RUN) {
    try {
      const result = gitCommand('git remote prune origin');
      console.log(chalk.green('✅ Remote tracking branches pruned'));
      if (result) {
        console.log(chalk.gray(result));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error pruning remote tracking branches'));
    }
  }
}

/**
 * Main execution
 */
function main() {
  try {
    // Ensure we're in a git repository
    gitCommand('git rev-parse --git-dir');

    // Update local repository
    console.log(chalk.blue('📡 Fetching latest changes...'));
    if (!DRY_RUN) {
      gitCommand('git fetch origin');
    }

    // Get merged branches
    const mergedBranches = getMergedBranches();
    
    console.log('');
    console.log(chalk.blue.bold('📊 Analysis Results:'));
    console.log(chalk.gray(`Protected branches: ${PROTECTED_BRANCHES.join(', ')}`));
    console.log(chalk.gray(`Merged branches found: ${mergedBranches.length}`));
    
    if (mergedBranches.length === 0) {
      console.log(chalk.green('🎉 No merged branches to clean up!'));
      return;
    }

    console.log('');

    // Delete local branches
    deleteLocalBranches(mergedBranches);
    console.log('');

    // Delete remote branches
    deleteRemoteBranches(mergedBranches);
    console.log('');

    // Prune remote tracking branches
    pruneRemoteTrackingBranches();

    console.log('');
    console.log(chalk.green.bold('✨ Branch cleanup completed!'));
    
    if (DRY_RUN) {
      console.log('');
      console.log(chalk.yellow('To actually perform the cleanup, run:'));
      console.log(chalk.cyan('node scripts/cleanup-merged-branches.js'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error: Not in a git repository or git not available'));
    process.exit(1);
  }
}

// Run the script
main();
