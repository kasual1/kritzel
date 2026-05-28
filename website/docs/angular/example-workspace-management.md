---
sidebar_label: Workspace Management
displayed_sidebar: tutorialSidebar
title: "Workspace Management Example | Kritzel for Angular"
description: "Manage multiple workspaces with a tab bar, full CRUD controls, or URL-synced deep linking — each example is self-contained and ready to copy."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Workspace Management

This page shows how to manage multiple workspaces programmatically — from a simple tab bar to a full CRUD panel to URL-routed deep linking. Each example is self-contained and ready to copy into your project.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Workspaces Work

A workspace is described by the `KritzelWorkspace` class:

```ts
class KritzelWorkspace {
  id: string;        // unique identifier
  name: string;      // display name shown in the UI
  createdAt: Date;
  updatedAt: Date;
  viewport: {
    centerWorldX: number;  // saved pan position (X)
    centerWorldY: number;  // saved pan position (Y)
    scale: number;         // saved zoom level
  };
  isPublic: boolean; // whether the workspace is accessible via a share link
}
```

The editor always has one active workspace. The `activeWorkspaceId` input prop drives which workspace is loaded; changing it switches the canvas. The `activeWorkspaceChange` event fires whenever the active workspace changes, carrying the new workspace's metadata.

The four CRUD methods — `createWorkspace`, `getWorkspaces`, `updateWorkspace`, `deleteWorkspace` — operate on the persisted list. Because the `<kritzel-editor>` element does not re-emit a `workspacesChange` event, call `getWorkspaces()` to refresh the list after any mutation.

---

## Workspace Tab Bar

A read-only tab bar that lists all persisted workspaces and lets the user switch between them by clicking a tab. The active tab highlights automatically.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/workspace-management-tab-bar"
  repoFiles={['src/app/examples/workspace-management/workspace-management-tab-bar.component.ts']}
/>

`isReady` fires once the engine has fully initialised and all persisted workspaces have been loaded. Reading `getWorkspaces()` inside this handler guarantees the list is complete before the first render. Setting `activeWorkspaceId` to a new value causes the editor to load the matching workspace and fire `activeWorkspaceChange` to confirm the switch.

---

## Workspace CRUD Panel

A production-ready tab bar with create, rename, and delete actions. New workspaces open immediately after creation; the delete button is disabled when only one workspace remains to prevent an empty-state scenario.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/workspace-management-crud-panel"
  repoFiles={['src/app/examples/workspace-management/workspace-management-crud-panel.component.ts']}
/>

`createWorkspace` persists a new `KritzelWorkspace` instance — construct it with `new KritzelWorkspace(id, name)`. `updateWorkspace` persists any property changes (here the `name`). `deleteWorkspace` removes a workspace but does not auto-switch, so the component redirects to the first remaining workspace when the active one is deleted. After every mutation, call `getWorkspaces()` to refresh the local list.

---

## URL-Synced Workspace Switcher

Sync the active workspace ID with the Angular Router so users can bookmark or share a direct link to a specific workspace. If the URL contains a workspace ID on load, that workspace opens automatically; otherwise the editor's default workspace is used and the URL updates to match.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/workspace-management-url-synced"
  repoFiles={['src/app/examples/workspace-management/workspace-management-url-synced.component.ts']}
/>

The route is configured with an optional `:workspaceId` param. On init the component reads the param from the snapshot; inside `onReady` it falls back to `event.detail.activeWorkspace.id` when no param is present. Every workspace switch calls `router.navigate` with `replaceUrl: true` to keep the URL in sync without polluting browser history.
