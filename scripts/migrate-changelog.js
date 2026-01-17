#!/usr/bin/env node

/**
 * One-time migration script to convert version.json history to CHANGELOG.md
 *
 * Run with: node scripts/migrate-changelog.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const versionFilePath = path.join(rootDir, 'version.json');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');

if (!fs.existsSync(versionFilePath)) {
    console.error('Error: version.json not found');
    process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));

// Build CHANGELOG.md content
let changelog = `# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

for (const entry of versionData.history) {
    changelog += `## [${entry.version}] - ${entry.date}\n\n`;

    // Group changes by type
    const added = [];
    const fixed = [];
    const changed = [];

    for (const change of entry.changes) {
        const lowerChange = change.toLowerCase();
        if (lowerChange.startsWith('fix') || lowerChange.includes('fix ')) {
            fixed.push(change);
        } else if (lowerChange.startsWith('add') || lowerChange.startsWith('feat') || lowerChange.includes('add ')) {
            added.push(change);
        } else {
            changed.push(change);
        }
    }

    if (added.length > 0) {
        changelog += `### Added\n`;
        for (const item of added) {
            changelog += `- ${item}\n`;
        }
        changelog += '\n';
    }

    if (fixed.length > 0) {
        changelog += `### Fixed\n`;
        for (const item of fixed) {
            changelog += `- ${item}\n`;
        }
        changelog += '\n';
    }

    if (changed.length > 0) {
        changelog += `### Changed\n`;
        for (const item of changed) {
            changelog += `- ${item}\n`;
        }
        changelog += '\n';
    }
}

// Write CHANGELOG.md
fs.writeFileSync(changelogPath, changelog);
console.log('✅ Created CHANGELOG.md');

// Simplify version.json (keep only version field)
const simplifiedVersion = {
    version: versionData.version
};
fs.writeFileSync(versionFilePath, JSON.stringify(simplifiedVersion, null, 2) + '\n');
console.log('✅ Simplified version.json (removed history array)');

console.log(`\nMigration complete!`);
console.log(`- CHANGELOG.md created with ${versionData.history.length} version entries`);
console.log(`- version.json now contains only: { "version": "${versionData.version}" }`);
