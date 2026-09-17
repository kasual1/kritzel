// Jest setup file

// Suppress the Yjs "already imported" warning that occurs in test environments
// due to module resolution differences. This is a known issue: https://github.com/yjs/yjs/issues/438
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    message.includes('Yjs was already imported')
  ) {
    return; // Suppress this specific warning
  }
  originalConsoleError.apply(console, args);
};