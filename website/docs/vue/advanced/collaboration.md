---
sidebar_label: Collaboration
displayed_sidebar: tutorialSidebar
title: "Collaboration Concept | Kritzel for Vue"
description: "Understand the core concept of Collaboration in Kritzel - cross-tab sync and multi-user editing using Yjs providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Collaboration

## Overview

Kritzel uses [Yjs](https://yjs.dev/) CRDTs under the hood for all data synchronization and persistence. Every canvas object lives inside a Yjs document (`Y.Doc`), which means changes merge conflict-free across any number of clients, whether they are browser tabs on the same machine or users on opposite sides of the world.

You configure collaboration through the `syncConfig` prop on `<KritzelEditor>` (or `<KritzelEngine>`). This prop accepts a list of **providers** that control *where* and *how* document state is shared. Providers are composable and can combine local browser channels with network transport.

## Cross-Tab Sync

For same-device collaboration across multiple browser tabs, use `BroadcastSyncProvider`. It synchronizes document updates in real time through the BroadcastChannel API.

This is useful when users open the same board in multiple tabs and expect immediate consistency.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced/collaboration-local"
  repoFiles={['src/pages/advanced/collaboration/CollaborationLocalPage.vue']}
/>

## Real-Time Multi-User Sync

To collaborate across devices or users, add a network provider. Kritzel supports two WebSocket-based providers:

- `WebSocketSyncProvider` - connects to any [y-websocket](https://github.com/yjs/y-websocket)-compatible server.
- `HocuspocusSyncProvider` - connects to a [Hocuspocus](https://tiptap.dev/hocuspocus) server with built-in support for authentication tokens and multiplexed connections.

A common production pattern combines local persistence (for offline resilience) with a network provider (for real-time sync):

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced/collaboration-realtime"
  repoFiles={['src/pages/advanced/collaboration/CollaborationRealtimePage.vue']}
/>

## Multiplexing Connections

When your application manages multiple documents simultaneously (for example, a workspace switcher), the `HocuspocusSyncProvider` supports multiplexing by sharing a single WebSocket connection for all documents. This reduces connection overhead, avoids redundant authentication handshakes, and makes document switching instantaneous since the connection is already established.

## Related API Methods

- Sync configuration (`syncConfig` prop, provider composition)
- Provider factories (`WebSocketSyncProvider.with()`, `HocuspocusSyncProvider.with()`)
- Multiplexing lifecycle (`HocuspocusSyncProvider.createSharedWebSocket()`, `HocuspocusSyncProvider.destroySharedWebSocket()`)
- Cross-tab provider (`BroadcastSyncProvider`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).