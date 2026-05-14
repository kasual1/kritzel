---
sidebar_label: Overview
title: "Overview | Kritzel for Angular"
description: Build infinite canvas and collaborative whiteboard experiences in Angular with Kritzel's native wrapper and TypeScript-first API.
keywords:
  - angular whiteboard
  - angular infinite canvas
  - kritzel
  - collaborative canvas
  - drawing tools
---

# Overview

Kritzel is a framework-agnostic infinite canvas and collaborative whiteboard engine. It provides web components that work natively in any framework — with first-class wrappers for React, Vue, and Angular.

## Key Features

- **Infinite canvas** — unlimited pan and zoom with configurable viewport boundaries
- **Drawing tools** — brush, line, shape, text, image, and eraser tools out of the box
- **Selection & manipulation** — select, move, resize, rotate, group, align, and reorder objects
- **Real-time collaboration** — Yjs-based sync with pluggable providers (IndexedDB, BroadcastChannel, WebSocket, Hocuspocus)
- **Workspaces** — multiple canvases within a single instance with workspace switching
- **Undo / redo** — full undo/redo stack backed by Yjs
- **Theming** — built-in light and dark themes with full CSS variable customization
- **Export** — capture viewport as PNG or SVG
- **Multi-framework** — native web components with React, Vue, and Angular wrappers

## Architecture

```mermaid
graph TD
  classDef default fill:#ffe6e6,stroke:darkred,stroke-width:2px,color:#333,rx:5px,ry:5px;
  App["Your Application"]
  Editor["&lt;kritzel-editor&gt;<br/><small>High-level: toolbar + engine + panels</small>"]
  Engine["&lt;kritzel-engine&gt;<br/><small>Low-level canvas primitive</small>"]
  Core["KritzelCore<br/><small>Orchestrator</small>"]
  Store["KritzelStore<br/><small>Reactive state</small>"]
  ObjectMap["KritzelObjectMap<br/><small>Yjs Y.Map + QuadTree</small>"]
  Tools["Tools<br/><small>Brush, Line, Shape, Text, Image, Eraser, Selection</small>"]
  Objects["Objects<br/><small>Path, Line, Shape, Text, Image, Group</small>"]
  Sync["Sync Providers<br/><small>IndexedDB, BroadcastChannel, WebSocket, Hocuspocus</small>"]

  App --> Editor
  Editor --> Engine
  Engine -...->|"Internal API Boundary"| Core
  Core --> Store
  Core --> Tools
  Store --> ObjectMap
  ObjectMap --> Objects
  ObjectMap --> Sync
```

Most applications should use `<kritzel-editor>`, which bundles the canvas engine together with a toolbar, utility panel, context menus, and settings. Use `<kritzel-engine>` directly when you need full control over the UI and want to build your own toolbar and panels.

