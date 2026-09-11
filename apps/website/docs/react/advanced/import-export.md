---
sidebar_label: Import/Export
displayed_sidebar: tutorialSidebar
title: "Import/Export Concept | Kritzel for React"
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

Call `exportViewportAsPng()` or `exportViewportAsSvg()` on the editor ref to render the current viewport and trigger a browser download. Both methods accept an optional `includeBackground` flag to control whether the canvas background is included in the exported image.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/advanced/import-export/viewport-export"
  repoFiles={['src/pages/advanced/import-export/ImportExportViewportExportPage.tsx']}
/>

## Exporting the Workspace

Call `exportAsJson()` on the engine ref to serialize the active workspace — its metadata and every object it contains — into a JSON string you can inspect, transmit, or store yourself. If you just need a file download instead of the raw string, call `downloadAsJson()` on either the editor or the engine ref.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/advanced/import-export/workspace-export"
  repoFiles={['src/pages/advanced/import-export/ImportExportWorkspaceExportPage.tsx']}
/>

## Importing a Workspace

Call `importFromJson()` on the engine ref with a JSON string produced by `exportAsJson()` to recreate the workspace. Kritzel creates a **new** workspace with a fresh id, revives all objects into it, and switches the active workspace to it. If you instead want to merge objects into the *current* workspace without creating a new one, use `loadObjectsFromJson()` on the editor or engine ref.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/advanced/import-export/workspace-import"
  repoFiles={['src/pages/advanced/import-export/ImportExportWorkspaceImportPage.tsx']}
/>

## Related API Methods

- Viewport export ([exportViewportAsPng](../api-reference/editor.md#exportviewportaspng), [exportViewportAsSvg](../api-reference/editor.md#exportviewportassvg))
- Workspace export (`exportAsJson`, [downloadAsJson](../api-reference/editor.md#downloadasjson))
- Workspace import (`importFromJson`, [loadObjectsFromJson](../api-reference/editor.md#loadobjectsfromjson), [importFromFile](../api-reference/editor.md#importfromfile))

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
