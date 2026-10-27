---
sidebar_label: Titlebars
displayed_sidebar: tutorialSidebar
title: "Titlebars | Kritzel for React"
description: "Render a configurable titlebar above objects with a title, text, icons, and buttons, and style it with theme tokens in React."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Titlebars

## Overview

A titlebar is an optional bar rendered above an object, similar to the frame labels in design tools. It shows the object's title and can hold additional text, icons, and buttons. Pressing the bar selects its object, and dragging the bar moves the object.

Titlebars are set up in three places:

- The `objectTitlebar` prop on `<KritzelEditor>` declares the content of the titlebar. The same configuration applies to every object. Leave it unset to turn titlebars off.
- The `hasTitlebar` option of the `objectConfig` prop decides which objects get a titlebar. See [Object Configuration](./object-config.md) for everything else the `objectConfig` prop configures.
- Each object can have a `name`, which is shown as the title.

The following demo renders labeled frames for different screen sizes. Each frame shows a filled preview button, its name, and its width, plus a button to add a breakpoint. The demo's `hasTitlebar` function only accepts objects with a `name`, so the note in the bottom left has no titlebar. The status line shows the last clicked button.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/titlebar/configure"
  repoFiles={['src/pages/customization/titlebar/TitlebarConfigurePage.tsx']}
/>

## Enabling Titlebars

Pass a `KritzelObjectTitlebarConfig` to the `objectTitlebar` prop, and choose which objects get a titlebar with the `hasTitlebar` option of the `objectConfig` prop. `hasTitlebar` receives an object and returns `true` if the object should get a titlebar. To set the title, pass `name` to the object. Every object constructor accepts this option, and it is persisted and synced like any other object property.

```tsx
import { useState } from 'react';
import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  type KritzelObjectConfig,
} from '@kritzel/react-editor';

const objectConfig: KritzelObjectConfig = {
  hasTitlebar: (object) => object.__class__ === 'KritzelShape',
};

export function Frames() {
  const [workspaces] = useState(() => [
    new KritzelWorkspace({
      objects: [
        new KritzelShape({ translateX: 0, translateY: 0, width: 400, height: 240, name: 'Desktop' }),
      ],
    }),
  ]);

  return (
    <KritzelEditor
      workspaces={workspaces}
      objectTitlebar={KRITZEL_DEFAULT_OBJECT_TITLEBAR}
      objectConfig={objectConfig}
    />
  );
}
```

`KRITZEL_DEFAULT_OBJECT_TITLEBAR` is a ready-made preset that shows an icon for the object type followed by the title. Pass it as is, as shown above, or spread it and override individual options. An empty configuration (`{}`) shows the title only.

To rename an object later, use `updateObject()`. Like every call to `updateObject()`, this clears the current selection:

```ts
const editor = editorRef.current;
const [object] = (await editor?.getSelectedObjects()) ?? [];

if (object) {
  await editor?.updateObject(object, { name: 'Hero section' });
}
```

The title is resolved in the following order:

1. The `text` of the `title` item.
2. The `title(object)` resolver of the configuration.
3. The object's `name`.
4. A localized label for the object type, such as `Shape` or `Group` (see the `objectType.*` keys in [Localization Terms](../api-reference/localization-terms.md#object-type-labels)).

## Choosing Which Objects Get a Titlebar

The `hasTitlebar` option of the `objectConfig` prop decides which objects get a titlebar. Set it to `true` to give every object a titlebar, or pass a function that receives an object and returns `true` if the object should get one. Without `hasTitlebar`, no titlebars are rendered, and the editor logs a hint to the console once. The general rules for the options of the `objectConfig` prop are described in [Object Configuration](./object-config.md).

Compare `object.__class__` to select objects by type, or check any other property of the object:

```ts
// Every object
hasTitlebar: true

// Groups only
hasTitlebar: (object) => object.__class__ === 'KritzelGroup'

// Shapes and groups
hasTitlebar: (object) => object.__class__ === 'KritzelShape' || object.__class__ === 'KritzelGroup'

// Named objects only
hasTitlebar: (object) => !!object.name
```

Keep the following in mind when writing a `hasTitlebar` function:

- **Evaluation:** The function is called for every visible top-level object on every render, so it must be synchronous and cheap. Only `true` shows a titlebar. Any other return value means no titlebar. A function that throws or returns a promise counts as `false` and logs a warning once.
- **Groups:** Objects inside a group never get their own titlebar. The function receives the group instead, and the group gets a titlebar only if it returns `true` for it.
- **Type checks:** Compare `object.__class__`, for example `'KritzelGroup'`, `'KritzelShape'`, `'KritzelText'`, `'KritzelImage'`, `'KritzelPath'`, `'KritzelLine'`, `'KritzelIframeObject'`, or `'KritzelDynamicObject'`, instead of using `instanceof`, which fails when the app bundles more than one copy of the engine.
- **Group children:** To inspect the children of a group, prefer `childIds` over the `children` getter, which looks them up in the store.

### Toggling Titlebars per Object

`hasTitlebar` is only evaluated when the editor renders, and the editor rerenders when it receives a new `objectConfig` object. To show or hide the titlebar of individual objects at runtime, keep their IDs in React state, read them in `hasTitlebar`, and derive `objectConfig` with `useMemo` so that every change produces a new configuration object. Replace the set instead of mutating it, so that React detects the change. The IDs live in your app, so they are neither persisted nor synced.

```tsx
import { useMemo, useRef, useState } from 'react';
import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KritzelEditor,
  type HTMLKritzelEditorElement,
  type KritzelObjectConfig,
} from '@kritzel/react-editor';

export function ToggleableTitlebars() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [titlebarObjectIds, setTitlebarObjectIds] = useState(() => new Set<string>());

  const objectConfig = useMemo<KritzelObjectConfig>(
    () => ({
      hasTitlebar: (object) => titlebarObjectIds.has(object.id),
    }),
    [titlebarObjectIds],
  );

  async function toggleTitlebar() {
    const [object] = (await editorRef.current?.getSelectedObjects()) ?? [];
    if (!object) {
      return;
    }

    setTitlebarObjectIds((ids) => {
      const next = new Set(ids);

      if (next.has(object.id)) {
        next.delete(object.id);
      } else {
        next.add(object.id);
      }

      return next;
    });
  }

  return (
    <>
      <button onClick={() => void toggleTitlebar()}>Toggle titlebar</button>
      <KritzelEditor
        ref={editorRef}
        objectTitlebar={KRITZEL_DEFAULT_OBJECT_TITLEBAR}
        objectConfig={objectConfig}
      />
    </>
  );
}
```

## Configuring Items

A titlebar has three sections: `left`, `center`, and `right`. Each section is an array of items that are rendered in order. `left` defaults to a single `title` item, `center` and `right` default to empty.

```ts
const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [
    { id: 'preview', type: 'button', icon: 'play', tooltip: 'Preview', variant: 'filled' },
    { id: 'title', type: 'title' },
    { id: 'width', type: 'text', tone: 'muted', text: ({ contentSize }) => `${Math.round(contentSize.width)}` },
  ],
  right: [
    { id: 'add-breakpoint', type: 'button', icon: 'plus', tooltip: 'Add breakpoint' },
  ],
};
```

Define the configuration once at module level, or memoize it with `useMemo`, so that it keeps the same reference across renders.

### Item Types

| Type | Options | Description |
|------|---------|-------------|
| title | text, isEditable | Shows the resolved title. `text` overrides it for this item. With `isEditable`, users can rename the object, see [Renaming Objects](#renaming-objects). |
| text | text, tone | Shows arbitrary text. `tone` is `'default'`, `'muted'`, or `'strong'`. |
| icon | icon | Shows a non-interactive icon from the icon registry. |
| button | icon, label, tooltip, variant, isDisabled, isPressed, action | Shows an interactive button. |
| spacer | - | Fills the remaining space of its section. |
| separator | - | Shows a thin vertical divider. |

Every item supports the following options:

| Option | Type | Description |
|--------|------|-------------|
| id | string | Stable identifier. Used as the `itemId` of `objectTitlebarAction` and as the `data-item-id` attribute. |
| isVisible | boolean | Hides the item when `false`. |
| showWhen | 'always' \| 'active' \| 'inactive' | Restricts the item to the active or inactive state. Defaults to `'always'`. |
| minBarWidth | number | Hides the item while the titlebar is narrower than this many screen pixels. |
| part | string | Additional part name for styling the item with `::part()`. |

Buttons support the following additional options:

| Option | Type | Description |
|--------|------|-------------|
| icon | KritzelIconName | Icon shown in the button. |
| label | string | Button text. Localization term keys are translated through the active locale, other strings are used as is. |
| tooltip | string | Tooltip and accessible label. Localization term keys are translated through the active locale. |
| variant | 'ghost' \| 'filled' \| 'outlined' | Visual style of the button. Defaults to `'ghost'`. |
| isDisabled | boolean | Disables the button. Disabled buttons neither call `action` nor emit `objectTitlebarAction`. |
| isPressed | boolean | Shows the button in its pressed state, for example for toggles. |
| action | (context, event) => void | Called when the button is clicked. |

Any titlebar or button icon can be a [default icon](../api-reference/icons.md) such as `play`, `plus`, `settings`, or `download`, or a custom icon registered through the `customSvgIcons` prop.

### Dynamic Values

`text`, `icon`, `isVisible`, `isEditable`, `isDisabled`, and `isPressed` accept either a value or a function that receives the titlebar context and returns the value. Functions are evaluated synchronously on every render, so they must be cheap and must not return a promise. A function that throws or returns a promise falls back to the default value and logs a warning once.

```ts
{ id: 'size', type: 'text', tone: 'muted', text: ({ size }) => `${Math.round(size.width)} × ${Math.round(size.height)}` }
```

The context contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| object | KritzelBaseObject | The object or group the titlebar belongs to. |
| objectType | string | Class name of the object, for example `'KritzelShape'` or `'KritzelGroup'`. |
| children | KritzelBaseObject[] | Children of the group, or an empty array for other objects. |
| isActive | boolean | Whether the object, or something inside its group, is selected. |
| title | string | The resolved title. |
| size | `{ width: number; height: number }` | Unrotated size in world units, including padding. |
| contentSize | `{ width: number; height: number }` | The object's own `width` and `height`, for example the pixel size of a frame. |
| barWidth | number | Width of the titlebar in screen pixels. |
| t | (key, vars?) => string | Translates a localization term key through the active locale. Other strings are returned as is. |

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| left | KritzelTitlebarItem[] | Items of the left section. Defaults to a single `title` item. |
| center | KritzelTitlebarItem[] | Items of the center section. |
| right | KritzelTitlebarItem[] | Items of the right section. |
| visibility | 'always' \| 'active' | Show titlebars always (default) or only while their object is selected. |
| rotation | 'follow' \| 'upright' | Follow the object's rotation (default) or stay upright above its rotated bounding box. |
| title | (object) => string \| undefined | Resolves the title of an object. Falls back to the object's `name`, then to a localized type label. |
| draggable | boolean | Whether dragging a titlebar moves its object. Defaults to `true`. |
| hideBelowWidth | number | Hides titlebars whose object is narrower than this many screen pixels. Defaults to `40`. |

## Renaming Objects

Set `isEditable` on a title item to let users rename objects from their titlebar:

```ts
{ id: 'title', type: 'title', isEditable: true }
```

Renaming works like editing a selected text object: the first click on a titlebar selects its object, and clicking the title of the active titlebar again replaces the title with an input. A click only starts renaming when the object is the only selected object and the pointer did not move, so dragging the titlebar still moves the object.

- **Committing:** Press Enter or click elsewhere to save the new name. Press Escape to keep the old name.
- **Storage:** The trimmed input is stored in the object's `name`, which is persisted and synced. Renaming is a single undo step and emits `objectsUpdated` with `changedProperties: ['name']`.
- **Empty names:** An empty input clears the name, so the title falls back to the default title, such as `Shape` or `Group`.
- **Shortcuts:** While the input has focus, keys such as Delete, Escape, or Ctrl+Z only affect the input, not the canvas.
- **Per object:** `isEditable` also accepts a function of the titlebar context, for example `isEditable: ({ objectType }) => objectType === 'KritzelGroup'`. It defaults to `false`.

A title item with a `text` override cannot be edited. A `title` resolver in the configuration takes precedence over the object's `name`, so a name set by renaming only shows when the resolver returns no title for that object.

## Handling Button Clicks

Every button click emits the `objectTitlebarAction` event, in addition to calling the optional `action` callback of the item. Listen for it with the `onObjectTitlebarAction` prop:

```tsx
<KritzelEditor
  objectTitlebar={objectTitlebar}
  objectConfig={objectConfig}
  onObjectTitlebarAction={(event) => {
    const { itemId, objectId } = event.detail;

    if (itemId === 'preview') {
      setPreviewObjectId(objectId);
    }
  }}
/>
```

The event detail contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| itemId | string | `id` of the clicked button. |
| section | 'left' \| 'center' \| 'right' | Section that contains the button. |
| objectId | string | ID of the object or group the titlebar belongs to. |
| objectType | string | Class name of the object, for example `'KritzelShape'`. |
| workspaceId | string | ID of the workspace that contains the object. |
| anchorRect | DOMRect | Client rect of the clicked button, for example to position a popover. |

You can also handle a click in the `action` callback of the item, which receives the titlebar context and the click event. Because the configuration should keep a stable reference, a callback defined at module level cannot read component state, so prefer `onObjectTitlebarAction` for anything that updates React state:

```ts
const objectTitlebar: KritzelObjectTitlebarConfig = {
  right: [
    {
      id: 'open',
      type: 'button',
      icon: 'chevronRight',
      tooltip: 'Open',
      action: ({ object }) => openObject(object.id),
    },
  ],
};
```

## Behavior

- **Active state:** A titlebar is highlighted while its object, or something inside its group, is selected. Set `visibility: 'active'` to show titlebars only in this state.
- **Selecting and moving:** Pressing a titlebar selects its object, and dragging it moves the object exactly like dragging the object itself, including undo and sync. Holding Shift or Ctrl while pressing toggles the object in the selection. Set `draggable: false` to keep the selection behavior without moving.
- **Buttons:** Clicking a button never changes the selection or starts a drag. Buttons of an active titlebar can be reached with the keyboard.
- **Context menu:** Right-clicking or long-pressing a titlebar opens the object context menu.
- **Text objects:** Clicking the titlebar of a text object selects it without entering edit mode.
- **Drawing tools:** While a drawing tool is active, input passes through the titlebar surface to the canvas, while its buttons stay clickable.
- **Groups:** Children of a group never show their own titlebar. `hasTitlebar` receives the group instead, and the group gets a titlebar only if `hasTitlebar` is `true` for it, so there is at most one titlebar per top-level object or group.
- **Rotation:** By default, titlebars follow the rotated top edge of their object. Set `rotation: 'upright'` to keep them horizontal above the rotated bounding box.
- **Zoom:** Titlebars keep a constant screen size at every zoom level and are hidden while their object is narrower than `hideBelowWidth` screen pixels.
- **Bounds and exports:** Titlebars are never part of an object's bounds, so the selection box stays around the object. They are also excluded from viewport screenshots and exports.

## Styling

Titlebars are styled through the `titlebar` section of `KritzelTheme`. Each property maps to a CSS variable named `--kritzel-titlebar-<property>` in kebab case, for example `--kritzel-titlebar-background-color`.

Because the `themes` prop replaces the registered themes, override titlebar properties by spreading an existing theme and its `titlebar` section. The following example creates a transparent look where the title and buttons float directly above the object:

```tsx
import { KritzelEditor, darkTheme, lightTheme, type KritzelTheme } from '@kritzel/react-editor';

const transparentTitlebar: KritzelTheme['titlebar'] = {
  backgroundColor: 'transparent',
  hoverBackgroundColor: 'transparent',
  activeBackgroundColor: 'transparent',
  offset: '2px',
  paddingX: '0',
};

const transparentLightTheme: KritzelTheme = {
  ...lightTheme,
  titlebar: { ...lightTheme.titlebar, ...transparentTitlebar },
};

const transparentDarkTheme: KritzelTheme = {
  ...darkTheme,
  titlebar: { ...darkTheme.titlebar, ...transparentTitlebar },
};

const themes: KritzelTheme[] = [transparentLightTheme, transparentDarkTheme];

export function TransparentTitlebars() {
  return (
    <KritzelEditor themes={themes} theme="light" objectTitlebar={objectTitlebar} objectConfig={objectConfig} />
  );
}
```

The themes keep the names `light` and `dark` of the themes they spread, so the built-in theme switch keeps working.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/titlebar/styling"
  repoFiles={['src/pages/customization/titlebar/TitlebarStylingPage.tsx']}
/>

### Theme Properties

`height` and `offset` must be pixel values, because they are also used to position titlebars.

| Property | Light default | Dark default | Description |
|----------|---------------|--------------|-------------|
| activeBackgroundColor | #e0efff | #16314c | Background of an active titlebar |
| activeBorder | none | none | Border of an active titlebar |
| activeBoxShadow | none | none | Box shadow of an active titlebar |
| activeButtonFilledBackgroundColor | #007aff | #0a84ff | Background of filled buttons in an active titlebar |
| activeIconColor | #007aff | #4da3ff | Icon color in an active titlebar |
| activeMutedTextColor | rgba(0, 122, 255, 0.6) | rgba(77, 163, 255, 0.6) | Muted text color in an active titlebar |
| activeTextColor | #007aff | #4da3ff | Text color of an active titlebar |
| backgroundColor | #f2f2f2 | #282828 | Background |
| border | none | none | Border |
| borderRadius | 8px | 8px | Corner radius |
| boxShadow | none | none | Box shadow |
| buttonBorderRadius | 6px | 6px | Corner radius of buttons |
| buttonFilledBackgroundColor | #8e8e93 | #636366 | Background of filled buttons |
| buttonFilledColor | #ffffff | #ffffff | Content color of filled buttons |
| buttonHoverBackgroundColor | rgba(0, 0, 0, 0.06) | rgba(255, 255, 255, 0.08) | Background of hovered buttons |
| buttonOutlineColor | currentColor | currentColor | Border color of outlined buttons |
| buttonPressedBackgroundColor | rgba(0, 0, 0, 0.1) | rgba(255, 255, 255, 0.14) | Background of pressed buttons |
| buttonSize | 22px | 22px | Height and minimum width of buttons |
| focusRing | 2px solid #007aff | 2px solid #4da3ff | Outline of focused buttons |
| fontFamily | var(--kritzel-global-font-family, sans-serif) | var(--kritzel-global-font-family, sans-serif) | Font family |
| fontSize | 12px | 12px | Font size |
| fontWeight | 400 | 400 | Font weight of text items |
| gap | 4px | 4px | Space between items |
| height | 28px | 28px | Height of the titlebar |
| hoverBackgroundColor | #ededed | #2f2f2f | Background of a hovered titlebar |
| iconColor | #6b6b6b | #a0a0a0 | Icon color |
| inputBackgroundColor | rgba(255, 255, 255, 0.9) | rgba(255, 255, 255, 0.12) | Background of the input shown while renaming an object |
| inputPadding | 3px 6px | 3px 6px | Padding of the input shown while renaming an object |
| iconSize | 16px | 16px | Icon size |
| mutedTextColor | #9a9a9a | #7a7a7a | Color of muted text items |
| offset | 6px | 6px | Space between the titlebar and its object |
| paddingX | 6px | 6px | Horizontal padding |
| selectionBackgroundColor | #007aff | #007aff | Background of selected text, for example the name selected when renaming starts |
| selectionColor | #ffffff | #ffffff | Color of selected text |
| textColor | #5f5f5f | #b0b0b0 | Text color |
| titleFontWeight | 600 | 600 | Font weight of the title and strong text items |
| transition | background-color 120ms ease, color 120ms ease | background-color 120ms ease, color 120ms ease | Transition of hover and active states |

### Styling with CSS Parts

For styles that theme properties do not cover, titlebars expose parts on `<kritzel-engine>`, the canvas element rendered by `<KritzelEditor>`:

| Part | Element |
|------|---------|
| titlebar | Every titlebar |
| titlebar-active | Active titlebars |
| titlebar-inactive | Inactive titlebars |
| titlebar-left | Left section |
| titlebar-center | Center section |
| titlebar-right | Right section |
| titlebar-title | Title items |
| titlebar-title-input | Input shown while renaming an object |
| titlebar-text | Text items |
| titlebar-icon | Icon items |
| titlebar-button | Buttons |
| titlebar-button-pressed | Pressed buttons |
| titlebar-separator | Separators |

Items with a `part` option additionally expose that part name. Add the rules to a global stylesheet:

```css
kritzel-engine::part(titlebar-title) {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

kritzel-engine::part(preview-button) {
  border-radius: 999px;
}
```

## API Details

For the full list of related APIs, see the following reference sections.

- [Editor](../api-reference/editor.md#object-titlebar)
- [Engine](../api-reference/engine.md#object-titlebar)
- [Objects](../api-reference/objects.md#base-object)
- [Object Configuration](./object-config.md)
- [Theming](../api-reference/theming.md#titlebar)
- [Localization Terms](../api-reference/localization-terms.md#object-type-labels)
- [Object Titlebar Types](../api-reference/types.md#object-titlebar-types)
