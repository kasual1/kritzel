---
sidebar_label: Import/Export
displayed_sidebar: tutorialSidebar
title: "Import/Export Concept | Kritzel for Angular"
description: "Understand how to programmatically export the viewport as PNG or SVG, export the workspace as JSON, and import a workspace from JSON in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Import/Export

## Overview

Kritzel exposes editor and engine methods for moving data in and out of a workspace without going through the built-in export/import menu. You can trigger a PNG or SVG download of the current viewport, obtain the entire workspace as a JSON string, and feed a JSON string back in to recreate a workspace — all from your own application code.

Two surfaces expose these capabilities:

- **`KritzelEditor`** exposes `exportViewportAsPng`, `exportViewportAsSvg`, `downloadAsJson`, `importFromFile`, and `loadObjectsFromJson` for browser-download and file-picker driven flows.
- **`KritzelEngine`** additionally exposes `exportAsJson` and `importFromJson`, which work with in-memory JSON strings instead of files — useful when you want to send workspace data to a server, store it yourself, or generate it without any file dialog.

## Exporting the Viewport

Call `exportViewportAsPng()` or `exportViewportAsSvg()` on the editor to render the current viewport and trigger a browser download. Both methods accept an optional `includeBackground` flag to control whether the canvas background is included in the exported image.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/import-export/viewport-export"
  repoFiles={['src/app/advanced/import-export/import-export-viewport-export.component.ts']}
/>

## Exporting the Workspace

Call `exportAsJson()` on the engine to serialize the active workspace — its metadata and every object it contains — into a JSON string you can inspect, transmit, or store yourself. If you just need a file download instead of the raw string, call `downloadAsJson()` on either the editor or the engine.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/import-export/workspace-export"
  repoFiles={['src/app/advanced/import-export/import-export-workspace-export.component.ts']}
/>

## Importing a Workspace

Call `importFromJson()` on the engine with a JSON string produced by `exportAsJson()` to recreate the workspace. Kritzel creates a **new** workspace with a fresh id, revives all objects into it, and switches the active workspace to it. If you instead want to merge objects into the *current* workspace without creating a new one, use `loadObjectsFromJson()` on the editor or engine.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/import-export/workspace-import"
  repoFiles={['src/app/advanced/import-export/import-export-workspace-import.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Export & Import](../api-reference/editor.md#export--import)
