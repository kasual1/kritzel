module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/templates/'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: { target: 'ES2022', module: 'CommonJS', esModuleInterop: true, strict: true, types: ['node', 'jest'] } }] },
};
