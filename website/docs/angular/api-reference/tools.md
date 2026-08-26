---
sidebar_label: Tool
displayed_sidebar: tutorialSidebar
title: "Tools API Reference | Kritzel for Angular"
description: "API Reference for KritzelBaseTool and built-in tools."
---

# Tool API Reference

The Kritzel tool architecture is highly extensible. All interaction tools in Kritzel extend the `KritzelBaseTool` class, which handles standardizing pointer state, serialization, and lifecycle callbacks.

## `KritzelBaseTool`

`KritzelBaseTool` is the abstract base class for all drawing and interaction tools in Kritzel. When creating custom tools, you will subclass `KritzelBaseTool` and override its lifecycle and interaction methods.

### Properties

- **`__class__: string`**  
  Class name identifier used for serialization and deserialization.
- **`name: string`**  
  Human-readable name of the tool (e.g., `'base-tool'`).
- **`protected readonly _core: KritzelCore`**  
  Reference to the Kritzel core instance for accessing the workspace, viewport, and other core functionality.

### Lifecycle Methods

These methods are called by the core engine during tool selection and deselection.

#### `onActivate(): void`
Called when the tool becomes the active tool. Override this to perform initialization when the tool is selected (e.g., capturing the current active styling or altering the cursor).

#### `onDeactivate(): void`
Called when the tool is deactivated (another tool becomes active). Override this to perform cleanup when the tool is deselected.

### Interaction Methods

These methods intercept user input routed directly from the canvas viewport.

#### `handlePointerDown(_event: PointerEvent): void`
Handles pointer down events (mouse click, touch start, pen down). Override to implement behavior when the user starts an interaction.

#### `handlePointerMove(_event: PointerEvent): void`
Handles pointer move events (mouse move, touch move, pen move). Override to implement behavior during dragging or hovering.

#### `handlePointerUp(_event: PointerEvent): void`
Handles pointer up events (mouse release, touch end, pen up). Override to implement behavior when the user ends an interaction.

#### `handleWheel(_event: WheelEvent): void`
Handles mouse wheel events for zooming or scrolling. Override to implement tool-specific wheel behavior.

### Serialization Methods

#### `serialize(): { __class__: string, name: string }`
Serializes the tool to a plain object for persistence, synchronization, or transfer.

#### `deserialize(object: any): KritzelSerializable`
Deserializes a plain object into this tool instance, restoring state from storage or over the network.

---

## Built-in Tools

Kritzel bundles several native tools that inherit from `KritzelBaseTool`:

- **`KritzelSelectionTool`**: Base tool for selecting, moving, resizing, and transforming objects.
- **`KritzelBrushTool`**: Draws freehand vector curves.
- **`KritzelLineTool`**: Draws straight connecting lines.
- **`KritzelShapeTool`**: Draws geometric shapes like rectangles and ellipses.
- **`KritzelTextTool`**: Places and edits rich text structures.
- **`KritzelEraserTool`**: Computes intersections directly to erase portions of strokes or whole objects.
- **`KritzelImageTool`**: Places and transforms visual media frames.

### Registering and Enabling a Tool

To inject a custom built tool, utilize the `registerTool()` method on the editor or engine:

```ts
import { KritzelBaseTool } from 'kritzel-angular';

export class MyCustomTool extends KritzelBaseTool {
  name = 'my-custom-tool';

  override handlePointerDown(e: PointerEvent) {
    console.log('Custom tool clicked!');
  }
}

// In your application logic:
const tool = await editor.registerTool('my-custom-tool', MyCustomTool, {});
await editor.changeActiveTool(tool);
// or, equivalently, by its registered name:
await editor.changeActiveToolByName('my-custom-tool');
```