# Holistiq Assets

This directory contains all the static assets used in the Holistiq application.

## Directory Structure

```
assets/
├── favicon/
│   ├── favicon.ico             # Main favicon file (16x16)
│   └── [future favicon files]  # Additional favicon sizes can be added here
├── images/
│   ├── hero/
│   │   └── cognitive-tracking.png  # Main hero image used on the homepage
│   ├── icons/
│   │   └── [app icons]         # Application icons can be added here
│   └── social/
│       └── og-image.png        # Open Graph image for social media sharing
└── README.md                   # This file
```

## Usage Guidelines

### Favicons

The favicon files are referenced in the `index.html` file and should be used for browser tabs and bookmarks.

### Hero Images

Hero images are used on the homepage and other key pages. They should be high-quality and represent the Holistiq brand.

### Social Media Images

Social media images are used for sharing on platforms like Twitter, Facebook, etc. They should be:
- 1200x630 pixels for optimal display
- Include the Holistiq logo and relevant text
- Have a clean, professional design

## Adding New Assets

When adding new assets:

1. Place them in the appropriate directory
2. Use descriptive filenames (e.g., `dashboard-chart.png` instead of `image1.png`)
3. Optimize images for web (compress without significant quality loss)
4. Update this README if adding new asset categories

## Image Optimization

All images should be optimized for web use:
- Use PNG for images with transparency or sharp details
- Use JPEG for photographs
- Consider WebP format for better compression
- Aim for file sizes under 200KB for hero images and under 100KB for other images
