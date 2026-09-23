# Core Pattern

## Location

`libs/engine/core/src/classes/core/core.class.ts`

## Purpose

`KritzelCore` is the central orchestrator — the service locator that wires together all subsystems. It owns the store, managers, registries, and coordinates workspace lifecycle, object management, selection, clipboard, and z-ordering.

## Structure

```typescript
export class KritzelCore {
  private readonly _kritzelEngine: KritzelEngine;
  private readonly _store: KritzelStore;
  private readonly _appStateMap: KritzelAppStateMap;
  private readonly _anchorManager: KritzelAnchorManager;
  private readonly _cursorManager: KritzelCursorManager;
  private readonly _themeManager: KritzelThemeManager;
  private readonly _toolRegistry: KritzelToolRegistry;
  private readonly _assetResolver: KritzelAssetResolver;
}
```

## Responsibilities

| Domain | Methods |
|--------|---------|
| Workspace lifecycle | `initializeWorkspace()`, `createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`, `loadSharedWorkspace()` |
| Object CRUD | `addObject()`, `removeObject()`, `updateObject()`, `deleteObject()`, `findObjectById()` |
| Selection | `selectObjects()`, `selectAllObjects()`, `selectAllObjectsInViewport()`, `clearSelection()`, `deselectAllObjects()` |
| Clipboard | `copy()`, `cut()`, `paste()` |
| Z-ordering | `bringForward()`, `sendBackward()`, `bringToFront()`, `sendToBack()` |
| Alignment | `alignObjects()` |
| Grouping | `group()`, `ungroup()` |
| Undo/Redo | `undo()`, `redo()` |
| Hit testing | `getObjectFromPointerEvent()`, `getObjectsFromPointerEvent()`, `getCanvasPoint()` |
| Rendering | `rerender()` |
| Sync/Assets | `initializeYjs()`, `initializeAssetStorage()`, `setSyncConfig()`, `setAssetStorageConfig()` |
| User/awareness | `setUser()` |

## When to Modify Core

Add methods to core when:
- The operation spans multiple subsystems (objects + selection + rerender)
- It needs to be callable from tools, handlers, AND components
- It manages workspace-level state transitions

Do NOT add to core when:
- Logic is specific to one tool → put in the tool class
- It's a pure computation → put in a helper
- It only affects UI state → put in the component

## Patterns Used in Core

### Transaction batching
Wrap multiple object mutations in a Yjs transaction for atomicity and single undo step:
```typescript
this._store.objects.transaction(() => {
  // multiple inserts/updates/removes
});
```

### Undo boundary control
Use `stopUndoCapturing()` to seal an undo step before starting a new logical operation:
```typescript
this._store.objects.stopUndoCapturing();
// ... perform operation ...
this._store.objects.stopUndoCapturing();
```

### Coordinate conversion
Convert screen coordinates to canvas (world) coordinates:
```typescript
const { x, y } = this.getCanvasPoint(event);
```

### Selection group lifecycle
```typescript
this.removeSelectionGroup();
this.removeSelectionBox();
const selectionGroup = KritzelSelectionGroup.create(this);
selectionGroup.addOrRemove(object);
selectionGroup.isSelected = true;
this.addSelectionGroup(selectionGroup);
```

### Object update pattern
Always use `updateObject()` to ensure Yjs persistence and `onAfterUpdate` hooks:
```typescript
this.updateObject(object, { width: 100, height: 50 });
```

### Rerender trigger
After any state mutation that should reflect visually:
```typescript
this.rerender(); // increments forceUpdate counter
```

## Access Pattern

All other classes receive core via constructor and access services through it:
```typescript
this._core.store          // state management
this._core.engine         // rendering component
this._core.themeManager   // theme switching
this._core.cursorManager  // cursor appearance
this._core.anchorManager  // line anchor connections
this._core.toolRegistry   // tool lookup
this._core.appStateMap    // workspace persistence
this._core.assetResolver  // binary asset storage
this._core.user           // current user
this._core.editorId       // storage key namespace
```

## Conventions

- Core is instantiated once per editor by `KritzelEngine`
- Never instantiate core directly in tests — mock or use a test harness
- Methods that modify objects should emit change events: `this.engine.emitObjectsChange()`
- Methods that affect viewport should emit: `this.engine.emitObjectsInViewportChange()`
- Always call `this.rerender()` after state mutations that should reflect in UI
- Use `this.getStorageKey(base)` for namespaced localStorage keys

## Unit Testing Guidance

- When behavior is extracted into a manager, keep core tests focused on delegation (method forwarding, argument passthrough)
- Do not duplicate manager behavior assertions in core specs; verify those in manager-specific tests
- Mock only stable/public collaborators from core (`store`, `engine`, `toolRegistry`, managers), not private implementation details
