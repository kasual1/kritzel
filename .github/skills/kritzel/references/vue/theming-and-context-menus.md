# Theming & Context Menus

## Theming

Kritzel theming is a `KritzelTheme` object of design tokens (mapped to `--kritzel-*` CSS variables). Two built-ins are exported: `lightTheme`, `darkTheme`.

```html
<KritzelEditor theme="light" />           <!-- built-ins work out of the box -->
```

### Custom themes — always extend a base theme

Spread a built-in theme and override sections; **give it a `name`, pass it via `:themes` (an array), and select it by name with `theme`.** Define the theme objects and the array as consts in `<script setup>` (or a separate module) — never inline in the template, since inline literals are recreated every render and re-trigger prop setters:

```vue
<script setup lang="ts">
import { KritzelEditor, lightTheme, type KritzelTheme } from '@kritzel/vue-editor'

const brandLight: KritzelTheme = {
  ...lightTheme,
  name: 'brand',
  global:  { ...lightTheme.global,  focusRingColor: 'rgba(66, 184, 131, 0.2)' },
  selection: {
    ...lightTheme.selection,
    borderColor: '#42b883',
    handleStrokeColor: '#42b883',
    boxBackgroundColor: 'rgba(66, 184, 131, 0.2)',
    boxBorderColor: 'rgba(66, 184, 131, 0.5)',
  },
  contextMenu: {
    ...lightTheme.contextMenu,
    itemHoverBackgroundColor: 'rgba(66, 184, 131, 0.08)',
  },
}

const themes = [brandLight]
</script>

<template>
  <KritzelEditor :themes="themes" theme="brand" />
</template>
```

Theme sections include: `global`, `engine` (canvas background), `checkerboard`, `toolbar` (toolbar), `selection`, `button`, `contextMenu`, `dialog`, `menu`, `moreMenu`, `dropdown`, `settings`, `tooltip`, `utilityPanel`, and more — always spread the corresponding base section before overriding.

Rules:
- `:themes` takes an **array** even for one theme; `theme` is the **name string** (use `:theme="activeName"` with a `ref` to switch reactively).
- Theme switches are live (no reload); listen with `@themeChange` to mirror into app state (`@themeChange="e => (current = (e as CustomEvent<ThemeName>).detail)"`).
- Object/tool colors are independent of UI themes — they use `ThemeAwareColor` (`{ light, dark }`) and flip automatically with the active theme.

## Context menus

Two independent surfaces, both props of editor and engine:

- `:globalContextMenuItems` — right-click on empty canvas.
- `:objectContextMenuItems` — right-click on an object/selection.

Supplying these **replaces** the defaults (the editor ships sensible defaults: paste/select-all globally; copy/cut/paste, order, align, group, export, delete on objects).

**Define the arrays as consts in `<script setup>`** and reach the editor inside callbacks via `editor.value?.` — the resolved ref is stable, and the consts keep prop identity stable across renders:

```vue
<script setup lang="ts">
import { KritzelEditor, getEditorRef, type ContextMenuItem } from '@kritzel/vue-editor'

const editor = getEditorRef('editor')   // argument = template-ref NAME

const globalItems: ContextMenuItem[] = [
  {
    label: 'Paste', icon: 'paste', group: 'clipboard',
    action: async menu => { await editor.value?.paste(menu.x, menu.y) },  // menu.x/y = world coords
  },
  {
    label: 'Select All', icon: 'select-all',
    action: async () => { await editor.value?.selectAllObjectsInViewport() },
  },
]

const objectItems: ContextMenuItem[] = [
  { label: 'Copy', icon: 'copy', group: 'clipboard', action: async () => { await editor.value?.copy() } },
  {
    label: 'Order', icon: 'ordering', group: 'arrange',
    children: [
      { label: 'Bring to Front', icon: 'bring-to-front', action: async () => { await editor.value?.bringToFront() } },
      { label: 'Send to Back', icon: 'send-to-back', action: async () => { await editor.value?.sendToBack() } },
    ],
  },
  { label: 'Delete', icon: 'delete', group: 'edit', action: async () => { await editor.value?.delete() } },
]
</script>

<template>
  <KritzelEditor ref="editor" :globalContextMenuItems="globalItems" :objectContextMenuItems="objectItems" />
</template>
```

`ContextMenuItem` shape:

| Field | Notes |
|---|---|
| `label` | Required display text |
| `action(menu, objects)` | Sync or async; `menu` carries `x`, `y` (world coords), `objects` is the affected `KritzelBaseObject[]` |
| `disabled` | Boolean or (async) predicate `(menu, objects) => boolean` — item shown greyed out |
| `visible` | Boolean or (async) predicate `(menu, objects) => boolean` — item hidden |
| `icon` | Built-in icon name (extendable via `customSvgIcons`) |
| `group` | Items with the same group are visually clustered with separators |
| `children` | Nested submenu (arbitrary depth); parents with children need no `action` |

Programmatic control:

```ts
await editor.value?.openContextMenu({ x, y })                    // global menu at world coords
await editor.value?.openContextMenu({ x, y, objectId: obj.id })  // object menu
await editor.value?.hideContextMenu()
```

On touch devices, the engine's `@longpress` event (payload: `PointerEvent` in `(event as CustomEvent<PointerEvent>).detail`) is the hook for opening menus manually.

## Object titlebars

An optional bar above objects (Framer / Claude-design style). Its content is declared **once** with the `:objectTitlebar` prop (on `KritzelEditor` and `KritzelEngine`) and is the same for every object; each object opts in with `hasTitlebar: true` and is titled by its `name` (see objects.md). Leaving the prop unset turns the feature off.

Define the config as a const in `<script setup>` (never inline in the template) and handle buttons through `@objectTitlebarAction` (see events.md):

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  KritzelEditor,
  type KritzelObjectTitlebarActionEvent,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/vue-editor'

const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [
    { id: 'preview', type: 'button', icon: 'play', variant: 'filled', tooltip: 'Preview' },
    { id: 'title', type: 'title' },
    { id: 'width', type: 'text', tone: 'muted', minBarWidth: 120, text: ({ contentSize }) => `${Math.round(contentSize.width)}` },
  ],
  right: [{ id: 'add-breakpoint', type: 'button', icon: 'plus', tooltip: 'Add breakpoint' }],
}

const lastAction = ref('')

function onTitlebarAction(event: Event) {
  lastAction.value = (event as CustomEvent<KritzelObjectTitlebarActionEvent>).detail.itemId
}
</script>

<template>
  <KritzelEditor :objectTitlebar="objectTitlebar" @objectTitlebarAction="onTitlebarAction" />
</template>
```

`KRITZEL_DEFAULT_OBJECT_TITLEBAR` is a ready-made preset (type icon + title).

Items — every item needs a stable `id` (used in events) and accepts `isVisible`, `showWhen` (`'always'` | `'active'` | `'inactive'`), `minBarWidth` (screen px) and `part`:

| `type` | Fields | Notes |
|---|---|---|
| `title` | `text?` | Resolved title: item `text` > `config.title(object)` > `object.name` > localized type label |
| `text` | `text`, `tone?` (`'default'` \| `'muted'` \| `'strong'`) | Arbitrary text, e.g. a size |
| `icon` | `icon` | Registry icon name (`:customSvgIcons` extend it) |
| `button` | `icon?`, `label?`, `tooltip?`, `variant?` (`'ghost'` \| `'filled'` \| `'outlined'`), `isDisabled?`, `isPressed?`, `action?(context, event)` | Never selects or drags; always emits `objectTitlebarAction`. `label` / `tooltip` take term keys or plain strings |
| `spacer` / `separator` | — | Flexible space / thin divider |

Any value may be a function `(context) => value`. It runs **synchronously on every render**: keep it pure and cheap; promises are not supported (they resolve to the fallback and warn once). The context has `object`, `objectType`, `children`, `isActive`, `title`, `size` (world units), `contentSize` (`object.width` / `height`, e.g. a frame's `1200`), `barWidth` (screen px) and `t(key, vars)`.

Config options: `left` (default: one title item), `center`, `right`, `visibility` (`'always'` default, or `'active'` = only while selected), `rotation` (`'follow'` default = along the rotated top edge, or `'upright'`), `title(object)` resolver, `draggable` (default `true`), `hideBelowWidth` (default `40` screen px).

Behavior: the bar is active (highlighted) while its object, or something inside its group, is selected. Pressing the bar selects the object and dragging moves it exactly like dragging the object (same undo and sync); Shift/Ctrl-press toggles it in the selection. Right-click / long-press opens the object context menu. Clicking a text object's bar does not start editing. While a drawing tool is active, the bar lets input pass through but buttons stay clickable. Bars keep a constant screen size at any zoom, hide below `hideBelowWidth`, and are excluded from screenshots and exports.

### Titlebar theme tokens

The `titlebar` theme section maps to `--kritzel-titlebar-<key-kebab>` variables: `height` and `offset` (px values only), `paddingX`, `gap`, `borderRadius`, `fontFamily`, `fontSize`, `fontWeight`, `titleFontWeight`, `backgroundColor`, `hoverBackgroundColor`, `activeBackgroundColor`, `border`, `activeBorder`, `boxShadow`, `activeBoxShadow`, `textColor`, `activeTextColor`, `mutedTextColor`, `activeMutedTextColor`, `iconSize`, `iconColor`, `activeIconColor`, `buttonSize`, `buttonBorderRadius`, `buttonHoverBackgroundColor`, `buttonPressedBackgroundColor`, `buttonFilledBackgroundColor`, `activeButtonFilledBackgroundColor`, `buttonFilledColor`, `buttonOutlineColor`, `focusRing`, `transition`.

`:themes` **replaces** the theme registry (no deep merge), so spread both the base theme and its `titlebar` section, keep the names, and register the light and dark variants. A transparent "Claude design" bar sitting close to the object:

```vue
<script setup lang="ts">
import { KritzelEditor, darkTheme, lightTheme, type KritzelTheme } from '@kritzel/vue-editor'

const transparentTitlebar = {
  backgroundColor: 'transparent',
  hoverBackgroundColor: 'transparent',
  activeBackgroundColor: 'transparent',
  offset: '2px',
  paddingX: '0',
}

const themes: KritzelTheme[] = [
  { ...lightTheme, titlebar: { ...lightTheme.titlebar, ...transparentTitlebar } },
  { ...darkTheme, titlebar: { ...darkTheme.titlebar, ...transparentTitlebar } },
]
</script>

<template>
  <KritzelEditor :themes="themes" theme="light" :objectTitlebar="objectTitlebar" />
</template>
```

### Styling with `::part()`

For anything tokens do not cover, target parts on the engine: `titlebar`, `titlebar-active`, `titlebar-inactive`, `titlebar-left`, `titlebar-center`, `titlebar-right`, `titlebar-title`, `titlebar-text`, `titlebar-icon`, `titlebar-button`, `titlebar-button-pressed`, `titlebar-separator`, plus any item's own `part`. The engine is rendered by the editor (in its light DOM), not by your template, so use a non-scoped `<style>` block or a global stylesheet — `scoped` selectors never match it:

```vue
<style>
kritzel-engine::part(titlebar-active) { box-shadow: 0 0 0 1px #42b883; }
kritzel-engine::part(titlebar-button) { border-radius: 999px; }
</style>
```

Runnable demos: `/customization/titlebar/configure` and `/customization/titlebar/styling`.
