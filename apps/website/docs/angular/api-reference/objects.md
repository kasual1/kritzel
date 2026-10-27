---
sidebar_label: Objects
title: "Objects | Kritzel for Angular"
description: "Reference for all canvas object types in Kritzel: brush, line, shape, text, and image."
toc_max_heading_level: 2
---
# Objects

This is the API reference for all canvas object types in Kritzel.
Every object consists of properties, computed properties and methods.

## Base Object

`KritzelBaseObject` is the abstract base class for every object that can be placed on the canvas. All other object types listed below extend this class and inherit its properties, computed properties, and methods and extend them with their own specific functionality.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier |
| workspaceId | string | ID of the workspace this object belongs to |
| x | number | X position in world coordinates |
| y | number | Y position in world coordinates |
| translateX | number | World-space X translation |
| translateY | number | World-space Y translation |
| width | number | Width in world units |
| height | number | Height in world units |
| rotation | number | Rotation in radians |
| opacity | number | Opacity (0–1) |
| zIndex | number | Z-order layer |
| scale | number | Object scale |
| backgroundColor | ThemeAwareColor | Background color |
| borderColor | ThemeAwareColor | Border color |
| borderWidth | number | Border width |
| padding | number | Padding |
| resizing | boolean | Whether the object is currently being resized |
| markedForRemoval | boolean | Whether the object is pending removal |
| userId | string | ID of the user who created the object |
| name | string | User-facing name, shown as the title of its titlebar. Persisted and synced |
| isVisible | boolean | Visibility flag |
| isSelected | boolean | Whether the object is selected |
| isHovered | boolean | Whether the object is hovered |
| isMounted | boolean | Whether the object is mounted to the DOM |
| isEditable | boolean | Whether the object is in edit mode |
| isInteractive | boolean | Whether the object responds to interaction |
| isResizable | boolean | Whether the object can be resized. Persisted and synced. Combines with `isResizable` of the [`objectConfig` prop](../fundamentals/objects.md#configuring-objects): either one can forbid it |
| isRotatable | boolean | Whether the object can be rotated. Persisted and synced. Combines with `isRotatable` of the [`objectConfig` prop](../fundamentals/objects.md#configuring-objects): either one can forbid it |
| centerX | number | Center X coordinate |
| centerY | number | Center Y coordinate |
| totalWidth | number | Width including padding and borders |
| totalHeight | number | Height including padding and borders |
| boundingBox | KritzelBoundingBox | Axis-aligned bounding box |
| rotatedBoundingBox | KritzelBoundingBox | Bounding box accounting for rotation |
| rotatedPolygon | KritzelPolygon | Four corners of the rotated rectangle |
| transformationMatrix | DOMMatrix | Full transformation matrix |
| rotationDegrees | number | Rotation converted to degrees |

### Common Constructor Options

The constructor of every object accepts the following options in addition to its own, for example in `KritzelShapeConfig` or `KritzelTextConfig`.

| Option | Type | Description |
|--------|------|-------------|
| name | string | User-facing name, shown as the title of its titlebar |

```ts
const frame = new KritzelShape({ translateX: 0, translateY: 0, width: 400, height: 240, name: 'Desktop' });
```

See [Titlebar](../fundamentals/controls.md#titlebar) for details.

### Methods

#### mount

Mounts the object to a DOM element.

```ts
mount(element)
```

#### generateId

Generates a new unique identifier.

```ts
generateId()
```

#### isInViewport

Tests if the object is visible in the current viewport.

```ts
isInViewport()
```

#### centerInViewport

Moves the object to the center of the current viewport.

```ts
centerInViewport()
```

#### update

Notifies the store that the object was updated.

```ts
update()
```

#### move

Moves the object by the delta between two points.

```ts
move(startX, startY, endX, endY)
```

#### resize

Resizes and repositions the object.

```ts
resize(x, y, width, height)
```

#### rotate

Sets the rotation angle in radians.

```ts
rotate(value)
```

#### updatePosition

Updates the object's translateX and translateY values.

```ts
updatePosition(x, y)
```

#### clone

Creates a shallow copy of the object with the same id.

```ts
clone()
```

#### copy

Creates an independent copy of the object with a new id.

```ts
copy()
```

#### serialize

Converts the object to a plain serializable representation.

```ts
serialize()
```

#### deserialize

Restores the object from serialized data.

```ts
deserialize(data)
```

#### isClass

Checks whether the object's `__class__` matches a class name.

```ts
isClass(className)
```

#### edit

Handles edit actions and is overridden by editable object types.

```ts
edit(event)
```

#### hitTest

Tests whether a world-coordinate point intersects this object.

```ts
hitTest(x, y)
```

#### hitTestPolygon

Tests whether a polygon intersects this object.

```ts
hitTestPolygon(polygon)
```

---

## Path

`KritzelPath` represents a brush stroke rendered as an SVG path.
It is created by the `KritzelBrushTool` when the user draws a freehand stroke.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| points | number[][] | Array of [x, y] coordinate pairs defining the path |
| d | string | Generated SVG path data string |
| stroke | ThemeAwareColor | Stroke color |
| strokeWidth | number | Width of the stroke in pixels |
| lineSlack | number | Additional padding for bounding box calculations |
| fill | ThemeAwareColor | Fill color |
| isDebugInfoVisible | boolean | Whether debug info is rendered for the path |
| isCompleted | boolean | Whether the stroke has finished being drawn |
| viewBox | string | SVG viewBox attribute for local (object-relative) rendering |

---

## Line

`KritzelLine` represents a straight or curved line with configurable arrowheads at either end. `KritzelLineTool` creates lines, which can snap their endpoints to anchors on other objects. Arrowheads support triangle, open, diamond, and circle styles.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| startX | number | X coordinate of the start point |
| startY | number | X coordinate of the start point |
| endX | number | X coordinate of the end point |
| endY | number | X coordinate of the end point |
| controlX | number | X coordinate of the curve control point |
| controlY | number | X coordinate of the curve control point |
| stroke | ThemeAwareColor | Stroke color |
| strokeWidth | number | Width of the stroke in pixels |
| startAnchor | LineAnchor | Anchor connection for the start point |
| endAnchor | LineAnchor | Anchor connection for the end point |
| arrows | LineArrowConfig | Arrow head configuration for start and end of line |
| isDebugInfoVisible | boolean | Whether debug info is rendered for the line |
| isCompleted | boolean | Whether the line has finished being drawn |
| d | string | Generated SVG path data string (straight line or quadratic Bezier curve) |
| viewBox | string | SVG viewBox attribute string |

---

## Shape

`KritzelShape` represents a rectangle, ellipse, or triangle created by `KritzelShapeTool`. Shapes can contain editable text, and the shapeType property determines their geometry.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| shapeType | ShapeType | Rectangle, Ellipse, or Triangle |
| fillColor | ThemeAwareColor | Fill color |
| strokeColor | ThemeAwareColor | Stroke color |
| strokeWidth | number | Width of the shape's stroke in pixels |
| fontFamily | string | Font family for the shape's text content |
| fontSize | number | Font size for text content in points |
| fontColor | ThemeAwareColor | Font color for text content |
| scaleFactor | number | Horizontal scale factor for transformations |
| isEditing | boolean | Whether the shape's text is currently being edited |
| editor | EditorView | ProseMirror editor instance for the shape's text |
| content | any | Serialized ProseMirror document content |
| uneditedObject | KritzelShape | Snapshot of the shape before editing started |
| viewBox | string | SVG viewBox using screen-space coordinates |

### Methods

#### updateDimensions

Recomputes world-space translateX and translateY from screen-space x and y values.

```ts
updateDimensions()
```

#### mountTextEditor

Mounts the ProseMirror text editor to a DOM element.

```ts
mountTextEditor(element)
```

#### setContent

Sets the text content from a serialized ProseMirror document.

```ts
setContent(content)
```

#### focus

Focuses the text editor, optionally positioning the cursor at given coordinates.

```ts
focus(coords)
```

---

## Text

`KritzelText` represents rich text on the canvas. It is created via the `KritzelTextTool` and supports inline text editing.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| fontFamily | string | Font family name |
| fontSize | number | Font size in points |
| fontColor | ThemeAwareColor | Font color |
| initialWidth | number | Initial width before scaling |
| initialHeight | number | Initial height before scaling |
| scaleFactor | number | Horizontal scale factor for transformations |
| isDebugInfoVisible | boolean | Whether debug info is rendered for the text object |
| isEditing | boolean | Whether the text is currently being edited |
| isNewlyCreated | boolean | Whether the text object was just created and not yet edited |
| editor | EditorView | ProseMirror editor instance |
| content | any | Serialized ProseMirror document content |
| uneditedObject | KritzelText | Snapshot of the text object before editing started |
| rows | number | Number of text rows |
| isEmpty | boolean | Whether the editor is empty or contains only whitespace |

### Methods

#### setContent

Sets the text content from a serialized ProseMirror document.

```ts
setContent(content)
```

#### createEditor

Creates and configures a new ProseMirror editor instance.

```ts
createEditor()
```

#### adjustSizeOnInput

Recalculates width and height based on the current content.

```ts
adjustSizeOnInput()
```

#### focus

Focuses the text editor, optionally positioning the cursor at given coordinates.

```ts
focus(coords)
```

---

## Image

`KritzelImage` represents a raster image placed on the canvas by `KritzelImageTool`. It supports resizing while preserving the image's aspect ratio.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| assetId | string | Stable asset identifier used to resolve the image bytes |
| mimeType | string | MIME type of the referenced asset |
| src | string | Legacy inline data URL (deprecated, use assetId) |
| maxWidth | number | Maximum width in pixels |
| maxHeight | number | Maximum height in pixels |
| maxCompressionSize | number | Maximum size used when compressing the image |
| resolvedSrc | string | URL resolved from the asset storage layer (not persisted) |
| loadState | KritzelAssetLoadState | Current load state of the referenced asset (not persisted) |
| maxLoadAttempts | number | Maximum number of definitive resolution failures before giving up |
| loadAttempts | number | Number of definitive resolution failures so far (not persisted) |
| maxTransientRetryDurationMs | number | Maximum time to keep retrying transient failures |
| transientRetryStartedAt | number | Timestamp of the first transient failure in the current retry chain |

### Methods

#### ensureResolved

Triggers idempotent resolution of the referenced asset.

```ts
ensureResolved()
```

---

## Group

`KritzelGroup` permanently groups multiple objects so that they can be manipulated as a single unit. Groups may be nested. Selecting a child selects its group. Their children move, resize, and rotate as a unit.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| childIds | string[] | IDs of the child objects within this group |
| children | KritzelBaseObject[] | The actual child objects resolved from the store |
| length | number | Number of children in this group |

### Methods

#### addChild

Adds a child object to this group.

```ts
addChild(object)
```

#### removeChild

Removes a child object from this group by id.

```ts
removeChild(objectId)
```

#### ungroup

Returns all children as top-level objects.

```ts
ungroup()
```

#### finalize

Refreshes the bounding box and snapshots after children are positioned.

```ts
finalize()
```

#### refreshBoundingBox

Recalculates the group's bounding box based on its children.

```ts
refreshBoundingBox()
```

### Static Methods

#### createFromObjects

Creates a group from an array of existing objects.

```ts
createFromObjects(core, objects)
```

#### findParentGroup

Finds the parent group that contains the given object as a direct child.

```ts
findParentGroup(core, objectId)
```

#### collectDescendantIds

Recursively collects the ids of all descendants of a group.

```ts
collectDescendantIds(group)
```

---

## Dynamic Object

`KritzelDynamicObject` represents a user-defined custom HTML element on the canvas. It can embed arbitrary HTML content and participates in selection, movement, and z-ordering like any other object.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| element | HTMLElement | The HTML element rendered on the canvas |
| rendererKey | string | Identifier for a registered renderer (e.g. 'angular-component', 'react-default') |
| rendererData | unknown | Custom data payload passed to the renderer |

### Methods

#### setIsInteractive

Updates interactivity state for the embedded HTML content.

```ts
setIsInteractive(isInteractive)
```

#### hasFocusedInputElement

Returns true when a text-input-like element inside this object currently has focus.

```ts
hasFocusedInputElement()
```


