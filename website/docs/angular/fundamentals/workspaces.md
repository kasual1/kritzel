---
sidebar_label: Workspaces
displayed_sidebar: tutorialSidebar
title: "Workspaces Concept | Kritzel for Angular"
description: "Understand the core concept of Workspaces in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Workspaces

## Overview

A workspace is the container of the current canvas and stores its objects, viewport, and configuration. Only the active workspace is displayed and changed as the user interacts with the editor. This lets a single editor manage multiple independent canvases, similar to pages or documents.

Workspaces can either be created programmatically or managed through the built-in [workspace manager](./controls.md#workspace-manager).

## Creating Workspaces

Workspaces can be created by passing a `KritzelWorkspaceConfig` options object (or an existing `KritzelWorkspace` instance) to `editor.createWorkspace()`. You can specify initial canvas `objects`, custom `viewport` settings, and set `activate: true` to automatically switch to the new workspace upon creation.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/workspaces/create"
  repoFiles={['src/app/pages/fundamentals/workspaces/workspaces-create.component.ts']}
/>

## Reading Workspaces

Use `getWorkspaces()` to retrieve the complete workspace collection and `getActiveWorkspace()` when you only need the workspace currently shown in the editor. Both methods return workspace metadata such as the ID, name, visibility, and timestamps.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/workspaces/read"
  repoFiles={['src/app/pages/fundamentals/workspaces/workspaces-read.component.ts']}
/>

## Updating Workspaces

Workspace metadata can be changed with `updateWorkspace()`. Clone the current workspace before modifying it so Angular and Kritzel receive a new object reference, then pass the updated workspace back to the editor. The demo renames the active workspace.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/workspaces/update"
  repoFiles={['src/app/pages/fundamentals/workspaces/workspaces-update.component.ts']}
/>

## Deleting Workspaces

Call `deleteWorkspace()` with the workspace to remove. Keep at least one workspace available for the user and choose another active workspace before deleting the current one. The `(workspacesChange)` event lets custom navigation refresh whenever the collection changes.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/workspaces/delete"
  repoFiles={['src/app/pages/fundamentals/workspaces/workspaces-delete.component.ts']}
/>

## Switching Workspaces

By default, Kritzel provides a built-in UI for managing multiple workspaces. However, if you hide this UI (`hideWorkspaceManager`), you can programmatically build your own workspace navigation. The `<kritzel-editor>` exposes an `[activeWorkspaceId]` input and an `(activeWorkspaceChange)` output binding that make switching between canvases seamless.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/workspaces/switch"
  repoFiles={['src/app/pages/fundamentals/workspaces/workspaces-switch.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Workspace](../api-reference/editor.md#workspace)
