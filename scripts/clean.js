const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const { execSync } = require('child_process');

// Paths to clean
const paths = [
  '../packages/demos/angular',
  '../packages/demos/react',
  '../packages/demos/vue',
  '../packages/libs/kritzel-angular',
  '../packages/libs/kritzel-react',
  '../packages/libs/kritzel-stencil',
  '../packages/libs/kritzel-vue',
];

// Helper function to delete a folder
function deleteFolder(folderPath, subfolder) {
  const fullPath = path.resolve(__dirname, folderPath, subfolder);
  if (fs.existsSync(fullPath)) {
    console.log(`Deleting: ${fullPath}`);
    rimraf.sync(fullPath); // Use rimraf's sync method
  } else {
    console.log(`No ${subfolder} found at: ${fullPath}`);
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

// Step 1: Delete node_modules and dist in specified paths
paths.forEach((folderPath) => {
  deleteFolder(folderPath, 'node_modules');
  deleteFolder(folderPath, 'dist');
});

// Step 2: Delete node_modules and package-lock.json at the root
deleteFolder('../', 'node_modules'); // Delete node_modules at the root
deleteFolder('../', 'dist'); // Delete dist at the root
deleteFile('../package-lock.json'); // Delete package-lock.json at the root

console.log('Clean-up complete!');