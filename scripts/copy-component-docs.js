// filepath: scripts/copy-component-docs.js
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const sourceBasePath = path.resolve(__dirname, '../libs/kritzel-stencil/src/components');
const targetBasePath = path.resolve(__dirname, '../website/docs/components');

// Ensure target directory exists
fs.ensureDirSync(targetBasePath);

// Find all readme.md files in the component directories
const componentReadmeFiles = glob.sync('**/readme.md', { cwd: sourceBasePath });

componentReadmeFiles.forEach(relativeReadmePath => {
  const componentName = path.dirname(relativeReadmePath); // Extracts the component folder name
  const sourcePath = path.join(sourceBasePath, relativeReadmePath);
  const targetPath = path.join(targetBasePath, `${componentName}.md`); // Renames to componentName.md

  try {
    fs.copySync(sourcePath, targetPath);
    console.log(`Copied ${componentName}.md`);
  } catch (err) {
    console.error(`Error copying ${sourcePath}:`, err);
  }
});

console.log('Component documentation copied successfully.');