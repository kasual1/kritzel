---
sidebar_label: Migrating to Updraw
title: "Migrating from Kritzel | Updraw for Vue"
description: "Kritzel is now Updraw. Rename the packages, components, CSS variables and constants in your Vue app, and see which stored data keeps working without changes."
---

# Migrating to Updraw

## Overview

Kritzel has been renamed to Updraw. The packages moved from the `@kritzel` to the `@updraw` npm scope, the website moved from kritzel.io to updraw.io, and every public name that contained "Kritzel" now says "Updraw". New releases are only published under `@updraw`.

The rename does not change the API or the behavior. Every name changes in the same way:

| Kritzel | Updraw |
|---------|--------|
| `Kritzel` | `Updraw` |
| `kritzel` | `updraw` |
| `KRITZEL` | `UPDRAW` |

So in most apps a case-sensitive search and replace of these three words in your own source code does the migration. Don't run it over stored data, and don't touch the names your server uses to load documents saved before the rename (see [Server-Side Document Names](#server-side-document-names)).

Data your users already have keeps working: documents, settings and local databases saved by Kritzel are read by Updraw, as described in [What Keeps Working](#what-keeps-working).

## Updating the Packages

Replace the Kritzel package with the Updraw package:

```bash
npm uninstall @kritzel/vue-editor
npm install @updraw/vue-editor
```

| Kritzel | Updraw |
|---------|--------|
| `@kritzel/vue-editor` | `@updraw/vue-editor` |
| `@kritzel/vue-engine` | `@updraw/vue-engine` |
| `@kritzel/engine` | `@updraw/engine` |
| `@kritzel/core` | `@updraw/core` |

Update every import to the new package name.

## Renaming Components and Types

Rename the components in your templates and imports:

| Kritzel | Updraw |
|---------|--------|
| `<KritzelEditor>` | `<UpdrawEditor>` |
| `<KritzelEngine>` | `<UpdrawEngine>` |

```html title="Editor.vue"
<script setup lang="ts">
import { UpdrawEditor } from '@updraw/vue-editor'
</script>

<template>
  <UpdrawEditor style="display: block; width: 100%; height: 100vh" />
</template>
```

The internal custom elements are now called `updraw-*` as well. If your styles or `querySelector` calls target a `kritzel-*` element, rename the selector.

Classes, interfaces and types follow the same pattern:

| Kritzel | Updraw |
|---------|--------|
| `KritzelBaseObject`, `KritzelPath`, `KritzelText`, `KritzelImage`, … | `UpdrawBaseObject`, `UpdrawPath`, `UpdrawText`, `UpdrawImage`, … |
| `KritzelSyncConfig`, `KritzelTheme`, `KritzelLocale`, … | `UpdrawSyncConfig`, `UpdrawTheme`, `UpdrawLocale`, … |
| `IKritzelUser`, `IKritzelMenuItem`, … | `IUpdrawUser`, `IUpdrawMenuItem`, … |
| `KritzelAgentActionError`, `KritzelChatHttpError`, … | `UpdrawAgentActionError`, `UpdrawChatHttpError`, … |

## Renaming Styles and Attributes

CSS custom properties, such as the [theme variables](../api-reference/theming.md), use the new prefix, and so do class names and data attributes:

| Kritzel | Updraw |
|---------|--------|
| `--kritzel-*` | `--updraw-*` |
| `.kritzel-*` classes | `.updraw-*` classes |
| `data-kritzel-id` | `data-updraw-id` |
| other `data-kritzel-*` attributes | `data-updraw-*` |
| `kritzelId` in element descriptions | `updrawId` |

```css
:root {
  /* was --kritzel-global-font-family */
  --updraw-global-font-family: 'Inter', sans-serif;
}
```

In the HTML of [dynamic objects](../advanced/dynamic-objects.md), mark elements with `data-updraw-id` and use `var(--updraw-content-border-radius)` for rounded corners. The page script inside an iframe now reads its state from `globalThis.updraw` and listens to the `updrawstatechange` event.

## Renaming Constants and Helpers

| Kritzel | Updraw |
|---------|--------|
| `KRITZEL_DEFAULT_OBJECT_TITLEBAR` | `UPDRAW_DEFAULT_OBJECT_TITLEBAR` |
| `KRITZEL_CHAT_PROTOCOL_VERSION` | `UPDRAW_CHAT_PROTOCOL_VERSION` |
| `KRITZEL_VERSION` | `UPDRAW_VERSION` |
| `KRITZEL_*` (all other constants) | `UPDRAW_*` |
| `isKritzelAgent()` | `isUpdrawAgent()` |
| `isKritzelChatSession()` | `isUpdrawChatSession()` |

## What Keeps Working

Updraw reads everything Kritzel saved, so your users don't lose any work:

- **Stored documents.** Objects saved by Kritzel carry class names such as `KritzelPath` or `KritzelGroup`. Updraw loads them as `UpdrawPath` and `UpdrawGroup`, and the old dynamic object class `KritzelCustomElement` as `UpdrawDynamicObject`. Nothing is rewritten on load: an object is saved with its new class name the next time it changes. [JSON exports](../advanced/import-export.md) made with Kritzel can be imported the same way.
- **Settings in `localStorage`.** The theme, language, active workspace and app state id that Kritzel stored under `kritzel-settings`, `kritzel-active-workspace-id` and `kritzel-app-state-instance-id` (also with an `-{editorId}` suffix) are copied to their `updraw-*` keys on the first load. The old keys are left in place.
- **IndexedDB documents and assets.** Workspaces that `IndexedDBSyncProvider` saved in `kritzel-workspace-*` and `kritzel-app-state-*` databases, and images in the `kritzel-assets` database, are imported into the new databases the first time they are opened. The old databases are not deleted. If you pass your own `name` to the provider, the database name doesn't change and there is nothing to import.
- **Clipboard.** Objects copied in a Kritzel editor can be pasted into an Updraw editor.
- **Iframe and dynamic object content.** HTML saved in existing objects keeps working: `globalThis.kritzel`, the `kritzelstatechange` event, `[data-kritzel-id]` lookups and the CSS variables `--kritzel-iframe-default-cursor`, `--kritzel-iframe-pointer-cursor` and `--kritzel-content-border-radius` remain available as deprecated aliases. Use the Updraw names in content you create from now on.

## Server-Side Document Names

Each Yjs document has a generated name, which network providers send to the server (see [Providers](../api-reference/providers.md)). These names changed:

| Kritzel | Updraw |
|---------|--------|
| `kritzel-app-state-{editorId}-{appStateId}` | `updraw-app-state-{editorId}-{appStateId}` |
| `kritzel-workspace-{editorId}-{workspaceId}` | `updraw-workspace-{editorId}-{workspaceId}` |

Without an `editorId`, the names have no `{editorId}-` part. Only the prefix changed, the ids are the same.

If your server stores documents by name, for example with `HocuspocusSyncProvider` or `WebSocketSyncProvider`, upgraded clients ask for documents it doesn't know and get empty ones. Rename the stored documents before you deploy, or let the server fall back to the old name. If you set `name` (Hocuspocus) or `roomName` (WebSocket) yourself, the server name stays the same and there is nothing to do.

To rename stored documents, for example in a PostgreSQL table `documents (name text primary key, data bytea)`:

```sql
UPDATE documents AS legacy
SET name = 'updraw-' || substring(legacy.name FROM 9)
WHERE (legacy.name LIKE 'kritzel-app-state-%' OR legacy.name LIKE 'kritzel-workspace-%')
  AND NOT EXISTS (
    SELECT 1 FROM documents AS renamed
    WHERE renamed.name = 'updraw-' || substring(legacy.name FROM 9)
  );
```

The query skips documents that already exist under their new name, because an upgraded client saved them first. Merge those with `Y.mergeUpdates([legacyState, updrawState])` from `yjs`, store the result under the new name and delete the old row.

To fall back to the old name instead, load it in the server's `onLoadDocument` hook when a document doesn't exist yet. `toLegacyDocumentName()` from `@updraw/core` turns `updraw-workspace-…` into `kritzel-workspace-…` and returns `null` for any other name:

```ts title="server.ts"
import { Server } from '@hocuspocus/server';
import { toLegacyDocumentName } from '@updraw/core';
import * as Y from 'yjs';
import { loadDocument, saveDocument } from './storage'; // your own persistence

const server = new Server({
  port: 1234,
  async onLoadDocument({ documentName, document }) {
    let state = await loadDocument(documentName);
    if (!state) {
      // Not saved under its Updraw name yet: load the document Kritzel saved.
      const legacyName = toLegacyDocumentName(documentName);
      state = legacyName ? await loadDocument(legacyName) : null;
    }
    if (state) {
      Y.applyUpdate(document, state);
    }
  },
  async onStoreDocument({ documentName, document }) {
    await saveDocument(documentName, Y.encodeStateAsUpdate(document));
  },
});

server.listen();
```

Documents are then saved under their new names the next time they change.

## Upgrading All Collaborators Together

Compatibility only works in one direction: Updraw reads what Kritzel wrote, but Kritzel can't read what Updraw writes. A Kritzel client doesn't know the `Updraw*` class names, so it can't show objects that an Updraw client created or changed, and it can't paste Updraw clipboard content or import Updraw JSON exports.

Upgrade every client that shares a document at the same time, and don't run Kritzel and Updraw clients against the same server side by side. Once Updraw has saved changes to a document, going back to Kritzel is not supported.
