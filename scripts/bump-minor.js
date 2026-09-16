const { bump } = require('./bump-shared');

bump((version) => {
  const [major, minor] = version.split('.').map(Number);
  return `${major}.${minor + 1}.0`; // Increment the minor version and reset the patch version to 0
});