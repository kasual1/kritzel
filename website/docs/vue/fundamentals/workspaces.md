---
sidebar_label: Workspaces
displayed_sidebar: tutorialSidebar
title: "Workspaces Concept | Kritzel for Vue"
description: "Understand the core concept of Workspaces in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Workspaces

## Overview

A Workspace in Kritzel is essentially a container for the canvas and its corresponding state. While an Object represents a single visual element on the canvas (like a shape or text block), a Workspace contains the entire collection of objects, the current view transformation (zoom and pan), and the configuration of the canvas itself.

When a user interacts with the canvas, they are making changes within the active workspace. Kritzel's state machine manages everything inside a workspace as a unified whole. You can think of a Workspace as a complete document or page.

Workspaces are the fundamental unit for real-time collaboration. When multiple users collaborate, they synchronize the state of a shared workspace, ensuring everyone sees the exact same objects in the same locations.

## Switching Between Workspaces

By default, Kritzel provides a built-in UI for managing multiple workspaces. However, if you hide this UI (`:isWorkspaceManagerVisible="false"`), you can programmatically build your own workspace navigation. `<KritzelEditor>` exposes an `activeWorkspaceId` prop and an `activeWorkspaceChange` event that make switching between canvases seamless.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/workspaces-switch"
  repoFiles={['src/pages/fundamentals/workspaces/workspaces-switch.vue']}
/>

## Managing Workspaces (Create, Read, Update, Delete)

Kritzel allows you to fully manage the lifecycle of workspaces. You can create new blank canvases, update metadata (like custom names), or delete them entirely via the editor's asynchronous workspace API (`createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`). The component emits changes whenever the overall collection updates, so your custom UI stays in sync.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/fundamentals/workspaces-crud"
  repoFiles={['src/pages/fundamentals/workspaces/workspaces-crud.vue']}
/>

## Related API Methods

- Getting workspace state (`getWorkspaces()`, `getActiveWorkspace()`)
- Modifying workspaces (`createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`)
- Component integration props and events (`activeWorkspaceId`, `activeWorkspaceChange`, `workspacesChange`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).