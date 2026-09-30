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
