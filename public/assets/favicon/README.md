# Holistiq Favicons

This directory contains the favicon files for the Holistiq application.

## Files

- `favicon.svg` - The main SVG favicon that can scale to any size
- `favicon-16x16.png` - 16x16 PNG favicon for older browsers
- `favicon-32x32.png` - 32x32 PNG favicon for older browsers
- `favicon-48x48.png` - 48x48 PNG favicon for Windows tiles
- `favicon-192x192.png` - 192x192 PNG favicon for Android devices
- `favicon-512x512.png` - 512x512 PNG favicon for PWA icons

## Generating PNG Favicons

The PNG favicons can be generated from the SVG file using the script in `scripts/generate-favicons.js`. To use this script:

1. Install the required dependency:
   ```
   npm install sharp
   ```

2. Run the script:
   ```
   node scripts/generate-favicons.js
   ```

This will generate all the PNG favicon files in the correct sizes.

## Usage in HTML

The favicons are referenced in the `index.html` file with the following tags:

```html
<link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg" />
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon/favicon-48x48.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/favicon-192x192.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon/favicon-192x192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/assets/favicon/favicon-512x512.png" />
```

## PWA Support

The favicons are also referenced in the `manifest.json` file for PWA support.

## Design Guidelines

When creating a new favicon design:

1. Start with the SVG file to ensure scalability
2. Use the brand's primary color (#7c3aed)
3. Keep the design simple and recognizable at small sizes
4. Generate PNG versions in all required sizes
5. Update both the HTML references and the manifest.json file
