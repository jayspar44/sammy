#!/usr/bin/env node

/**
 * Automated version bump script
 *
 * Usage:
 *   npm run version:bump -- patch "Bug fixes"
 *   npm run version:bump -- minor "New feature" "Another feature"
 *   npm run version:bump -- major "Breaking changes"
 *
 * Or use directly:
 *   node scripts/bump-version-auto.js patch "Bug fixes"
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const versionFilePath = path.join(rootDir, 'version.json');
const packageJsonPaths = [
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'frontend', 'package.json'),
    path.join(rootDir, 'backend', 'package.json')
];

// Parse command-line arguments
const args = process.argv.slice(2);
const bumpType = args[0]; // 'major', 'minor', or 'patch'
const changes = args.slice(1); // Remaining args are changelog entries

// Validate arguments
if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Error: Invalid bump type. Use "major", "minor", or "patch"');
    console.error('Usage: npm run version:bump -- <major|minor|patch> [changelog entries...]');
    console.error('Example: npm run version:bump -- patch "Fix login bug" "Update styles"');
    process.exit(1);
}

if (!fs.existsSync(versionFilePath)) {
    console.error('Error: version.json not found');
    process.exit(1);
}

/**
 * Increment version number based on bump type
 * @param {string} version - Current version (e.g., "0.1.1")
 * @param {string} type - Bump type ('major', 'minor', or 'patch')
 * @returns {string} New version
 */
function incrementVersion(version, type) {
    const parts = version.split('.').map(Number);

    switch (type) {
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'patch':
            parts[2]++;
            break;
    }

    return parts.join('.');
}

// Read current version
const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
const currentVersion = versionData.version;
const newVersion = incrementVersion(currentVersion, bumpType);

console.log(`Bumping version: ${currentVersion} → ${newVersion} (${bumpType})`);

// Prepare changelog
const changelogEntries = changes.length > 0
    ? changes
    : [`${bumpType.charAt(0).toUpperCase() + bumpType.slice(1)} version bump`];

console.log('Changelog:');
changelogEntries.forEach(entry => console.log(`  - ${entry}`));

// 1. Update version.json
versionData.version = newVersion;
versionData.history.unshift({
    version: newVersion,
    date: new Date().toISOString().split('T')[0],
    author: process.env.USER || process.env.USERNAME || 'Developer',
    changes: changelogEntries
});

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 4) + '\n');
console.log(`\n✓ Updated version.json to ${newVersion}`);

// 2. Sync to package.json files
packageJsonPaths.forEach(pkgPath => {
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.version = newVersion;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`✓ Updated ${path.relative(rootDir, pkgPath)} to ${newVersion}`);
    }
});

console.log('\n✅ Version bump complete!');
console.log(`\nNext steps:`);
console.log(`  1. Review changes: git diff`);
console.log(`  2. Commit: git add -A && git commit -m "chore: bump version to ${newVersion}"`);
console.log(`  3. Tag: git tag v${newVersion}`);
console.log(`  4. Push: git push && git push --tags`);
