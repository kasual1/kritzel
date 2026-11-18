---
sidebar_label: Migrating to Upmade
title: "Migrating from Kritzel or Updraw | Upmade for Vue"
description: "Kritzel, later Updraw, is now Upmade. Rename the packages, components, CSS variables and constants in your Vue app, and see which stored data keeps working without changes."
---

# Migrating to Upmade

## Overview

The library was first called Kritzel, then Updraw, and is now called Upmade. The packages moved from the `@kritzel` and `@updraw` npm scopes to `@upmade`, the website moved to upmade.io, and every public name that contained "Kritzel" or "Updraw" now says "Upmade". New releases are only published under `@upmade`.

This guide is for apps on either `@kritzel/*` or `@updraw/*` packages: the steps are the same. The rename does not change the API or the behavior. Every name changes in the same way:

| Kritzel | Updraw | Upmade |
|---------|--------|--------|
| `Kritzel` | `Updraw` | `Upmade` |
| `kritzel` | `updraw` | `upmade` |
| `KRITZEL` | `UPDRAW` | `UPMADE` |

So in most apps a case-sensitive search and replace of the old words in your own source code does the migration. Don't run it over stored data, and don't touch the names your server uses to load documents saved before the rename (see [Server-Side Document Names](#server-side-document-names)).

Data your users already have keeps working: documents, settings and local databases saved by Kritzel or Updraw are read by Upmade, as described in [What Keeps Working](#what-keeps-working).

## Updating the Packages

Replace the Kritzel or Updraw package with the Upmade package:

```bash
npm uninstall @updraw/vue-editor # or @kritzel/vue-editor
npm install @upmade/vue-editor
```

| Kritzel | Updraw | Upmade |
|---------|--------|--------|
| `@kritzel/vue-editor` | `@updraw/vue-editor` | `@upmade/vue-editor` |
| `@kritzel/vue-engine` | `@updraw/vue-engine` | `@upmade/vue-engine` |
| `@kritzel/engine` | `@updraw/engine` | `@upmade/engine` |
| `@kritzel/core` | `@updraw/core` | `@upmade/core` |

Update every import to the new package name.

## Renaming Components and Types

Rename the components in your templates and imports:

| Kritzel | Updraw | Upmade |
|---------|--------|--------|
| `<KritzelEditor>` | `<UpdrawEditor>` | `<UpmadeEditor>` |
| `<KritzelEngine>` | `<UpdrawEngine>` | `<UpmadeEngine>` |

```html title="Editor.vue"
<script setup lang="ts">
import { UpmadeEditor } from '@upmade/vue-editor'
</script>

<template>
  <UpmadeEditor style="display: block; width: 100%; height: 100vh" />
</template>
```

The internal custom elements are now called `upmade-*` as well. If your styles or `querySelector` calls target a `kritzel-*` or `updraw-*` element, rename the selector.

Classes, interfaces and types follow the same pattern:

| Kritzel | Updraw | Upmade |
|---------|--------|--------|
| `KritzelBaseObject`, `KritzelPath`, `KritzelText`, … | `UpdrawBaseObject`, `UpdrawPath`, `UpdrawText`, … | `UpmadeBaseObject`, `UpmadePath`, `UpmadeText`, … |
| `KritzelSyncConfig`, `KritzelTheme`, `KritzelLocale`, … | `UpdrawSyncConfig`, `UpdrawTheme`, `UpdrawLocale`, … | `UpmadeSyncConfig`, `UpmadeTheme`, `UpmadeLocale`, … |
| `IKritzelUser`, `IKritzelMenuItem`, … | `IUpdrawUser`, `IUpdrawMenuItem`, … | `IUpmadeUser`, `IUpmadeMenuItem`, … |
| `KritzelAgentActionError`, `KritzelChatHttpError`, … | `UpdrawAgentActionError`, `UpdrawChatHttpError`, … | `UpmadeAgentActionError`, `UpmadeChatHttpError`, … |

## Renaming Styles and Attributes

CSS custom properties, such as the [theme variables](../api-reference/theming.md), use the new prefix, and so do class names and data attributes:

| Kritzel | Updraw | Upmade |
|---------|--------|--------|
| `--kritzel-*` | `--updraw-*` | `--upmade-*` |
| `.kritzel-*` classes | `.updraw-*` classes | `.upmade-*` classes |
| `data-kritzel-id` | `data-updraw-id` | `data-upmade-id` |
| other `data-kritzel-*` attributes | other `data-updraw-*` attributes | `data-upmade-*` |
| `kritzelId` in element descriptions | `updrawId` in element descriptions | `upmadeId` |

```css
:root {
  /* was --kritzel-global-font-family, then --updraw-global-font-family */
  --upmade-global-font-family: 'Inter', sans-serif;
}
```

In the HTML of [dynamic objects](../advanced/dynamic-objects.md), mark elements with `data-upmade-id` and use `var(--upmade-content-border-radius)` for rounded corners. The page script inside an iframe now reads its state from `globalThis.upmade` and listens to the `upmadestatechange` event.

## Renaming Constants and Helpers

| Kritzel | Updraw | Upmade |
|---------|--------|--------|
| `KRITZEL_DEFAULT_OBJECT_TITLEBAR` | `UPDRAW_DEFAULT_OBJECT_TITLEBAR` | `UPMADE_DEFAULT_OBJECT_TITLEBAR` |
| `KRITZEL_CHAT_PROTOCOL_VERSION` | `UPDRAW_CHAT_PROTOCOL_VERSION` | `UPMADE_CHAT_PROTOCOL_VERSION` |
| `KRITZEL_VERSION` | `UPDRAW_VERSION` | `UPMADE_VERSION` |
| `KRITZEL_*` (all other constants) | `UPDRAW_*` (all other constants) | `UPMADE_*` |
| `isKritzelAgent()` | `isUpdrawAgent()` | `isUpmadeAgent()` |
| `isKritzelChatSession()` | `isUpdrawChatSession()` | `isUpmadeChatSession()` |

## What Keeps Working

Upmade reads everything Kritzel and Updraw saved, so your users don't lose any work. Where the same data exists under both former names, the Updraw copy wins, because it is newer.

- **Stored documents.** Objects saved by Kritzel or Updraw carry class names such as `KritzelPath` or `UpdrawGroup`. Upmade loads them as `UpmadePath` and `UpmadeGroup`, and the old dynamic object class `KritzelCustomElement` as `UpmadeDynamicObject`. Nothing is rewritten on load: an object is saved with its new class name the next time it changes. [JSON exports](../advanced/import-export.md) made with Kritzel or Updraw can be imported the same way.
- **Settings in `localStorage`.** The theme, language, active workspace and app state id stored under `updraw-settings`, `updraw-active-workspace-id` and `updraw-app-state-instance-id`, or under the same keys with the `kritzel-` prefix (also with an `-{editorId}` suffix), are copied to their `upmade-*` keys on the first load, unless the `upmade-*` key already exists. If a value exists under both former names, the `updraw-*` one is copied. The old keys are left in place.
- **IndexedDB documents and assets.** With its default database name, `IndexedDBSyncProvider` merges the `updraw-workspace-*` and `kritzel-workspace-*` (and `updraw-app-state-*` and `kritzel-app-state-*`) databases into the matching `upmade-*` database when it connects. The imported content can't be undone with the undo history. With its default database, `IndexedDBAssetProvider` copies missing images from the `updraw-assets` database, then from `kritzel-assets`. Each old database is read once in a browser; content that Updraw already imported from Kritzel is merged, not duplicated. The old databases are not deleted, except by `deleteWorkspace()`, which removes the workspace's `upmade-*` database and both older ones. If you pass your own database name (`name` on `IndexedDBSyncProvider`, `dbName` on `IndexedDBAssetProvider`), the name doesn't change and there is nothing to import.
- **Clipboard.** Objects copied in a Kritzel or Updraw editor can be pasted into an Upmade editor.
- **Iframe and dynamic object content.** HTML saved in existing objects keeps working: `globalThis.updraw` and `globalThis.kritzel`, the `updrawstatechange` and `kritzelstatechange` events, `[data-updraw-id]` and `[data-kritzel-id]` lookups and the CSS variables `--updraw-iframe-default-cursor`, `--updraw-iframe-pointer-cursor` and `--updraw-content-border-radius` and their `--kritzel-*` versions remain available as deprecated aliases. Use the Upmade names in content you create from now on. Selectors you pass yourself, for example to query, highlight or pick elements, are plain CSS: to also match saved content, use `[data-upmade-id], [data-updraw-id], [data-kritzel-id]`.

## Server-Side Document Names

Each Yjs document has a generated name, which network providers send to the server (see [Providers](../api-reference/providers.md)). These names changed:

| Kritzel | Updraw | Upmade |
|---------|--------|--------|
| `kritzel-app-state-{editorId}-{appStateId}` | `updraw-app-state-{editorId}-{appStateId}` | `upmade-app-state-{editorId}-{appStateId}` |
| `kritzel-workspace-{editorId}-{workspaceId}` | `updraw-workspace-{editorId}-{workspaceId}` | `upmade-workspace-{editorId}-{workspaceId}` |

Without an `editorId`, the names have no `{editorId}-` part. Only the prefix changed, the ids are the same.

If your server stores documents by name, for example with `HocuspocusSyncProvider` or `WebSocketSyncProvider`, upgraded clients ask for documents it doesn't know and get empty ones. Rename the stored documents before you deploy, or let the server fall back to the old names. If you set `name` (Hocuspocus) or `roomName` (WebSocket) yourself, the server name stays the same and there is nothing to do.

To rename stored documents, for example in a PostgreSQL table `documents (name text primary key, data bytea)`, rename the `updraw-` names first and then the older `kritzel-` names:

```sql
UPDATE documents AS legacy
SET name = 'upmade-' || substring(legacy.name FROM 8)
WHERE (legacy.name LIKE 'updraw-app-state-%' OR legacy.name LIKE 'updraw-workspace-%')
  AND NOT EXISTS (
    SELECT 1 FROM documents AS renamed
    WHERE renamed.name = 'upmade-' || substring(legacy.name FROM 8)
  );

UPDATE documents AS legacy
SET name = 'upmade-' || substring(legacy.name FROM 9)
WHERE (legacy.name LIKE 'kritzel-app-state-%' OR legacy.name LIKE 'kritzel-workspace-%')
  AND NOT EXISTS (
    SELECT 1 FROM documents AS renamed
    WHERE renamed.name = 'upmade-' || substring(legacy.name FROM 9)
  );
```

The queries skip documents that already exist under their new name, because an upgraded client saved them first or because the document was saved under both former names. Merge those with `Y.mergeUpdates([legacyState, upmadeState])` from `yjs`, store the result under the new name and delete the old row.

To fall back to the old names instead, load them in the server's `onLoadDocument` hook when a document doesn't exist yet. `toLegacyDocumentNames()` from `@upmade/core` returns the former names of any `upmade-…` document name (`upmade-workspace-…`, `upmade-app-state-…`), newest first: `upmade-workspace-1` gives `['updraw-workspace-1', 'kritzel-workspace-1']`. For names without the `upmade-` prefix it returns an empty array:

```ts title="server.ts"
import { Server } from '@hocuspocus/server';
import { toLegacyDocumentNames } from '@upmade/core';
import * as Y from 'yjs';
import { loadDocument, saveDocument } from './storage'; // your own persistence

const server = new Server({
  port: 1234,
  async onLoadDocument({ documentName, document }) {
    let state = await loadDocument(documentName);
    // Not saved under its Upmade name yet: load the document Updraw or Kritzel saved.
    for (const legacyName of toLegacyDocumentNames(documentName)) {
      if (state) break;
      state = await loadDocument(legacyName);
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

`toLegacyDocumentName()`, which servers on `@updraw/core` used to find `kritzel-…` documents, is deprecated. It now returns only the name before the latest rename (`upmade-workspace-1` gives `updraw-workspace-1`) or `null`, so it no longer finds documents that were only ever saved under a `kritzel-…` name. Use `toLegacyDocumentNames()` instead. The single-value constants of `@updraw/core` (`LEGACY_CLASS_PREFIX`, `LEGACY_NAME_PREFIX`, `LEGACY_CLIPBOARD_PAYLOAD_PREFIX`, `LEGACY_ASSET_DB_NAME`, `LEGACY_IFRAME_GLOBAL`, `LEGACY_IFRAME_STATE_EVENT` and `LEGACY_ELEMENT_ID_ATTRIBUTE`) are deprecated the same way: they now hold only the Updraw-era value. Their lists, with the newest name first, are `LEGACY_CLASS_PREFIXES`, `LEGACY_NAME_PREFIXES`, `LEGACY_CLIPBOARD_PAYLOAD_PREFIXES`, `LEGACY_ASSET_DB_NAMES`, `LEGACY_IFRAME_GLOBALS`, `LEGACY_IFRAME_STATE_EVENTS` and `LEGACY_ELEMENT_ID_ATTRIBUTES`.

## Upgrading All Collaborators Together

Compatibility only works in one direction: Upmade reads what Kritzel and Updraw wrote, but neither can read what Upmade writes. Kritzel and Updraw clients don't know the `Upmade*` class names, so they can't show objects that an Upmade client created or changed, and they can't paste Upmade clipboard content or import Upmade JSON exports.

The runtime brands `Symbol.for('upmade.agent')` and `Symbol.for('upmade.chatSession')` and the internal iframe message types (`upmade-iframe-*`) were renamed too, so `isUpmadeAgent()` and `isUpmadeChatSession()` don't recognize agents or chat sessions created with a `@kritzel/*` or `@updraw/*` package.

Upgrade every client that shares a document at the same time, and don't run Kritzel or Updraw clients against the same server as Upmade clients. Once Upmade has saved changes to a document, going back to Kritzel or Updraw is not supported.
