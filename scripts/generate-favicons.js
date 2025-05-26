#!/usr/bin/env node

/**
 * Generate PNG favicons from SVG
 *
 * This script generates PNG favicons in different sizes from an SVG file.
 * It requires the 'sharp' package to be installed.
 *
 * Usage:
 * npm install sharp
 * node scripts/generate-favicons.js
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 32, 48, 192, 512];
const svgPath = path.join(__dirname, "../public/assets/favicon/favicon.svg");
const outputDir = path.join(__dirname, "../public/assets/favicon");

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate PNG favicons for each size
async function generateFavicons() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);

      await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

      console.log(`Generated ${outputPath}`);
    }

    console.log("All favicons generated successfully!");
  } catch (error) {
    console.error("Error generating favicons:", error);
  }
}

generateFavicons();
