---
sidebar_label: Tools
title: "Tools | Kritzel for Angular"
description: "Reference for all drawing tool classes and tool configuration interfaces in Kritzel: base tool, selection, brush, line, shape, text, image, and eraser."
toc_max_heading_level: 2
---
# Tools

This is the API reference for all drawing tool classes and tool configurations in Kritzel.
Every tool handles user interactions on the canvas and can be registered and configured via the editor.

## Base Tool

`KritzelBaseTool` is the abstract base class for all tools in Kritzel. All specific tool implementations extend this class and inherit its properties and lifecycle hooks.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| __class__ | string | Identifier used for object serialization and deserialization |
| toolType | KritzelToolType | Type key identifying the tool type across builds ('base', 'selection', 'brush', 'line', 'shape', 'text', 'image', 'eraser') |
| name | string | Human-readable name of the tool |

### Methods

#### onActivate

Called when the tool becomes the active tool.

```ts
onActivate()
```

#### onDeactivate

Called when the tool is deactivated.

```ts
onDeactivate()
```

#### handlePointerDown

Handles pointer down events (mouse click, touch start, pen down).

```ts
handlePointerDown(event: PointerEvent)
```

#### handlePointerMove

Handles pointer move events (mouse move, touch move, pen move).

```ts
handlePointerMove(event: PointerEvent)
```

#### handlePointerUp

Handles pointer up events (mouse release, touch end, pen up).

```ts
handlePointerUp(event: PointerEvent)
```

#### handleWheel

Handles mouse wheel events for zooming or panning.

```ts
handleWheel(event: WheelEvent)
```

#### serialize

Serializes the tool state to a plain object.

```ts
serialize()
```

#### deserialize

Restores the tool state from a serialized object.

```ts
deserialize(object: any)
```

---

## Selection Tool

`KritzelSelectionTool` enables selecting, moving, resizing, and rotating objects on the canvas. It manages selection handles, multi-selection bounding boxes, and object transformations.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| toolType | 'selection' | Type identifier for the selection tool |
| selectionHandler | KritzelSelectionHandler | Handler for selection box and multi-select logic |
| moveHandler | KritzelMoveHandler | Handler for dragging and moving selected objects |
| resizeHandler | KritzelResizeHandler | Handler for resizing selected objects |
| rotationHandler | KritzelRotationHandler | Handler for rotating selected objects |
| hoverHandler | KritzelHoverHandler | Handler for object hover highlighting |
| lineHandleHandler | KritzelLineHandleHandler | Handler for manipulating line endpoint anchors |
| palette | ThemeAwareColor[] | Active color palette available for modifying selected objects |

### Methods

#### hasSelection

Checks if any objects are currently selected.

```ts
hasSelection()
```

#### getSelectedObjects

Returns an array of currently selected objects.

```ts
getSelectedObjects()
```

---

## Brush Tool

`KritzelBrushTool` handles freehand drawing on the canvas, creating vector `KritzelPath` objects as the pointer moves.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| toolType | 'brush' | Type identifier for the brush tool |
| color | ThemeAwareColor | Stroke color of the brush |
| size | number | Stroke width in pixels |
| opacity | number | Opacity of the stroke (0–1) |
| palette | ThemeAwareColor[] | Available color palette presets |
| sizes | number[] | Available stroke size presets |

### Configuration

Toolbar items can configure initial settings for the brush tool using `KritzelBrushToolConfig`:

| Property | Type | Description |
|----------|------|-------------|
| color | ThemeAwareColor | Initial stroke color |
| size | number | Initial stroke size in pixels |
| opacity | number | Optional initial opacity (0–1) |
| palette | ThemeAwareColor[] | Color palette options shown in tool configuration |
| sizes | number[] | Optional stroke size presets |

---

## Line Tool

`KritzelLineTool` creates straight or curved `KritzelLine` objects with optional arrowheads by dragging from a start point to an end point.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| toolType | 'line' | Type identifier for the line tool |
| color | ThemeAwareColor | Line stroke color |
| size | number | Line stroke width in pixels |
| opacity | number | Line opacity (0–1) |
| palette | ThemeAwareColor[] | Available color palette presets |
| sizes | number[] | Available line stroke size presets |
| arrows | LineArrowConfig | Arrowhead configurations for start and end points |

### Configuration

Toolbar items configure initial line settings using `KritzelLineToolConfig`:

| Property | Type | Description |
|----------|------|-------------|
| color | ThemeAwareColor | Initial line stroke color |
| size | number | Initial stroke width in pixels |
| opacity | number | Optional initial opacity (0–1) |
| palette | ThemeAwareColor[] | Color palette options |
| sizes | number[] | Optional stroke size presets |
| arrows | LineArrowConfig | Optional initial arrowhead styles ('triangle', 'open', 'diamond', 'circle') |

---

## Shape Tool

`KritzelShapeTool` creates geometric `KritzelShape` objects (rectangles, ellipses, triangles) by dragging across the canvas.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| toolType | 'shape' | Type identifier for the shape tool |
| shapeType | ShapeType | Active shape geometry (Rectangle, Ellipse, Triangle) |
| fillColor | ThemeAwareColor | Shape background fill color |
| strokeColor | ThemeAwareColor | Shape border stroke color |
| strokeWidth | number | Border stroke width in pixels |
| opacity | number | Shape opacity (0–1) |
| fontFamily | string | Font family for optional embedded text |
| fontSize | number | Font size in points for embedded text |
| fontColor | ThemeAwareColor | Font color for embedded text |
| palette | ThemeAwareColor[] | Available color palette presets |
| sizes | number[] | Available border width presets |

### Configuration

Toolbar items configure initial shape settings using `KritzelShapeToolConfig`:

| Property | Type | Description |
|----------|------|-------------|
| shapeType | ShapeType | Initial shape type (Rectangle, Ellipse, Triangle) |
| fillColor | ThemeAwareColor | Initial fill color |
| strokeColor | ThemeAwareColor | Initial stroke color |
| strokeWidth | number | Initial stroke width in pixels |
| opacity | number | Optional initial opacity (0–1) |
| fontColor | ThemeAwareColor | Initial font color for embedded text |
| fontSize | number | Initial font size for embedded text |
| fontFamily | string | Initial font family for embedded text |
| palette | ThemeAwareColor[] | Color palette options |
| sizes | number[] | Optional stroke width presets |

---

## Text Tool

`KritzelTextTool` places and edits rich text `KritzelText` objects on the canvas using an inline ProseMirror editor.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| toolType | 'text' | Type identifier for the text tool |
| fontFamily | string | Active font family name |
| fontSize | number | Active font size in points |
| fontColor | ThemeAwareColor | Active font color |
| opacity | number | Text opacity (0–1) |
| palette | ThemeAwareColor[] | Available font color palette presets |
| sizes | number[] | Available font size presets |

### Configuration

Toolbar items configure initial text tool settings using `KritzelTextToolConfig`:

| Property | Type | Description |
|----------|------|-------------|
| color | ThemeAwareColor | Initial font color |
| size | number | Initial font size in points |
| opacity | number | Optional initial opacity (0–1) |
| fontFamily | string | Initial font family name |
| availableFonts | KritzelFontRegistration[] | Optional array of registered fonts available in the tool UI |
| palette | ThemeAwareColor[] | Color palette options |
| sizes | number[] | Optional font size presets |

---

## Image Tool

`KritzelImageTool` handles uploading and inserting raster `KritzelImage` objects onto the canvas via a native file picker dialog.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| toolType | 'image' | Type identifier for the image tool |
| fileInput | HTMLInputElement \| null | Hidden HTML file input element used to select image files |
| maxCompressionSize | number | Maximum width/height dimension in pixels for automatic image compression |
| multiImportOffset | number | Stagger offset in world units applied when importing multiple images at once |

---

## Eraser Tool

`KritzelEraserTool` removes objects or path segments touched by the eraser during drag gestures.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| toolType | 'eraser' | Type identifier for the eraser tool |
