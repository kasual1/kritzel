# Object Pattern

## Location

`libs/core/src/classes/objects/`

## Base Class

All canvas objects extend `KritzelBaseObject<T>` where `T` is the mounted DOM element type.

```typescript
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';

export class MyObject extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'MyObject';

  static override create(core: KritzelCore): MyObject {
    const object = new MyObject();
    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.scale = core.store.state.scale;
    return object;
  }
}
```

## Required Properties

| Property | Purpose |
|----------|---------|
| `__class__` | String identifier for serialization/revival |
| `id` | Unique UUID |
| `workspaceId` | Workspace this object belongs to |
| `userId` | Creator user ID |
| `scale` | Scale at creation time |
| `width` / `height` | Dimensions |
| `x` / `y` | Position on canvas |
| `zIndex` | Layer order |
| `opacity` | Transparency (0–1) |
| `rotationDegrees` | Rotation angle |

## Factory Method

Objects use a static `create(core)` factory — never construct directly outside the class. The factory:

1. Instantiates the object
2. Assigns `_core` reference
3. Generates a unique ID
4. Sets workspace and user context
5. Sets initial scale from current viewport
6. Returns fully initialized instance

## Serialization

Objects implement `KritzelSerializable`:

```typescript
override serialize(): Record<string, unknown> {
  return {
    ...super.serialize(),
    __class__: this.__class__,
    customProp: this.customProp,
  };
}

override deserialize(data: Record<string, unknown>): void {
  super.deserialize(data);
  this.customProp = data['customProp'] as string;
}
```

## Revival

The `KritzelReviver` uses `__class__` to reconstruct the correct instance during deserialization (e.g., from Yjs doc or localStorage).

## Rendering

Objects are rendered in `kritzel-engine.tsx`. The engine iterates over `store.objects` and renders each based on its class (`object instanceof KritzelText`, …) using conditional blocks.

## Loading State

Loading is generic and owned by the base class: `isLoading` (default `false`, serialized and synced) and `setLoading(isLoading)` live on `KritzelBaseObject`, and every object config accepts `isLoading?: boolean`. `setLoading()` no-ops when unchanged, otherwise calls `update()` and `_core.rerender()`. The engine draws `<div class="kritzel-loading-placeholder">` inside the object's `.object` wrapper (after the type-specific content, before selection UI; not for selection groups or selection boxes), covering `totalWidth` × `totalHeight`. It keeps `pointer-events: auto` so the object can still be selected and moved while its content can't be used. Its look comes from the `loadingPlaceholder` theme tokens (`--kritzel-loading-placeholder-*`, see [theme.md](theme.md)).

Objects must not render their own loading content or override `setLoading()` — keep the content mounted underneath and let the engine draw the placeholder.

## Mounting

Objects receive a DOM element ref via `mount(el)` for direct DOM access when needed.

## Theme-Aware Colors

Use `ThemeAwareColor` for colors that change with the theme:

```typescript
import { ThemeAwareColor } from '../../constants/color-palette.constants';

object.backgroundColor = {
  light: 'var(--kritzel-my-object-bg)',
  dark: 'var(--kritzel-my-object-bg)',
} as ThemeAwareColor;
```

Colors are resolved at render time via `KritzelColorHelper.resolveThemeColor()`.

## Conventions

- File name: `<type>.class.ts` (e.g., `connector.class.ts`)
- Always provide `__class__` as a string literal matching the class name
- Use the factory pattern — no public constructors
- Keep rendering logic in the engine component, not in the object class
- Use the base `isLoading` / `setLoading()` for loading state instead of custom loading content
