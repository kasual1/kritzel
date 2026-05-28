# Handler Pattern

## Location

`libs/kritzel-stencil/src/classes/handlers/`

## Base Class

All handlers extend `KritzelBaseHandler`.

```typescript
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';

export class MyHandler extends KritzelBaseHandler {
  constructor(core: KritzelCore) {
    super(core);
  }
}
```

## Purpose

Handlers manage specific categories of user interaction that are independent of the active tool. Examples:

| Handler | Responsibility |
|---------|---------------|
| `key.handler` | Keyboard shortcuts and commands |
| `selection.handler` | Multi-select logic |
| `move.handler` | Object dragging |
| `resize.handler` | Object resize via handles |
| `rotation.handler` | Object rotation |
| `hover.handler` | Cursor changes on hover |
| `context-menu.handler` | Right-click menu logic |

## Conventions

- File name: `<domain>.handler.ts` (e.g., `snap.handler.ts`)
- Receives `KritzelCore` via constructor
- Access state via `this._core.store`
- Handlers are instantiated by the engine and called from the rendering component
- Keep handlers stateless where possible; use `this._core.store` for shared state
- Coordinate with the active tool when needed: `this._core.toolRegistry.activeTool`

## Keyboard Shortcut Pattern (Key Handler)

```typescript
private readonly shortcuts: Shortcut[] = [
  {
    key: 'Delete',
    condition: () => this._core.store.state.selectedObjects.length > 0,
    action: () => this._core.deleteSelectedObjects(),
  },
];
```

Each shortcut has:
- `key` — the key or key combo
- `condition` — optional guard function
- `action` — the effect to trigger

## Integration

Handlers are typically instantiated and held by `KritzelCore` or the engine component, then invoked from event listeners in the rendering layer.
