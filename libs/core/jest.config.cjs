// Same environment as `stencil test --spec` in the engine (node + Stencil's mock-doc),
// so the specs that moved here from @kritzel/engine run unchanged.
module.exports = {
  preset: '@stencil/core/testing',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testRegex: ['(/__tests__/.*|(\\.|/)(spec|e2e))\\.(tsx?|ts?)$'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testTimeout: 15000,
};
