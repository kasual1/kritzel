---
sidebar_label: Types & Interfaces
title: "Types & Interfaces | Kritzel for React"
description: "TypeScript types and interfaces exposed by the Kritzel library for use in React projects."
---
# Other

All types below are exported from `@kritzel/engine`.

## Interfaces

### `KritzelViewportState`

Emitted by the `viewportChange` event. Returned by `getViewport()`.

```ts
interface KritzelViewportState {
  translateX: number;
  translateY: number;
  scale: number;
  width: number;
  height: number;
}
```

### `KritzelUndoState`

Emitted by the `undoStateChange` event.

```ts
interface KritzelUndoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
}
```

### `KritzelSyncConfig`

Passed to the `syncConfig` prop. See [Sync & Collaboration](../advanced/collaboration.md).

```ts
interface KritzelSyncConfig {
  providers: ProviderConfig[];
}
```

### `KritzelShortcut`

Keyboard shortcut definition. Returned by `getDisplayableShortcuts()`.

```ts
interface KritzelShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  category: string;
  condition?: () => boolean;
  action: () => void;
}
```

### `KritzelToolbarItem`

Defines a toolbar item for the `toolbarItems` prop on `<KritzelEditor>`.

```ts
interface KritzelToolbarItem {
  type: 'tool' | 'config';
  tool?: (new (...args: any[]) => KritzelBaseTool) | KritzelBaseTool;
  icon?: string;
  isDefault?: boolean;
  isDisabled?: boolean | (() => boolean | Promise<boolean>);
  name: string;
  config?: KritzelBrushToolConfig | KritzelLineToolConfig | KritzelTextToolConfig | KritzelShapeToolConfig;
  subOptions?: KritzelToolbarSubOption[];
}

interface KritzelToolbarSubOption {
  id: string;
  icon: string;
  label: string;
  value: any;
  toolProperty: string;
}
```

### Tool Config Interfaces

```ts
interface KritzelBrushToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
}

interface KritzelLineToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
  arrows?: {
    start?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
    end?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
  };
}

interface KritzelTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}

interface KritzelShapeToolConfig {
  shapeType: ShapeType;
  fillColor: ThemeAwareColor;
  strokeColor: ThemeAwareColor;
  strokeWidth: number;
  fontColor: ThemeAwareColor;
  fontSize: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}
```

### Event Payload Interfaces

```ts
interface ObjectsAddedEvent {
  objects: KritzelBaseObject[];
}

interface ObjectsRemovedEvent {
  objects: KritzelBaseObject[];
}

interface ObjectsUpdatedEvent {
  objects: { object: KritzelBaseObject; changedProperties: Partial<KritzelBaseObject> }[];
}
```

### Geometry Interfaces

```ts
interface KritzelBoundingBox {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
}

interface KritzelPolygon {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}
```

### Anchor Interface

```ts
interface LineAnchor {
  objectId: string;
}
```

### Theme Interface

```ts
interface KritzelTheme {
  global?: { ... };
  engine?: { backgroundColor?: string; ... };
  toolbarItems?: { ... };
  selection?: { ... };
  dialog?: { ... };
  contextMenu?: { ... };
  utilityPanel?: { ... };
  // ... and more sections
}
```

See [Theming](../customization/themes.md) for details.

---

## Classes

### `KritzelWorkspace`

Represents a workspace (canvas) within the editor.

```ts
class KritzelWorkspace {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  viewport: {
    centerWorldX: number;
    centerWorldY: number;
    scale: number;
  };

  constructor(
    id: string,
    name: string,
    viewport?: { centerWorldX: number; centerWorldY: number; scale: number },
  );
}
```

Default viewport: `{ centerWorldX: 0, centerWorldY: 0, scale: 1 }`.

---

## Enums

### `KritzelAlignment`

Used with `alignObjects()`.

```ts
enum KritzelAlignment {
  StartHorizontal  = 'start-horizontal',   // Align left edges
  CenterHorizontal = 'center-horizontal',  // Align horizontal centers
  EndHorizontal    = 'end-horizontal',     // Align right edges
  StartVertical    = 'start-vertical',     // Align top edges
  CenterVertical   = 'center-vertical',    // Align vertical centers
  EndVertical      = 'end-vertical',       // Align bottom edges
}
```

### `ShapeType`

Used with `KritzelShapeToolConfig`.

```ts
enum ShapeType {
  Rectangle = 'rectangle',
  Ellipse   = 'ellipse',
  Triangle  = 'triangle',
}
```

---

## Type Aliases

| Type | Definition | Description |
|------|------------|-------------|
| `ThemeName` | `'light' \| 'dark' \| string` | Theme identifier — built-in names or the name of a custom theme |
| `ThemeAwareColor` | `{ light: string; dark: string; label?: string }` | Color that adapts to active theme |
| `ColorPalette` | `readonly ThemeAwareColor[]` | Array of theme-aware colors |

## Agentic Cursor Types

Types used by the [agentic cursor methods](./editor.md#agentic-cursors).

### `KritzelAgenticCursorOptions`

Passed to `addAgenticCursor()`.

```ts
interface KritzelAgenticCursorOptions {
  id?: string;
  name?: string;
  color?: string;
  status?: string;
  visible?: boolean;
  position?: KritzelAgenticCursorTarget;
}
```

### `KritzelAgenticCursorTarget`

Target of `moveAgenticCursor()` and the initial `position` of a cursor. Either world coordinates or an anchor on an object.

```ts
type KritzelAgenticCursorTarget =
  | { x: number; y: number }
  | { objectId: string; anchor?: KritzelAgenticCursorAnchor; offset?: { x: number; y: number } };

type KritzelAgenticCursorAnchor =
  | 'center' | 'top-left' | 'top' | 'top-right' | 'right'
  | 'bottom-right' | 'bottom' | 'bottom-left' | 'left';
```

### `KritzelAgenticCursorMoveOptions`

Passed to `moveAgenticCursor()`.

```ts
interface KritzelAgenticCursorMoveOptions {
  duration?: number;
  easing?: KritzelEasing;
  speed?: number;
  attach?: boolean;
}

type KritzelEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number);

interface KritzelAgenticCursorMoveResult {
  completed: boolean;
}
```

### `KritzelAgenticCursorPatch`

Passed to `updateAgenticCursor()`.

```ts
interface KritzelAgenticCursorPatch {
  name?: string;
  color?: string;
  status?: string | null;
  visible?: boolean;
}
```

### `KritzelAgenticCursor`

Snapshot returned by `addAgenticCursor()`, `updateAgenticCursor()`, `getAgenticCursor()` and `getAgenticCursors()`.

```ts
interface KritzelAgenticCursor {
  id: string;
  name?: string;
  color: string;
  status?: string;
  visible: boolean;
  position: { x: number; y: number };
  attachedTo: { objectId: string; anchor: KritzelAgenticCursorAnchor; offset: { x: number; y: number } } | null;
  isMoving: boolean;
}
```

### `KritzelAgenticCursorDetachedEvent`

Emitted by the `agenticCursorDetached` event.

```ts
interface KritzelAgenticCursorDetachedEvent {
  id: string;
  objectId: string;
  reason: 'object-removed' | 'manual';
}
```
