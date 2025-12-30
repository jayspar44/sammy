const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.join(__dirname, '..');
const versionFilePath = path.join(rootDir, 'version.json');
const packageJsonPaths = [
    path.join(rootDir, 'package.json'),
    path.join(rootDir, 'frontend', 'package.json'),
    path.join(rootDir, 'backend', 'package.json')
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if (!fs.existsSync(versionFilePath)) {
    console.error('Error: version.json not found');
    process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
const currentVersion = versionData.version;

console.log(`Current version: ${currentVersion}`);

rl.question('Enter new version: ', (newVersion) => {
    if (!newVersion || newVersion === currentVersion) {
        console.log('Version update cancelled.');
        rl.close();
        return;
    }

    rl.question('Enter changelog message (comma separated for multiple): ', (changesInput) => {
        const changes = changesInput.split(',').map(c => c.trim()).filter(c => c);

        // 1. Update version.json
        versionData.version = newVersion;
        versionData.history.unshift({
            version: newVersion,
            date: new Date().toISOString().split('T')[0],
            author: process.env.USERNAME || 'User',
            changes: changes.length > 0 ? changes : ['Maintenance update']
        });

        fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
        console.log(`Updated version.json to ${newVersion}`);

        // 2. Sync to package.json files
        packageJsonPaths.forEach(pkgPath => {
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                pkg.version = newVersion;
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n'); // Maintain trailing newline
                console.log(`Updated ${path.relative(rootDir, pkgPath)} to ${newVersion}`);
            }
        });

        console.log('\nVersion bump complete!');
        rl.close();
    });
});
