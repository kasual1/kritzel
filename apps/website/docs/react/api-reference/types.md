---
sidebar_label: Types & Interfaces
title: "Types & Interfaces | Updraw for React"
description: "TypeScript types and interfaces exposed by the Updraw library for use in React projects."
---
# Other

All types below are exported from `@updraw/engine`.

## Interfaces

### `UpdrawViewportState`

Emitted by the `viewportChange` event. Returned by `getViewport()`.

```ts
interface UpdrawViewportState {
  translateX: number;
  translateY: number;
  scale: number;
  width: number;
  height: number;
}
```

### `UpdrawUndoState`

Emitted by the `undoStateChange` event.

```ts
interface UpdrawUndoState {
  canUndo: boolean;
  canRedo: boolean;
  undoStackSize: number;
  redoStackSize: number;
}
```

### `UpdrawSyncConfig`

Passed to the `syncConfig` prop. See [Sync & Collaboration](../advanced/collaboration.md).

```ts
interface UpdrawSyncConfig {
  providers: ProviderConfig[];
}
```

### `UpdrawShortcut`

Keyboard shortcut definition. Returned by `getDisplayableShortcuts()`.

```ts
interface UpdrawShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  label: string;
  category: string;
  condition?: () => boolean;
  action: () => void;
}
```

### `UpdrawToolbarItem`

Defines a toolbar item for the `toolbarItems` prop on `<UpdrawEditor>`.

```ts
interface UpdrawToolbarItem {
  type: 'tool' | 'config';
  tool?: (new (...args: any[]) => UpdrawBaseTool) | UpdrawBaseTool;
  icon?: string;
  isDefault?: boolean;
  isDisabled?: boolean | (() => boolean | Promise<boolean>);
  name: string;
  config?: UpdrawBrushToolConfig | UpdrawLineToolConfig | UpdrawTextToolConfig | UpdrawShapeToolConfig;
  subOptions?: UpdrawToolbarSubOption[];
}

interface UpdrawToolbarSubOption {
  id: string;
  icon: string;
  label: string;
  value: any;
  toolProperty: string;
}
```

### Tool Config Interfaces

```ts
interface UpdrawBrushToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
}

interface UpdrawLineToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
  arrows?: {
    start?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
    end?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
  };
}

interface UpdrawTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}

interface UpdrawShapeToolConfig {
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
  objects: UpdrawBaseObject[];
  /** Set when an agent made the change. */
  source?: UpdrawAgentChangeSource;
}

interface ObjectsRemovedEvent {
  objects: UpdrawBaseObject[];
  /** Set when an agent made the change. */
  source?: UpdrawAgentChangeSource;
}

interface ObjectsUpdatedEvent {
  objects: { object: UpdrawBaseObject; changedProperties: Partial<UpdrawBaseObject> }[];
  /** Set when an agent made the change. */
  source?: UpdrawAgentChangeSource;
}
```

### Geometry Interfaces

```ts
interface UpdrawBoundingBox {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
}

interface UpdrawPolygon {
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
interface UpdrawTheme {
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

### `UpdrawWorkspace`

Represents a workspace (canvas) within the editor.

```ts
class UpdrawWorkspace {
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

### `UpdrawAlignment`

Used with `alignObjects()`.

```ts
enum UpdrawAlignment {
  StartHorizontal  = 'start-horizontal',   // Align left edges
  CenterHorizontal = 'center-horizontal',  // Align horizontal centers
  EndHorizontal    = 'end-horizontal',     // Align right edges
  StartVertical    = 'start-vertical',     // Align top edges
  CenterVertical   = 'center-vertical',    // Align vertical centers
  EndVertical      = 'end-vertical',       // Align bottom edges
}
```

### `ShapeType`

Used with `UpdrawShapeToolConfig`.

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

Types used by [`UpdrawAgent`](./agent.md) and the [agent methods](./editor.md#agents) of the editor. The [Agent API Reference](./agent.md#related-types) lists their full definitions.

| Type | Description |
|------|-------------|
| [`UpdrawAgentOptions`](./agent.md#updrawagentoptions) | Options of `new UpdrawAgent()`: `name` (required), `id`, `color`, `avatarUrl`, `speed`, `broadcast`, `status`, `visible`, and `position`. |
| [`UpdrawAgentState`](./agent.md#updrawagentstate) | Snapshot returned by `agent.state`: position, attachment, status, visibility, selection, activity, and `canUndo` / `canRedo`. |
| [`UpdrawAgentPresence`](./agent.md#updrawagentpresence) | An agent of this editor as reported by `agentsChange` and `agent.toPresence()`, with `isRemote: false`. |
| [`UpdrawAgentsChangeEvent`](./agent.md#updrawagentschangeevent) | Detail of the `agentsChange` event: `{ agents: (UpdrawAgentPresence \| UpdrawRemoteAgentPresence)[] }`, the agents of the editor first, then those of collaborators. `isRemote` tells them apart. |
| [`UpdrawRemoteAgentPresence`](./agent.md#updrawremoteagentpresence) | An agent of a collaborator, as returned by `getRemoteAgents()` and listed in `agentsChange`: `isRemote: true`, `clientId`, and `hostUser`. |
| [`UpdrawAgentEventMap`](./agent.md#updrawagenteventmap) | Events of `agent.on()`, with `UpdrawAgentDetachedEvent` and `UpdrawAgentInterruptedEvent`. |
| [`UpdrawAgenticTarget`](./agent.md#updrawagentictarget) | A point in world coordinates, an anchor (`UpdrawAgenticAnchor`) on an object, or an element inside an object's content (`UpdrawAgenticElementTarget`: `{ objectId, selector }`), such as a button in an iframe object. |
| [`UpdrawAgenticMoveOptions`](./agent.md#updrawagenticmoveoptions) | Options of `agent.moveTo()`, which resolves with `UpdrawAgenticMoveResult`. |
| [`UpdrawAgenticAction`](./agent.md#updrawagenticaction) | The actions of `agent.perform()`, from `click` to `setStyle`, `addObject`, `undo`, and `redo`. |
| [`UpdrawAgenticFill`](./agent.md#updrawagenticfill) | What fills in the loading placeholder of an `addObject` action with a `fill`: `content` and `apply(placeholder, content)`. |
| [`UpdrawAgenticActionOptions`](./agent.md#updrawagenticactionoptions) | `speed`, `instant`, `signal`, and `easing` of an action. |
| [`UpdrawAgenticActionResult`](./agent.md#updrawagenticactionresult) | Result of an action, with an `UpdrawAgenticActionFailureReason` when it did not complete. |
| [`UpdrawAgentActionError`](./agent.md#updrawagentactionerror) | Thrown when an action that belongs to a running `agent.task()` does not complete. |
| [`UpdrawAgentTool`](./agent.md#updrawagenttool) | A provider-neutral LLM tool from `agent.tools()`: `name`, `description`, `inputSchema`, `run(input, context?)` with an `UpdrawAgentToolContext` (`signal`, `toolCallId`), and the optional `begin(context)`, which begins a call while the model writes it and returns an `UpdrawAgentToolCall` (`update`, `finish`, and `cancel`). |
| [`UpdrawAgentToolSchema`](./agent.md#updrawagenttoolschema) | The JSON Schema of a tool's input. |
| [`UpdrawAgentToolsOptions`](./agent.md#updrawagenttoolsoptions) | `only`, `prefix`, and `maxTextLength` of `agent.tools()`. |
| [`UpdrawAgentToolResult`](./agent.md#updrawagenttoolresult) | What a tool's `run()` resolves with as JSON: `completed`, `reason`, `objectIds`, `message`, `hint`, and `objects`. |
| [`UpdrawObserveOptions`](./agent.md#updrawobserveoptions) | `scope`, `objectIds`, `maxObjects`, and `maxTextLength` of `agent.observe()`. |
| [`UpdrawCanvasSnapshot`](./agent.md#updrawcanvassnapshot) | What `agent.observe()` returns: the viewport, the user's selection, the agent, and the objects. |
| [`UpdrawCanvasObject`](./agent.md#updrawcanvasobject) | One object of a snapshot: ID, type, box, rotation, text, group and line relations, style, `busy`, and `createdBy`. |

### `UpdrawAgentChangeSource`

The `source` of `objectsAdded`, `objectsUpdated`, and `objectsRemoved` when an agent made the change. `actionType` is `'undo'` or `'redo'` for changes from the agent's own history.

```ts
interface UpdrawAgentChangeSource {
  type: 'agent';
  agentId: string;
  actionType: UpdrawAgenticAction['type'];
}
```

## Object Element Types

Types used by the [object element events and methods](./editor.md#object-elements). See [Interacting with iFrame Content](../advanced/dynamic-objects.md#interacting-with-iframe-content) for usage. To point an agent's cursor at an element, pass a [`UpdrawAgenticElementTarget`](./agent.md#updrawagentictarget) to `agent.moveTo()`.

### `UpdrawObjectElementInfo`

Description of an element inside an object's content, reported by events and returned by `queryObjectElements()`. The content is untrusted, so treat these values like any other untrusted input.

```ts
interface UpdrawObjectElementInfo {
  selector: string;                    // matched exactly this element when it was reported
  updrawId?: string;                  // the data-updraw-id attribute
  tagName: string;                     // lowercase, e.g. 'button'
  id?: string;
  classList: string[];
  text?: string;                       // collapsed whitespace, at most 200 characters
  attributes: Record<string, string>;  // role, aria-*, data-*, name, type, href, src, alt, title, placeholder, for
  rect: UpdrawObjectElementRect;
  visibleRect?: UpdrawObjectElementRect; // omitted when no part of the element can be seen
  state?: UpdrawObjectElementState;      // omitted when there is none
  value?: string;                         // form field value, only with includeValues or from interactions; never for passwords
}

// Only the fields that apply to the element are set
interface UpdrawObjectElementState {
  disabled?: boolean;
  checked?: boolean | 'mixed'; // checkboxes, radio buttons, switches (also by ARIA role)
  selected?: boolean;          // <option>
  open?: boolean;              // <details>
  focused?: boolean;
  editable?: boolean;          // text fields, selects, and editable elements
  playing?: boolean;           // <audio> and <video>
}

// CSS pixels relative to the top-left corner of the content, before canvas zoom, object scale and rotation
interface UpdrawObjectElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### `UpdrawObjectElementHighlight`

Passed to `highlightObjectElements()`.

```ts
interface UpdrawObjectElementHighlight {
  selector: string; // every match is highlighted, up to 100 elements
  color?: string;   // defaults to the theme's elementHighlight.color
  label?: string;   // shown above each highlighted element
}
```

### `UpdrawObjectElementPickingOptions`

Passed to `setObjectElementPicking()`.

```ts
interface UpdrawObjectElementPickingOptions {
  selector?: string; // picks the closest matching ancestor of the element under the pointer
  color?: string;    // defaults to the theme's elementHighlight.color
}
```

### Event Payloads

Emitted by the `objectElementHover`, `objectElementClick`, and `objectElementPick` events.

```ts
interface UpdrawObjectElementHoverEvent {
  objectId: string;
  element: UpdrawObjectElementInfo | null; // null when the pointer left the content or the object was deselected
  isPicking: boolean;
}

interface UpdrawObjectElementClickEvent {
  objectId: string;
  element: UpdrawObjectElementInfo;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// Same shape as UpdrawObjectElementClickEvent
interface UpdrawObjectElementPickEvent {
  objectId: string;
  element: UpdrawObjectElementInfo;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}
```

## Object Config Types

Types used by the [`objectConfig` prop](./editor.md#object). See [Configuring Objects](../fundamentals/objects.md#configuring-objects) for usage.

### `UpdrawObjectConfig`

Passed to the `objectConfig` prop. Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized.

```ts
interface UpdrawObjectConfig {
  hasTitlebar?: boolean | ((object: UpdrawBaseObject) => boolean); // defaults to false
  isRotatable?: boolean | ((object: UpdrawBaseObject) => boolean); // defaults to true
  isResizable?: boolean | ((object: UpdrawBaseObject) => boolean); // defaults to true
}
```

`hasTitlebar` also requires the `objectTitlebar` prop. It is called for every visible top-level object on every render. Objects inside a group never get their own titlebar; the group is passed in instead.

`isRotatable` and `isResizable` combine with the persisted `isRotatable` and `isResizable` flags of each object: either one can forbid the gesture. A group, and a selection of several objects, can only be rotated or resized when it and every object inside it allow it. When an object cannot be rotated or resized, its handles are hidden and the gesture does not start. Programmatic API calls are not affected.

The configuration is local to your app and neither persisted nor synced. Pass a new object to update it.

Each option is a fixed value for every object, or a function deciding per object. Functions are called synchronously while the engine renders or handles input, so they must be cheap and must not return a promise. A function that throws or returns a promise resolves to the option's default and logs a warning once. Any return value other than a boolean also resolves to the default. Check types with `instanceof` against the classes your Updraw package exports or compare `object.__class__` (for example `'UpdrawGroup'`), and prefer `childIds` over `children` to inspect a group's children, for example `(object) => object.__class__ === 'UpdrawGroup' && (object as UpdrawGroup).childIds.length > 1`.

## Object Titlebar Types

Types used by the [`objectTitlebar` prop](./editor.md#object-titlebar). See [Object Titlebar](../fundamentals/controls.md#object-titlebar) for usage.

### `UpdrawObjectTitlebarConfig`

Passed to the `objectTitlebar` prop. The same configuration applies to every object for which the `hasTitlebar` option of the `objectConfig` prop is `true`. Without `hasTitlebar`, no titlebars are rendered.

```ts
interface UpdrawObjectTitlebarConfig {
  left?: UpdrawTitlebarElement[];   // defaults to [{ id: 'title', type: 'title' }]
  center?: UpdrawTitlebarElement[];
  right?: UpdrawTitlebarElement[];
  visibility?: 'always' | 'active';
  rotation?: 'follow' | 'upright';
  title?: (object: UpdrawBaseObject) => string | undefined;
  draggable?: boolean;            // defaults to true
  hideBelowWidth?: number;        // screen pixels, defaults to 40
}
```

Which objects get a titlebar is decided by [`UpdrawObjectConfig`](#updrawobjectconfig) on the `objectConfig` prop, not by this configuration. See [Object Titlebar](../fundamentals/controls.md#object-titlebar).

`UPDRAW_DEFAULT_OBJECT_TITLEBAR` is a ready-made configuration that shows an icon for the object type followed by the title. Pass it as is, or spread it and override individual options, for example `{ ...UPDRAW_DEFAULT_OBJECT_TITLEBAR, visibility: 'active' }`.

### `UpdrawTitlebarElement`

```ts
type UpdrawTitlebarElement =
  | UpdrawTitlebarTitle
  | UpdrawTitlebarText
  | UpdrawTitlebarIcon
  | UpdrawTitlebarButton
  | UpdrawTitlebarMenu
  | UpdrawTitlebarSpacer;

// Options shared by every element (internal, not exported)
interface UpdrawTitlebarElementBase {
  id: string;
  isVisible?: UpdrawTitlebarValue<boolean>;
  showWhen?: 'always' | 'active' | 'inactive';
  minBarWidth?: number;
  part?: string;
}

interface UpdrawTitlebarTitle extends UpdrawTitlebarElementBase {
  type: 'title';
  text?: UpdrawTitlebarValue<string>;
  isEditable?: UpdrawTitlebarValue<boolean>; // lets users rename the object, defaults to false
}

interface UpdrawTitlebarText extends UpdrawTitlebarElementBase {
  type: 'text';
  text: UpdrawTitlebarValue<string>;
  tone?: 'default' | 'muted' | 'strong';
}

interface UpdrawTitlebarIcon extends UpdrawTitlebarElementBase {
  type: 'icon';
  icon: UpdrawTitlebarValue<UpdrawIconName>;
}

interface UpdrawTitlebarButton extends UpdrawTitlebarElementBase {
  type: 'button';
  icon?: UpdrawTitlebarValue<UpdrawIconName>;
  label?: UpdrawTermKey | string;
  tooltip?: UpdrawTermKey | string;
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: UpdrawTitlebarValue<boolean>;
  isPressed?: UpdrawTitlebarValue<boolean>;
  action?: (context: UpdrawObjectTitlebarContext, event: MouseEvent) => void;
}

interface UpdrawTitlebarMenu extends UpdrawTitlebarElementBase {
  type: 'menu';
  icon?: UpdrawTitlebarValue<UpdrawIconName>;
  label?: UpdrawTermKey | string;
  tooltip?: UpdrawTermKey | string;
  variant?: 'ghost' | 'filled' | 'outlined';
  isDisabled?: UpdrawTitlebarValue<boolean>;
  items: UpdrawTitlebarValue<UpdrawTitlebarMenuItem[]>; // resolved when the menu opens
}

interface UpdrawTitlebarSpacer extends UpdrawTitlebarElementBase {
  type: 'spacer' | 'separator';
}
```

### `UpdrawTitlebarMenuItem`

An entry of a [`UpdrawTitlebarMenu`](#updrawtitlebarelement). `isVisible` and `isDisabled` are evaluated when the menu opens and again when the menu item is selected.

```ts
interface UpdrawTitlebarMenuItem {
  id: string;                      // reported as menuItemId in objectTitlebarAction
  label: UpdrawTermKey | string;  // term keys are translated through the active locale
  icon?: UpdrawIconName;
  isVisible?: UpdrawTitlebarValue<boolean>;
  isDisabled?: UpdrawTitlebarValue<boolean>;
  action?: (context: UpdrawObjectTitlebarContext, menuItem: UpdrawTitlebarMenuItem) => void;
}
```

### `UpdrawTitlebarValue`

A static value or a function that resolves it from the titlebar context. Functions are evaluated synchronously on every render; promises are not supported.

```ts
type UpdrawTitlebarValue<T> = T | ((context: UpdrawObjectTitlebarContext) => T);
```

### `UpdrawObjectTitlebarContext`

Passed to dynamic element values and the `action` callbacks of buttons and menu items.

```ts
interface UpdrawObjectTitlebarContext {
  object: UpdrawBaseObject;
  objectType: string;
  children: UpdrawBaseObject[];
  isActive: boolean;
  title: string;
  size: { width: number; height: number };        // world units, including padding
  contentSize: { width: number; height: number }; // the object's own width and height
  barWidth: number;                                // screen pixels
  t: (key: UpdrawTermKey | string, vars?: UpdrawTermVars) => string;
}
```

### `UpdrawObjectTitlebarActionEvent`

Emitted by the `objectTitlebarAction` event.

```ts
interface UpdrawObjectTitlebarActionEvent {
  elementId: string;   // id of the clicked button, or of the menu that contains the selected menu item
  menuItemId?: string; // id of the selected menu item, unset for button clicks
  section: 'left' | 'center' | 'right';
  objectId: string;
  objectType: string;
  workspaceId: string;
  anchorRect: DOMRect; // client rect of the clicked button or menu button
}
```

### `UpdrawObjectTitlebarMenuState`

Emitted by the `objectTitlebarMenuStateChange` event of `<UpdrawEngine>` when a titlebar menu opens or closes. Only needed when rendering titlebar menus without `<UpdrawEditor>`.

```ts
interface UpdrawObjectTitlebarMenuState {
  isVisible: boolean;
  objectId?: string;                  // owner of the titlebar whose menu is open
  elementId?: string;                 // id of the open menu element
  section?: 'left' | 'center' | 'right';
  items: UpdrawTitlebarMenuItem[];   // visible menu items, labels translated and isDisabled evaluated
  anchor?: HTMLElement;               // the menu button, inside the engine's shadow root
  anchorRect?: DOMRect;               // client rect of the menu button when the menu opened
}
```

Select a menu item with `selectObjectTitlebarMenuItem(menuItemId)` and close the menu with `closeObjectTitlebarMenu()` on the engine.
