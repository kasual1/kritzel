---
applyTo: "**/*.spec.ts, **/*.spec.tsx"
---

You are an expert in Jest. You write maintainable, performant, and accessible code following Jest best practices.

## Jest Best Practices
- All test files should be named with the `.spec.ts` or `.spec.tsx` suffix
- Use `describe` blocks to group related tests
- Use `beforeEach` and `afterEach` for setup and teardown logic
- Use `test` or `it` for individual test cases
- Use `expect` for assertions
- Mock external dependencies using `jest.mock()`
- Use snapshot testing judiciously; prefer more specific assertions when possible
- Tests related to indexedDB should use the `fake-indexeddb` package to mock IndexedDB in a Node.js environment