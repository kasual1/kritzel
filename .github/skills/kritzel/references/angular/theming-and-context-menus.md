# Theming & Context Menus

## Theming

Kritzel theming is a `KritzelTheme` object of design tokens (mapped to `--kritzel-*` CSS variables). Two built-ins are exported: `lightTheme`, `darkTheme`.

```html
<kritzel-editor [theme]="'light'"></kritzel-editor>           <!-- built-ins work out of the box -->
```

### Custom themes — always extend a base theme

Spread a built-in theme and override sections; **give it a `name` and pass it via `[themes]` (an array), selecting it by name with `[theme]`:**

```ts
import { lightTheme, darkTheme, KritzelTheme } from '@kritzel/angular-editor';

export const brandLight: KritzelTheme = {
  ...lightTheme,
  name: 'brand',
  global:  { ...lightTheme.global,  focusRingColor: 'rgba(221, 0, 48, 0.2)' },
  selection: {
    ...lightTheme.selection,
    borderColor: '#dd0031',
    handleStrokeColor: '#dd0031',
    boxBackgroundColor: 'rgba(221, 0, 48, 0.2)',
    boxBorderColor: 'rgba(221, 0, 48, 0.5)',
  },
  contextMenu: {
    ...lightTheme.contextMenu,
    itemHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
  },
};
```

```ts
readonly themes = [brandLight, brandDark];
```

```html
<kritzel-editor [themes]="themes" theme="brand"></kritzel-editor>
```

Theme sections include: `global`, `engine` (canvas background), `checkerboard`, `toolbar` (toolbar), `selection`, `button`, `contextMenu`, `dialog`, `menu`, `moreMenu`, `dropdown`, `settings`, `tooltip`, `utilityPanel`, and more — always spread the corresponding base section before overriding.

Rules:
- `[themes]` takes an **array** even for one theme; `[theme]` is the **name string**.
- Theme switches are live (no reload); listen to `(themeChange)` to mirror into app state.
- Object/tool colors are independent of UI themes — they use `ThemeAwareColor` (`{ light, dark }`) and flip automatically with the active theme.

## Context menus

Two independent surfaces, both inputs of editor and engine:

- `[globalContextMenuItems]` — right-click on empty canvas.
- `[objectContextMenuItems]` — right-click on an object/selection.

Supplying these **replaces** the defaults (the editor ships sensible defaults: paste/select-all globally; copy/cut/paste, order, align, group, export, delete on objects).

```ts
import { ContextMenuItem } from '@kritzel/angular-editor';

readonly globalItems: ContextMenuItem[] = [
  {
    label: 'Paste', icon: 'paste', group: 'clipboard',
    action: menu => this.editor.paste(menu.x, menu.y),   // menu.x / menu.y = world coords of the click
  },
  { label: 'Select All', icon: 'select-all', action: () => this.editor.selectAllObjectsInViewport() },
];

readonly objectItems: ContextMenuItem[] = [
  { label: 'Copy', icon: 'copy', group: 'clipboard', action: () => this.editor.copy() },
  {
    label: 'Order', icon: 'ordering', group: 'arrange',
    children: [
      { label: 'Bring to Front', icon: 'bring-to-front', action: () => this.editor.bringToFront() },
      { label: 'Send to Back', icon: 'send-to-back', action: () => this.editor.sendToBack() },
    ],
  },
  { label: 'Delete', icon: 'delete', group: 'edit', action: () => this.editor.delete() },
];
```

```html
<kritzel-editor [globalContextMenuItems]="globalItems" [objectContextMenuItems]="objectItems"></kritzel-editor>
```

`ContextMenuItem` shape:

| Field | Notes |
|---|---|
| `label` | Required display text |
| `action(menu, objects)` | Sync or async; `menu` carries `x`, `y` (world coords), `objects` is the affected `KritzelBaseObject[]` |
| `disabled` | Boolean or (async) predicate `(menu, objects) => boolean` — item shown greyed out |
| `visible` | Boolean or (async) predicate `(menu, objects) => boolean` — item hidden |
| `icon` | Built-in icon name (extendable via `[customSvgIcons]`) |
| `group` | Items with the same group are visually clustered with separators |
| `children` | Nested submenu (arbitrary depth); parents with children need no `action` |

Programmatic control:

```ts
await editor.openContextMenu({ x, y });                    // global menu at world coords
await editor.openContextMenu({ x, y, objectId: obj.id });  // object menu
await editor.hideContextMenu();
```

On touch devices, the engine's `(longpress)` event (payload: `PointerEvent`) is the hook for opening menus manually.

## Object titlebars

An optional bar above objects (Framer / Claude-design style). Its content and appearance are declared **once** with the `[objectTitlebar]` input (on `kritzel-editor` and `kritzel-engine`) and are the same for every object. Which objects get a bar is decided by `hasTitlebar` in the `[objectConfig]` input (see the object configuration section of objects.md), and each bar is titled by the object's `name`. Leaving `[objectTitlebar]` unset turns the feature off; without `objectConfig.hasTitlebar` no bar renders. Pass both inputs.

Define both configs as stable component fields (not inline template literals) and handle buttons through the `(objectTitlebarAction)` output (see events.md):

```ts
import { signal } from '@angular/core';
import { KritzelObjectConfig, KritzelObjectTitlebarActionEvent, KritzelObjectTitlebarConfig } from '@kritzel/angular-editor';

readonly objectConfig: KritzelObjectConfig = {
  hasTitlebar: object => object.__class__ === 'KritzelShape',   // without it no bar renders
};

readonly objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [
    { id: 'preview', type: 'button', icon: 'play', variant: 'filled', tooltip: 'Preview' },
    { id: 'title', type: 'title' },
    { id: 'width', type: 'text', tone: 'muted', minBarWidth: 120, text: ({ contentSize }) => `${Math.round(contentSize.width)}` },
  ],
  right: [{ id: 'add-breakpoint', type: 'button', icon: 'plus', tooltip: 'Add breakpoint' }],
};

readonly lastAction = signal('');

onTitlebarAction(e: CustomEvent<KritzelObjectTitlebarActionEvent>) {
  this.lastAction.set(e.detail.itemId);
}
```

```html
<kritzel-editor
  [objectConfig]="objectConfig"
  [objectTitlebar]="objectTitlebar"
  (objectTitlebarAction)="onTitlebarAction($event)"
></kritzel-editor>
```

The proxies set inputs outside `NgZone`, so a button's `action` callback runs **outside the Angular zone**. Prefer the `(objectTitlebarAction)` output (runs in the zone) for state changes, or wrap the work in `this.ngZone.run(() => …)` inside `action`.

`KRITZEL_DEFAULT_OBJECT_TITLEBAR` is a ready-made preset (type icon + title); pass it as the titlebar config (or spread it to change options) and pick the objects with `objectConfig`, e.g. `{ hasTitlebar: object => object.__class__ === 'KritzelGroup' }`.

`objectConfig.hasTitlebar` is `true` / `false` for every object, or a plain function `(object) => boolean` that receives just the object:

- **Default: no bars.** Without `objectConfig.hasTitlebar` nothing renders, and the engine logs a one-time `console.info` hint while `[objectTitlebar]` is set. `hasTitlebar: true` gives every top-level object a bar.
- Called **synchronously for every visible top-level object on every render**: keep it pure and cheap. Only `true` shows a bar; a non-boolean result, a throw or a returned promise counts as `false` (a throw or promise warns once).
- Grouped children are never passed in and never get their own bar; the group is passed instead and gets a bar only if `hasTitlebar` returns `true` for it (no special group rules; its children are not asked).
- Check types with `object.__class__` (`'KritzelGroup'`, `'KritzelShape'`, `'KritzelText'`, `'KritzelImage'`, `'KritzelPath'`, `'KritzelLine'`, `'KritzelIframeObject'`, `'KritzelDynamicObject'`), not `instanceof`, which fails when the app bundles more than one copy of the engine.
- To inspect a group's children, read `childIds` (cheap) rather than the `children` getter (looks them up in the store). The function receives a `KritzelBaseObject`, so cast after the `__class__` check, e.g. `(object as KritzelGroup).childIds`.

`hasTitlebar` is only re-evaluated on renders, and a **new** `objectConfig` object triggers one. To toggle bars per object at runtime, keep the ids in a signal, read them inside `hasTitlebar` and derive `objectConfig` with `computed()` as a component field (replace the `Set`, never mutate it); the titlebar config itself stays constant. The ids live in the app, so they are neither persisted nor synced:

```ts
import { computed, signal } from '@angular/core';
import { KRITZEL_DEFAULT_OBJECT_TITLEBAR, KritzelObjectConfig } from '@kritzel/angular-editor';

readonly objectTitlebar = KRITZEL_DEFAULT_OBJECT_TITLEBAR;
readonly titlebarIds = signal(new Set<string>());

readonly objectConfig = computed<KritzelObjectConfig>(() => {
  const ids = this.titlebarIds();
  return { hasTitlebar: object => ids.has(object.id) };
});

toggleTitlebar(id: string) {
  this.titlebarIds.update(ids => {
    const next = new Set(ids);
    if (!next.delete(id)) next.add(id);
    return next;
  });
}
```

```html
<kritzel-editor [objectConfig]="objectConfig()" [objectTitlebar]="objectTitlebar"></kritzel-editor>
```

Items — every item needs a stable `id` (used in events) and accepts `isVisible`, `showWhen` (`'always'` | `'active'` | `'inactive'`), `minBarWidth` (screen px) and `part`:

| `type` | Fields | Notes |
|---|---|---|
| `title` | `text?`, `isEditable?` | Resolved title: item `text` > `config.title(object)` > `object.name` > localized type label. `isEditable: true` (or a function of the context) lets users rename the object: clicking the title of the active bar of the only selected object again opens an input; Enter/blur stores the trimmed value in `name` (one undo step, emits `objectsUpdated` with `['name']`), Escape cancels, empty clears the name (default title). Not editable with a `text` override |
| `text` | `text`, `tone?` (`'default'` \| `'muted'` \| `'strong'`) | Arbitrary text, e.g. a size |
| `icon` | `icon` | Registry icon name (`[customSvgIcons]` extend it) |
| `button` | `icon?`, `label?`, `tooltip?`, `variant?` (`'ghost'` \| `'filled'` \| `'outlined'`), `isDisabled?`, `isPressed?`, `action?(context, event)` | Never selects or drags; always emits `objectTitlebarAction`. `label` / `tooltip` take term keys or plain strings |
| `spacer` / `separator` | — | Flexible space / thin divider |

Any value may be a function `(context) => value`. It runs **synchronously on every render**: keep it pure and cheap; promises are not supported (they resolve to the fallback and warn once). The context has `object`, `objectType`, `children`, `isActive`, `title`, `size` (world units), `contentSize` (`object.width` / `height`, e.g. a frame's `1200`), `barWidth` (screen px) and `t(key, vars)`.

Config options: `left` (default: one title item), `center`, `right`, `visibility` (`'always'` default, or `'active'` = only while selected), `rotation` (`'follow'` default = along the rotated top edge, or `'upright'`), `title(object)` resolver, `draggable` (default `true`), `hideBelowWidth` (default `40` screen px). Which objects get a bar is not a titlebar option: it is `objectConfig.hasTitlebar`.

Behavior: the bar is active (highlighted) while its object, or something inside its group, is selected. Pressing the bar selects the object and dragging moves it exactly like dragging the object (same undo and sync); Shift/Ctrl-press toggles it in the selection. Right-click / long-press opens the object context menu. Clicking a text object's bar does not start editing. While a drawing tool is active, the bar lets input pass through but buttons stay clickable. Bars keep a constant screen size at any zoom, hide below `hideBelowWidth`, and are excluded from screenshots and exports.

### Titlebar theme tokens

The `titlebar` theme section maps to `--kritzel-titlebar-<key-kebab>` variables: `height` and `offset` (px values only), `paddingX`, `gap`, `borderRadius`, `fontFamily`, `fontSize`, `fontWeight`, `titleFontWeight`, `backgroundColor`, `hoverBackgroundColor`, `activeBackgroundColor`, `border`, `activeBorder`, `boxShadow`, `activeBoxShadow`, `textColor`, `activeTextColor`, `mutedTextColor`, `activeMutedTextColor`, `iconSize`, `iconColor`, `activeIconColor`, `buttonSize`, `buttonBorderRadius`, `buttonHoverBackgroundColor`, `buttonPressedBackgroundColor`, `buttonFilledBackgroundColor`, `activeButtonFilledBackgroundColor`, `buttonFilledColor`, `buttonOutlineColor`, `focusRing`, `transition`.

`[themes]` **replaces** the theme registry (no deep merge), so spread both the base theme and its `titlebar` section, keep the names, and register the light and dark variants. A transparent "Claude design" bar sitting close to the object:

```ts
import { darkTheme, lightTheme, KritzelTheme } from '@kritzel/angular-editor';

const transparentTitlebar = {
  backgroundColor: 'transparent',
  hoverBackgroundColor: 'transparent',
  activeBackgroundColor: 'transparent',
  offset: '2px',
  paddingX: '0',
};

export const transparentTitlebarLight: KritzelTheme = { ...lightTheme, titlebar: { ...lightTheme.titlebar, ...transparentTitlebar } };
export const transparentTitlebarDark: KritzelTheme = { ...darkTheme, titlebar: { ...darkTheme.titlebar, ...transparentTitlebar } };
```

```ts
readonly themes = [transparentTitlebarLight, transparentTitlebarDark];
```

```html
<kritzel-editor [themes]="themes" theme="light" [objectTitlebar]="objectTitlebar"></kritzel-editor>
```

### Styling with `::part()`

For anything tokens do not cover, target parts on the engine: `titlebar`, `titlebar-active`, `titlebar-inactive`, `titlebar-left`, `titlebar-center`, `titlebar-right`, `titlebar-title`, `titlebar-title-input`, `titlebar-text`, `titlebar-icon`, `titlebar-button`, `titlebar-button-pressed`, `titlebar-separator`, plus any item's own `part`. The engine is rendered by the editor (in its light DOM), not by your template, so emulated component styles never match it — put these rules in the global `styles.css`:

```css
kritzel-engine::part(titlebar-active) { box-shadow: 0 0 0 1px #dd0031; }
kritzel-engine::part(titlebar-button) { border-radius: 999px; }
```

Runnable demos: `/customization/titlebar/configure` and `/customization/titlebar/styling`.
