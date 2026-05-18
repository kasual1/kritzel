---
sidebar_label: Custom Context Menu
displayed_sidebar: tutorialSidebar
title: "Custom Context Menu Example | Kritzel for Angular"
description: "Build a custom Kritzel context menu step by step, from a minimal action list up to a fully structured menu with icons, groups, nested submenus, and async conditional items."
---

# Custom Context Menu

This guide builds up a custom context menu step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

## Prerequisites

Install the Angular wrapper package:

```bash
npm install kritzel-angular
```

Register Kritzel in your application config:

```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideKritzel } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideKritzel(),
    // ... other providers
  ],
};
```

Then import `KritzelEditor` into your standalone component:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor></kritzel-editor>`,
})
export class EditorComponent {}
```

Add the following to your global styles (for example `src/styles.scss`):

```scss title="styles.scss"
html,
body {
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior-x: none;
}
```

This renders the editor with the **built-in default context menu** — paste and select-all on the canvas, and copy, paste, ordering, alignment, group, and delete on selected objects.

---

## How the Context Menu Works

The context menu is controlled by two inputs on `<kritzel-editor>`:

- **`globalContextMenuItems`** — the items shown when the user right-clicks on the empty canvas (no object under the cursor).
- **`objectContextMenuItems`** — the items shown when the user right-clicks on a selected object.

Both accept an array of `ContextMenuItem` objects:

```ts
import { ContextMenuItem } from 'kritzel-stencil';

interface ContextMenuItem {
  label: string;
  action?: (menu: { x: number; y: number }, objects: KritzelBaseObject[]) => void;
  icon?: string;
  group?: string;
  children?: ContextMenuItem[];
  visible?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
  disabled?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
}
```

Passing either input replaces the corresponding default set entirely. Omitting an input keeps that default set intact.

---

## Step 1: Adding Items to the Canvas Menu

Pass a `globalContextMenuItems` array to replace the default canvas (empty-area) context menu:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ContextMenuItem } from 'kritzel-stencil'; // highlight-line

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [globalContextMenuItems]="globalItems"
    ></kritzel-editor>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  // highlight-start
  globalItems: ContextMenuItem[] = [
    {
      label: 'Paste',
      action: (_menu, _objects) => {
        // paste logic
      },
    },
    {
      label: 'Select All',
      action: (_menu, _objects) => {
        // select-all logic
      },
    },
  ];
  // highlight-end
}
```

The `action` callback receives the screen-space position of the menu (`menu.x`, `menu.y`) and the array of currently selected objects (`objects`). For canvas-level items, `objects` is always empty.

---

## Step 2: Adding Items to the Object Menu

Add `objectContextMenuItems` to also replace the per-object context menu:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { ContextMenuItem } from 'kritzel-stencil';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [globalContextMenuItems]="globalItems"
      [objectContextMenuItems]="objectItems"
    ></kritzel-editor>
  `,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  globalItems: ContextMenuItem[] = [
    { label: 'Paste', action: () => {} },
    { label: 'Select All', action: () => {} },
  ];

  // highlight-start
  objectItems: ContextMenuItem[] = [
    {
      label: 'Copy',
      action: (_menu, objects) => {
        console.log('Copying', objects.length, 'object(s)');
      },
    },
    {
      label: 'Delete',
      action: (_menu, objects) => {
        console.log('Deleting', objects.length, 'object(s)');
      },
    },
  ];
  // highlight-end
}
```

When right-clicking a selected object, `objects` contains the currently selected objects. When right-clicking an unselected object, the editor first selects it, then populates `objects` with that single object.

---

## Step 3: Adding Icons and Visual Groups

Use `icon` and `group` to structure the menu visually. Items sharing the same `group` string are separated from other groups by a divider:

```ts
objectItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    action: () => {},
    // highlight-start
    icon: 'copy',
    group: 'clipboard',
    // highlight-end
  },
  {
    label: 'Paste',
    action: () => {},
    // highlight-start
    icon: 'clipboard',
    group: 'clipboard',
    // highlight-end
  },
  {
    label: 'Delete',
    action: () => {},
    // highlight-start
    icon: 'trash',
    group: 'destructive',
    // highlight-end
  },
];
```

The `icon` value is a built-in icon name. Custom SVG icons registered via the `customSvgIcons` input on `<kritzel-editor>` are also available here by their registered key.

---

## Step 4: Conditionally Disabling Items

Use a function for `disabled` to compute the enabled state at the moment the menu opens. The function receives the same `menu` position and `objects` array as `action`:

```ts
objectItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    action: () => {},
    icon: 'copy',
    group: 'clipboard',
  },
  {
    label: 'Paste',
    action: () => {},
    icon: 'clipboard',
    group: 'clipboard',
    // highlight-start
    disabled: (_menu, objects) => objects.length > 5,
    // highlight-end
  },
  {
    label: 'Delete',
    action: () => {},
    icon: 'trash',
    group: 'destructive',
  },
];
```

`disabled` also accepts a plain `boolean` for statically disabled items.

---

## Step 5: Async Disabled and Visible Conditions

Both `disabled` and `visible` accept functions that return a `Promise<boolean>`. The menu waits for all promises to resolve before rendering:

```ts
objectItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    action: () => {},
    icon: 'copy',
    group: 'clipboard',
  },
  {
    label: 'Export as PNG',
    action: (_menu, objects) => {
      // export logic
    },
    icon: 'download',
    group: 'export',
    // highlight-start
    visible: async (_menu, objects) => {
      const hasImages = objects.some(obj => obj.type === 'image');
      return hasImages;
    },
    disabled: async (_menu, objects) => {
      const count = objects.length;
      return count === 0;
    },
    // highlight-end
  },
  {
    label: 'Delete',
    action: () => {},
    icon: 'trash',
    group: 'destructive',
  },
];
```

`visible` controls whether the item appears in the list at all. `disabled` greys it out but keeps it visible.

---

## Step 6: Nested Submenus

Add `children` to an item to turn it into a submenu trigger. The item itself has no `action`; clicking it opens the nested list:

```ts
objectItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    action: () => {},
    icon: 'copy',
    group: 'clipboard',
  },
  // highlight-start
  {
    label: 'Order',
    icon: 'layers',
    group: 'arrange',
    children: [
      {
        label: 'Bring to Front',
        action: (_menu, objects) => {
          // bring-to-front logic
        },
      },
      {
        label: 'Bring Forward',
        action: (_menu, objects) => {
          // bring-forward logic
        },
      },
      {
        label: 'Send Backward',
        action: (_menu, objects) => {
          // send-backward logic
        },
      },
      {
        label: 'Send to Back',
        action: (_menu, objects) => {
          // send-to-back logic
        },
      },
    ],
  },
  {
    label: 'Align',
    icon: 'align-left',
    group: 'arrange',
    children: [
      { label: 'Align Left', action: () => {} },
      { label: 'Align Center', action: () => {} },
      { label: 'Align Right', action: () => {} },
    ],
    disabled: (_menu, objects) => objects.length < 2,
  },
  // highlight-end
  {
    label: 'Delete',
    action: () => {},
    icon: 'trash',
    group: 'destructive',
  },
];
```

`disabled` and `visible` work on submenu parent items the same way as on leaf items — the condition applies to the trigger entry itself, not to its children individually.
