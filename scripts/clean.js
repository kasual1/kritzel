const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to clean
const paths = [
  '../packages/demos/angular',
  '../packages/demos/react',
  '../packages/demos/vue',
  '../packages/libs/angular',
  '../packages/libs/react',
  '../packages/libs/stencil',
  '../packages/libs/vue',
];

// Helper function to delete a folder
function deleteFolder(folderPath) {
  const fullPath = path.resolve(__dirname, folderPath, 'node_modules');
  if (fs.existsSync(fullPath)) {
    console.log(`Deleting: ${fullPath}`);
    execSync(`rimraf ${fullPath}`, { stdio: 'inherit' }); // Use rimraf for cross-platform compatibility
  } else {
    console.log(`No node_modules found at: ${fullPath}`);
  }
}

// Helper function to delete a file
function deleteFile(filePath) {
  const fullPath = path.resolve(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`Deleting: ${fullPath}`);
    fs.unlinkSync(fullPath);
  } else {
    console.log(`No file found at: ${fullPath}`);
  }
}

// Step 1: Delete node_modules in specified paths
paths.forEach(deleteFolder);

// Step 2: Delete node_modules and package-lock.json at the root
deleteFolder('../'); // Delete node_modules at the root
deleteFile('../package-lock.json'); // Delete package-lock.json at the root

console.log('Clean-up complete!');