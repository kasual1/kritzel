---
sidebar_label: Types & Interfaces
title: "Types & Interfaces | Kritzel for Vue"
description: "TypeScript types and interfaces exposed by the Kritzel library for use in Vue projects."
---
# Types & Interfaces Reference

All types below are exported from `kritzel-stencil`.

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

Passed to the `syncConfig` prop. See [Sync & Collaboration](advanced-concepts/concept-collaboration.md).

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

### `KritzelToolbarControl`

Defines a toolbar item for the `controls` prop on `<KritzelEditor>`.

```ts
interface KritzelToolbarControl {
  type: 'tool' | 'config';
  tool?: (new (...args: any[]) => KritzelBaseTool) | KritzelBaseTool;
  icon?: string;
  isDefault?: boolean;
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
  type: 'pen' | 'highlighter';
  color: ThemeAwareColor;
  size: number;
  palettes: { [brushType: string]: ThemeAwareColor[] };
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
  controls?: { ... };
  selection?: { ... };
  dialog?: { ... };
  contextMenu?: { ... };
  utilityPanel?: { ... };
  // ... and more sections
}
```

See [Theming](advanced-concepts/customization/concept-theming.md) for details.

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
