#!/usr/bin/env node

/**
 * Android Build Script
 *
 * Usage:
 *   node scripts/android-build.js local  - Live reload with local dev server
 *   node scripts/android-build.js dev    - Build dev app (GCP dev backend)
 *   node scripts/android-build.js prod   - Build prod app (GCP prod backend)
 */

import { readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendDir = join(__dirname, '..');
const configPath = join(frontendDir, 'capacitor.config.json');

// Environment configurations
const configs = {
  local: {
    appId: 'io.sammy.app.local',
    appName: 'Sammy Local',
    webDir: 'dist',
    server: {
      url: 'http://10.0.2.2:4000',
      cleartext: true
    }
  },
  dev: {
    appId: 'io.sammy.app.dev',
    appName: 'Sammy Dev',
    webDir: 'dist',
    server: {
      androidScheme: 'https'
    }
  },
  prod: {
    appId: 'io.sammy.app',
    appName: 'Sammy',
    webDir: 'dist',
    server: {
      androidScheme: 'https'
    }
  }
};

// Get environment from command line
const env = process.argv[2];

if (!env || !configs[env]) {
  console.error('Usage: node scripts/android-build.js <local|dev|prod>');
  console.error('  local - Live reload with local dev server');
  console.error('  dev   - Build dev app (GCP dev backend)');
  console.error('  prod  - Build prod app (GCP prod backend)');
  process.exit(1);
}

// Save original config for restoration
const originalConfig = readFileSync(configPath, 'utf-8');

// Write the new config
function writeConfig() {
  const config = configs[env];
  console.log(`\n📱 Configuring for ${env.toUpperCase()} environment:`);
  console.log(`   App ID: ${config.appId}`);
  console.log(`   App Name: ${config.appName}`);
  console.log(`   Android Flavor: ${env}`);
  if (config.server.url) {
    console.log(`   Server: ${config.server.url}`);
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Restore original config
function restoreConfig() {
  console.log('\n🔄 Restoring original capacitor.config.json...');
  writeFileSync(configPath, originalConfig);
}

// Run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Running: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true,
      ...options
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

// Main execution
async function main() {
  writeConfig();

  // Handle cleanup on exit
  const cleanup = () => {
    restoreConfig();
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    // Android flavor matches environment name (local, dev, prod)
    const flavor = env;

    if (env === 'local') {
      // Local mode: just run the app with live reload
      console.log('\n⚡ Starting Android with live reload...');
      console.log('   Make sure "npm run dev:local" is running in another terminal!\n');
      await runCommand('npx', ['cap', 'run', 'android', '--flavor', flavor, '--live-reload', '--port', '4000']);
    } else {
      // Dev/Prod mode: build and sync
      const mode = env === 'dev' ? 'dev' : 'production';
      console.log(`\n🔨 Building for ${mode} mode...`);
      await runCommand('npm', ['run', 'build', '--', '--mode', mode]);

      console.log('\n📦 Syncing to Android...');
      await runCommand('npx', ['cap', 'sync', 'android', '--flavor', flavor]);

      console.log(`\n✅ Build complete! Open Android Studio and select "${flavor}Debug" variant:`);
      console.log('   npx cap open android\n');
    }
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    restoreConfig();
    process.exit(1);
  }

  // For non-local builds, restore config after completion
  if (env !== 'local') {
    restoreConfig();
  }
}

main();
