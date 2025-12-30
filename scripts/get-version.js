const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'version.json');

try {
    if (!fs.existsSync(versionFilePath)) {
        console.error('Error: version.json not found');
        process.exit(1);
    }

    const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    console.log(versionData.version);
} catch (error) {
    console.error('Error reading version:', error.message);
    process.exit(1);
}
