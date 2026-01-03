#!/usr/bin/env node

/**
 * Environment Setup Script
 * Creates .env files for local development
 *
 * Usage:
 *   npm run setup:env
 *   or
 *   node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.join(__dirname, '..');
const backendEnvPath = path.join(rootDir, 'backend', '.env');
const frontendEnvPath = path.join(rootDir, 'frontend', '.env.local');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

async function setupBackendEnv() {
    console.log('\n📦 Backend Environment Setup');
    console.log('================================\n');

    let firebaseServiceAccount = '';
    let geminiApiKey = '';
    let port = '4001';
    let nodeEnv = 'development';

    // Check if file already exists
    if (fs.existsSync(backendEnvPath)) {
        const overwrite = await question('⚠️  backend/.env already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Skipping backend/.env');
            return;
        }
    }

    console.log('\n1. Firebase Service Account JSON');
    console.log('   Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
    console.log('   Paste the entire JSON on one line:\n');

    while (!firebaseServiceAccount) {
        const input = await question('FIREBASE_SERVICE_ACCOUNT: ');
        if (!input.trim()) {
            console.log('❌ Firebase service account is required');
            continue;
        }
        if (!isValidJSON(input)) {
            console.log('❌ Invalid JSON. Please paste the entire JSON on one line.');
            continue;
        }
        firebaseServiceAccount = input.trim();
    }

    console.log('\n2. Google Gemini API Key');
    console.log('   Get from: https://aistudio.google.com/app/apikey\n');

    while (!geminiApiKey) {
        const input = await question('GEMINI_API_KEY: ');
        if (!input.trim()) {
            console.log('❌ Gemini API key is required');
            continue;
        }
        geminiApiKey = input.trim();
    }

    // Optional: Port
    const portInput = await question(`\n3. Backend port (default: 4001): `);
    if (portInput.trim()) {
        port = portInput.trim();
    }

    // Optional: Node env
    const envInput = await question(`4. Node environment (default: development): `);
    if (envInput.trim()) {
        nodeEnv = envInput.trim();
    }

    // Create .env file
    const envContent = `PORT=${port}
FIREBASE_SERVICE_ACCOUNT=${firebaseServiceAccount}
GEMINI_API_KEY=${geminiApiKey}
NODE_ENV=${nodeEnv}
# Comma-separated list of allowed origins for CORS
# Local dev defaults to: localhost:4000, localhost:5173, capacitor://localhost
# ALLOWED_ORIGINS=https://sammy-658-dev.web.app,https://sammy-658.web.app,capacitor://localhost
`;

    fs.writeFileSync(backendEnvPath, envContent);
    console.log('\n✅ Created backend/.env');
}

async function setupFrontendEnv() {
    console.log('\n🎨 Frontend Environment Setup');
    console.log('================================\n');

    let firebaseConfig = '';
    let apiUrl = '/api';

    // Check if file already exists
    if (fs.existsSync(frontendEnvPath)) {
        const overwrite = await question('⚠️  frontend/.env.local already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Skipping frontend/.env.local');
            return;
        }
    }

    console.log('1. Firebase Client Config JSON');
    console.log('   Get from: Firebase Console → Project Settings → General → Your apps → Web app config');
    console.log('   Paste the firebaseConfig object on one line:\n');

    while (!firebaseConfig) {
        const input = await question('VITE_FIREBASE_CONFIG: ');
        if (!input.trim()) {
            console.log('❌ Firebase config is required');
            continue;
        }
        if (!isValidJSON(input)) {
            console.log('❌ Invalid JSON. Please paste the entire config object on one line.');
            continue;
        }
        firebaseConfig = input.trim();
    }

    // Optional: API URL
    const apiUrlInput = await question(`\n2. Backend API URL (default: /api for local proxy): `);
    if (apiUrlInput.trim()) {
        apiUrl = apiUrlInput.trim();
    }

    // Create .env.local file
    const envContent = `VITE_API_URL=${apiUrl}
VITE_FIREBASE_CONFIG=${firebaseConfig}
`;

    fs.writeFileSync(frontendEnvPath, envContent);
    console.log('\n✅ Created frontend/.env.local');
}

async function setupFromTemplates() {
    console.log('\n📋 Quick Setup from Templates');
    console.log('================================\n');

    // Backend
    if (fs.existsSync(backendEnvPath)) {
        const overwrite = await question('⚠️  backend/.env already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Skipping backend/.env');
        } else {
            const backendTemplate = path.join(rootDir, 'backend', '.env.example');
            if (fs.existsSync(backendTemplate)) {
                fs.copyFileSync(backendTemplate, backendEnvPath);
                console.log('✅ Created backend/.env from template');
                console.log('   ⚠️  Edit backend/.env and add your credentials!');
            }
        }
    } else {
        const backendTemplate = path.join(rootDir, 'backend', '.env.example');
        if (fs.existsSync(backendTemplate)) {
            fs.copyFileSync(backendTemplate, backendEnvPath);
            console.log('✅ Created backend/.env from template');
            console.log('   ⚠️  Edit backend/.env and add your credentials!');
        }
    }

    // Frontend
    if (fs.existsSync(frontendEnvPath)) {
        const overwrite = await question('⚠️  frontend/.env.local already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Skipping frontend/.env.local');
        } else {
            const frontendTemplate = path.join(rootDir, 'frontend', '.env.local.template');
            if (fs.existsSync(frontendTemplate)) {
                fs.copyFileSync(frontendTemplate, frontendEnvPath);
                console.log('✅ Created frontend/.env.local from template');
                console.log('   ⚠️  Edit frontend/.env.local and add your Firebase config!');
            }
        }
    } else {
        const frontendTemplate = path.join(rootDir, 'frontend', '.env.local.template');
        if (fs.existsSync(frontendTemplate)) {
            fs.copyFileSync(frontendTemplate, frontendEnvPath);
            console.log('✅ Created frontend/.env.local from template');
            console.log('   ⚠️  Edit frontend/.env.local and add your Firebase config!');
        }
    }
}

async function main() {
    console.log('🚀 Sammy Environment Setup');
    console.log('==========================\n');

    console.log('Choose setup method:');
    console.log('1) Interactive (guided setup with prompts)');
    console.log('2) From templates (copy templates, edit manually)');
    console.log('3) Cancel\n');

    const choice = await question('Enter choice [1-3]: ');

    switch (choice.trim()) {
        case '1':
            await setupBackendEnv();
            await setupFrontendEnv();
            console.log('\n✨ Environment setup complete!');
            console.log('\nNext steps:');
            console.log('  1. Verify your .env files have correct values');
            console.log('  2. Run: npm run dev:local');
            console.log('  3. Open: http://localhost:4000\n');
            break;

        case '2':
            await setupFromTemplates();
            console.log('\n✨ Template files created!');
            console.log('\nNext steps:');
            console.log('  1. Edit backend/.env - add Firebase service account & Gemini API key');
            console.log('  2. Edit frontend/.env.local - add Firebase client config');
            console.log('  3. Run: npm run dev:local');
            console.log('  4. Open: http://localhost:4000\n');
            break;

        case '3':
            console.log('Setup cancelled.');
            break;

        default:
            console.log('Invalid choice. Exiting.');
            break;
    }

    rl.close();
}

// Verify .env files are in .gitignore
const gitignorePath = path.join(rootDir, '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
        console.warn('\n⚠️  WARNING: .env files may not be in .gitignore!');
        console.warn('Make sure to add .env files to .gitignore to prevent committing secrets.\n');
    }
}

main().catch((error) => {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
});
