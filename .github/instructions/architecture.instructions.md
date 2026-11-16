---
applyTo: "**/*.ts, **/*.tsx"
---

## Architecture Instructions
- upmade-engine is the low-level core of the application, all business logic and state management should reside here. It should be framework-agnostic and not contain any UI-specific code.
- upmade-editor is the high-level component that integrates upmade-engine and provides the main user interface. It should handle UI state and interactions, but delegate all business logic to upmade-engine.
- UI components used in upmade-editor should be reusable and not contain upmade-engine specific logic. They should receive data and callbacks via props and emit events for user interactions.
- When adding new features, first consider if the logic belongs in upmade-engine or upmade-editor. If it's core functionality that could be reused in different contexts, it likely belongs in upmade-engine. If it's specific to the editor UI, it can go in upmade-editor or a related UI component.