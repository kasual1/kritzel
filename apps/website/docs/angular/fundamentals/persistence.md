---
sidebar_label: Persistence
displayed_sidebar: tutorialSidebar
title: "Persistence Concept | Kritzel for Angular"
description: "Understand how Kritzel persists canvas data through sync providers such as IndexedDBSyncProvider."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Persistence

## Overview

In Kritzel, persistence is handled by sync providers. A sync provider connects the canvas to a storage or transport medium and is registered through the editor's `syncConfig` prop. By default, Kritzel uses an empty provider list (`providers: []`), so canvas state is reset on page reload.

Kritzel comes with the following built-in providers:

- [In-Memory Provider](../api-reference/providers.md#in-memory-provider)
- [IndexedDB Provider](../api-reference/providers.md#indexeddb-provider)
- [Broadcast Provider](../api-reference/providers.md#broadcast-provider)
- [WebSocket Provider](../api-reference/providers.md#websocket-provider)
- [Hocuspocus Provider](../api-reference/providers.md#hocuspocus-provider)

Providers are additive, so several of them can be active at the same time. You can also implement the [Sync Provider Interface](../api-reference/providers.md#sync-provider-interface) to connect a custom storage medium.

Take a look at [Collaboration](../advanced/collaboration.md) for more information on the network providers.

## Keeping Canvas State in Memory

`InMemorySyncProvider` keeps state in a module-scoped cache. The canvas survives the editor being removed from and re-added to the DOM within the same page session, but is reset on reload. Use it for demos, tests, and throwaway canvases.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/persistence/memory"
  repoFiles={['src/app/pages/fundamentals/persistence/persistence-memory.component.ts']}
/>

## Persisting Canvas State with IndexedDB

Configure `IndexedDBSyncProvider` in `syncConfig.providers` to make object state durable in the browser. This is the right choice when users should keep their canvas state across reloads and browser restarts on the same device.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/persistence/local"
  repoFiles={['src/app/pages/fundamentals/persistence/persistence-local.component.ts']}
/>

## Synchronizing Across Browser Tabs

`BroadcastSyncProvider` mirrors updates between tabs of the same origin. It stores nothing on its own, so combine it with `IndexedDBSyncProvider` when the state should also survive a reload.

Open this demo in a second browser tab to see edits appear in both.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/persistence/broadcast"
  repoFiles={['src/app/pages/fundamentals/persistence/persistence-broadcast.component.ts']}
/>

## Synchronizing with a WebSocket Server

`WebSocketSyncProvider` connects the canvas to any [y-websocket](https://github.com/yjs/y-websocket)-compatible server. Pass options through the static `with` method. Network providers connect in the background, so an unreachable server never blocks the editor — layering `IndexedDBSyncProvider` underneath keeps the canvas usable while offline.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/persistence/websocket"
  repoFiles={['src/app/pages/fundamentals/persistence/persistence-websocket.component.ts']}
/>

:::note
The demo points at a placeholder server URL, so no remote sync takes place. Replace it with your own endpoint to see live synchronization.
:::

## Synchronizing with a Hocuspocus Server

`HocuspocusSyncProvider` targets a [Hocuspocus](https://tiptap.dev/hocuspocus) server and adds authentication tokens, configurable reconnect behavior, and connection multiplexing. Set `appStateId` to a stable shared identity, such as a user or account id, so the workspace list is shared across devices instead of being browser-local.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/persistence/hocuspocus"
  repoFiles={['src/app/pages/fundamentals/persistence/persistence-hocuspocus.component.ts']}
/>

:::note
The demo points at a placeholder server URL, so no remote sync takes place. Replace it with your own endpoint to see live synchronization.
:::

## API Details

For the full list of related APIs, see the following reference sections.

- [Collaboration](../api-reference/editor.md#collaboration)
- [Providers](../api-reference/providers.md)
