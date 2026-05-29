---
sidebar_label: Collaboration
displayed_sidebar: tutorialSidebar
title: "Collaboration Concept | Kritzel for Angular"
description: "Understand the core concept of Collaboration in Kritzel — real-time sync, local persistence, and multi-user editing using Yjs providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Collaboration

## Overview

Kritzel uses [Yjs](https://yjs.dev/) CRDTs under the hood for all data synchronization and persistence. Every canvas object lives inside a Yjs document (`Y.Doc`), which means changes merge conflict-free across any number of clients — whether they are browser tabs on the same machine or users on opposite sides of the world.

You configure collaboration through the `syncConfig` prop on `<kritzel-editor>` (or `<kritzel-engine>`). This prop accepts a list of **providers** that control *where* and *how* document state is stored and shared. Providers are composable: combine a local persistence provider with a real-time network provider to get offline-first collaboration out of the box.

## Local Persistence & Cross-Tab Sync

For many use cases you don't need a server at all. Kritzel ships providers that keep canvas data entirely on the client:

- `IndexedDBSyncProvider` — persists state in the browser's IndexedDB. Data survives page reloads and browser restarts.
- `BroadcastSyncProvider` — syncs across tabs in the same browser using the BroadcastChannel API.
- `InMemorySyncProvider` — holds state in memory for the current session. Intended for documentation demos and transient editing.

Combine them to get durable local persistence *and* instant cross-tab updates.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/collaboration-local"
  repoFiles={['src/app/concepts/collaboration/collaboration-local.component.ts']}
/>

## Real-Time Multi-User Sync

To collaborate across devices or users, add a network provider. Kritzel supports two WebSocket-based providers:

- `WebSocketSyncProvider` — connects to any [y-websocket](https://github.com/yjs/y-websocket)-compatible server.
- `HocuspocusSyncProvider` — connects to a [Hocuspocus](https://tiptap.dev/hocuspocus) server with built-in support for authentication tokens and multiplexed connections.

A common production pattern combines local persistence (for offline resilience) with a network provider (for real-time sync):

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/collaboration-realtime"
  repoFiles={['src/app/concepts/collaboration/collaboration-realtime.component.ts']}
/>

## Multiplexing Connections

When your application manages multiple documents simultaneously (e.g. a workspace switcher), the `HocuspocusSyncProvider` supports multiplexing — sharing a single WebSocket connection for all documents. This reduces connection overhead, avoids redundant authentication handshakes, and makes document switching instantaneous since the connection is already established.

## Related API Methods

- Sync configuration (`syncConfig` prop, provider composition)
- Provider factories (`WebSocketSyncProvider.with()`, `HocuspocusSyncProvider.with()`)
- Multiplexing lifecycle (`HocuspocusSyncProvider.createSharedWebSocket()`, `HocuspocusSyncProvider.destroySharedWebSocket()`)
- Cache management (`InMemorySyncProvider.clear()`)

For a comprehensive view, see the [API Reference](api-reference-editor.md).
