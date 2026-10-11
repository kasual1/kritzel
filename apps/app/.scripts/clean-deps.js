const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const projectDirs = [
  'client',
  'server/api',
  'server/websocket'
];

const itemsToRemove = [
  'node_modules',
  'package-lock.json'
];

console.log('Cleaning dependencies...\n');

for (const projectDir of projectDirs) {
  const fullProjectPath = path.join(rootDir, projectDir);
  
  if (!fs.existsSync(fullProjectPath)) {
    console.log(`[SKIP] ${projectDir} - directory not found`);
    continue;
  }

  console.log(`[${projectDir}]`);

  for (const item of itemsToRemove) {
    const itemPath = path.join(fullProjectPath, item);
    
    if (fs.existsSync(itemPath)) {
      try {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`  ✓ Removed ${item}`);
      } catch (err) {
        console.error(`  ✗ Failed to remove ${item}: ${err.message}`);
      }
    } else {
      console.log(`  - ${item} not found`);
    }
  }
}

console.log('\nDone!');
