#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DESIGN_DIR = path.resolve(PROJECT_ROOT, '..', 'design');
const ANDROID_RES = path.resolve(PROJECT_ROOT, 'android', 'app', 'src', 'main', 'res');

// Color scheme
const COLORS = {
  light: '#f8fafc', // slate-50
  dark: '#0f172a',  // slate-900
};

// Density buckets for app icons
const ICON_DENSITIES = {
  mdpi: { size: 48, foregroundSize: 72 },
  hdpi: { size: 72, foregroundSize: 108 },
  xhdpi: { size: 96, foregroundSize: 144 },
  xxhdpi: { size: 144, foregroundSize: 216 },
  xxxhdpi: { size: 192, foregroundSize: 324 },
};

// Splash screen sizes (portrait and landscape)
const SPLASH_SIZES = {
  mdpi: { portrait: { width: 320, height: 480 }, landscape: { width: 480, height: 320 }, logoSize: 96 },
  hdpi: { portrait: { width: 480, height: 800 }, landscape: { width: 800, height: 480 }, logoSize: 144 },
  xhdpi: { portrait: { width: 720, height: 1280 }, landscape: { width: 1280, height: 720 }, logoSize: 192 },
  xxhdpi: { portrait: { width: 1080, height: 1920 }, landscape: { width: 1920, height: 1080 }, logoSize: 288 },
  xxxhdpi: { portrait: { width: 1440, height: 2560 }, landscape: { width: 2560, height: 1440 }, logoSize: 384 },
};

// Android 12+ splash icon size
const ANDROID_12_SPLASH_SIZE = 288;

/**
 * Get the source logo path from design directory
 */
function getSourceLogo(size) {
  return path.join(DESIGN_DIR, `sammy_logo_${size}.png`);
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create a circular mask for round icons
 */
async function createRoundIcon(inputPath, outputPath, size) {
  const circle = Buffer.from(
    `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
  );

  await sharp(inputPath)
    .resize(size, size)
    .composite([
      {
        input: circle,
        blend: 'dest-in',
      },
    ])
    .png()
    .toFile(outputPath);
}

/**
 * Generate app icons for all densities
 */
async function generateAppIcons() {
  console.log('\n📱 Generating app icons...');

  for (const [density, sizes] of Object.entries(ICON_DENSITIES)) {
    const mipmapDir = path.join(ANDROID_RES, `mipmap-${density}`);
    ensureDir(mipmapDir);

    // Standard launcher icon
    const standardSource = getSourceLogo(sizes.size);
    const standardDest = path.join(mipmapDir, 'ic_launcher.png');

    if (fs.existsSync(standardSource)) {
      await sharp(standardSource)
        .resize(sizes.size, sizes.size)
        .png()
        .toFile(standardDest);
      console.log(`  ✓ ${density}/ic_launcher.png (${sizes.size}x${sizes.size})`);
    } else {
      // Scale from 512px if exact size doesn't exist
      const fallbackSource = getSourceLogo(512);
      await sharp(fallbackSource)
        .resize(sizes.size, sizes.size)
        .png()
        .toFile(standardDest);
      console.log(`  ✓ ${density}/ic_launcher.png (${sizes.size}x${sizes.size}) [scaled from 512px]`);
    }

    // Round launcher icon (with circular mask)
    const roundDest = path.join(mipmapDir, 'ic_launcher_round.png');
    await createRoundIcon(standardDest, roundDest, sizes.size);
    console.log(`  ✓ ${density}/ic_launcher_round.png (${sizes.size}x${sizes.size})`);

    // Adaptive icon foreground (33% larger)
    const foregroundDest = path.join(mipmapDir, 'ic_launcher_foreground.png');

    // Check if we have the exact foreground size
    const foregroundSource = getSourceLogo(sizes.foregroundSize);
    if (fs.existsSync(foregroundSource)) {
      await sharp(foregroundSource)
        .resize(sizes.foregroundSize, sizes.foregroundSize)
        .png()
        .toFile(foregroundDest);
      console.log(`  ✓ ${density}/ic_launcher_foreground.png (${sizes.foregroundSize}x${sizes.foregroundSize})`);
    } else {
      // Scale from 512px source
      const fallbackSource = getSourceLogo(512);
      await sharp(fallbackSource)
        .resize(sizes.foregroundSize, sizes.foregroundSize)
        .png()
        .toFile(foregroundDest);
      console.log(`  ✓ ${density}/ic_launcher_foreground.png (${sizes.foregroundSize}x${sizes.foregroundSize}) [scaled from 512px]`);
    }
  }
}

/**
 * Create a splash screen with centered logo on colored background
 */
async function createSplashScreen(logoSize, width, height, backgroundColor, outputPath) {
  // Load and resize logo
  const logoSource = getSourceLogo(logoSize);
  let logoBuffer;

  if (fs.existsSync(logoSource)) {
    logoBuffer = await sharp(logoSource)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();
  } else {
    // Scale from 512px if exact size doesn't exist
    logoBuffer = await sharp(getSourceLogo(512))
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();
  }

  // Create background with centered logo
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([
      {
        input: logoBuffer,
        top: Math.floor((height - logoSize) / 2),
        left: Math.floor((width - logoSize) / 2),
      },
    ])
    .png()
    .toFile(outputPath);
}

/**
 * Generate legacy splash screens (API < 31)
 */
async function generateLegacySplashScreens() {
  console.log('\n🎨 Generating legacy splash screens (API < 31)...');

  for (const [density, dimensions] of Object.entries(SPLASH_SIZES)) {
    // Light mode - Portrait
    const portLightDir = path.join(ANDROID_RES, `drawable-port-${density}`);
    ensureDir(portLightDir);
    const portLightPath = path.join(portLightDir, 'splash.png');
    await createSplashScreen(
      dimensions.logoSize,
      dimensions.portrait.width,
      dimensions.portrait.height,
      COLORS.light,
      portLightPath
    );
    console.log(`  ✓ ${density}/portrait/light (${dimensions.portrait.width}x${dimensions.portrait.height})`);

    // Dark mode - Portrait
    const portDarkDir = path.join(ANDROID_RES, `drawable-night-port-${density}`);
    ensureDir(portDarkDir);
    const portDarkPath = path.join(portDarkDir, 'splash.png');
    await createSplashScreen(
      dimensions.logoSize,
      dimensions.portrait.width,
      dimensions.portrait.height,
      COLORS.dark,
      portDarkPath
    );
    console.log(`  ✓ ${density}/portrait/dark (${dimensions.portrait.width}x${dimensions.portrait.height})`);

    // Light mode - Landscape
    const landLightDir = path.join(ANDROID_RES, `drawable-land-${density}`);
    ensureDir(landLightDir);
    const landLightPath = path.join(landLightDir, 'splash.png');
    await createSplashScreen(
      dimensions.logoSize,
      dimensions.landscape.width,
      dimensions.landscape.height,
      COLORS.light,
      landLightPath
    );
    console.log(`  ✓ ${density}/landscape/light (${dimensions.landscape.width}x${dimensions.landscape.height})`);

    // Dark mode - Landscape
    const landDarkDir = path.join(ANDROID_RES, `drawable-night-land-${density}`);
    ensureDir(landDarkDir);
    const landDarkPath = path.join(landDarkDir, 'splash.png');
    await createSplashScreen(
      dimensions.logoSize,
      dimensions.landscape.width,
      dimensions.landscape.height,
      COLORS.dark,
      landDarkPath
    );
    console.log(`  ✓ ${density}/landscape/dark (${dimensions.landscape.width}x${dimensions.landscape.height})`);
  }
}

/**
 * Generate Android 12+ splash icons (API 31+)
 */
async function generateAndroid12SplashIcons() {
  console.log('\n✨ Generating Android 12+ splash icons (API 31+)...');

  // Light mode
  const lightDir = path.join(ANDROID_RES, 'drawable-v31');
  ensureDir(lightDir);
  const lightPath = path.join(lightDir, 'splash_icon.png');

  const logoSource = getSourceLogo(ANDROID_12_SPLASH_SIZE);
  if (fs.existsSync(logoSource)) {
    await sharp(logoSource)
      .resize(ANDROID_12_SPLASH_SIZE, ANDROID_12_SPLASH_SIZE)
      .png()
      .toFile(lightPath);
  } else {
    await sharp(getSourceLogo(512))
      .resize(ANDROID_12_SPLASH_SIZE, ANDROID_12_SPLASH_SIZE)
      .png()
      .toFile(lightPath);
  }
  console.log(`  ✓ drawable-v31/splash_icon.png (${ANDROID_12_SPLASH_SIZE}x${ANDROID_12_SPLASH_SIZE})`);

  // Dark mode
  const darkDir = path.join(ANDROID_RES, 'drawable-v31-night');
  ensureDir(darkDir);
  const darkPath = path.join(darkDir, 'splash_icon.png');

  if (fs.existsSync(logoSource)) {
    await sharp(logoSource)
      .resize(ANDROID_12_SPLASH_SIZE, ANDROID_12_SPLASH_SIZE)
      .png()
      .toFile(darkPath);
  } else {
    await sharp(getSourceLogo(512))
      .resize(ANDROID_12_SPLASH_SIZE, ANDROID_12_SPLASH_SIZE)
      .png()
      .toFile(darkPath);
  }
  console.log(`  ✓ drawable-v31-night/splash_icon.png (${ANDROID_12_SPLASH_SIZE}x${ANDROID_12_SPLASH_SIZE})`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Generating Android assets from design/ directory...\n');
  console.log(`Design directory: ${DESIGN_DIR}`);
  console.log(`Android res directory: ${ANDROID_RES}`);

  try {
    await generateAppIcons();
    await generateLegacySplashScreens();
    await generateAndroid12SplashIcons();

    console.log('\n✅ All Android assets generated successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npx cap sync android');
    console.log('  2. Build and test: npm run android:local');
  } catch (error) {
    console.error('\n❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
