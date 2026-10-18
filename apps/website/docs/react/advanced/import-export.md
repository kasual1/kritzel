---
sidebar_label: Import/Export
displayed_sidebar: tutorialSidebar
title: "Import/Export Concept | Kritzel for React"
description: "Understand how to programmatically export the viewport as PNG or SVG, export the workspace as JSON, and import a workspace from JSON in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Import/Export

## Overview

Kritzel lets you export the current viewport as PNG or SVG and lets you export and import workspaces as JSON. This is useful when you want to save a visual snapshot, preserve an editable canvas state, or move a workspace between environments.

You can either use the dedicated export and import dialogs described under [Controls](../fundamentals/controls.md), or handle these operations programmatically from code.

## Exporting the Viewport

Call `exportViewportAsPng()` or `exportViewportAsSvg()` on the editor ref to export the current viewport and trigger a browser download.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/import-export/viewport-export"
  repoFiles={['src/pages/advanced/import-export/ImportExportViewportExportPage.tsx']}
/>

## Exporting the Workspace

Call `exportAsJson()` on the editor ref to serialize the active workspace into a JSON string. If you just need a file download instead of the raw string, call `downloadAsJson()`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/import-export/workspace-export"
  repoFiles={['src/pages/advanced/import-export/ImportExportWorkspaceExportPage.tsx']}
/>

## Importing a Workspace

To import a previously exported workspace, call `importFromJson()` on the editor ref. This creates a new workspace with the imported data and automatically switches to it.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/import-export/workspace-import"
  repoFiles={['src/pages/advanced/import-export/ImportExportWorkspaceImportPage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Export & Import](../api-reference/editor.md#export--import)
