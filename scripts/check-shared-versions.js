const fs = require('fs');
const { paths } = require('./bump-shared');

function checkSharedVersions() {
  const packages = Object.entries(paths)
    .filter(([key]) => key !== 'version')
    .map(([, file]) => JSON.parse(fs.readFileSync(file, 'utf8')));
  const version = packages[0].version;
  const errors = [];

  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    errors.push(`Expected an exact stable release version, received ${version}`);
  }

  for (const pkg of packages) {
    if (pkg.version !== version) {
      errors.push(`${pkg.name}: expected ${version}, received ${pkg.version}`);
    }
    for (const field of ['dependencies', 'peerDependencies', 'devDependencies']) {
      for (const name of ['@kritzel/engine', '@kritzel/editor']) {
        const range = pkg[field]?.[name];
        if (range && range !== `^${version}` && range !== version) {
          errors.push(`${pkg.name} ${field}.${name}: expected ^${version} or ${version}, received ${range}`);
        }
      }
    }
  }

  const constant = fs.readFileSync(paths.version, 'utf8').match(/KRITZEL_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (constant?.[1] !== version) {
    errors.push(`KRITZEL_VERSION: expected ${version}, received ${constant?.[1] ?? 'missing'}`);
  }
  if (errors.length) {
    throw new Error(`Shared version consistency check failed:\n${errors.join('\n')}`);
  }
  return version;
}

if (require.main === module) {
  try {
    console.log(`All nine publishable packages and KRITZEL_VERSION match ${checkSharedVersions()}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { checkSharedVersions };
