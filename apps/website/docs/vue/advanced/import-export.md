---
sidebar_label: Import/Export
displayed_sidebar: tutorialSidebar
title: "Import/Export Concept | Kritzel for Vue"
description: "Understand how to programmatically export the viewport as PNG or SVG, export the workspace as JSON, and import a workspace from JSON in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Import/Export

## Overview

Kritzel lets you export the current viewport as PNG or SVG and lets you export and import workspaces as JSON. This is useful when you want to save a visual snapshot, preserve an editable canvas state, or move a workspace between environments.

You can either use the dedicated [export dialog](../fundamentals/controls.md#export-dialog) and [import dialog](../fundamentals/controls.md#import-dialog), or handle these operations programmatically from code.

## Exporting the Viewport

Call `exportViewportAsPng()` or `exportViewportAsSvg()` on the editor to export the current viewport and trigger a browser download.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/import-export/viewport-export"
  repoFiles={['src/pages/advanced/import-export/ImportExportViewportExportPage.vue']}
/>

## Exporting the Workspace

Call `exportAsJson()` on the editor to serialize the active workspace into a JSON string. If you just need a file download instead of the raw string, call `downloadAsJson()`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/import-export/workspace-export"
  repoFiles={['src/pages/advanced/import-export/ImportExportWorkspaceExportPage.vue']}
/>

## Importing a Workspace

To import a previously exported workspace, use `importFromJson()`. This creates a new workspace with the imported data and automatically switches to it.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/import-export/workspace-import"
  repoFiles={['src/pages/advanced/import-export/ImportExportWorkspaceImportPage.vue']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Export & Import](../api-reference/editor.md#export--import)
