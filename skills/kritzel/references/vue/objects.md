# Objects: Create, Update, Query, Organize

All canvas content is a `KritzelBaseObject` subclass. Import all classes from `@kritzel/vue-editor`:
`KritzelPath`, `KritzelLine`, `KritzelShape`, `KritzelText`, `KritzelImage`, `KritzelGroup`, plus `ShapeType` and `KritzelAlignment` enums.

In the snippets below, `editor` is the computed ref to the native element, resolved once at the top level of `<script setup>`:

```vue
<script setup lang="ts">
import { KritzelEditor, getEditorRef } from '@kritzel/vue-editor'

const editor = getEditorRef('editor') // argument = template-ref NAME
</script>

<template>
  <KritzelEditor ref="editor" @isReady="onReady" />
</template>
```

Every call goes through `editor.value` (may be `null` before mount) — e.g. `await editor.value?.addObject(obj)`.

## Shared base properties

| Property | Meaning |
|---|---|
| `id` | Auto-generated UUID (set on `addObject`) |
| `translateX`, `translateY` | Position in **world coordinates** (top-left of the object) |
| `width`, `height` | Size in world units |
| `scale` | Scale factor (default 1) |
| `rotation` | Radians (`rotationDegrees` getter for degrees) |
| `opacity` | 0–1 |
| `zIndex` | Layer order (managed by add/ordering APIs) |
| `isVisible`, `isSelected`, `isEditable`, `isInteractive` | State flags |
| `centerX`, `centerY` | Computed center (read-only getters) |
| `boundingBox`, `rotatedBoundingBox`, `rotatedPolygon` | Computed bounds |
| `__class__` | Type discriminator string, e.g. `'KritzelShape'` |
| `workspaceId` | Set automatically when added |

Colors everywhere are **theme-aware**: `{ light: '#hex', dark: '#hex', label?: string }`.

## Creating each object type (verified constructors)

### Text

```ts
const text = new KritzelText({
  text: 'Programmatic text!',          // NOTE: property is `text`
  translateX: 0,
  translateY: 0,
  fontSize: 24,
  fontFamily: 'Arial',
  fontColor: { light: '#ff0000', dark: '#ff4d6d' },
});
await editor.value?.addObject(text);
```

### Shape (rectangle / ellipse / triangle)

```ts
import { ShapeType } from '@kritzel/vue-editor';

const shape = new KritzelShape({
  translateX: 20,
  translateY: -150,
  width: 120,
  height: 120,
  shapeType: ShapeType.Rectangle,       // Rectangle | Ellipse | Triangle
  fillColor: { light: '#fce4ec', dark: '#880e4f' },
  strokeColor: { light: '#c62828', dark: '#ef9a9a' },
  strokeWidth: 3,
  // optional inline label text styling:
  fontSize: 16, fontFamily: 'Arial',
  fontColor: { light: '#000000', dark: '#ffffff' },
});
await editor.value?.addObject(shape);
```

Property names are `fillColor`/`strokeColor` — NOT `backgroundColor`/`borderColor`.

### Path (freehand stroke)

```ts
const path = new KritzelPath({
  points: [[0, 0, 0.5], [15, -20, 0.5], [30, -40, 0.5]], // [x, y, pressure?]
  translateX: -75,
  translateY: 125,
  strokeWidth: 8,
  fill: { light: '#ff9800', dark: '#ffb74d' },  // a path's color is `fill`
});
path.rotation = (40 * Math.PI) / 180;
await editor.value?.addObject(path);
```

### Line (straight or curved, optional arrowheads)

```ts
const line = new KritzelLine({
  startX: -170, startY: 10,
  endX: 130,   endY: 10,
  // controlX / controlY: optional quadratic-bezier control point for curves
  stroke: { light: '#4caf50', dark: '#81c784' },
  strokeWidth: 3,
  arrows: { end: { enabled: true, style: 'triangle' } }, // styles: triangle | open | diamond | circle
});
await editor.value?.addObject(line);
```

Properties are `stroke`/`strokeWidth`/`arrows` — NOT `color`/`size`/`startArrowhead`.

### Image

```ts
// From a URL or data URI — async factory, scales to fit maxWidth/maxHeight
const img = await KritzelImage.fromUrl('https://example.com/photo.jpg', {
  maxWidth: 300,
  maxHeight: 300,
});
img.translateX = 400;
img.translateY = 0;
img.isEditable = false; // optional: lock as background scenery
await editor.value?.addObject(img);
```

`fromUrl(src, config?: Partial<KritzelImage>)` — the second argument is a partial config object, not separate width/height arguments. `maxWidth`/`maxHeight` (default 300) constrain the rendered size while keeping aspect ratio.

## CRUD operations

```ts
// Add — single or batch (batch = one transaction, prefer for many objects)
await editor.value?.addObject(obj);
await editor.value?.addObjects([a, b, c]);

// Update — ALWAYS through updateObject, never bare mutation
await editor.value?.updateObject(obj, { opacity: 0.5, rotation: Math.PI / 4 });
await editor.value?.updateObject(obj, { translateX: obj.translateX + 100 });

// Remove
await editor.value?.removeObject(obj);
await editor.value?.removeObjects([a, b]);

// Read
const one = await editor.value?.getObjectById<KritzelShape>('some-id');   // null if missing
const all = (await editor.value?.getAllObjects()) ?? [];
const count = (await editor.value?.getObjectsTotalCount()) ?? 0;
const visible = (await editor.value?.getObjectsInViewport()) ?? [];
const shapes = (await editor.value?.findObjects(o => o.__class__ === 'KritzelShape')) ?? [];
```

Batch updates run concurrently fine:

```ts
const all = (await editor.value?.getAllObjects()) ?? [];
await Promise.all(all.map(o => editor.value?.updateObject(o, {
  translateX: o.translateX - o.centerX,
  translateY: o.translateY - o.centerY,
})));
```

Mirror query results into Vue state for templates:

```ts
import { ref } from 'vue';
import type { KritzelBaseObject } from '@kritzel/vue-editor';

const objects = ref<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);

async function refreshObjects() {
  const all = (await editor.value?.getAllObjects()) ?? [];
  objects.value = all as KritzelBaseObject<HTMLElement | SVGElement>[];
}
```

## Selection

```ts
await editor.value?.selectObjects([obj]);            // also switches to the selection tool
await editor.value?.selectAllObjectsInViewport();
const selected = (await editor.value?.getSelectedObjects()) ?? []; // [] when none
await editor.value?.clearSelection();
```

Switching the active tool clears the selection by design. To preserve it: read `getSelectedObjects()` first, switch, then `selectObjects(saved)`.

## Grouping, ordering, alignment (operate on current selection unless an object is passed)

```ts
await editor.value?.group();                  // groups selected objects (needs ≥ 2)
await editor.value?.ungroup();                // selection must contain a KritzelGroup

await editor.value?.bringToFront(obj);        // omit obj → applies to selection
await editor.value?.sendToBack();
await editor.value?.bringForward();
await editor.value?.sendBackward();

import { KritzelAlignment } from '@kritzel/vue-editor';
await editor.value?.alignObjects(KritzelAlignment.CenterHorizontal); // needs ≥ 2 selected
```

`KritzelAlignment` values: `StartHorizontal`, `CenterHorizontal`, `EndHorizontal`, `StartVertical`, `CenterVertical`, `EndVertical`.

Groups expose their children via `childIds: string[]`; resolve children with `getObjectById`.

## Clipboard & delete (system clipboard, world coordinates)

```ts
await editor.value?.copy();                   // serializes selection to the system clipboard
await editor.value?.cut();
await editor.value?.paste(x, y);              // world coordinates
await editor.value?.delete();                 // deletes selection
```

## Undo / redo

```ts
await editor.value?.undo();
await editor.value?.redo();
// availability: listen via @undoStateChange →
// (event as CustomEvent<KritzelUndoState>).detail
```

## Pitfalls

- Mutating `obj.translateX = …` directly renders nothing and syncs nothing — wrap changes in `updateObject`.
- `centerObjectInViewport(obj)` **moves the object**; to look at it instead, move the camera (see viewport.md).
- New objects land where you put them in world space — content at far coordinates may be off-screen; follow up with `backToContent()` or `centerAllObjects()`.
- Plain string colors (`'#ff0000'`) lose dark-mode support; always pass `{ light, dark }`.
- Don't keep live `KritzelBaseObject` references in Vue `ref()`s for long-lived UI; store `id`s and re-fetch with `getObjectById` when acting (objects can be replaced by sync/undo).
- `getEditorRef('editor')` must be called at the top level of `<script setup>` (it wraps `useTemplateRef`), and `editor.value` is `null` until the component mounts — do initial work in the `@isReady` handler.
