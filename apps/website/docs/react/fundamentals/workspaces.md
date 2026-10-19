---
sidebar_label: Workspaces
displayed_sidebar: tutorialSidebar
title: "Workspaces Concept | Kritzel for React"
description: "Understand the core concept of Workspaces in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Workspaces

## Overview

A workspace is the container of the current canvas and stores its objects, viewport, and configuration. Only the active workspace is displayed and changed as the user interacts with the editor. This lets a single editor manage multiple independent canvases, similar to pages or documents.

Workspaces can either be created programmatically or managed through the built-in [workspace manager](./controls.md).

## Creating Workspaces

Workspaces can be created by instantiating a `KritzelWorkspace` object and passing it to the asynchronous `editor.createWorkspace()` method. You can specify custom properties such as the workspace `name`, initial canvas `viewport` settings, or a custom `id`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/workspaces/create"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesCreatePage.tsx']}
/>

## Reading Workspaces

Use the asynchronous `getWorkspaces()` method to retrieve the complete workspace collection and `getActiveWorkspace()` when you only need the workspace currently shown in the editor. Both methods return workspace metadata such as the ID, name, visibility, and timestamps.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/workspaces/read"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesReadPage.tsx']}
/>

## Updating Workspaces

Pass a workspace to the asynchronous `updateWorkspace()` method describing how you want it to look. Name, visibility, and viewport are applied, and if you set `objects` it becomes the workspace's complete object set. Objects are matched by ID, so new entries are added, existing ones are updated, and anything you leave out is removed. Leave `objects` `undefined` (the default) to change metadata only, or pass `[]` to clear the canvas.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/workspaces/update"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesUpdatePage.tsx']}
/>

## Deleting Workspaces

Call the asynchronous `deleteWorkspace()` method with the workspace to remove. Keep at least one workspace available for the user and choose another active workspace before deleting the current one. After deletion, update the React state that drives your custom workspace navigation.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/workspaces/delete"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesDeletePage.tsx']}
/>

## Switching Workspaces

By default, Kritzel provides a built-in UI for managing multiple workspaces. However, if you hide this UI with `isWorkspaceManagerVisible={false}`, you can build your own workspace navigation. `<KritzelEditor>` exposes an `activeWorkspaceId` prop and an `onActiveWorkspaceChange` callback that make switching between canvases seamless. The imperative `setActiveWorkspace()` method is asynchronous when you need to switch through a ref.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/workspaces/switch"
  repoFiles={['src/pages/fundamentals/workspaces/WorkspacesSwitchPage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Workspace](../api-reference/editor.md#workspace)