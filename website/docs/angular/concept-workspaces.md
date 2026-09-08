---
sidebar_label: Workspaces
displayed_sidebar: tutorialSidebar
title: "Workspaces Concept | Kritzel for Angular"
description: "Understand the core concept of Workspaces in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Workspaces

## Overview

A Workspace in Kritzel is essentially a container for the user's canvas and its corresponding state. While an Object represents a single visual element on the canvas (like a shape or a text box), a Workspace contains the entire collection of objects, the current view transformation (zoom and pan), and the configuration of the canvas itself.

When a user interacts with the canvas, they are making changes within the active workspace. Kritzel's state machine manages everything inside a workspace as a unified whole. You can think of a Workspace as a complete document or page.

Workspaces are the fundamental unit for real-time collaboration. When multiple users collaborate, they synchronize the state of a shared workspace, ensuring everyone sees the exact same objects in the same locations.

## Switching Between Workspaces

By default, Kritzel provides a built-in UI for managing multiple workspaces. However, if you hide this UI (`hideWorkspaceManager`), you can programmatically build your own workspace navigation. The `<kritzel-editor>` exposes an `[activeWorkspaceId]` input and an `(activeWorkspaceChange)` output binding that make switching between canvases seamless.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/workspaces-switch"
  repoFiles={['src/app/concepts/workspaces/workspaces-switch.component.ts']}
/>

## Managing Workspaces (Create, Read, Update, Delete)

Kritzel allows you to fully manage the lifecycle of workspaces. You can create new blank canvases, update their metadata (like custom names), or delete them entirely via the editor's asynchronous workspace API (`createWorkspace()`, `updateWorkspace()`, `deleteWorkspace()`). The component emits `(workspacesChange)` whenever the overall collection updates, so your custom UI stays perfectly in sync.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/concepts/workspaces-crud"
  repoFiles={['src/app/concepts/workspaces/workspaces-crud.component.ts']}
/>

## Related API Methods

- Getting workspace state ([getWorkspaces](api-reference-editor.md#getworkspaces), [getActiveWorkspace](api-reference-editor.md#getactiveworkspace))
- Modifying workspaces ([createWorkspace](api-reference-editor.md#createworkspace), [updateWorkspace](api-reference-editor.md#updateworkspace), [deleteWorkspace](api-reference-editor.md#deleteworkspace))
- Component integration bindings ([activeWorkspaceId](api-reference-editor.md#props), [activeWorkspaceChange](api-reference-editor.md#events))

For a comprehensive view, see the [API Reference](api-reference-editor.md).
