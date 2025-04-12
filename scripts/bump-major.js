const fs = require('fs');
const path = require('path');

// Paths to the package.json files
const paths = {
  stencil: path.resolve(__dirname, '../packages/libs/kritzel-stencil/package.json'),
  angular: path.resolve(__dirname, '../packages/libs/kritzel-angular/projects/lib/package.json'),
  react: path.resolve(__dirname, '../packages/libs/kritzel-react/package.json'),
  vue: path.resolve(__dirname, '../packages/libs/kritzel-vue/package.json'),
};

// Helper function to read and parse a JSON file
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Helper function to write a JSON object to a file
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// Helper function to bump the minor version
function bumpVersion(version) {
    const [major] = version.split('.').map(Number);
    return `${major + 1}.0.0`; // Increment the major version and reset minor and patch versions to 0
}

// Step 1: Bump the version of kritzel-stencil
const stencilPackage = readJson(paths.stencil);
const newVersion = bumpVersion(stencilPackage.version);
stencilPackage.version = newVersion;
writeJson(paths.stencil, stencilPackage);
console.log(`Bumped kritzel-stencil version to ${newVersion}`);

// Step 2: Update the peerDependencies and versions of other packages
const otherPackages = ['angular', 'react', 'vue'];

otherPackages.forEach((pkg) => {
  const packagePath = paths[pkg];
  const packageJson = readJson(packagePath);

  // Bump the version of the package
  packageJson.version = bumpVersion(packageJson.version);

  // Update the peerDependencies.kritzel-stencil to the new version
  if (packageJson.peerDependencies && packageJson.peerDependencies['kritzel-stencil']) {
    packageJson.peerDependencies['kritzel-stencil'] = `^${newVersion}`;
  }

  writeJson(packagePath, packageJson);
  console.log(`Updated ${pkg} package: version bumped to ${packageJson.version}, peerDependencies.kritzel-stencil set to ^${newVersion}`);
});