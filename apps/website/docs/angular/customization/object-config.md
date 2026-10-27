---
sidebar_label: Object Configuration
displayed_sidebar: tutorialSidebar
title: "Object Configuration | Kritzel for Angular"
description: "Configure in one place which objects get a titlebar and which objects can be rotated or resized, using the objectConfig prop in Angular."
toc_badges:
  configuring-objects: Preview
---

# Object Configuration

## Overview

The `objectConfig` prop configures how objects behave, in one place for all objects: which objects get a titlebar, and which objects can be rotated or resized. Each option is either a boolean that applies to every object, or a function that receives an object and decides for that object.

The `objectConfig` prop is local configuration of your app. It is neither persisted nor synced, so every client decides for itself. It is not related to the options passed to object constructors, such as `KritzelShapeConfig` (see [Common Constructor Options](../api-reference/objects.md#common-constructor-options)).

## Configuring Objects

Bind a `KritzelObjectConfig` to the `objectConfig` prop with `[objectConfig]`. The following example gives named objects a titlebar, prevents rotating text, and prevents resizing images:

```ts
import { Component, signal } from '@angular/core';
import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KritzelEditor,
  KritzelObjectConfig,
  KritzelShape,
  KritzelWorkspace,
} from '@kritzel/angular-editor';

@Component({
  selector: 'app-board',
  imports: [KritzelEditor],
  template: `
    <kritzel-editor
      [workspaces]="workspaces()"
      [objectTitlebar]="objectTitlebar"
      [objectConfig]="objectConfig"
    ></kritzel-editor>
  `,
})
export class BoardComponent {
  readonly objectTitlebar = KRITZEL_DEFAULT_OBJECT_TITLEBAR;

  readonly objectConfig: KritzelObjectConfig = {
    hasTitlebar: object => !!object.name,
    isRotatable: object => object.__class__ !== 'KritzelText',
    isResizable: object => object.__class__ !== 'KritzelImage',
  };

  workspaces = signal([
    new KritzelWorkspace({
      objects: [
        new KritzelShape({ translateX: 0, translateY: 0, width: 400, height: 240, name: 'Desktop' }),
      ],
    }),
  ]);
}
```

Define the configuration once as a stable component field instead of an inline object in the template. `hasTitlebar` only decides which objects get a titlebar. The content of the titlebars is declared by the `objectTitlebar` prop, so titlebars require both props. See [Titlebars](./titlebars.md).

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| hasTitlebar | boolean \| (object) => boolean | `false` | Whether an object gets a titlebar. Requires the `objectTitlebar` prop. Objects inside a group never get their own titlebar. See [Choosing Which Objects Get a Titlebar](./titlebars.md#choosing-which-objects-get-a-titlebar). |
| isRotatable | boolean \| (object) => boolean | `true` | Whether an object can be rotated. Combines with the object's own `isRotatable` flag. |
| isResizable | boolean \| (object) => boolean | `true` | Whether an object can be resized. Combines with the object's own `isResizable` flag. |

An option that is not set uses its default. If the `objectTitlebar` prop is set but `hasTitlebar` is not, no titlebars are rendered, and the editor logs a hint to the console once.

When an object cannot be rotated or resized, the editor hides its rotation or resize handles, and the gesture does not start.

## Values

Every option accepts a boolean or a function:

- **Boolean:** Applies to every object. For example, `hasTitlebar: true` gives every object a titlebar, and `isResizable: false` prevents resizing any object.
- **Function:** Receives an object and returns `true` or `false` for it.

Keep the following in mind when writing a function:

- **Synchronous and cheap:** Functions are called while the editor renders and handles input. `hasTitlebar`, for example, is called for every visible top-level object on every render. Do not fetch data or return a promise. Compute what you need beforehand and read it in the function.
- **Failures:** A function that throws or returns a promise resolves to the option's default and logs a warning once. A failing `isRotatable` or `isResizable` function therefore allows the gesture, and a failing `hasTitlebar` function shows no titlebar.
- **Return values:** Only booleans count. Any other return value, such as `undefined`, also resolves to the option's default.

## Combining with Object Flags

Every object also has its own `isRotatable` and `isResizable` flags, which both default to `true` (see [Objects](../api-reference/objects.md#base-object)). The flags and the `objectConfig` prop serve different purposes:

| | Object flags | `objectConfig` prop |
|---|---|---|
| Scope | A single object | All objects, decided per object by your app |
| Storage | Persisted and synced with the object | Local app configuration, neither persisted nor synced |
| Typical use | Lock a particular object for every client | Rules of your app, for example by object type or user role |

An object can only be rotated when both its own `isRotatable` flag and the `isRotatable` option allow it. Resizing works the same way. Either one can forbid the gesture, and neither can override a `false` from the other.

To lock a single object, set its flags before adding it:

```ts
const frame = new KritzelShape({ translateX: 0, translateY: 0, width: 400, height: 240, name: 'Desktop' });
frame.isRotatable = false;
frame.isResizable = false;
```

To lock an existing object, use `updateObject()`. Like every call to `updateObject()`, this clears the current selection:

```ts
const editor = this.editor();
const [object] = (await editor?.getSelectedObjects()) ?? [];

if (object) {
  await editor?.updateObject(object, { isRotatable: false, isResizable: false });
}
```

## Groups and Multi-Selection

A group is rotated and resized together with everything inside it. A group can therefore only be rotated when the group itself and every object inside it, including the objects of nested groups, can be rotated. Each of these objects is checked against its own flag and the `isRotatable` option. Resizing follows the same rule with `isResizable`.

A selection of several objects follows the same rule: it can only be rotated or resized when every selected object, and everything inside selected groups, allows it. A single locked object hides the handle for the whole selection.

`hasTitlebar` works differently: objects inside a group never get their own titlebar. The function receives the group instead, and the group gets a titlebar only if it returns `true` for it.

## Choosing Objects by Type

To decide by object type, compare `object.__class__`, for example `'KritzelGroup'`, `'KritzelShape'`, `'KritzelText'`, `'KritzelImage'`, `'KritzelPath'`, `'KritzelLine'`, `'KritzelIframeObject'`, or `'KritzelDynamicObject'`. Do not use `instanceof`, which fails when the app bundles more than one copy of the engine.

To inspect the children of a group, check `__class__` first and then cast the object to `KritzelGroup`. Prefer `childIds` over the `children` getter, which looks up every child in the store:

```ts
import { KritzelGroup, KritzelObjectConfig } from '@kritzel/angular-editor';

readonly objectConfig: KritzelObjectConfig = {
  // Groups with more than one object and shapes get a titlebar.
  hasTitlebar: object =>
    (object.__class__ === 'KritzelGroup' && (object as KritzelGroup).childIds.length > 1) ||
    object.__class__ === 'KritzelShape',
  // Images and iframes keep their size.
  isResizable: object => object.__class__ !== 'KritzelImage' && object.__class__ !== 'KritzelIframeObject',
};
```

## Updating at Runtime

The editor reads the `objectConfig` prop live, and it rerenders when it receives a new configuration object. To change the configuration, pass a new object instead of mutating the current one. In Angular, keep the state in a signal and derive the configuration with `computed()`, so that every change produces a new object:

```ts
import { Component, computed, signal } from '@angular/core';
import { KritzelEditor, KritzelObjectConfig } from '@kritzel/angular-editor';

@Component({
  selector: 'app-lockable-board',
  imports: [KritzelEditor],
  template: `
    <button (click)="isLocked.set(!isLocked())">{{ isLocked() ? 'Unlock' : 'Lock' }}</button>
    <kritzel-editor [objectConfig]="objectConfig()"></kritzel-editor>
  `,
})
export class LockableBoardComponent {
  readonly isLocked = signal(false);

  readonly objectConfig = computed<KritzelObjectConfig>(() => ({
    isRotatable: !this.isLocked(),
    isResizable: !this.isLocked(),
  }));
}
```

The same pattern lets you toggle titlebars per object, see [Toggling Titlebars per Object](./titlebars.md#toggling-titlebars-per-object).

## Limitations

- **Line endpoints:** Dragging the endpoints of a line is not controlled by `isResizable`. Lines stay editable through their endpoints even when they cannot be resized.
- **Programmatic changes:** The options only control the handles and gestures of the editor. API calls such as `updateObject()` are not affected, so your app can still rotate and resize every object.
- **Local configuration:** Because the `objectConfig` prop is neither persisted nor synced, collaborators whose app uses a different configuration are not restricted by yours. Set the object flags for restrictions that should apply on every client.

## API Details

For the full list of related APIs, see the following reference sections.

- [Editor](../api-reference/editor.md#object)
- [Engine](../api-reference/engine.md#object)
- [Objects](../api-reference/objects.md#base-object)
- [Titlebars](./titlebars.md)
