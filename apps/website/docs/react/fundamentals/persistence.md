---
sidebar_label: Persistence
displayed_sidebar: tutorialSidebar
title: "Persistence Concept | Kritzel for React"
description: "Understand how Kritzel persists canvas data through sync providers such as IndexedDBSyncProvider."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Persistence

## Overview

In Kritzel, persistence is handled by sync providers. A sync provider connects the canvas to a storage medium and is registered through the editor's `syncConfig` prop. By default, Kritzel uses an empty provider list, so canvas state is reset on page reload.

Kritzel comes with the following built-in local providers to store your canvas state:

- [In-Memory Provider](../api-reference/providers.md#in-memory-provider)
- [IndexedDB Provider](../api-reference/providers.md#indexeddb-provider)

Providers are additive, so several of them can be active at the same time. Keep the `syncConfig` object stable by defining it at module scope or memoizing it with `useMemo`.

Cross-tab synchronization and real-time network sync use the same concept of providers. See the [Collaboration](../advanced/collaboration.md) guide for more details.

## Persisting in Memory

`InMemorySyncProvider` keeps state in memory for the current page session, so it survives editor remounts but resets on reload. This is only useful for demos and temporary canvases, not long-term persistence.

Make changes to the different workspaces in the demo below and see how the state is preserved when switching back and forth between them. Notice that reloading the page will reset all changes.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/persistence/memory"
  repoFiles={['src/pages/fundamentals/persistence/PersistenceMemoryPage.tsx']}
/>

## Persisting in IndexedDB

Register `IndexedDBSyncProvider` in `syncConfig.providers` to make object state durable in the browser. This is the right choice when you want to keep your canvas state across reloads and browser restarts on the same device.

Change anything on the canvas below and then reload the page. Your changes should now be automatically persisted. Because restored content is available when `onIsReady` fires, seed objects only when `await editor.getAllObjects()` returns an empty array.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/fundamentals/persistence/local"
  repoFiles={['src/pages/fundamentals/persistence/PersistenceLocalPage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Providers](../api-reference/providers.md)