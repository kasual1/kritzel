# Handler Pattern

## Location

`libs/core/src/classes/handlers/`

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
- Avoid `any[]` for handler configuration; define dedicated interfaces/types for handler inputs
- If handlers cache external configuration, ensure components can refresh that configuration when props change

## Runtime Config Updates

Many handlers are created once but must react to changing component props.

Recommended options:
- Keep config on the component and pass it at call time
- Or expose explicit update methods/properties on the handler and wire them via component `@Watch()` handlers

Example approach:

```typescript
export class MyHandler extends KritzelBaseHandler {
  items: MenuItem[] = [];

  setItems(items: MenuItem[] | undefined): void {
    this.items = items ?? [];
  }
}
```

Then in the component:
- Initialize handler with initial props
- Also call `handler.setItems(...)` inside the corresponding `@Watch()` method

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
