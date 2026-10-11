const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

const projectDirs = [
  'client',
  'server/api',
  'server/websocket'
];

console.log('Installing dependencies...\n');

for (const projectDir of projectDirs) {
  const fullProjectPath = path.join(rootDir, projectDir);
  
  if (!fs.existsSync(fullProjectPath)) {
    console.log(`[SKIP] ${projectDir} - directory not found`);
    continue;
  }

  const packageJsonPath = path.join(fullProjectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`[SKIP] ${projectDir} - no package.json found`);
    continue;
  }

  console.log(`[${projectDir}] Installing...`);
  
  try {
    execSync('npm install', { 
      cwd: fullProjectPath, 
      stdio: 'inherit' 
    });
    console.log(`[${projectDir}] ✓ Done\n`);
  } catch (err) {
    console.error(`[${projectDir}] ✗ Failed: ${err.message}\n`);
  }
}

console.log('All done!');
