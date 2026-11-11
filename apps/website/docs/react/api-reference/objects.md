---
sidebar_label: Objects
title: "Objects | Kritzel for React"
description: "Reference for all canvas object types in Kritzel: brush, line, shape, text, and image."
toc_max_heading_level: 2
---
# Objects

This is the API reference for all canvas object types in Kritzel.
Every object consists of properties, computed properties, and methods.

## Base Object

Abstract base class for every object that can be placed on the canvas. All other object types listed below extend this class and inherit its properties, computed properties, and methods — only properties/methods specific to a given type are listed in its own section.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| id | string | auto-generated UUID | Unique identifier |
| workspaceId | string | — | ID of the workspace this object belongs to |
| x | number | — | X position in world coordinates |
| y | number | — | Y position in world coordinates |
| translateX | number | — | World-space X translation |
| translateY | number | — | World-space Y translation |
| width | number | — | Width in world units |
| height | number | — | Height in world units |
| rotation | number | 0 | Rotation in radians |
| opacity | number | 1 | Opacity (0–1) |
| zIndex | number | 0 | Z-order layer |
| scale | number | — | Object scale |
| backgroundColor | ThemeAwareColor | — | Background color |
| borderColor | ThemeAwareColor | — | Border color |
| borderWidth | number | 0 | Border width |
| padding | number | 0 | Padding |
| resizing | boolean | false | Whether the object is currently being resized |
| markedForRemoval | boolean | false | Whether the object is pending removal |
| userId | string | — | ID of the user who created the object |
| name | string | — | User-facing name, shown as the title of its titlebar. Persisted and synced |
| isVisible | boolean | true | Visibility flag |
| isSelected | boolean | false | Whether the object is selected |
| isHovered | boolean | false | Whether the object is hovered |
| isMounted | boolean | false | Whether the object is mounted to the DOM |
| isEditable | boolean | false | Whether the object is in edit mode |
| isInteractive | boolean | false | Whether the object responds to interaction |
| isResizable | boolean | true | Whether the object can be resized. Persisted and synced. Combines with `isResizable` of the [`objectConfig` prop](../fundamentals/objects.md#configuring-objects): either one can forbid it |
| isRotatable | boolean | true | Whether the object can be rotated. Persisted and synced. Combines with `isRotatable` of the [`objectConfig` prop](../fundamentals/objects.md#configuring-objects): either one can forbid it |
| isLoading | boolean | false | Whether the engine draws a [loading placeholder](./theming.md#loading-placeholder) over the object. Persisted and synced |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
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
| isLoading | boolean | Whether the object starts out with a loading placeholder. Defaults to `false` |

```ts
const frame = new KritzelShape({ translateX: 0, translateY: 0, width: 400, height: 240, name: 'Desktop' });
```

See [Object Titlebar](../fundamentals/controls.md#object-titlebar) for details.

### Loading State

While `isLoading` is `true`, the engine draws a grey placeholder with a glare animation over the whole object. It follows the object's size and rotation, and the object can still be selected and moved, but its content can't be used until loading ends. Objects don't render loading content of their own. The look is set through the [Loading Placeholder](./theming.md#loading-placeholder) theme tokens.

```ts
const card = await editorRef.current?.addObject(
  new KritzelShape({ translateX: 0, translateY: 0, width: 320, height: 200, isLoading: true }),
);

// later, once the content is ready
card?.setLoading(false);
```

### Methods

| Method | Description |
|--------|-------------|
| mount(element) | Mounts the object to a DOM element |
| generateId() | Generates a new unique identifier |
| isInViewport() | Tests if the object is visible in the current viewport |
| centerInViewport() | Moves the object to the center of the current viewport |
| update() | Notifies the store that the object was updated |
| setLoading(isLoading) | Shows or hides the loading placeholder. Stores and syncs the change and rerenders. Does nothing if the value is unchanged |
| move(startX, startY, endX, endY) | Moves the object by the delta between two points |
| resize(x, y, width, height) | Resizes and repositions the object |
| rotate(value) | Sets the rotation angle in radians |
| updatePosition(x, y) | Updates the object's translateX/translateY |
| clone() | Creates a shallow copy of the object with the same id |
| copy() | Creates an independent copy of the object with a new id |
| serialize() | Converts the object to a plain serializable representation |
| deserialize(data) | Restores the object from serialized data |
| isClass(className) | Type guard that checks the object's `__class__` |
| edit(event) | Handles edit actions; overridden by editable object types |
| hitTest(x, y) | Tests if a world-coordinate point intersects this object |
| hitTestPolygon(polygon) | Tests if a polygon intersects this object |

---

## Path

Freehand brush strokes. Rendered as SVG paths using the [perfect-freehand](https://github.com/steveruizok/perfect-freehand) library.

- Created by: `KritzelBrushTool`
- Removed by: `KritzelEraserTool`

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| points | number[][] | [] | Array of [x, y] coordinate pairs defining the path |
| d | string | — | Generated SVG path data string |
| stroke | ThemeAwareColor | none | Stroke color |
| strokeWidth | number | 8 | Width of the stroke in pixels |
| lineSlack | number | 0.5 | Additional padding for bounding box calculations |
| fill | ThemeAwareColor | — | Fill color |
| isDebugInfoVisible | boolean | true | Whether debug info is rendered for the path |
| isCompleted | boolean | false | Whether the stroke has finished being drawn |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| viewBox | string | SVG viewBox attribute for local (object-relative) rendering |

---

## Line

Straight lines and arrows with configurable start/end arrowheads.

- Created by: `KritzelLineTool`
- Supports anchor snapping to other objects (connecting lines to shapes)
- Arrowhead styles: `triangle`, `open`, `diamond`, `circle`

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| startX | number | 0 | X coordinate of the start point |
| startY | number | 0 | Y coordinate of the start point |
| endX | number | 0 | X coordinate of the end point |
| endY | number | 0 | Y coordinate of the end point |
| controlX | number | — | X coordinate of the curve control point |
| controlY | number | — | Y coordinate of the curve control point |
| stroke | ThemeAwareColor | — | Stroke color |
| strokeWidth | number | 4 | Width of the stroke in pixels |
| opacity | number | 1 | Line opacity (0–1) |
| startAnchor | LineAnchor | — | Anchor connection for the start point |
| endAnchor | LineAnchor | — | Anchor connection for the end point |
| arrows | LineArrowConfig | — | Arrow head configuration for start and end of line |
| isDebugInfoVisible | boolean | true | Whether debug info is rendered for the line |
| isCompleted | boolean | false | Whether the line has finished being drawn |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| d | string | Generated SVG path data string (straight line or quadratic Bezier curve) |
| viewBox | string | SVG viewBox attribute string |

---

## Shape

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

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| shapeType | ShapeType | Rectangle | Rectangle, Ellipse, or Triangle |
| fillColor | ThemeAwareColor | transparent | Fill color |
| strokeColor | ThemeAwareColor | #000000 | Stroke color |
| strokeWidth | number | 4 | Width of the shape's stroke in pixels |
| fontFamily | string | Arial | Font family for the shape's text content |
| fontSize | number | 16 | Font size for text content in points |
| fontColor | ThemeAwareColor | #000000 | Font color for text content |
| scaleFactor | number | 1 | Horizontal scale factor for transformations |
| isEditing | boolean | false | Whether the shape's text is currently being edited |
| editor | EditorView | — | ProseMirror editor instance for the shape's text |
| content | any | — | Serialized ProseMirror document content |
| uneditedObject | KritzelShape | — | Snapshot of the shape before editing started |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| viewBox | string | SVG viewBox using screen-space coordinates |

### Methods

| Method | Description |
|--------|-------------|
| updateDimensions() | Recomputes world-space translateX/translateY from screen-space x/y |
| mountTextEditor(element) | Mounts the ProseMirror text editor to a DOM element |
| setContent(content) | Sets the text content from a serialized ProseMirror document |
| focus(coords) | Focuses the text editor, optionally positioning the cursor at given coordinates |

---

## Text

Rich text object powered by [ProseMirror](https://prosemirror.net/).

- Created by: `KritzelTextTool`
- Supports font family, size, and color configuration

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| fontFamily | string | Arial | Font family name |
| fontSize | number | 8 | Font size in points |
| fontColor | ThemeAwareColor | #000000 | Font color |
| initialWidth | number | 1 | Initial width before scaling |
| initialHeight | number | 1 | Initial height before scaling |
| scaleFactor | number | 1 | Horizontal scale factor for transformations |
| isDebugInfoVisible | boolean | true | Whether debug info is rendered for the text object |
| isEditing | boolean | false | Whether the text is currently being edited |
| isNewlyCreated | boolean | false | Whether the text object was just created and not yet edited |
| editor | EditorView | — | ProseMirror editor instance |
| content | any | — | Serialized ProseMirror document content |
| uneditedObject | KritzelText | — | Snapshot of the text object before editing started |
| rows | number | 1 | Number of text rows |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| isEmpty | boolean | Whether the editor is empty or contains only whitespace |

### Methods

| Method | Description |
|--------|-------------|
| setContent(content) | Sets the text content from a serialized ProseMirror document |
| createEditor() | Creates and configures a new ProseMirror editor instance |
| adjustSizeOnInput() | Recalculates width/height based on the current content |
| focus(coords) | Focuses the text editor, optionally positioning the cursor at given coordinates |

---

## Image

Raster image object.

- Created by: `KritzelImageTool`
- Supports resizing while maintaining aspect ratio

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| assetId | string | '' | Stable asset identifier used to resolve the image bytes |
| mimeType | string | '' | MIME type of the referenced asset |
| src | string | '' | Legacy inline data URL (deprecated, use assetId) |
| maxWidth | number | 300 | Maximum width in pixels |
| maxHeight | number | 300 | Maximum height in pixels |
| maxCompressionSize | number | 1200 | Maximum size used when compressing the image |
| resolvedSrc | string | — | URL resolved from the asset storage layer (not persisted) |
| loadState | KritzelAssetLoadState | idle | Current load state of the referenced asset (not persisted) |
| maxLoadAttempts | number | 3 | Maximum number of definitive resolution failures before giving up |
| loadAttempts | number | 0 | Number of definitive resolution failures so far (not persisted) |
| maxTransientRetryDurationMs | number | 30000 | Maximum time to keep retrying transient failures |
| transientRetryStartedAt | number | — | Timestamp of the first transient failure in the current retry chain |

### Methods

| Method | Description |
|--------|-------------|
| ensureResolved() | Triggers (idempotent) resolution of the referenced asset |

---

## Group

Permanent grouping of multiple objects. Unlike a temporary multi-selection, a group is persisted and saved with the workspace.

- Supports nested groups (groups can contain other groups)
- Clicking any child selects the entire group
- Children move, resize, and rotate as a unit

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| childIds | string[] | [] | IDs of the child objects within this group |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| children | KritzelBaseObject[] | The actual child objects resolved from the store |
| length | number | Number of children in this group |

### Methods

| Method | Description |
|--------|-------------|
| addChild(object) | Adds a child object to this group |
| removeChild(objectId) | Removes a child object from this group by id |
| ungroup() | Returns all children as top-level objects |
| finalize() | Refreshes the bounding box and snapshots after children are positioned |
| refreshBoundingBox() | Recalculates the group's bounding box based on its children |

### Static Methods

| Method | Description |
|--------|-------------|
| createFromObjects(core, objects) | Creates a group from an array of existing objects |
| findParentGroup(core, objectId) | Finds the parent group that contains the given object as a direct child |
| collectDescendantIds(group) | Recursively collects the ids of all descendants of a group |

---

## Dynamic Object

User-defined custom HTML element on the canvas.

- Allows embedding arbitrary HTML content as a canvas object
- Participates in selection, movement, and z-ordering like any other object

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| element | HTMLElement | — | The HTML element rendered on the canvas |
| rendererKey | string | — | Identifier for a registered renderer (for example, 'react-card') |
| rendererData | unknown | — | Custom data payload passed to the renderer |

### Methods

| Method | Description |
|--------|-------------|
| setIsInteractive(isInteractive) | Updates interactivity state for the embedded HTML content |
| hasFocusedInputElement() | Returns true when a text-input-like element inside this object currently has focus |

---

## Iframe Object

HTML, CSS, and JavaScript in a sandboxed iframe on the canvas.

- See [Rendering iFrames](../advanced/dynamic-objects.md#rendering-iframes) and [Interacting with iFrame Content](../advanced/dynamic-objects.md#interacting-with-iframe-content)
- The editor's [object element methods](./editor.md#object-elements) call the element methods below by object ID

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| content | KritzelIframeContent | — | The `html`, `css`, and `script` of the page |
| state | `Record<string, unknown>` | — | Serializable state shared with the page as `kritzel.state` |
| title | string | 'Embedded content' | Title of the iframe element |
| sandbox | string[] | ['allow-scripts'] | Sandbox tokens of the iframe |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| isElementPicking | boolean | Whether the object is picking elements (not persisted) |

### Methods

| Method | Description |
|--------|-------------|
| setContent(content) | Replaces the content and reloads the page |
| setState(state) | Replaces the state and sends it to the page |
| setElementPicking(enabled, options) | Turns element picking on or off. While picking, a click on an element of the page picks it instead of reaching the page |
| setElementHighlights(highlights) | Replaces the element highlights drawn inside the page. Pass an empty array to remove them |
| getElementHighlights() | Returns the current element highlights |
| queryElements(selector, limitOrOptions) | Describes the elements of the page that match a CSS selector, in document order, with their state. Pass the `limit` (default 100, at most 500) or options: `limit`, `interactiveOnly: true` for elements a user can interact with, `includeValues: true` for the values of form fields (never of password fields) |
| interactWithElement(selector, interaction, options) | Performs an interaction on the first matching element as a user would: a click, hover, fill, check, key press, or scroll (see [`KritzelObjectElementInteraction`](./agent.md#kritzelobjectelementinteraction)). Scrolls it into view and checks that it is visible, enabled, and not covered first; `{ trial: true }` only checks. Resolves with `completed: false` and a `reason` when it can't be performed, and rejects only for an invalid selector or interaction. The events are not trusted and carry no user activation, so APIs that need a user gesture (audio, fullscreen, clipboard) may refuse to work from them |
| trackElement(selector) | Starts reporting the visible position of the first element that matches a selector. Calls are counted, so each call needs a matching `untrackElement`. An agent's cursor uses this to follow an element it points at (`agent.moveTo({ objectId, selector })`) |
| untrackElement(selector) | Undoes one `trackElement` call for a selector |
| getTrackedElementRect(selector) | Returns the last known visible bounding box of a tracked element in content coordinates, or `null` if it hasn't been seen yet |
| contentToObjectLocal(point) | Converts a point in content coordinates to world units in the object's local, unrotated space, relative to its top-left corner |
