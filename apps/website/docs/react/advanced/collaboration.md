---
sidebar_label: Collaboration
displayed_sidebar: tutorialSidebar
title: "Collaboration Concept | Kritzel for React"
description: "Understand the core concept of Collaboration in Kritzel - cross-tab sync and multi-user editing using Yjs providers."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Collaboration

## Overview

Collaboration in Kritzel is built on sync providers, the same mechanism used for persistence. Register collaboration providers through the editor's `syncConfig` prop to control *where* and *how* document state is shared across tabs and users. Providers are composable and can combine local browser channels with network transport.

Kritzel comes with the following built-in collaboration providers:

- [BroadcastChannel Provider](../api-reference/providers.md#broadcast-provider)
- [WebSocket Provider](../api-reference/providers.md#websocket-provider)
- [Hocuspocus Provider](../api-reference/providers.md#hocuspocus-provider)

## Cross-Tab Sync

Use `BroadcastSyncProvider` to synchronize document updates across browser tabs on the same device through the BroadcastChannel API.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/advanced/collaboration/local"
  repoFiles={['src/pages/advanced/collaboration/CollaborationLocalPage.tsx']}
/>

## Real-Time Multi-User Sync

To collaborate across devices or users, combine local persistence with a network provider. A common production pattern uses `IndexedDBSyncProvider` for offline resilience together with `HocuspocusSyncProvider` (or `WebSocketSyncProvider`) for real-time sync. The `HocuspocusSyncProvider` also supports connection multiplexing for managing multiple documents efficiently.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/advanced/collaboration/realtime"
  repoFiles={['src/pages/advanced/collaboration/CollaborationRealtimePage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Providers](../api-reference/providers.md)