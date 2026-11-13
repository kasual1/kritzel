---
applyTo: "**/*.ts, **/*.tsx"
---

## Architecture Instructions
- updraw-engine is the low-level core of the application, all business logic and state management should reside here. It should be framework-agnostic and not contain any UI-specific code.
- updraw-editor is the high-level component that integrates updraw-engine and provides the main user interface. It should handle UI state and interactions, but delegate all business logic to updraw-engine.
- UI components used in updraw-editor should be reusable and not contain updraw-engine specific logic. They should receive data and callbacks via props and emit events for user interactions.
- When adding new features, first consider if the logic belongs in updraw-engine or updraw-editor. If it's core functionality that could be reused in different contexts, it likely belongs in updraw-engine. If it's specific to the editor UI, it can go in updraw-editor or a related UI component.