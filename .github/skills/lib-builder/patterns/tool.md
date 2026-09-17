# Tool Pattern

## Location

`libs/engine/core/src/classes/tools/`

## Base Class

All tools extend `KritzelBaseTool` which implements `KritzelTool` and `KritzelSerializable`.

```typescript
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';

export class MyTool extends KritzelBaseTool {
  override name = 'my-tool';

  constructor(core: KritzelCore) {
    super(core);
  }
}
```

## Required Interface

| Method | Purpose |
|--------|---------|
| `handlePointerDown(event)` | Start of interaction (click/touch/pen) |
| `handlePointerMove(event)` | During drag or hover |
| `handlePointerUp(event)` | End of interaction |
| `handleWheel(event)` | Scroll/zoom |
| `onActivate()` | Tool selected — initialize state |
| `onDeactivate()` | Tool deselected — cleanup |
| `serialize()` | Return plain object for persistence |
| `deserialize(data)` | Restore state from plain object |

## Lifecycle

1. Tool is registered via `KritzelToolRegistry`
2. User selects tool → `onActivate()` called
3. Pointer events dispatched to active tool
4. User switches tool → `onDeactivate()` called

## Conventions

- Tool name must be kebab-case: `'brush-tool'`, `'selection-tool'`
- File name: `<name>.class.ts` (e.g., `laser-pointer-tool.class.ts`)
- Access core services via `this._core` (store, viewport, engine)
- Create objects via static factory: `MyObject.create(this._core)`
- Push created objects to store: `this._core.store.objects.add(object)`
- Use `this._core.store.state.scale` for coordinate transforms

## Serialization

```typescript
override serialize(): Record<string, unknown> {
  return {
    __class__: this.__class__,
    name: this.name,
    color: this.color,
    size: this.size,
  };
}

override deserialize(data: Record<string, unknown>): void {
  this.color = data['color'] as string;
  this.size = data['size'] as number;
}
```

## Tool Configuration

If the tool has user-configurable options (color, size, opacity), expose them as public properties and serialize/deserialize them. The toolbar UI binds to these properties.

## Registration

Tools are registered in the tool registry, typically from the editor component:

```typescript
core.toolRegistry.register('my-tool', new MyTool(core));
```
