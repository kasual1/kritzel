---
sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor Concept | Kritzel for Angular"
description: "Understand the Kritzel Editor component, a batteries-included whiteboard UI."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Editor

## Overview

The `<kritzel-editor>` is a high-level, "batteries-included" component providing a complete whiteboard UI, including toolbars, utility panels, context menus, and settings dialogs. It shares its entire programmatic API (asynchronous methods returning Promises for managing state, viewports, tools, and objects) with its headless sibling, the [Engine](./engine.md), so the two are interchangeable at the API level and differ only in built-in UI chrome.

## Basic Initialization

The basic implementation of the Editor requires zero configuration. You simply drop the tag into your template, and a fully functional whiteboard will render to fit its container.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/editor"
  repoFiles={['src/app/fundamentals/components/components-editor.component.ts']}
/>

## Waiting for Initialization

Because Kritzel performs asynchronous setup tasks internally (such as instantiating canvas elements and syncing state), you must wait for the `(isReady)` event before calling programmatic API methods. Bind the event in your template:

```html
<kritzel-editor (isReady)="onEditorReady($event)"></kritzel-editor>
```

Then, in your component controller, you can safely interact with the Editor's API once the handler fires:

```typescript
import { Component } from '@angular/core';

@Component({ ... })
export class MyComponent {
  onEditorReady(event: Event) {
    // It's now safe to call API methods like addWorkspace(), registerTool(), etc.
    const editor = event.target as HTMLKritzelEditorElement;
    editor.setViewport({ pan: { x: 0, y: 0 }, zoom: 1 });
  }
}
```

## Customizing the Editor UI

Beyond toggling whole panels, the Editor exposes two independent customization surfaces: simple visibility flags for its built-in chrome, and fully custom context menus for canvas and object interactions.

### Toggling Built-in UI Chrome

You can toggle visibility for built-in UI components using the Editor's attributes. For example, setting `isWorkspaceManagerVisible` and `isMoreMenuVisible` to false will not render the workspace manager at the top left nor the more menu at the top right, giving you a more minimal interface while retaining all core whiteboard functionality. `isToolbarVisible` and `isUtilityPanelVisible` work the same way for the tool toolbar and the utility panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/editor-ui"
  repoFiles={['src/app/fundamentals/components/components-editor-ui.component.ts']}
/>

### Configuring Context Menus

The Editor separates right-click actions into two arrays: `globalContextMenuItems` for empty-canvas interactions, and `objectContextMenuItems` for selected-object interactions. Each item accepts a `label`, an `icon`, an `action` handler, and optional `visible`/`disabled` conditions so entries can react to editor state, plus `group` and `children` for grouping and nested submenus.

```ts
editor.globalContextMenuItems = [
  { label: 'Export as PNG', icon: 'export', action: () => editor.exportAsPng() },
];
```

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/context-menus-canvas-quick-actions"
  repoFiles={['src/app/fundamentals/components/context-menus-canvas-quick-actions.component.ts']}
/>

## User Management

Kritzel ships a presentational login dialog (`kritzel-login-dialog`) that is rendered by `<kritzel-editor>` as soon as a `[loginConfig]` is supplied. The dialog only displays provider buttons and emits events - the actual authentication is always performed by your application.

Providing a `loginConfig` has two effects: a **Sign in** button appears in the editor header while no authenticated user is set, and features that require an account (such as sharing a workspace) open the dialog instead of failing.

The configuration object has the following shape:

```ts
interface KritzelLoginConfig {
  providers: KritzelLoginProvider[];
  title?: string;
  subtitle?: string;
}

interface KritzelLoginProvider {
  name: string;   // machine identifier emitted in the login event
  label: string;  // button text
  icon?: string;  // icon name registered via customSvgIcons
}
```

### Configuring Providers

Every entry in `providers` becomes one button in the dialog, in declaration order. The `name` is the identifier your application receives when the button is clicked, while `label` controls the visible text. The optional `icon` references a name resolved through the shared `KritzelIconRegistry`, so provider marks are registered with the `[customSvgIcons]` binding just like any other custom icon.

`title` and `subtitle` override the localized defaults of the dialog header. When `title` is omitted, the active locale's `login.dialogTitle` term is used.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/user-management-providers"
  repoFiles={['src/app/fundamentals/components/user-management-providers.component.ts']}
/>

### Handling the Login Flow

Clicking a provider button puts that button into a loading state and emits the editor's `(login)` output with a `LoginEvent` containing the provider `name`. Your application performs the sign-in and then reports the result back to the editor:

- Call `setLoginLoading(provider)` while authentication is pending and `setLoginLoading(null)` when it settles.
- Set the `[user]` binding to an `IKritzelUser` once authentication succeeds. A user with `isGuest: false` replaces the Sign in button with the current-user avatar.
- Handle the `(logout)` output to clear the user again.
- Call `openLoginDialog()` to open the dialog from your own UI, for example from an application menu.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/user-management-flow"
  repoFiles={['src/app/fundamentals/components/user-management-flow.component.ts']}
/>

## Related API Methods

- Tool registration and selection ([registerTool](../../api-reference/editor.md#registertool), [changeActiveTool](../../api-reference/editor.md#changeactivetool))
- Viewport and boundaries ([viewportBoundaryLeft](../../api-reference/editor.md#props), [viewportBoundaryRight](../../api-reference/editor.md#props), [scaleMin](../../api-reference/editor.md#props), [scaleMax](../../api-reference/editor.md#props))
- Theme management ([theme](../../api-reference/editor.md#props) property)
- Context menu configuration ([globalContextMenuItems](../../api-reference/editor.md#props), [objectContextMenuItems](../../api-reference/editor.md#props))
- Editor-only UI options ([isToolbarVisible](../../api-reference/editor.md#props), [isUtilityPanelVisible](../../api-reference/editor.md#props), [isWorkspaceManagerVisible](../../api-reference/editor.md#props), [isMoreMenuVisible](../../api-reference/editor.md#props))
- User management configuration ([loginConfig](../../api-reference/editor.md#props), `KritzelLoginConfig`, `KritzelLoginProvider`)
- User management icons and state ([customSvgIcons](../../api-reference/editor.md#props), [user](../../api-reference/editor.md#props), `KritzelIconRegistry`, `IKritzelUser`)
- User management events and methods ([login](../../api-reference/editor.md#events), [logout](../../api-reference/editor.md#events), [openLoginDialog](../../api-reference/editor.md#openlogindialog), [setLoginLoading](../../api-reference/editor.md#setloginloading), `LoginEvent`)

For a comprehensive view, see the [API Reference](../../api-reference/editor.md).
