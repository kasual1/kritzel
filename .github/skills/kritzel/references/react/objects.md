# Objects: Create, Update, Query, Organize

All canvas content is a `KritzelBaseObject` subclass. Import all classes from `@kritzel/react-editor`:
`KritzelPath`, `KritzelLine`, `KritzelShape`, `KritzelText`, `KritzelImage`, `KritzelGroup`, plus `ShapeType` and `KritzelAlignment` enums.

In the snippets below, `editor` is the ref element (`const editor = editorRef.current; if (!editor) return;`).

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

```tsx
const text = new KritzelText({
  text: 'Programmatic text!',          // NOTE: property is `text`
  translateX: 0,
  translateY: 0,
  fontSize: 24,
  fontFamily: 'Arial',
  fontColor: { light: '#ff0000', dark: '#ff4d6d' },
});
await editor.addObject(text);
```

### Shape (rectangle / ellipse / triangle)

```tsx
import { ShapeType } from '@kritzel/react-editor';

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
await editor.addObject(shape);
```

Property names are `fillColor`/`strokeColor` — NOT `backgroundColor`/`borderColor`.

### Path (freehand stroke)

```tsx
const path = new KritzelPath({
  points: [[0, 0, 0.5], [15, -20, 0.5], [30, -40, 0.5]], // [x, y, pressure?]
  translateX: -75,
  translateY: 125,
  strokeWidth: 8,
  fill: { light: '#ff9800', dark: '#ffb74d' },  // a path's color is `fill`
});
path.rotation = (40 * Math.PI) / 180;
await editor.addObject(path);
```

### Line (straight or curved, optional arrowheads)

```tsx
const line = new KritzelLine({
  startX: -170, startY: 10,
  endX: 130,   endY: 10,
  // controlX / controlY: optional quadratic-bezier control point for curves
  stroke: { light: '#4caf50', dark: '#81c784' },
  strokeWidth: 3,
  arrows: { end: { enabled: true, style: 'triangle' } }, // styles: triangle | open | diamond | circle
});
await editor.addObject(line);
```

Properties are `stroke`/`strokeWidth`/`arrows` — NOT `color`/`size`/`startArrowhead`.

### Image

```tsx
// From a URL or data URI — async factory, scales to fit maxWidth/maxHeight
const img = await KritzelImage.fromUrl('https://example.com/photo.jpg', {
  maxWidth: 300,
  maxHeight: 300,
});
img.translateX = 400;
img.translateY = 0;
img.isEditable = false; // optional: lock as background scenery
await editor.addObject(img);
```

`fromUrl(src, config?: Partial<KritzelImage>)` — the second argument is a partial config object, not separate width/height arguments. `maxWidth`/`maxHeight` (default 300) constrain the rendered size while keeping aspect ratio.

## CRUD operations

```tsx
// Add — single or batch (batch = one transaction, prefer for many objects)
await editor.addObject(obj);
await editor.addObjects([a, b, c]);

// Update — ALWAYS through updateObject, never bare mutation
await editor.updateObject(obj, { opacity: 0.5, rotation: Math.PI / 4 });
await editor.updateObject(obj, { translateX: obj.translateX + 100 });

// Remove
await editor.removeObject(obj);
await editor.removeObjects([a, b]);

// Read
const one = await editor.getObjectById<KritzelShape>('some-id');   // null if missing
const all = await editor.getAllObjects();
const count = await editor.getObjectsTotalCount();
const visible = await editor.getObjectsInViewport();
const shapes = await editor.findObjects(o => o.__class__ === 'KritzelShape');
```

Batch updates run concurrently fine:

```tsx
const all = await editor.getAllObjects();
await Promise.all(all.map(o => editor.updateObject(o, {
  translateX: o.translateX - o.centerX,
  translateY: o.translateY - o.centerY,
})));
```

## Selection

```tsx
await editor.selectObjects([obj]);            // also switches to the selection tool
await editor.selectAllObjectsInViewport();
const selected = await editor.getSelectedObjects(); // [] when none
await editor.clearSelection();
```

Switching the active tool clears the selection by design. To preserve it: read `getSelectedObjects()` first, switch, then `selectObjects(saved)`.

## Grouping, ordering, alignment (operate on current selection unless an object is passed)

```tsx
await editor.group();                  // groups selected objects (needs ≥ 2)
await editor.ungroup();                // selection must contain a KritzelGroup

await editor.bringToFront(obj);        // omit obj → applies to selection
await editor.sendToBack();
await editor.bringForward();
await editor.sendBackward();

import { KritzelAlignment } from '@kritzel/react-editor';
await editor.alignObjects(KritzelAlignment.CenterHorizontal); // needs ≥ 2 selected
```

`KritzelAlignment` values: `StartHorizontal`, `CenterHorizontal`, `EndHorizontal`, `StartVertical`, `CenterVertical`, `EndVertical`.

Groups expose their children via `childIds: string[]`; resolve children with `getObjectById`.

## Clipboard & delete (system clipboard, world coordinates)

```tsx
await editor.copy();                   // serializes selection to the system clipboard
await editor.cut();
await editor.paste(x, y);              // world coordinates
await editor.delete();                 // deletes selection
```

## Undo / redo

```tsx
await editor.undo();
await editor.redo();
// availability: listen via onUndoStateChange → CustomEvent<KritzelUndoState>
```

## Pitfalls

- Mutating `obj.translateX = …` directly renders nothing and syncs nothing — wrap changes in `updateObject`.
- `centerObjectInViewport(obj)` **moves the object**; to look at it instead, move the camera (see viewport.md).
- New objects land where you put them in world space — content at far coordinates may be off-screen; follow up with `backToContent()` or `centerAllObjects()`.
- Plain string colors (`'#ff0000'`) lose dark-mode support; always pass `{ light, dark }`.
- Don't keep live `KritzelBaseObject` references in React state for long-lived UI; store `id`s and re-fetch with `getObjectById` when acting (objects can be replaced by sync/undo).
