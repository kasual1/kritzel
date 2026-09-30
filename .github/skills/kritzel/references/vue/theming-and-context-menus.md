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
