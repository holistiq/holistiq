# HolistiQ Project Scripts

This directory contains utility scripts for the HolistiQ project.

## Component Usage Analyzer

The `analyze-component-usage.js` script helps you determine if a specific component is being used in the project. This is useful for identifying dead code or understanding component dependencies.

### Usage

```bash
node scripts/analyze-component-usage.js [componentPath] [options]
```

### Arguments

- `componentPath` - Path to the component file to analyze (relative to project root)

### Options

- `--verbose` - Show detailed information about each reference, including line numbers and content
- `--help` - Show help information

### Examples

Check if a component is being used:

```bash
node scripts/analyze-component-usage.js src/components/dashboard/charts/components/MAInfoPopover.tsx
```

Get detailed information about component usage:

```bash
node scripts/analyze-component-usage.js src/components/dashboard/charts/components/MAInfoPopover.tsx --verbose
```

### Output

The script provides the following information:

1. Total number of files analyzed
2. List of files that import the component
3. Whether the component is used in JSX in those files
4. List of files that reference the component without importing it
5. A conclusion about whether the component appears to be actively used

### How It Works

The script:

1. Recursively searches through all TypeScript/JavaScript files in the project
2. Looks for import statements that include the component name
3. Checks for JSX usage of the component
4. Identifies other references to the component name
5. Analyzes the results to determine if the component is actively used

### Excluded Directories

The script automatically excludes the following directories:
- node_modules
- dist
- build
- .git
- coverage
- .next
- out

### Supported File Extensions

The script analyzes files with the following extensions:
- .ts
- .tsx
- .js
- .jsx
