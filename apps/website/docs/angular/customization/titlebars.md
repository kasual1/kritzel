---
sidebar_label: Titlebars
displayed_sidebar: tutorialSidebar
title: "Titlebars | Kritzel for Angular"
description: "Render a configurable titlebar above objects with a title, text, icons, and buttons, and style it with theme tokens."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Titlebars

## Overview

A titlebar is an optional bar rendered above an object, similar to the frame labels in design tools. It shows the object's title and can hold additional text, icons, and buttons. Pressing the bar selects its object, and dragging the bar moves the object.

Titlebars are set up in two places:

- The `[objectTitlebar]` binding on `<kritzel-editor>` declares the content of the titlebar. The same configuration applies to every object. Leave it unset to turn titlebars off.
- Each object opts in with `hasTitlebar`. Its `name` is shown as the title.

The following demo renders labeled frames for different screen sizes. Each frame shows a filled preview button, its name, and its width, plus a button to add a breakpoint. The note in the bottom left does not set `hasTitlebar`, so it has no titlebar. The status line shows the last clicked button.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/titlebar/configure"
  repoFiles={['src/app/pages/customization/titlebar/titlebar-configure.component.ts']}
/>

## Enabling Titlebars

Bind a `KritzelObjectTitlebarConfig` to `[objectTitlebar]` and pass `name` and `hasTitlebar` to the objects that should get a titlebar. Both options are accepted by every object constructor through the shared `KritzelObjectCommonConfig`. They are persisted and synced like any other object property.

```ts
import { Component, signal } from '@angular/core';
import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KritzelEditor,
  KritzelObjectTitlebarConfig,
  KritzelShape,
  KritzelWorkspace,
} from '@kritzel/angular-editor';

@Component({
  selector: 'app-frames',
  imports: [KritzelEditor],
  template: `
    <kritzel-editor [workspaces]="workspaces()" [objectTitlebar]="objectTitlebar"></kritzel-editor>
  `,
})
export class FramesComponent {
  readonly objectTitlebar: KritzelObjectTitlebarConfig = KRITZEL_DEFAULT_OBJECT_TITLEBAR;

  workspaces = signal([
    new KritzelWorkspace({
      objects: [
        new KritzelShape({ translateX: 0, translateY: 0, width: 400, height: 240, name: 'Desktop', hasTitlebar: true }),
      ],
    }),
  ]);
}
```

`KRITZEL_DEFAULT_OBJECT_TITLEBAR` is a ready-made preset that shows an icon for the object type followed by the title. An empty configuration (`{}`) shows the title only.

To add or remove a titlebar later, or to rename an object, use `updateObject()`. Like every call to `updateObject()`, this clears the current selection:

```ts
const editor = this.editor();
const [object] = (await editor?.getSelectedObjects()) ?? [];

if (object) {
  await editor?.updateObject(object, { name: 'Hero section', hasTitlebar: true });
}
```

The title is resolved in the following order:

1. The `text` of the `title` item.
2. The `title(object)` resolver of the configuration.
3. The object's `name`.
4. A localized label for the object type, such as `Shape` or `Group` (see the `objectType.*` keys in [Localization Terms](../api-reference/localization-terms.md#object-type-labels)).

## Configuring Items

A titlebar has three sections: `left`, `center`, and `right`. Each section is an array of items that are rendered in order. `left` defaults to a single `title` item, `center` and `right` default to empty.

```ts
readonly objectTitlebar: KritzelObjectTitlebarConfig = {
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

Define the configuration once as a stable component field instead of an inline object in the template.

### Item Types

| Type | Options | Description |
|------|---------|-------------|
| title | text | Shows the resolved title. `text` overrides it for this item. |
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

Any titlebar or button icon can be a [default icon](../api-reference/icons.md) such as `play`, `plus`, `settings`, or `download`, or a custom icon registered through `[customSvgIcons]`.

### Dynamic Values

`text`, `icon`, `isVisible`, `isDisabled`, and `isPressed` accept either a value or a function that receives the titlebar context and returns the value. Functions are evaluated synchronously on every render, so they must be cheap and must not return a promise. A function that throws or returns a promise falls back to the default value and logs a warning once.

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

## Handling Button Clicks

Every button click emits the `objectTitlebarAction` event, in addition to calling the optional `action` callback of the item. Listen for it with the `(objectTitlebarAction)` output:

```html
<kritzel-editor
  [objectTitlebar]="objectTitlebar"
  (objectTitlebarAction)="onTitlebarAction($event)"
></kritzel-editor>
```

```ts
onTitlebarAction(event: CustomEvent<KritzelObjectTitlebarActionEvent>) {
  const { itemId, objectId } = event.detail;

  if (itemId === 'preview') {
    this.previewObjectId.set(objectId);
  }
}
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

The Angular wrapper passes inputs to the editor outside of the Angular zone, so `action` callbacks also run outside of the zone. Prefer the `(objectTitlebarAction)` output, which runs inside the zone, for anything that changes component state. If you use `action` callbacks, wrap state changes in `NgZone.run()`:

```ts
private readonly ngZone = inject(NgZone);

readonly objectTitlebar: KritzelObjectTitlebarConfig = {
  right: [
    {
      id: 'open',
      type: 'button',
      icon: 'chevronRight',
      tooltip: 'Open',
      action: ({ object }) => this.ngZone.run(() => this.openObject(object.id)),
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
- **Groups:** Children of a group never show their own titlebar. Grouping objects where at least one child has a titlebar gives the group a titlebar, so there is one titlebar per top-level object or group.
- **Rotation:** By default, titlebars follow the rotated top edge of their object. Set `rotation: 'upright'` to keep them horizontal above the rotated bounding box.
- **Zoom:** Titlebars keep a constant screen size at every zoom level and are hidden while their object is narrower than `hideBelowWidth` screen pixels.
- **Bounds and exports:** Titlebars are never part of an object's bounds, so the selection box stays around the object. They are also excluded from viewport screenshots and exports.

## Styling

Titlebars are styled through the `titlebar` section of `KritzelTheme`. Each property maps to a CSS variable named `--kritzel-titlebar-<property>` in kebab case, for example `--kritzel-titlebar-background-color`.

Because `[themes]` replaces the registered themes, override titlebar properties by spreading an existing theme and its `titlebar` section. The following example creates a transparent look where the title and buttons float directly above the object:

```ts
import { KritzelTheme, darkTheme, lightTheme } from '@kritzel/angular-editor';

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

themes: KritzelTheme[] = [transparentLightTheme, transparentDarkTheme];
```

```html
<kritzel-editor [themes]="themes" [theme]="'light'" [objectTitlebar]="objectTitlebar"></kritzel-editor>
```

The themes keep the names `light` and `dark` of the themes they spread, so the built-in theme switch keeps working.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/titlebar/styling"
  repoFiles={['src/app/pages/customization/titlebar/titlebar-styling.component.ts']}
/>

### Theme Properties

`height` and `offset` must be pixel values, because they are also used to position titlebars.

| Property | Light default | Dark default | Description |
|----------|---------------|--------------|-------------|
| activeBackgroundColor | rgba(0, 122, 255, 0.12) | rgba(10, 132, 255, 0.22) | Background of an active titlebar |
| activeBorder | none | none | Border of an active titlebar |
| activeBoxShadow | none | none | Box shadow of an active titlebar |
| activeButtonFilledBackgroundColor | #007aff | #0a84ff | Background of filled buttons in an active titlebar |
| activeIconColor | #007aff | #4da3ff | Icon color in an active titlebar |
| activeMutedTextColor | rgba(0, 122, 255, 0.6) | rgba(77, 163, 255, 0.6) | Muted text color in an active titlebar |
| activeTextColor | #007aff | #4da3ff | Text color of an active titlebar |
| backgroundColor | rgba(0, 0, 0, 0.05) | rgba(255, 255, 255, 0.06) | Background |
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
| hoverBackgroundColor | rgba(0, 0, 0, 0.07) | rgba(255, 255, 255, 0.09) | Background of a hovered titlebar |
| iconColor | #6b6b6b | #a0a0a0 | Icon color |
| iconSize | 16px | 16px | Icon size |
| mutedTextColor | #9a9a9a | #7a7a7a | Color of muted text items |
| offset | 6px | 6px | Space between the titlebar and its object |
| paddingX | 6px | 6px | Horizontal padding |
| textColor | #5f5f5f | #b0b0b0 | Text color |
| titleFontWeight | 600 | 600 | Font weight of the title and strong text items |
| transition | background-color 120ms ease, color 120ms ease | background-color 120ms ease, color 120ms ease | Transition of hover and active states |

### Styling with CSS Parts

For styles that theme properties do not cover, titlebars expose parts on `<kritzel-engine>`:

| Part | Element |
|------|---------|
| titlebar | Every titlebar |
| titlebar-active | Active titlebars |
| titlebar-inactive | Inactive titlebars |
| titlebar-left | Left section |
| titlebar-center | Center section |
| titlebar-right | Right section |
| titlebar-title | Title items |
| titlebar-text | Text items |
| titlebar-icon | Icon items |
| titlebar-button | Buttons |
| titlebar-button-pressed | Pressed buttons |
| titlebar-separator | Separators |

Items with a `part` option additionally expose that part name. Add the rules to a global stylesheet such as `styles.css`, because `<kritzel-engine>` is created by the editor and is not affected by Angular's component style encapsulation:

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
- [Theming](../api-reference/theming.md#titlebar)
- [Localization Terms](../api-reference/localization-terms.md#object-type-labels)
