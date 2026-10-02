# Theming & Context Menus

## Theming

Kritzel theming is a `KritzelTheme` object of design tokens (mapped to `--kritzel-*` CSS variables). Two built-ins are exported: `lightTheme`, `darkTheme`.

```tsx
<KritzelEditor theme="light" />           {/* built-ins work out of the box */}
```

### Custom themes — always extend a base theme

Spread a built-in theme and override sections; **give it a `name`, pass it via `themes` (an array), and select it by name with `theme`.** Define theme objects and the array at module scope (identity-stable):

```tsx
import { lightTheme, darkTheme, type KritzelTheme } from '@kritzel/react-editor';

export const brandLight: KritzelTheme = {
  ...lightTheme,
  name: 'brand',
  global:  { ...lightTheme.global,  focusRingColor: 'rgba(8, 126, 164, 0.2)' },
  selection: {
    ...lightTheme.selection,
    borderColor: '#087ea4',
    handleStrokeColor: '#087ea4',
    boxBackgroundColor: 'rgba(8, 126, 164, 0.2)',
    boxBorderColor: 'rgba(8, 126, 164, 0.5)',
  },
  contextMenu: {
    ...lightTheme.contextMenu,
    itemHoverBackgroundColor: 'rgba(8, 126, 164, 0.08)',
  },
};

const themes = [brandLight];

// in the component:
<KritzelEditor themes={themes} theme="brand" />
```

Theme sections include: `global`, `engine` (canvas background), `checkerboard`, `toolbar` (toolbar), `selection`, `button`, `contextMenu`, `dialog`, `menu`, `moreMenu`, `dropdown`, `settings`, `tooltip`, `utilityPanel`, and more — always spread the corresponding base section before overriding.

Rules:
- `themes` takes an **array** even for one theme; `theme` is the **name string**.
- Theme switches are live (no reload); listen with `onThemeChange` to mirror into app state (`onThemeChange={e => setTheme(e.detail)}`).
- Object/tool colors are independent of UI themes — they use `ThemeAwareColor` (`{ light, dark }`) and flip automatically with the active theme.

## Context menus

Two independent surfaces, both props of editor and engine:

- `globalContextMenuItems` — right-click on empty canvas.
- `objectContextMenuItems` — right-click on an object/selection.

Supplying these **replaces** the defaults (the editor ships sensible defaults: paste/select-all globally; copy/cut/paste, order, align, group, export, delete on objects).

**Memoize the arrays with `useMemo(() => [...], [])`** and reach the editor inside callbacks via `editorRef.current?.` — the ref is identity-stable, so the empty dependency array is safe:

```tsx
import { useMemo, useRef } from 'react';
import { KritzelEditor, type ContextMenuItem, type HTMLKritzelEditorElement } from '@kritzel/react-editor';

const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

const globalItems = useMemo<ContextMenuItem[]>(() => [
  {
    label: 'Paste', icon: 'paste', group: 'clipboard',
    action: async menu => { await editorRef.current?.paste(menu.x, menu.y); },  // menu.x/y = world coords
  },
  {
    label: 'Select All', icon: 'select-all',
    action: async () => { await editorRef.current?.selectAllObjectsInViewport(); },
  },
], []);

const objectItems = useMemo<ContextMenuItem[]>(() => [
  { label: 'Copy', icon: 'copy', group: 'clipboard', action: async () => { await editorRef.current?.copy(); } },
  {
    label: 'Order', icon: 'ordering', group: 'arrange',
    children: [
      { label: 'Bring to Front', icon: 'bring-to-front', action: async () => { await editorRef.current?.bringToFront(); } },
      { label: 'Send to Back', icon: 'send-to-back', action: async () => { await editorRef.current?.sendToBack(); } },
    ],
  },
  { label: 'Delete', icon: 'delete', group: 'edit', action: async () => { await editorRef.current?.delete(); } },
], []);

<KritzelEditor ref={editorRef} globalContextMenuItems={globalItems} objectContextMenuItems={objectItems} />
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

```tsx
await editor.openContextMenu({ x, y });                    // global menu at world coords
await editor.openContextMenu({ x, y, objectId: obj.id });  // object menu
await editor.hideContextMenu();
```

On touch devices, the engine's `onLongpress` event (payload: `PointerEvent`) is the hook for opening menus manually.
