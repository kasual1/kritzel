---
sidebar_label: Collaboration
displayed_sidebar: tutorialSidebar
title: "Collaboration Concept | Kritzel for Angular"
description: "Understand the core concept of Collaboration in Kritzel — cross-tab sync and multi-user editing using Yjs providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Collaboration

## Overview

Kritzel uses [Yjs](https://yjs.dev/) CRDTs under the hood for all data synchronization and persistence. Every canvas object lives inside a Yjs document (`Y.Doc`), which means changes merge conflict-free across any number of clients — whether they are browser tabs on the same machine or users on opposite sides of the world.

You configure collaboration through the `syncConfig` prop on `<kritzel-editor>` (or `<kritzel-engine>`). This prop accepts a list of **providers** that control *where* and *how* document state is shared. Providers are composable and can combine local browser channels with network transport.

## Cross-Tab Sync

For same-device collaboration across multiple browser tabs, use `BroadcastSyncProvider`. It synchronizes document updates in real time through the BroadcastChannel API.

This is useful when users open the same board in multiple tabs and expect immediate consistency.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/collaboration/local"
  repoFiles={['src/app/advanced/collaboration/collaboration-local.component.ts']}
/>

## Real-Time Multi-User Sync

To collaborate across devices or users, add a network provider. Kritzel supports two WebSocket-based providers:

- `WebSocketSyncProvider` — connects to any [y-websocket](https://github.com/yjs/y-websocket)-compatible server.
- `HocuspocusSyncProvider` — connects to a [Hocuspocus](https://tiptap.dev/hocuspocus) server with built-in support for authentication tokens and multiplexed connections.

A common production pattern combines local persistence (for offline resilience) with a network provider (for real-time sync):

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/collaboration/realtime"
  repoFiles={['src/app/advanced/collaboration/collaboration-realtime.component.ts']}
/>

## Multiplexing Connections

When your application manages multiple documents simultaneously (e.g. a workspace switcher), the `HocuspocusSyncProvider` supports multiplexing — sharing a single WebSocket connection for all documents. This reduces connection overhead, avoids redundant authentication handshakes, and makes document switching instantaneous since the connection is already established.

## API Details

For the full list of available APIs, see the following reference sections.

- [Collaboration](../api-reference/editor.md#collaboration)
