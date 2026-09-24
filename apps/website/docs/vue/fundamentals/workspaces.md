---
sidebar_label: Workspaces
displayed_sidebar: tutorialSidebar
title: "Workspaces Concept | Kritzel for Vue"
description: "Understand the core concept of Workspaces in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Workspaces

## Overview

A workspace is the container of the current canvas and stores its objects, viewport, and configuration. Only the active workspace is displayed and changed as the user interacts with the editor. This lets a single editor manage multiple independent canvases, similar to pages or documents.

Workspaces can either be created programmatically or managed through the built-in [workspace manager](./controls.md#workspace-manager).

## Creating Workspaces

Workspaces can be created by instantiating a `KritzelWorkspace` object and passing it to `editor.value.createWorkspace()`. You can specify custom properties such as the workspace `name`, initial canvas `viewport` settings, or a custom `id`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/workspaces/create"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesCreatePage.vue']}
/>

## Reading Workspaces

Use `getWorkspaces()` to retrieve the complete workspace collection and `getActiveWorkspace()` when you only need the workspace currently shown in the editor. Both methods return workspace metadata such as the ID, name, visibility, and timestamps.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/workspaces/read"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesReadPage.vue']}
/>

## Updating Workspaces

Pass a workspace to `updateWorkspace()` describing how you want it to look. Name, visibility and viewport are applied, and if you set `objects` it becomes the workspace's complete object set — objects are matched by ID, so new entries are added, existing ones are updated, and anything you leave out is removed. Leave `objects` `undefined` (the default) to change metadata only, or pass `[]` to clear the canvas.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/workspaces/update"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesUpdatePage.vue']}
/>

## Deleting Workspaces

Call `deleteWorkspace()` with the workspace to remove. Keep at least one workspace available for the user and choose another active workspace before deleting the current one. The `workspacesChange` event lets custom navigation refresh whenever the collection changes.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/workspaces/delete"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesDeletePage.vue']}
/>

## Switching Workspaces

By default, Kritzel provides a built-in UI for managing multiple workspaces. However, if you hide this UI (`:isWorkspaceManagerVisible="false"`), you can programmatically build your own workspace navigation. `<KritzelEditor>` exposes an `activeWorkspaceId` prop and an `activeWorkspaceChange` event that make switching between canvases seamless.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/vue"
  demoPath="/fundamentals/workspaces/switch"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesSwitchPage.vue']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Workspace](../api-reference/editor.md#workspace)