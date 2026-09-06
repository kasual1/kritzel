const fs = require('fs');
const path = require('path');

// Project paths and generated folders to clean
const cleanTargets = [
  { path: '../demos/angular', folders: ['node_modules', 'dist'] },
  { path: '../demos/react', folders: ['node_modules', 'dist'] },
  { path: '../demos/vue', folders: ['node_modules', 'dist'] },
  { path: '../libs/kritzel-angular', folders: ['node_modules', 'dist'] },
  { path: '../libs/kritzel-react', folders: ['node_modules', 'dist'] },
  { path: '../libs/kritzel-stencil', folders: ['node_modules', 'dist'] },
  { path: '../libs/kritzel-vue', folders: ['node_modules', 'dist'] },
  { path: '../server/websocket-demo', folders: ['node_modules', 'dist'] },
  { path: '../website', folders: ['node_modules', 'build', '.docusaurus'] },
];

// Helper function to delete a folder
function deleteFolder(folderPath, subfolder) {
  const fullPath = path.resolve(__dirname, folderPath, subfolder);
  if (fs.existsSync(fullPath)) {
    console.log(`Deleting: ${fullPath}`);
    fs.rmSync(fullPath, { force: true, maxRetries: 3, recursive: true, retryDelay: 100 });
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

// Step 1: Delete generated folders in specified paths
cleanTargets.forEach(({ path: folderPath, folders }) => {
  folders.forEach((subfolder) => {
    deleteFolder(folderPath, subfolder);
  });
});

// Step 2: Delete node_modules and package-lock.json at the root
deleteFolder('../', 'node_modules'); // Delete node_modules at the root
deleteFolder('../', 'dist'); // Delete dist at the root
deleteFile('../package-lock.json'); // Delete package-lock.json at the root

console.log('Clean-up complete!');