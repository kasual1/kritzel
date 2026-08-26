---
sidebar_label: Canvas Object Types
title: "Canvas Object Types | Kritzel for Angular"
description: "Reference for all canvas object types in Kritzel: brush, line, shape, text, and image."
---
# Canvas Object Types

All objects on the canvas extend `KritzelBaseObject`. Each tool creates a specific object type when the user draws on the canvas.

## Base Properties

Every object inherits these properties from `KritzelBaseObject`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | auto-generated UUID | Unique identifier |
| `workspaceId` | `string` | — | ID of the workspace this object belongs to |
| `x` | `number` | — | X position in world coordinates |
| `y` | `number` | — | Y position in world coordinates |
| `width` | `number` | — | Width in world units |
| `height` | `number` | — | Height in world units |
| `rotation` | `number` | `0` | Rotation in radians |
| `opacity` | `number` | `1` | Opacity (0–1) |
| `zIndex` | `number` | `0` | Z-order layer |
| `scale` | `number` | — | Object scale |
| `backgroundColor` | `ThemeAwareColor` | — | Background color |
| `borderColor` | `ThemeAwareColor` | — | Border color |
| `borderWidth` | `number` | `0` | Border width |
| `padding` | `number` | `0` | Padding |
| `isVisible` | `boolean` | `true` | Visibility flag |
| `isSelected` | `boolean` | `false` | Whether the object is selected |
| `isHovered` | `boolean` | `false` | Whether the object is hovered |
| `isEditable` | `boolean` | `false` | Whether the object is in edit mode |
| `isInteractive` | `boolean` | `false` | Whether the object responds to interaction |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `centerX` | `number` | Center X coordinate |
| `centerY` | `number` | Center Y coordinate |
| `totalWidth` | `number` | Width including padding and borders |
| `totalHeight` | `number` | Height including padding and borders |
| `boundingBox` | `KritzelBoundingBox` | Axis-aligned bounding box |
| `rotatedBoundingBox` | `KritzelBoundingBox` | Bounding box accounting for rotation |
| `rotatedPolygon` | `KritzelPolygon` | Four corners of the rotated rectangle |
| `transformationMatrix` | `DOMMatrix` | Full transformation matrix |
| `rotationDegrees` | `number` | Rotation converted to degrees |

### Key Methods

| Method | Description |
|--------|-------------|
| `serialize()` | Converts the object to a plain serializable representation |
| `deserialize(data)` | Restores the object from serialized data |
| `clone()` | Creates a deep copy of the object |
| `hitTest(x, y)` | Tests if a world-coordinate point intersects this object |
| `hitTestPolygon(polygon)` | Tests if a polygon intersects this object |
| `isInViewport(viewport)` | Tests if the object is visible in the given viewport |

---

## Object Types

### `KritzelPath`

Freehand brush strokes. Rendered as SVG paths using the [perfect-freehand](https://github.com/steveruizok/perfect-freehand) library.

- Created by: `KritzelBrushTool`
- Removed by: `KritzelEraserTool`

### `KritzelLine`

Straight lines and arrows with configurable start/end arrowheads.

- Created by: `KritzelLineTool`
- Supports anchor snapping to other objects (connecting lines to shapes)
- Arrowhead styles: `triangle`, `open`, `diamond`, `circle`

### `KritzelShape`

Geometric shapes: rectangle, ellipse, or triangle.

- Created by: `KritzelShapeTool`
- Can contain editable text
- Shape type is determined by the `ShapeType` enum

```ts
enum ShapeType {
  Rectangle = 'rectangle',
  Ellipse   = 'ellipse',
  Triangle  = 'triangle',
}
```

### `KritzelText`

Rich text object powered by [ProseMirror](https://prosemirror.net/).

- Created by: `KritzelTextTool`
- Supports font family, size, and color configuration

### `KritzelImage`

Raster image object.

- Created by: `KritzelImageTool`
- Supports resizing while maintaining aspect ratio

### `KritzelGroup`

Permanent grouping of multiple objects.

- Created via `group()` method
- Dissolved via `ungroup()` method
- Children move, resize, and rotate as a unit

### `KritzelCustomElement`

User-defined custom HTML element on the canvas.

- Allows embedding arbitrary HTML content as a canvas object
- Participates in selection, movement, and z-ordering like any other object

---

## Working with Objects Programmatically

```ts
const editor = document.querySelector('kritzel-editor');

// Get all objects
const objects = await editor.getAllObjects();

// Find objects by type
const paths = await editor.findObjects(obj => obj.__class__ === 'KritzelPath');
const shapes = await editor.findObjects(obj => obj.__class__ === 'KritzelShape');

// Get a specific object
const obj = await editor.getObjectById('some-id');

// Update an object
await editor.updateObject(obj, { opacity: 0.5, rotation: Math.PI / 4 });

// Remove an object
await editor.removeObject(obj);

// Center viewport on an object
await editor.centerObjectInViewport(obj);
```
