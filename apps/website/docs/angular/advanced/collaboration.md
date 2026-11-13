---
sidebar_label: Collaboration
displayed_sidebar: tutorialSidebar
title: "Collaboration Concept | Updraw for Angular"
description: "Understand the core concept of Collaboration in Updraw — cross-tab sync and multi-user editing using Yjs providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Collaboration

## Overview

Collaboration in Updraw is built on sync providers, the same mechanism used for persistence. Register collaboration providers through the editor's `syncConfig` prop to control *where* and *how* document state is shared across tabs and users. Providers are composable and can combine local browser channels with network transport.

Updraw comes with the following built-in collaboration providers:

- [BroadcastChannel Provider](../api-reference/providers.md#broadcast-provider)
- [WebSocket Provider](../api-reference/providers.md#websocket-provider)
- [Hocuspocus Provider](../api-reference/providers.md#hocuspocus-provider)

## Cross-Tab Sync

Use `BroadcastSyncProvider` to synchronize document updates across browser tabs on the same device through the BroadcastChannel API.

By default, the tabs share only the document. To share presence between the tabs as well, that is the cursors and selections of users and the [agents](./agents.md#collaboration) of each tab, use `BroadcastSyncProvider.with({ awareness: true })`. See [Broadcast Provider](../api-reference/providers.md#broadcast-provider).

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/advanced/collaboration/local"
  repoFiles={['src/app/pages/advanced/collaboration/collaboration-local.component.ts']}
/>

## Real-Time Multi-User Sync

To collaborate across devices or users, combine local persistence with a network provider. A common production pattern uses `IndexedDBSyncProvider` for offline resilience together with `HocuspocusSyncProvider` (or `WebSocketSyncProvider`) for real-time sync. The `HocuspocusSyncProvider` also supports connection multiplexing for managing multiple documents efficiently.

Network providers share presence: collaborators see each other's cursors and selections, and the [agents](./agents.md#collaboration) of each editor.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/advanced/collaboration/realtime"
  repoFiles={['src/app/pages/advanced/collaboration/collaboration-realtime.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Collaboration](../api-reference/editor.md#collaboration)
