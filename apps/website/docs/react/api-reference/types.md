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

## Object Config Types

Types used by the [`objectConfig` prop](./editor.md#object). See [Configuring Objects](../fundamentals/objects.md#configuring-objects) for usage.

### `KritzelObjectConfig`

Passed to the `objectConfig` prop. Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized.

```ts
interface KritzelObjectConfig {
  hasTitlebar?: boolean | ((object: KritzelBaseObject) => boolean); // defaults to false
  isRotatable?: boolean | ((object: KritzelBaseObject) => boolean); // defaults to true
  isResizable?: boolean | ((object: KritzelBaseObject) => boolean); // defaults to true
}
```

`hasTitlebar` also requires the `objectTitlebar` prop. It is called for every visible top-level object on every render. Objects inside a group never get their own titlebar; the group is passed in instead.

`isRotatable` and `isResizable` combine with the persisted `isRotatable` and `isResizable` flags of each object: either one can forbid the gesture. A group, and a selection of several objects, can only be rotated or resized when it and every object inside it allow it. When an object cannot be rotated or resized, its handles are hidden and the gesture does not start. Programmatic API calls are not affected.

The configuration is local to your app and neither persisted nor synced. Pass a new object to update it.

Each option is a fixed value for every object, or a function deciding per object. Functions are called synchronously while the engine renders or handles input, so they must be cheap and must not return a promise. A function that throws or returns a promise resolves to the option's default and logs a warning once. Any return value other than a boolean also resolves to the default. Compare `object.__class__` (for example `'KritzelGroup'`) rather than using `instanceof`, which fails when the app bundles more than one copy of the engine, and prefer `childIds` over `children` to inspect a group's children, for example `(object) => object.__class__ === 'KritzelGroup' && (object as KritzelGroup).childIds.length > 1`.

## Object Titlebar Types

Types used by the [`objectTitlebar` prop](./editor.md#object-titlebar). See [Object Titlebar](../fundamentals/controls.md#object-titlebar) for usage.

### `KritzelObjectTitlebarConfig`

Passed to the `objectTitlebar` prop. The same configuration applies to every object for which the `hasTitlebar` option of the `objectConfig` prop is `true`. Without `hasTitlebar`, no titlebars are rendered.

```ts
interface KritzelObjectTitlebarConfig {
  left?: KritzelTitlebarElement[];   // defaults to [{ id: 'title', type: 'title' }]
  center?: KritzelTitlebarElement[];
  right?: KritzelTitlebarElement[];
  visibility?: 'always' | 'active';
  rotation?: 'follow' | 'upright';
  title?: (object: KritzelBaseObject) => string | undefined;
  draggable?: boolean;            // defaults to true
  hideBelowWidth?: number;        // screen pixels, defaults to 40
}
```

Which objects get a titlebar is decided by [`KritzelObjectConfig`](#kritzelobjectconfig) on the `objectConfig` prop, not by this configuration. See [Object Titlebar](../fundamentals/controls.md#object-titlebar).

`KRITZEL_DEFAULT_OBJECT_TITLEBAR` is a ready-made configuration that shows an icon for the object type followed by the title. Pass it as is, or spread it and override individual options, for example `{ ...KRITZEL_DEFAULT_OBJECT_TITLEBAR, visibility: 'active' }`.

### `KritzelTitlebarElement`

```ts
type KritzelTitlebarElement =
  | KritzelTitlebarTitle
  | KritzelTitlebarText
  | KritzelTitlebarIcon
  | KritzelTitlebarButton
  | KritzelTitlebarMenu
  | KritzelTitlebarSpacer;

// Options shared by every element (internal, not exported)
interface KritzelTitlebarElementBase {
  id: string;
  isVisible?: KritzelTitlebarValue<boolean>;
  showWhen?: 'always' | 'active' | 'inactive';
  minBarWidth?: number;
  part?: string;
}

interface KritzelTitlebarTitle extends KritzelTitlebarElementBase {
  type: 'title';
  text?: KritzelTitlebarValue<string>;
  isEditable?: KritzelTitlebarValue<boolean>; // lets users rename the object, defaults to false
}

interface KritzelTitlebarText extends KritzelTitlebarElementBase {
  type: 'text';
  text: KritzelTitlebarValue<string>;
  tone?: 'default' | 'muted' | 'strong';
}

interface KritzelTitlebarIcon extends KritzelTitlebarElementBase {
  type: 'icon';
  icon: KritzelTitlebarValue<KritzelIconName>;
}

interface KritzelTitlebarButton extends KritzelTitlebarElementBase {
  type: 'button';
  icon?: KritzelTitlebarValue<KritzelIconName>;
  label?: KritzelTermKey | string;
  tooltip?: KritzelTermKey | string;
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: KritzelTitlebarValue<boolean>;
  isPressed?: KritzelTitlebarValue<boolean>;
  action?: (context: KritzelObjectTitlebarContext, event: MouseEvent) => void;
}

interface KritzelTitlebarMenu extends KritzelTitlebarElementBase {
  type: 'menu';
  icon?: KritzelTitlebarValue<KritzelIconName>;
  label?: KritzelTermKey | string;
  tooltip?: KritzelTermKey | string;
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: KritzelTitlebarValue<boolean>;
  items: KritzelTitlebarValue<KritzelTitlebarMenuItem[]>; // resolved when the menu opens
}

interface KritzelTitlebarSpacer extends KritzelTitlebarElementBase {
  type: 'spacer' | 'separator';
}
```

### `KritzelTitlebarMenuItem`

An entry of a [`KritzelTitlebarMenu`](#kritzeltitlebarelement). `isVisible` and `isDisabled` are evaluated when the menu opens and again when the menu item is selected.

```ts
interface KritzelTitlebarMenuItem {
  id: string;                      // reported as menuItemId in objectTitlebarAction
  label: KritzelTermKey | string;  // term keys are translated through the active locale
  icon?: KritzelIconName;
  isVisible?: KritzelTitlebarValue<boolean>;
  isDisabled?: KritzelTitlebarValue<boolean>;
  action?: (context: KritzelObjectTitlebarContext, menuItem: KritzelTitlebarMenuItem) => void;
}
```

### `KritzelTitlebarValue`

A static value or a function that resolves it from the titlebar context. Functions are evaluated synchronously on every render; promises are not supported.

```ts
type KritzelTitlebarValue<T> = T | ((context: KritzelObjectTitlebarContext) => T);
```

### `KritzelObjectTitlebarContext`

Passed to dynamic element values and the `action` callbacks of buttons and menu items.

```ts
interface KritzelObjectTitlebarContext {
  object: KritzelBaseObject;
  objectType: string;
  children: KritzelBaseObject[];
  isActive: boolean;
  title: string;
  size: { width: number; height: number };        // world units, including padding
  contentSize: { width: number; height: number }; // the object's own width and height
  barWidth: number;                                // screen pixels
  t: (key: KritzelTermKey | string, vars?: KritzelTermVars) => string;
}
```

### `KritzelObjectTitlebarActionEvent`

Emitted by the `objectTitlebarAction` event.

```ts
interface KritzelObjectTitlebarActionEvent {
  elementId: string;   // id of the clicked button, or of the menu that contains the selected menu item
  menuItemId?: string; // id of the selected menu item, unset for button clicks
  section: 'left' | 'center' | 'right';
  objectId: string;
  objectType: string;
  workspaceId: string;
  anchorRect: DOMRect; // client rect of the clicked button or menu button
}
```

### `KritzelObjectTitlebarMenuState`

Emitted by the `objectTitlebarMenuStateChange` event of `<KritzelEngine>` when a titlebar menu opens or closes. Only needed when rendering titlebar menus without `<KritzelEditor>`.

```ts
interface KritzelObjectTitlebarMenuState {
  isVisible: boolean;
  objectId?: string;                  // owner of the titlebar whose menu is open
  elementId?: string;                 // id of the open menu element
  section?: 'left' | 'center' | 'right';
  items: KritzelTitlebarMenuItem[];   // visible menu items, labels translated and isDisabled evaluated
  anchor?: HTMLElement;               // the menu button, inside the engine's shadow root
  anchorRect?: DOMRect;               // client rect of the menu button when the menu opened
}
```

Select a menu item with `selectObjectTitlebarMenuItem(menuItemId)` and close the menu with `closeObjectTitlebarMenu()` on the engine.
