---
applyTo: "**/*.ts, **/*.tsx"
---

You are an expert in Typescript. You write maintainable, performant, and accessible code following TypeScript best practices.

## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## TSX (React + TypeScript) Guidelines
- Keep JSX expressions simple; extract complex logic into typed helper functions
- Ensure keys are stable and deterministic; never use array index when collection can reorder