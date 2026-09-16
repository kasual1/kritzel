const { bump } = require('./bump-shared');

bump((version) => {
  const [major] = version.split('.').map(Number);
  return `${major + 1}.0.0`; // Increment the major version and reset minor and patch versions to 0
});