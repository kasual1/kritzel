---
sidebar_label: Types & Interfaces
title: "Types & Interfaces | Upmade for React"
description: "TypeScript types and interfaces exposed by the Upmade library for use in React projects."
---
# Other

All types below are exported from `@upmade/engine`.

## Interfaces

### `UpmadeViewportState`

Emitted by the `viewportChange` event. Returned by `getViewport()`.

```ts
interface UpmadeViewportState {
  translateX: number;
  translateY: number;
  scale: number;
  width: number;
  height: number;
}
```

### `UpmadeUndoState`

Emitted by the `undoStateChange` event.

```ts
interface UpmadeUndoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
}
```

### `UpmadeSyncConfig`

Passed to the `syncConfig` prop. See [Sync & Collaboration](../advanced/collaboration.md).

```ts
interface UpmadeSyncConfig {
  providers: ProviderConfig[];
}
```

### `UpmadeShortcut`

Keyboard shortcut definition. Returned by `getDisplayableShortcuts()`.

```ts
interface UpmadeShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  category: string;
  condition?: () => boolean;
  action: () => void;
}
```

### `UpmadeToolbarItem`

Defines a toolbar item for the `toolbarItems` prop on `<UpmadeEditor>`.

```ts
interface UpmadeToolbarItem {
  type: 'tool' | 'config';
  tool?: (new (...args: any[]) => UpmadeBaseTool) | UpmadeBaseTool;
  icon?: string;
  isDefault?: boolean;
  isDisabled?: boolean | (() => boolean | Promise<boolean>);
  name: string;
  config?: UpmadeBrushToolConfig | UpmadeLineToolConfig | UpmadeTextToolConfig | UpmadeShapeToolConfig;
  subOptions?: UpmadeToolbarSubOption[];
}

interface UpmadeToolbarSubOption {
  id: string;
  icon: string;
  label: string;
  value: any;
  toolProperty: string;
}
```

### Tool Config Interfaces

```ts
interface UpmadeBrushToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
}

interface UpmadeLineToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
  arrows?: {
    start?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
    end?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
  };
}

interface UpmadeTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}

interface UpmadeShapeToolConfig {
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
  objects: UpmadeBaseObject[];
  /** Set when an agent made the change. */
  source?: UpmadeAgentChangeSource;
}

interface ObjectsRemovedEvent {
  objects: UpmadeBaseObject[];
  /** Set when an agent made the change. */
  source?: UpmadeAgentChangeSource;
}

interface ObjectsUpdatedEvent {
  objects: { object: UpmadeBaseObject; changedProperties: Partial<UpmadeBaseObject> }[];
  /** Set when an agent made the change. */
  source?: UpmadeAgentChangeSource;
}
```

### Geometry Interfaces

```ts
interface UpmadeBoundingBox {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
}

interface UpmadePolygon {
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
interface UpmadeTheme {
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

### `UpmadeWorkspace`

Represents a workspace (canvas) within the editor.

```ts
class UpmadeWorkspace {
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

### `UpmadeAlignment`

Used with `alignObjects()`.

```ts
enum UpmadeAlignment {
  StartHorizontal  = 'start-horizontal',   // Align left edges
  CenterHorizontal = 'center-horizontal',  // Align horizontal centers
  EndHorizontal    = 'end-horizontal',     // Align right edges
  StartVertical    = 'start-vertical',     // Align top edges
  CenterVertical   = 'center-vertical',    // Align vertical centers
  EndVertical      = 'end-vertical',       // Align bottom edges
}
```

### `ShapeType`

Used with `UpmadeShapeToolConfig`.

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

## Agent Types

Types used by [`UpmadeAgent`](./agent.md) and the [agent methods](./editor.md#agents) of the editor. The [Agent API Reference](./agent.md#related-types) lists their full definitions.

| Type | Description |
|------|-------------|
| [`UpmadeAgentOptions`](./agent.md#upmadeagentoptions) | Options of `new UpmadeAgent()`: `name` (required), `id`, `color`, `avatarUrl`, `speed`, `broadcast`, `status`, `visible`, and `position`. |
| [`UpmadeAgentState`](./agent.md#upmadeagentstate) | Snapshot returned by `agent.state`: position, attachment, status, visibility, selection, activity, and `canUndo` / `canRedo`. |
| [`UpmadeAgentPresence`](./agent.md#upmadeagentpresence) | An agent of this editor as reported by `agentsChange` and `agent.toPresence()`, with `isRemote: false`. |
| [`UpmadeAgentsChangeEvent`](./agent.md#upmadeagentschangeevent) | Detail of the `agentsChange` event: `{ agents: (UpmadeAgentPresence \| UpmadeRemoteAgentPresence)[] }`, the agents of the editor first, then those of collaborators. `isRemote` tells them apart. |
| [`UpmadeRemoteAgentPresence`](./agent.md#upmaderemoteagentpresence) | An agent of a collaborator, as returned by `getRemoteAgents()` and listed in `agentsChange`: `isRemote: true`, `clientId`, and `hostUser`. |
| [`UpmadeAgentEventMap`](./agent.md#upmadeagenteventmap) | Events of `agent.on()`, with `UpmadeAgentDetachedEvent` and `UpmadeAgentInterruptedEvent`. |
| [`UpmadeAgenticTarget`](./agent.md#upmadeagentictarget) | A point in world coordinates, an anchor (`UpmadeAgenticAnchor`) on an object, or an element inside an object's content (`UpmadeAgenticElementTarget`: `{ objectId, selector }`), such as a button in an iframe object. |
| [`UpmadeAgenticMoveOptions`](./agent.md#upmadeagenticmoveoptions) | Options of `agent.moveTo()`, which resolves with `UpmadeAgenticMoveResult`. |
| [`UpmadeAgenticAction`](./agent.md#upmadeagenticaction) | The actions of `agent.perform()`, from `click` to `setStyle`, `addObject`, `undo`, and `redo`. |
| [`UpmadeAgenticFill`](./agent.md#upmadeagenticfill) | What fills in the loading placeholder of an `addObject` action with a `fill`: `content` and `apply(placeholder, content)`. |
| [`UpmadeAgenticActionOptions`](./agent.md#upmadeagenticactionoptions) | `speed`, `instant`, `signal`, and `easing` of an action. |
| [`UpmadeAgenticActionResult`](./agent.md#upmadeagenticactionresult) | Result of an action, with an `UpmadeAgenticActionFailureReason` when it did not complete. |
| [`UpmadeAgentActionError`](./agent.md#upmadeagentactionerror) | Thrown when an action that belongs to a running `agent.task()` does not complete. |
| [`UpmadeAgentTool`](./agent.md#upmadeagenttool) | A provider-neutral LLM tool from `agent.tools()`: `name`, `description`, `inputSchema`, `run(input, context?)` with an `UpmadeAgentToolContext` (`signal`, `toolCallId`), and the optional `begin(context)`, which begins a call while the model writes it and returns an `UpmadeAgentToolCall` (`update`, `finish`, and `cancel`). |
| [`UpmadeAgentToolSchema`](./agent.md#upmadeagenttoolschema) | The JSON Schema of a tool's input. |
| [`UpmadeAgentToolsOptions`](./agent.md#upmadeagenttoolsoptions) | `only`, `prefix`, and `maxTextLength` of `agent.tools()`. |
| [`UpmadeAgentToolResult`](./agent.md#upmadeagenttoolresult) | What a tool's `run()` resolves with as JSON: `completed`, `reason`, `objectIds`, `message`, `hint`, and `objects`. |
| [`UpmadeObserveOptions`](./agent.md#upmadeobserveoptions) | `scope`, `objectIds`, `maxObjects`, and `maxTextLength` of `agent.observe()`. |
| [`UpmadeCanvasSnapshot`](./agent.md#upmadecanvassnapshot) | What `agent.observe()` returns: the viewport, the user's selection, the agent, and the objects. |
| [`UpmadeCanvasObject`](./agent.md#upmadecanvasobject) | One object of a snapshot: ID, type, box, rotation, text, group and line relations, style, `busy`, and `createdBy`. |

### `UpmadeAgentChangeSource`

The `source` of `objectsAdded`, `objectsUpdated`, and `objectsRemoved` when an agent made the change. `actionType` is `'undo'` or `'redo'` for changes from the agent's own history.

```ts
interface UpmadeAgentChangeSource {
  type: 'agent';
  agentId: string;
  actionType: UpmadeAgenticAction['type'];
}
```

## Object Element Types

Types used by the [object element events and methods](./editor.md#object-elements). See [Interacting with iFrame Content](../advanced/dynamic-objects.md#interacting-with-iframe-content) for usage. To point an agent's cursor at an element, pass a [`UpmadeAgenticElementTarget`](./agent.md#upmadeagentictarget) to `agent.moveTo()`.

### `UpmadeObjectElementInfo`

Description of an element inside an object's content, reported by events and returned by `queryObjectElements()`. The content is untrusted, so treat these values like any other untrusted input.

```ts
interface UpmadeObjectElementInfo {
  selector: string;                    // matched exactly this element when it was reported
  upmadeId?: string;                  // the data-upmade-id attribute
  tagName: string;                     // lowercase, e.g. 'button'
  id?: string;
  classList: string[];
  text?: string;                       // collapsed whitespace, at most 200 characters
  attributes: Record<string, string>;  // role, aria-*, data-*, name, type, href, src, alt, title, placeholder, for
  rect: UpmadeObjectElementRect;
  visibleRect?: UpmadeObjectElementRect; // omitted when no part of the element can be seen
  state?: UpmadeObjectElementState;      // omitted when there is none
  value?: string;                         // form field value, only with includeValues or from interactions; never for passwords
}

// Only the fields that apply to the element are set
interface UpmadeObjectElementState {
  disabled?: boolean;
  checked?: boolean | 'mixed'; // checkboxes, radio buttons, switches (also by ARIA role)
  selected?: boolean;          // <option>
  open?: boolean;              // <details>
  focused?: boolean;
  editable?: boolean;          // text fields, selects, and editable elements
  playing?: boolean;           // <audio> and <video>
}

// CSS pixels relative to the top-left corner of the content, before canvas zoom, object scale and rotation
interface UpmadeObjectElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### `UpmadeObjectElementHighlight`

Passed to `highlightObjectElements()`.

```ts
interface UpmadeObjectElementHighlight {
  selector: string; // every match is highlighted, up to 100 elements
  color?: string;   // defaults to the theme's elementHighlight.color
  label?: string;   // shown above each highlighted element
}
```

### `UpmadeObjectElementPickingOptions`

Passed to `setObjectElementPicking()`.

```ts
interface UpmadeObjectElementPickingOptions {
  selector?: string; // picks the closest matching ancestor of the element under the pointer
  color?: string;    // defaults to the theme's elementHighlight.color
}
```

### Event Payloads

Emitted by the `objectElementHover`, `objectElementClick`, and `objectElementPick` events.

```ts
interface UpmadeObjectElementHoverEvent {
  objectId: string;
  element: UpmadeObjectElementInfo | null; // null when the pointer left the content or the object was deselected
  isPicking: boolean;
}

interface UpmadeObjectElementClickEvent {
  objectId: string;
  element: UpmadeObjectElementInfo;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// Same shape as UpmadeObjectElementClickEvent
interface UpmadeObjectElementPickEvent {
  objectId: string;
  element: UpmadeObjectElementInfo;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}
```

## Object Config Types

Types used by the [`objectConfig` prop](./editor.md#object). See [Configuring Objects](../fundamentals/objects.md#configuring-objects) for usage.

### `UpmadeObjectConfig`

Passed to the `objectConfig` prop. Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized.

```ts
interface UpmadeObjectConfig {
  hasTitlebar?: boolean | ((object: UpmadeBaseObject) => boolean); // defaults to false
  isRotatable?: boolean | ((object: UpmadeBaseObject) => boolean); // defaults to true
  isResizable?: boolean | ((object: UpmadeBaseObject) => boolean); // defaults to true
}
```

`hasTitlebar` also requires the `objectTitlebar` prop. It is called for every visible top-level object on every render. Objects inside a group never get their own titlebar; the group is passed in instead.

`isRotatable` and `isResizable` combine with the persisted `isRotatable` and `isResizable` flags of each object: either one can forbid the gesture. A group, and a selection of several objects, can only be rotated or resized when it and every object inside it allow it. When an object cannot be rotated or resized, its handles are hidden and the gesture does not start. Programmatic API calls are not affected.

The configuration is local to your app and neither persisted nor synced. Pass a new object to update it.

Each option is a fixed value for every object, or a function deciding per object. Functions are called synchronously while the engine renders or handles input, so they must be cheap and must not return a promise. A function that throws or returns a promise resolves to the option's default and logs a warning once. Any return value other than a boolean also resolves to the default. Check types with `instanceof` against the classes your Upmade package exports or compare `object.__class__` (for example `'UpmadeGroup'`), and prefer `childIds` over `children` to inspect a group's children, for example `(object) => object.__class__ === 'UpmadeGroup' && (object as UpmadeGroup).childIds.length > 1`.

## Object Titlebar Types

Types used by the [`objectTitlebar` prop](./editor.md#object-titlebar). See [Object Titlebar](../fundamentals/controls.md#object-titlebar) for usage.

### `UpmadeObjectTitlebarConfig`

Passed to the `objectTitlebar` prop. The same configuration applies to every object for which the `hasTitlebar` option of the `objectConfig` prop is `true`. Without `hasTitlebar`, no titlebars are rendered.

```ts
interface UpmadeObjectTitlebarConfig {
  left?: UpmadeTitlebarElement[];   // defaults to [{ id: 'title', type: 'title' }]
  center?: UpmadeTitlebarElement[];
  right?: UpmadeTitlebarElement[];
  visibility?: 'always' | 'active';
  rotation?: 'follow' | 'upright';
  title?: (object: UpmadeBaseObject) => string | undefined;
  draggable?: boolean;            // defaults to true
  hideBelowWidth?: number;        // screen pixels, defaults to 40
}
```

Which objects get a titlebar is decided by [`UpmadeObjectConfig`](#upmadeobjectconfig) on the `objectConfig` prop, not by this configuration. See [Object Titlebar](../fundamentals/controls.md#object-titlebar).

`UPMADE_DEFAULT_OBJECT_TITLEBAR` is a ready-made configuration that shows an icon for the object type followed by the title. Pass it as is, or spread it and override individual options, for example `{ ...UPMADE_DEFAULT_OBJECT_TITLEBAR, visibility: 'active' }`.

### `UpmadeTitlebarElement`

```ts
type UpmadeTitlebarElement =
  | UpmadeTitlebarTitle
  | UpmadeTitlebarText
  | UpmadeTitlebarIcon
  | UpmadeTitlebarButton
  | UpmadeTitlebarMenu
  | UpmadeTitlebarSpacer;

// Options shared by every element (internal, not exported)
interface UpmadeTitlebarElementBase {
  id: string;
  isVisible?: UpmadeTitlebarValue<boolean>;
  showWhen?: 'always' | 'active' | 'inactive';
  minBarWidth?: number;
  part?: string;
}

interface UpmadeTitlebarTitle extends UpmadeTitlebarElementBase {
  type: 'title';
  text?: UpmadeTitlebarValue<string>;
  isEditable?: UpmadeTitlebarValue<boolean>; // lets users rename the object, defaults to false
}

interface UpmadeTitlebarText extends UpmadeTitlebarElementBase {
  type: 'text';
  text: UpmadeTitlebarValue<string>;
  tone?: 'default' | 'muted' | 'strong';
}

interface UpmadeTitlebarIcon extends UpmadeTitlebarElementBase {
  type: 'icon';
  icon: UpmadeTitlebarValue<UpmadeIconName>;
}

interface UpmadeTitlebarButton extends UpmadeTitlebarElementBase {
  type: 'button';
  icon?: UpmadeTitlebarValue<UpmadeIconName>;
  label?: UpmadeTermKey | string;
  tooltip?: UpmadeTermKey | string;
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: UpmadeTitlebarValue<boolean>;
  isPressed?: UpmadeTitlebarValue<boolean>;
  action?: (context: UpmadeObjectTitlebarContext, event: MouseEvent) => void;
}

interface UpmadeTitlebarMenu extends UpmadeTitlebarElementBase {
  type: 'menu';
  icon?: UpmadeTitlebarValue<UpmadeIconName>;
  label?: UpmadeTermKey | string;
  tooltip?: UpmadeTermKey | string;
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: UpmadeTitlebarValue<boolean>;
  items: UpmadeTitlebarValue<UpmadeTitlebarMenuItem[]>; // resolved when the menu opens
}

interface UpmadeTitlebarSpacer extends UpmadeTitlebarElementBase {
  type: 'spacer' | 'separator';
}
```

### `UpmadeTitlebarMenuItem`

An entry of a [`UpmadeTitlebarMenu`](#upmadetitlebarelement). `isVisible` and `isDisabled` are evaluated when the menu opens and again when the menu item is selected.

```ts
interface UpmadeTitlebarMenuItem {
  id: string;                      // reported as menuItemId in objectTitlebarAction
  label: UpmadeTermKey | string;  // term keys are translated through the active locale
  icon?: UpmadeIconName;
  isVisible?: UpmadeTitlebarValue<boolean>;
  isDisabled?: UpmadeTitlebarValue<boolean>;
  action?: (context: UpmadeObjectTitlebarContext, menuItem: UpmadeTitlebarMenuItem) => void;
}
```

### `UpmadeTitlebarValue`

A static value or a function that resolves it from the titlebar context. Functions are evaluated synchronously on every render; promises are not supported.

```ts
type UpmadeTitlebarValue<T> = T | ((context: UpmadeObjectTitlebarContext) => T);
```

### `UpmadeObjectTitlebarContext`

Passed to dynamic element values and the `action` callbacks of buttons and menu items.

```ts
interface UpmadeObjectTitlebarContext {
  object: UpmadeBaseObject;
  objectType: string;
  children: UpmadeBaseObject[];
  isActive: boolean;
  title: string;
  size: { width: number; height: number };        // world units, including padding
  contentSize: { width: number; height: number }; // the object's own width and height
  barWidth: number;                                // screen pixels
  t: (key: UpmadeTermKey | string, vars?: UpmadeTermVars) => string;
}
```

### `UpmadeObjectTitlebarActionEvent`

Emitted by the `objectTitlebarAction` event.

```ts
interface UpmadeObjectTitlebarActionEvent {
  elementId: string;   // id of the clicked button, or of the menu that contains the selected menu item
  menuItemId?: string; // id of the selected menu item, unset for button clicks
  section: 'left' | 'center' | 'right';
  objectId: string;
  objectType: string;
  workspaceId: string;
  anchorRect: DOMRect; // client rect of the clicked button or menu button
}
```

### `UpmadeObjectTitlebarMenuState`

Emitted by the `objectTitlebarMenuStateChange` event of `<UpmadeEngine>` when a titlebar menu opens or closes. Only needed when rendering titlebar menus without `<UpmadeEditor>`.

```ts
interface UpmadeObjectTitlebarMenuState {
  isVisible: boolean;
  objectId?: string;                  // owner of the titlebar whose menu is open
  elementId?: string;                 // id of the open menu element
  section?: 'left' | 'center' | 'right';
  items: UpmadeTitlebarMenuItem[];   // visible menu items, labels translated and isDisabled evaluated
  anchor?: HTMLElement;               // the menu button, inside the engine's shadow root
  anchorRect?: DOMRect;               // client rect of the menu button when the menu opened
}
```

Select a menu item with `selectObjectTitlebarMenuItem(menuItemId)` and close the menu with `closeObjectTitlebarMenu()` on the engine.
