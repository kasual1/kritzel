---

sidebar_label: Workspaces
displayed_sidebar: tutorialSidebar
title: "Workspaces | Kritzel for Vue"
description: "Manage canvases, persistence, and state with Kritzel workspaces in Vue."
---

# Workspaces in Kritzel

A Workspace in Kritzel is essentially a container for the user's canvas and its corresponding state. 

## Understanding Workspaces

While an **Object** represents a single visual element on the canvas (like a shape or a text box), a **Workspace** contains the entire collection of objects, the current view transformation (zoom and pan), and the configuration of the canvas itself.

When a user interacts with the canvas, they are making changes within the active workspace. Kritzel's state machine manages everything inside a workspace as a unified whole.

## Interacting with Workspaces

You can think of a Workspace as a complete document. The workspace defines the boundaries (if any) and holds all the content that the tools manipulate.

It interacts seamlessly with the rest of Kritzel:
- Tools modify the objects inside the active workspace.
- The Engine renders the objects contained in the workspace.
- When saving or loading data, you are generally saving or loading the state of a specific workspace.

## Collaboration

Workspaces are the fundamental unit for real-time collaboration. When multiple users collaborate, they synchronize the state of a shared workspace, ensuring everyone sees the exact same objects in the same locations.
